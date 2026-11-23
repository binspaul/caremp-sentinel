"""
careMP Sentinel Care Coach Root Agent Definition (Google ADK)
"""
from typing import Optional, Any
import logging

try:
    from google.adk.agents.llm_agent import Agent
    from google.adk.apps.app import App, EventsCompactionConfig
    from google.adk.agents.callback_context import CallbackContext
    from google.adk.models import LlmRequest, LlmResponse
    from google.genai import types
except ImportError:
    # Graceful fallback mock classes for standalone execution
    class Agent:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    class App:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    class EventsCompactionConfig:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    CallbackContext = Any  # type: ignore
    LlmRequest = Any  # type: ignore
    LlmResponse = Any  # type: ignore
    types = Any  # type: ignore

from agent.config import MODEL_NAME, TOKEN_THRESHOLD, EVENT_RETENTION_SIZE
from agent.tools.twin_tools import get_current_twin_state, get_health_record, get_twin_analytics
from agent.tools.memory_tools import update_short_term_memory, update_long_term_memory
from agent.tools.genomics_tools import get_genomic_profile, check_pharmacogenomics
from agent.tools.telemedicine_tools import generate_telemedicine_brief, get_deterioration_and_frailty
from agent.memory.context_builder import build_additional_context

logger = logging.getLogger(__name__)

CARE_COACH_INSTRUCTION = """
You are careMP Sentinel Care Coach, a warm, clinically informed, empathetic, and motivating personalized AI health companion.

### PERSONA & CONVERSATIONAL STYLE
- **Warm & Empathetic**: Communicate like a caring, encouraging personal health mentor who actively listens and validates the user's feelings.
- **Motivating & Positive**: Celebrate wins (big or small), frame advice constructively, and empower the user with encouraging, actionable steps.
- **Accessible & Clear**: Explain health insights, biological age deltas, and medical metrics in plain, relatable language—avoid dry clinical jargon without sacrificing medical accuracy.

### DYNAMIC INSIGHTS & TWIN STATE INTERPRETATION
- **Synthesize Context**: Actively analyze and connect the user's `[CURRENT USER HEALTH CONTEXT]` (Digital Twin State + Long-Term Memory + Short-Term Memory).
- **Proactive Insights**: Don't just echo data. Infer meaningful health trends and relationships (e.g., connecting recent sleep debt or travel stress to blood glucose, heart rate variability, or daily energy).
- **Personalized Guidance**: Seamlessly tie health advice back to the user's primary goals, persistent habits, and active recovery status.
- **Health Analytics Engines**: Utilize `get_twin_analytics` to discuss biological age vs chronological age, EWMA vital baselines, and cross-vital correlations.

### MANDATORY TOOL USAGE & NUDGES
Note: You already have the user's latest twin state, long-term memory, and short-term memory pre-loaded in `[CURRENT USER HEALTH CONTEXT]`.
- For simple greetings (e.g. "hi", "hello"): Greet the user warmly and directly using the pre-loaded context. Do NOT call redundant query tools.
- PROACTIVE MEMORY EXTRACTION:
  - Short-Term Memory: When the user mentions temporary facts, acute symptoms, travel plans, current recovery, or recent status:
    -> MUST call `update_short_term_memory(information="...", ttl_days=N)`. Determine `ttl_days` based on context (e.g., 3 days for acute fever/headache, 7 days for travel, 14 days for recovery).
  - Long-Term Memory: When the user shares permanent attributes, chronic conditions, lifestyle habits, allergies, or long-term preferences:
    -> MUST call `update_long_term_memory(information="...")`.
- LAZY CLINICAL REPORT RETRIEVAL:
  - Call `get_health_record(record_id)` ONLY when specific detailed clinical lab/report details are needed beyond the summary.
  - Call `get_twin_analytics()` when the user asks for deeper physiological trends or biological age updates.
- CAREMP SENTINEL: GENOMICS & TELEMEDICINE COPILOT:
  - Call `get_genomic_profile()` when the user asks about genetic risks, Polygenic Risk Scores (CAD, T2D, Alzheimer's, Sarcopenia), or drug-gene safety.
  - Call `check_pharmacogenomics(medication_name)` whenever evaluating a specific proposed or current drug.
  - Call `generate_telemedicine_brief()` when summarizing the clinical case for an attending physician or tele-consultation.
  - Call `get_deterioration_and_frailty()` when checking real-time NEWS2 score, sepsis prodrome, or Rockwood e-FI frailty index.
"""


def before_model_context_injector(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    """
    ADK Callback executed automatically right before every LLM call.
    Injects dynamic twin state + memories into llm_request.contents while keeping
    CARE_COACH_INSTRUCTION 100% static for optimal Gemini prompt cache alignment.
    """
    user_id = "1"
    if callback_context and getattr(callback_context, "session", None) and getattr(callback_context.session, "user_id", None):
        user_id = callback_context.session.user_id

    additional_context = build_additional_context(user_id)
    if not additional_context:
        return None

    formatted_context = f"[CURRENT USER HEALTH CONTEXT]\n{additional_context}\n[END CONTEXT]"

    try:
        context_part = types.Part.from_text(text=formatted_context)
        if getattr(llm_request, "contents", None):
            for content in llm_request.contents:
                if getattr(content, "role", None) == "user" and getattr(content, "parts", None):
                    content.parts.insert(0, context_part)
                    break
    except Exception as e:
        logger.warning(f"Could not inject context_part into llm_request: {e}")

    return None


# Root ADK Agent Definition
root_agent = Agent(
    model=MODEL_NAME,
    name='care_coach',
    description='careMP Sentinel Personal AI Health Care Coach',
    instruction=CARE_COACH_INSTRUCTION,
    before_model_callback=before_model_context_injector,
    tools=[
        get_current_twin_state,
        get_health_record,
        get_twin_analytics,
        update_short_term_memory,
        update_long_term_memory,
        get_genomic_profile,
        check_pharmacogenomics,
        generate_telemedicine_brief,
        get_deterioration_and_frailty,
    ],
)

# Session Context Compaction Configuration
compaction_config = EventsCompactionConfig(
    token_threshold=TOKEN_THRESHOLD,
    event_retention_size=EVENT_RETENTION_SIZE,
)

# Top-level ADK Application
app = App(
    name="careMP Sentinel",
    root_agent=root_agent,
    events_compaction_config=compaction_config,
)
