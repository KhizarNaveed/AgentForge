# 🛠️ AgentForge: The Multi-Model AI Workspace

> **Problem:** Relying on a single AI provider creates vendor lock-in, leads to API downtime, and wastes compute costs by using massive models for simple tasks.
>
> **Solution:** A production-grade Mixture-of-Experts (MoE) architecture that routes user prompts to the optimal AI model across 5 specialized agents (20 models total) with automatic failover.

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)]()
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-darkgreen.svg)]()

## 📊 The Problem (The Market Gap)
- **The "Jack-of-All-Trades" Trap:** Using one massive model (like GPT-4) for everything wastes compute. A model that writes poetry is slow at generating structured JSON.
- **API Downtime:** If an enterprise relies solely on OpenAI or Google, a single API outage crashes their entire application.
- **Lack of Visibility:** Companies lack visibility into *which* model answered a query, how long it took, and whether they are hitting rate limits.

## 💡 The Solution
AgentForge acts as an intelligent "Traffic Cop" for AI. 
- **5 Specialized Agents (20 Models Total):** Coder, Reasoner, Speedster, Creative, and Analyst.
- **Resilient Fallback Chain:** Each agent has 1 primary model and 3 fallback models. If Groq fails, it instantly reroutes to Gemini or OpenRouter without the user noticing.
- **Manual Model Override:** Users can manually select a specific model within an agent's context, with graceful fallback if it fails.
- **Live Telemetry:** A UI dashboard displaying real-time metrics for every prompt.
- **Persistent History:** All chats are logged in PostgreSQL and can be resumed from the sidebar.

## 🏗️ Architecture
[Click here to view the interactive architecture diagram](docs/architecture.html)

## 🧠 The 20-Model Setup

| Agent | Primary Model | Fallback 1 | Fallback 2 | Fallback 3 |
| :--- | :--- | :--- | :--- | :--- |
| **Coder** | `openai/gpt-oss-120b` (Groq) | `llama-3.3-70b-versatile` (Groq) | `openrouter/free` (OpenRouter) | `gemini-1.5-pro` (Gemini) |
| **Reasoner** | `openai/gpt-oss-120b` (Groq) | `llama-3.3-70b-versatile` (Groq) | `gemini-1.5-pro` (Gemini) | `openrouter/free` (OpenRouter) |
| **Speedster** | `openai/gpt-oss-20b` (Groq) | `llama-3.3-70b-versatile` (Groq) | `openrouter/free` (OpenRouter) | `gemini-1.5-pro` (Gemini) |
| **Creative** | `llama-3.3-70b-versatile` (Groq) | `openai/gpt-oss-120b` (Groq) | `gemini-1.5-pro` (Gemini) | `openrouter/free` (OpenRouter) |
| **Analyst** | `openai/gpt-oss-120b` (Groq) | `gemini-1.5-pro` (Gemini) | `llama-3.3-70b-versatile` (Groq) | `openrouter/free` (OpenRouter) |

## 🛠️ Tech Stack
| Category | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Axios, React-Markdown, KaTeX |
| **Backend** | Python, FastAPI, Uvicorn, OpenAI SDK |
| **Database** | Supabase (PostgreSQL) |
| **AI Providers** | Groq, Google Gemini, OpenRouter, Hugging Face |

## 🚀 How to Run This Project
### 1. Clone the Repository
```bash
git clone https://github.com/KhizarNaveed/AgentForge.git
cd AgentForge
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📬 Connect with Me
- **LinkedIn:** [Muhammad Khizar Naveed](https://www.linkedin.com/in/muhammad-khizar-naveed-1767312b2/)
- **GitHub:** [KhizarNaveed](https://github.com/KhizarNaveed)

**⭐ If you found this project useful, please consider giving it a star!**

