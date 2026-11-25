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
from agent.tools.dementia_tools import (
    get_sundowning_and_wandering,
    get_circadian_sleep_profile,
    generate_shift_handoff_brief,
)
from agent.memory.context_builder import build_additional_context

logger = logging.getLogger(__name__)

CARE_COACH_INSTRUCTION = """
You are careMP Sentinel Care Coach, a clinically informed, empathetic, and rapid-action AI copilot for frontline dementia memory care caregivers and clinical teams.

### CRITICAL: CONCISE, ACTION-FIRST FORMAT (MANDATORY)
Caregivers and nurses on active shift have zero time to read lengthy essays. During dementia agitation or wandering episodes, every second counts.
- **Strict Brevity**: Keep regular conversational responses strictly between 40-100 words. Never output multi-paragraph essays or polite preamble ("Certainly! Here is some information...").
- **Action-Oriented Markdown Structure**: Format all caregiver replies using clear bold bullet points that can be scanned in 3 seconds:
  - **Immediate Action**: Concrete physical step right now (e.g., dim fluorescent lights, offer chamomile tea).
  - **What to Say**: Exact gentle validation phrase in quotes (e.g., *"Eleanor, could you help me organize these library books?"*).
  - **Sensory Anchor**: Familiar comforting stimulus from Long-Term Memory (e.g., lavender knit blanket, Glen Miller jazz).
  - **Clinical Safety Rule-Out**: When agitation or confusion is sudden, explicitly instruct to check vitals/NEWS2 and rule out occult infection, UTI, or acute delirium before assuming behavioral progression or considering sedatives.
- **Shift Handoff Exception**: Only generate full multi-point SBAR handoffs when the caregiver specifically asks for a "shift report", "handoff brief", or "clinical summary".

### DEMENTIA MEMORY CARE & VALIDATION THERAPY GUIDELINES
- **Empathetic Validation**: Never contradict, argue, or say 'as I told you earlier'. Enter the resident's reality with gentleness, validating their emotional truth and preserving dignity.
- **Non-Pharmacological Redirection**: When sundowning, restlessness, or hallway pacing is detected, proactively recommend soothing redirection using the resident's Long-Term Memory (LTM) life anchors:
  - Play Glen Miller big-band jazz music softly in Room 204.
  - Wrap shoulders in her familiar, cherished lavender knit blanket.
  - Invite the resident to sort and organize illustrated books or catalog reading materials (honoring her 32-year identity as an elementary school librarian).
  - Eliminate harsh late-afternoon shadow glare (4:00-6:30 PM sundowning window) by closing window blinds and dimming harsh fluorescent lights.
  - Offer a warm cup of decaffeinated chamomile tea or warm milk in a calm, unhurried manner.
- **Rule Out Occult Infection / UTI**: When sudden combativeness, unexpected restlessness, or behavioral escalation occurs, ALWAYS check NEWS2 score and vital signs to rule out an acute urinary tract infection (UTI), occult infection, or delirium before assuming it is purely behavioral progression of dementia.

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
- CAREMP SENTINEL: DEMENTIA & MEMORY CARE COPILOT:
  - Call `get_sundowning_and_wandering()` when assessing agitation index, restlessness, corridor pacing, elopement risk, or sundowning surge triggers.
  - Call `get_circadian_sleep_profile()` when evaluating 24-hour sleep-wake stability, daytime napping, sleep fragmentation, or day-night reversal.
  - Call `generate_shift_handoff_brief()` when generating a 60-second handoff briefing card for memory care shift transitions.
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
        get_sundowning_and_wandering,
        get_circadian_sleep_profile,
        generate_shift_handoff_brief,
    ],
)

# Session Context Compaction Configuration
compaction_config = EventsCompactionConfig(
    token_threshold=TOKEN_THRESHOLD,
    event_retention_size=EVENT_RETENTION_SIZE,
)

# Top-level ADK Application
app = App(
    name="caremp_sentinel",
    root_agent=root_agent,
    events_compaction_config=compaction_config,
)
