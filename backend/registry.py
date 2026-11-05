import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

groq_client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

gemini_client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

openrouter_client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

hf_client = OpenAI(
    api_key=os.getenv("HF_TOKEN"),
    base_url="https://router.huggingface.co/v1"
)

AGENTS = {
    "coder": [
        {"client": groq_client, "model": "openai/gpt-oss-120b"},
        {"client": groq_client, "model": "llama-3.3-70b-versatile"},
        {"client": openrouter_client, "model": "openrouter/free"},
        {"client": gemini_client, "model": "gemini-1.5-pro"}
    ],
    "reasoner": [
        {"client": groq_client, "model": "openai/gpt-oss-120b"},
        {"client": groq_client, "model": "llama-3.3-70b-versatile"},
        {"client": gemini_client, "model": "gemini-1.5-pro"},
        {"client": openrouter_client, "model": "openrouter/free"}
    ],
    "speedster": [
        {"client": groq_client, "model": "openai/gpt-oss-20b"},
        {"client": groq_client, "model": "llama-3.3-70b-versatile"},
        {"client": openrouter_client, "model": "openrouter/free"},
        {"client": gemini_client, "model": "gemini-1.5-pro"}
    ],
    "creative": [
        {"client": groq_client, "model": "llama-3.3-70b-versatile"},
        {"client": groq_client, "model": "openai/gpt-oss-120b"},
        {"client": gemini_client, "model": "gemini-1.5-pro"},
        {"client": openrouter_client, "model": "openrouter/free"}
    ],
    "analyst": [
        {"client": groq_client, "model": "openai/gpt-oss-120b"},
        {"client": gemini_client, "model": "gemini-1.5-pro"},
        {"client": groq_client, "model": "llama-3.3-70b-versatile"},
        {"client": openrouter_client, "model": "openrouter/free"}
    ]
}


