# careMP Sentinel Care Coach Agent (Google ADK & Cloud Run)

Conversational AI agent for **careMP Sentinel**, built using the **Google Agent Development Kit (ADK)** and powered by **Google Gemini**.

---

## 📁 Clean Directory Layout

```text
agent/
├── memory/
│   ├── compactor.py            # Gemini LTM memory synthesizer (<= 6,000 chars)
│   ├── context_builder.py      # Dynamic turn context compiler (Twin + LTM + STM)
│   └── __init__.py
├── tools/
│   ├── memory_tools.py         # update_short_term_memory, update_long_term_memory
│   ├── twin_tools.py           # get_current_twin_state, get_health_record, get_twin_analytics
│   └── __init__.py
├── tests/
│   ├── test_components.py      # Automated verification of all tools & memory stores
│   ├── test_live_reasoning.py  # Live end-to-end Gemini conversation test
│   └── __init__.py
├── scripts/
│   └── cli_chat.py             # Interactive CLI console for rapid manual testing
├── agent.py                    # Root ADK Agent, App, and prompt-caching callback
├── api_client.py               # Unified API Client (Live + Mock fallback)
├── mock_data.py                # Realistic clinical datasets (Alex Rivera)
├── config.py                   # Environment & model settings (BASE_URL normalization)
├── serve.py                    # Production FastAPI server (Cloud Run & UI Web Access)
├── Dockerfile                  # Cloud Run-optimized container definition
├── .dockerignore               # Clean container build exclusions
├── API_INTEGRATION_CONTRACT.md # Spec for backend team handoff
├── requirements.txt            # Python dependencies
└── .env.example
```

---

## 🏗️ Architecture & Key Capabilities

1. **Google Native Gemini Integration**:
   - Uses `gemini-3.5-flash-lite` / `gemini-3.5-flash` natively for low latency, high clinical accuracy, and automatic tool execution.
2. **Dynamic Context Injection & Prompt Caching**:
   - Dynamic health context (Twin state + LTM + STM) is compiled before every turn, keeping the system prompt static for high Gemini cache hits.
3. **Pluggable Live Backend & Mock Fallback (`api_client.py`)**:
   - `USE_MOCK_API=false`: Connects directly to the hosted NestJS backend (`https://v1`).
   - Automatically acquires and caches JWT Bearer tokens via `/auth/login`.
   - Reads & writes to `/digital-twin`, `/short-term-memory`, and `/long-term-memory`.
4. **Health Analytics Engines Integration**:
   - Exposes `get_twin_analytics` tool to deliver physiological trend insights (EWMA vitals, 30-day trends, biological age delta, longevity resilience score).
5. **Intelligent Dual-Tier Memory System**:
   - **Short-Term Memory (STM)**: For acute symptoms, temporary trips, or recovery, with dynamic TTL days.
   - **Long-Term Memory (LTM)**: Persistent profile organized into structured clinical categories, continuously synthesized and compacted using Gemini.

---

## 🌐 End-to-End UI & Web Integration

The FastAPI server in `agent/serve.py` exposes:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/health` | `GET` | Health check for Cloud Run container probes |
| `/api/chat` | `POST` | Primary conversational endpoint for Web UI |
| `/api/twin/context/{resident_id}` | `GET` | Full injected context (Twin + LTM + STM) |
| `/api/twin/analytics/{resident_id}` | `GET` | High-order engine analytics |

### Chat Request Payload
```json
{
  "message": "How is my resting heart rate looking today?",
  "resident_id": 1
}
```

### Chat Response Payload
```json
{
  "response": "Hello Mary! Your resting heart rate is sitting right at a steady 75 bpm...",
  "status": "success",
  "model": "gemini-3.5-flash-lite"
}
```

### Frontend Configuration
In `dashboard/.env` or deployment environment:
```bash
VITE_AGENT_API_URL=https://<YOUR-AGENT-CLOUD-RUN-URL>/api/chat
```

---

## 🐳 Docker & Cloud Run Deployment Guide

### Option 1: Direct Deploy to Cloud Run from Source (Recommended)
No local Docker daemon required. Google Cloud Build packages the container directly:

```bash
cd agent

gcloud run deploy caremp-sentinel-agent \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "BASE_URL=https:///,USE_MOCK_API=false,API_USER_EMAIL=sadmin@caremp.ai,API_USER_PASSWORD=sadmin@123#,ADK_MODEL=gemini-3.5-flash-lite,GEMINI_API_KEY=YOUR_GEMINI_API_KEY"
```

### Option 2: Build & Run Locally with Docker

```bash
# 1. Build the container
docker build -t caremp-sentinel-agent ./agent

# 2. Run the container
docker run -p 8000:8080 \
  -e PORT=8080 \
  -e BASE_URL=https:// \
  -e USE_MOCK_API=false \
  -e API_USER_EMAIL=sadmin@caremp.ai \
  -e API_USER_PASSWORD=sadmin@123# \
  -e GEMINI_API_KEY=YOUR_GEMINI_API_KEY \
  caremp-sentinel-agent

# 3. Test health
curl http://localhost:8000/health
```

### Option 3: Docker Compose
From the repository root:
```bash
docker compose up --build
```

---

## 🚀 Local Development Commands

### 1. Launch Interactive Terminal Console
```bash
uv run --with google-genai --with requests --with python-dotenv python agent/scripts/cli_chat.py
```

### 2. Start Agent API Server Locally
```bash
uv run --with fastapi --with uvicorn --with requests --with python-dotenv --with google-genai python agent/serve.py
```
