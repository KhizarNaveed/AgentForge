from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import registry
import db
import time
import uuid

app = FastAPI(title="AgentForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    agent: str = "speedster"
    session_id: str = str(uuid.uuid4())
    model_override: Optional[str] = None
    history: list = []

class PromptResponse(BaseModel):
    answer: str
    model_used: str
    provider: str
    latency_ms: int
    fallback_triggered: bool
    session_id: str

def _find_model_config(model_name: str):
    """Look up a specific model configuration across all agents in registry.AGENTS."""
    for chain in registry.AGENTS.values():
        for config in chain:
            if config["model"] == model_name:
                return config
    return None

@app.get("/")
def root():
    return {"status": "AgentForge is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/history")
def get_history():
    return db.get_all_sessions()

@app.get("/api/history/{session_id}")
def get_session_history(session_id: str):
    return db.get_messages_by_session(session_id)

@app.delete("/api/history/{session_id}")
def delete_chat_history(session_id: str):
    try:
        db.delete_session(session_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate", response_model=PromptResponse)
def generate(request: PromptRequest):
    if request.agent not in registry.AGENTS:
        raise HTTPException(status_code=400, detail="Invalid agent")

    if request.model_override and request.model_override != "Auto":
        override_config = _find_model_config(request.model_override)
        if not override_config:
            raise HTTPException(status_code=400, detail=f"Invalid model_override: {request.model_override}")
        # Try the overridden model first, then fall back to the rest of the agent's chain
        remaining = [c for c in registry.AGENTS[request.agent] if c["model"] != request.model_override]
        agent_chain = [override_config] + remaining
    else:
        agent_chain = registry.AGENTS[request.agent]

    # Validate session_id is a valid UUID; if not, generate a new one
    session_id = request.session_id
    try:
        uuid.UUID(str(session_id))
    except (ValueError, TypeError, AttributeError):
        new_session_id = str(uuid.uuid4())
        print(f"[WARN] Invalid session_id '{session_id}' provided. Generated new UUID: {new_session_id}")
        session_id = new_session_id

    # 1. Ensure session exists in Supabase
    db.create_session(session_id)
    
    # 2. Save the user's prompt to Supabase
    db.save_message(session_id, role="user", content=request.prompt, agent=request.agent)

    # Format chat history + current prompt
    formatted_messages = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in request.history
        if isinstance(msg, dict) and msg.get("role") in ["user", "assistant"] and msg.get("content")
    ]
    formatted_messages.append({"role": "user", "content": request.prompt})

    fallback_triggered = False
    errors = []

    # 3. Loop through the models (Fallback logic)
    for index, config in enumerate(agent_chain):
        start_time = time.time()
        try:
            response = config["client"].chat.completions.create(
                model=config["model"],
                messages=formatted_messages,
                max_tokens=1000
            )
            latency_ms = int((time.time() - start_time) * 1000)
            
            base_url = str(config["client"].base_url)
            if "groq" in base_url:
                provider = "Groq"
            elif "google" in base_url:
                provider = "Gemini"
            elif "huggingface" in base_url:
                provider = "HuggingFace"
            else:
                provider = "OpenRouter"

            raw_answer = response.choices[0].message.content
            if not raw_answer:
                raise ValueError("Model returned an empty response")
            answer = raw_answer

            # 4. Save the AI's response and telemetry to Supabase
            db.save_message(
                session_id=session_id,
                role="assistant",
                content=answer,
                agent=request.agent,
                model_used=config["model"],
                provider=provider,
                latency_ms=latency_ms,
                fallback_triggered=fallback_triggered
            )

            return PromptResponse(
                answer=answer,
                model_used=config["model"],
                provider=provider,
                latency_ms=latency_ms,
                fallback_triggered=fallback_triggered,
                session_id=session_id
            )
            
        except Exception as e:
            print(f"[WARN] {config['model']} failed: {e}")
            errors.append(str(e))
            fallback_triggered = True
            continue 

    raise HTTPException(status_code=503, detail="All models failed")