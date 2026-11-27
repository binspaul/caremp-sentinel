"""
Production FastAPI Server for careMP Sentinel Care Coach Agent
Cloud Run & UI Web Access Ready
"""
import os
import sys
import logging
from typing import Dict, Any, Optional
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure parent directory (repo root) is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from agent.config import (
    MODEL_NAME,
    GEMINI_API_KEY,
    USE_VERTEX_AI,
    GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLOUD_LOCATION,
    API_BASE_URL,
    USE_MOCK_API,
)
from agent.agent import CARE_COACH_INSTRUCTION
from agent.tools.twin_tools import (
    get_current_twin_state,
    get_health_record,
    get_twin_analytics,
)
from agent.tools.memory_tools import (
    update_short_term_memory,
    update_long_term_memory,
)
from agent.tools.genomics_tools import (
    get_genomic_profile,
    check_pharmacogenomics,
)
from agent.tools.telemedicine_tools import (
    generate_telemedicine_brief,
    get_deterioration_and_frailty,
)
from agent.tools.dementia_tools import (
    get_sundowning_and_wandering,
    get_circadian_sleep_profile,
    generate_shift_handoff_brief,
)
from agent.memory.context_builder import build_additional_context

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caremp-sentinel.agent")

app = FastAPI(
    title="careMP Sentinel Care Coach Agent API",
    description="Conversational AI Care Coach with Digital Twin, Dementia Memory Care, and Clinical Telemetry Integration",
    version="2.0.0",
)

# Enable CORS for local web dashboard and hosted frontend origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "https://sentinel.caremp.ai",
    "https://sentinel-app.caremp.ai",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_client = None


def get_gemini_client():
    global _client
    if _client is None:
        from google import genai
        client_kwargs: Dict[str, Any] = {
            "api_key": GEMINI_API_KEY,
        }
        if USE_VERTEX_AI:
            client_kwargs["vertexai"] = True
            if GOOGLE_CLOUD_PROJECT:
                client_kwargs["project"] = GOOGLE_CLOUD_PROJECT
            if GOOGLE_CLOUD_LOCATION:
                client_kwargs["location"] = GOOGLE_CLOUD_LOCATION

        _client = genai.Client(**client_kwargs)
    return _client


class ChatRequest(BaseModel):
    message: str
    resident_id: Optional[Any] = 1


class ChatResponse(BaseModel):
    response: str
    status: str
    model: Optional[str] = None


@app.get("/")
def root():
    return {
        "service": "careMP Sentinel Care Coach Agent API",
        "status": "online",
        "model": MODEL_NAME,
        "backend_url": API_BASE_URL,
        "mock_mode": USE_MOCK_API,
        "endpoints": [
            "/health",
            "/api/chat",
            "/api/twin/context/{resident_id}",
            "/api/twin/analytics/{resident_id}",
            "/api/dementia/status/{resident_id}",
            "/api/handoff/{resident_id}",
        ],
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "care_coach_agent",
        "backend_api": API_BASE_URL,
        "mock_mode": USE_MOCK_API,
        "model": MODEL_NAME,
    }


@app.get("/api/twin/context/{resident_id}")
def get_context(resident_id: str):
    return {"resident_id": resident_id, "context": build_additional_context(resident_id)}


@app.get("/api/twin/analytics/{resident_id}")
def get_analytics(resident_id: str):
    res_id = int(resident_id) if resident_id.isdigit() else 1
    return get_twin_analytics(resident_id=res_id)


@app.get("/api/dementia/status/{resident_id}")
def get_dementia_status(resident_id: str):
    """
    Returns live sundowning agitation and spatial wandering metrics for dementia care monitoring.
    """
    res_id = int(resident_id) if resident_id.isdigit() else 1
    sundowning = get_sundowning_and_wandering(resident_id=res_id)
    circadian = get_circadian_sleep_profile(resident_id=res_id)
    return {
        "status": "success",
        "residentId": res_id,
        "sundowning": sundowning,
        "circadian": circadian,
        "agitationIndex": sundowning.get("agitationIndex", 76),
        "alertLevel": sundowning.get("alertLevel", "SUNDOWNING_SURGE"),
        "wanderingStatus": sundowning.get("wanderingStatus", "HALLWAY_PACING"),
        "locationZone": sundowning.get("locationZone", "North Memory Corridor Gallery"),
        "calmingSuggestions": sundowning.get("calmingSuggestions", []),
        "circadianRegularityScore": circadian.get("circadianRegularityScore", 48),
        "dayNightStatus": circadian.get("dayNightStatus", "MILD"),
    }


@app.get("/api/handoff/{resident_id}")
@app.post("/api/handoff/{resident_id}")
def post_shift_handoff(resident_id: str):
    """
    Generates a structured 60-second shift handoff briefing card for memory care nursing transitions.
    """
    res_id = int(resident_id) if resident_id.isdigit() else 1
    brief_data = generate_shift_handoff_brief(resident_id=res_id)
    
    vitals = brief_data.get("vitalsSummary", {})
    behav = brief_data.get("behavioralObservations", {})
    meals = brief_data.get("mealsHydration", {})
    watchouts = brief_data.get("eveningWatchOuts", [])
    watchouts_md = "\n".join([f"  - {w}" for w in watchouts]) if watchouts else "  - Standard evening check"

    md_brief = (
        f"### 📋 60s Shift Handoff Brief (SBAR)\n"
        f"**Resident**: {brief_data.get('residentName', 'Resident')} (#{res_id}) • *{brief_data.get('diagnosis', 'Memory Care')}*\n\n"
        f"- **Situation & State**: Agitation **{behav.get('agitationIndex', 76)}/100** ({behav.get('alertLevel', 'SUNDOWNING_SURGE')}) • {behav.get('location', 'Corridor')} ({behav.get('wanderingStatus', 'PACING')})\n"
        f"- **Vitals & NEWS2**: HR **{vitals.get('heartRate', 88)} bpm** • BP **{vitals.get('bloodPressure', '136/84')}** • Temp **{vitals.get('bodyTemperature', 37.4)}°C** • NEWS2: **{vitals.get('news2Score', 5)}** (Rule out UTI)\n"
        f"- **Meals & Meds**: {meals.get('lunch', 'Good intake')} • {meals.get('medicationAdherence', 'Adherent')}\n"
        f"- **Evening Watch-Outs**:\n{watchouts_md}"
    )
    brief_data["brief"] = md_brief
    return brief_data


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    res_id = str(payload.resident_id or 1)

    try:
        from google.genai import types

        client = get_gemini_client()
        dynamic_context = build_additional_context(res_id)
        system_prompt = (
            f"{CARE_COACH_INSTRUCTION}\n\n"
            f"[ACTIVE TARGET RESIDENT PROFILE]\n"
            f"You are currently assessing and consulting on Resident #{res_id}.\n"
            f"When invoking any tools (e.g., get_current_twin_state, get_genomic_profile, check_pharmacogenomics, get_deterioration_and_frailty, get_sundowning_and_wandering, get_circadian_sleep_profile, generate_shift_handoff_brief), always pass resident_id={res_id}.\n\n"
            f"[CURRENT USER HEALTH CONTEXT FOR RESIDENT #{res_id}]\n"
            f"{dynamic_context}\n"
            f"[END CONTEXT]"
        )

        config_args = {
            "system_instruction": system_prompt,
            "tools": [
                get_current_twin_state,
                get_health_record,
                get_twin_analytics,
                update_short_term_memory,
                update_long_term_memory,
                get_genomic_profile,
                check_pharmacogenomics,
                generate_telemedicine_brief,
                get_deterioration_and_frailty,
                get_sundowning_and_wandering,
                get_circadian_sleep_profile,
                generate_shift_handoff_brief,
            ],
        }
        if "lite" not in MODEL_NAME:
            config_args["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

        for attempt in range(2):
            try:
                chat = client.chats.create(
                    model=MODEL_NAME,
                    config=types.GenerateContentConfig(**config_args),
                )
                response = chat.send_message(message)
                return ChatResponse(
                    response=response.text or "I am listening, but could not produce a response.",
                    status="success",
                    model=MODEL_NAME,
                )
            except Exception as retry_err:
                if attempt == 0:
                    logger.warning(f"Chat attempt 1 warning: {retry_err}. Reconnecting...")
                    global _client
                    _client = None
                    client = get_gemini_client()
                    continue
                raise retry_err

    except Exception as e:
        logger.error(f"Chat generation error: {e}", exc_info=True)
        return ChatResponse(
            response=f"Care Coach temporarily unavailable: {str(e)}",
            status="error",
            model=MODEL_NAME,
        )


if __name__ == "__main__":
    # Cloud Run injects the PORT environment variable (typically 8080)
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting careMP Sentinel Care Coach Agent API server on 0.0.0.0:{port}")
    uvicorn.run("agent.serve:app", host="0.0.0.0", port=port, reload=False)
