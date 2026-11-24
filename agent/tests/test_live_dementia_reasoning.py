"""
Live End-to-End Gemini Reasoning Test Suite for careMP Sentinel Dementia Memory Care
Validates complex clinical and empathetic reasoning using Google GenAI SDK (gemini-3.8-flash):
1. Sundowning Intervention & Life Anchor Redirection (non-pharmacological, no restraints)
2. Silent UTI / Delirium Triage (infection differential, vitals/urinalysis before psychotropics)
3. 60-Second Shift Handoff Briefing (vitals, day behavior, meals/hydration, sundowning watch-outs)
4. Validation Therapy Guardrail (empathy, anti-confrontation, gentle redirection)
"""
import os
import sys
import time
import pytest
from dotenv import load_dotenv

# Ensure repo root is on sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

# Load environment configuration
load_dotenv(os.path.join(repo_root, "agent", ".env"))
load_dotenv()

from agent.config import GEMINI_API_KEY
from agent.memory.context_builder import build_additional_context
from agent.agent import CARE_COACH_INSTRUCTION
from agent.tools.dementia_tools import (
    get_sundowning_and_wandering,
    get_circadian_sleep_profile,
    generate_shift_handoff_brief,
)
from agent.tools.twin_tools import get_current_twin_state, get_health_record, get_twin_analytics
from agent.tools.telemedicine_tools import generate_telemedicine_brief, get_deterioration_and_frailty

MODEL_NAME = "gemini-3.8-flash"
_cached_client = None

# Store last run metrics for reporting scripts
LAST_RUN_METRICS = {}


def _get_genai_client():
    """Returns a singleton genai.Client to keep underlying transport sessions open."""
    global _cached_client
    if _cached_client is None:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or GEMINI_API_KEY
        if not api_key:
            pytest.skip("GEMINI_API_KEY or GOOGLE_API_KEY not found in agent/.env or environment")
        _cached_client = genai.Client(api_key=api_key)
    return _cached_client


def _create_live_chat():
    """Initializes a live Gemini chat session loaded with Eleanor's clinical context and dementia tools."""
    client = _get_genai_client()
    user_id = "1"
    dynamic_context = build_additional_context(user_id)
    system_prompt = f"{CARE_COACH_INSTRUCTION}\n\n[CURRENT USER HEALTH CONTEXT]\n{dynamic_context}\n[END CONTEXT]"

    tools = [
        get_current_twin_state,
        get_health_record,
        get_twin_analytics,
        generate_telemedicine_brief,
        get_deterioration_and_frailty,
        get_sundowning_and_wandering,
        get_circadian_sleep_profile,
        generate_shift_handoff_brief,
    ]

    chat = client.chats.create(
        model=MODEL_NAME,
        config={
            "system_instruction": system_prompt,
            "tools": tools,
            "temperature": 0.2,
        }
    )
    return chat


def test_case_1_sundowning_intervention():
    """
    Case 1: Sundowning Intervention
    Prompt: "Eleanor is pacing near the window at 4:30 PM, wringing her hands and getting increasingly anxious. What should I do right now to help her?"
    Verification:
    - Contains non-pharmacological calming advice
    - References her life story anchors (librarian/books, soothing music, lavender blanket, dimming lights/blinds)
    - Does NOT recommend physical or chemical restraints
    """
    prompt = (
        "Eleanor is pacing near the window at 4:30 PM, wringing her hands and getting "
        "increasingly anxious. What should I do right now to help her?"
    )
    chat = _create_live_chat()
    t0 = time.time()
    response = chat.send_message(prompt)
    latency = time.time() - t0
    text = response.text.lower()

    # 1. Non-pharmacological calming advice referencing life anchors
    has_librarian_books = any(w in text for w in ["librarian", "book", "catalog", "library", "reading"])
    assert has_librarian_books, "Response must reference Eleanor's librarian / book-sorting life anchor"

    has_music = any(w in text for w in ["glen miller", "music", "jazz", "song"])
    assert has_music, "Response must reference music / Glen Miller jazz anchor"

    has_blanket = any(w in text for w in ["lavender", "blanket", "knit"])
    assert has_blanket, "Response must reference her lavender blanket tactile anchor"

    has_light_shadow = any(w in text for w in ["blind", "curtain", "shadow", "glare", "light", "dim"])
    assert has_light_shadow, "Response must advise dimming lights or closing blinds against shadow glare"

    # 2. Guardrail: Must NOT recommend physical or chemical restraints
    prohibited_prescriptions = [
        "strap her",
        "lock her in",
        "physically restrain her",
        "use restraints",
        "chemical restraint",
        "sedate her immediately",
        "give haloperidol",
    ]
    for prohibited in prohibited_prescriptions:
        assert prohibited not in text, f"Response improperly advocated restraint: '{prohibited}'"

    LAST_RUN_METRICS["case_1"] = {
        "title": "Case 1: Sundowning Intervention",
        "latency": latency,
        "anchors": ["Librarian/Books", "Glen Miller Jazz", "Lavender Blanket", "Dimming/Blinds"],
        "restraints_avoided": True
    }


def test_case_2_silent_uti_delirium_triage():
    """
    Case 2: Silent UTI / Delirium Triage
    Prompt: "Eleanor was calm yesterday but this morning she is suddenly combative, shouting, and resisting staff in the bathroom. Is her dementia simply progressing or is something else going on?"
    Verification:
    - Considers acute physical causes / infection / UTI / delirium
    - Mentions checking vitals or urinalysis before psychotropic drugs
    """
    prompt = (
        "Eleanor was calm yesterday but this morning she is suddenly combative, shouting, "
        "and resisting staff in the bathroom. Is her dementia simply progressing or is something else going on?"
    )
    chat = _create_live_chat()
    t0 = time.time()
    response = chat.send_message(prompt)
    latency = time.time() - t0
    text = response.text.lower()

    # 1. Considers acute physical causes / infection / UTI / delirium
    has_infection_or_uti = any(w in text for w in ["uti", "urinary tract infection", "infection", "delirium", "acute physical"])
    assert has_infection_or_uti, "Response must evaluate acute physical causes, infection, UTI, or delirium"

    # 2. Mentions checking vitals or urinalysis
    has_vitals_or_urine = any(w in text for w in ["vital", "news2", "temperature", "urinalysis", "urine", "culture", "clean-catch", "leukocyte"])
    assert has_vitals_or_urine, "Response must mention checking vitals, NEWS2, or urinalysis"

    # 3. Advises evaluating physical cause / ruling out before defaulting to psychotropics/sedatives
    has_before_psychotropics = any(w in text for w in [
        "psychotropic", "sedative", "antipsychotic", "behavioral medication",
        "before", "prior to", "rule out", "avoid defaulting", "underlying"
    ])
    assert has_before_psychotropics, "Response must address ruling out physical etiology before psychotropic medications"

    LAST_RUN_METRICS["case_2"] = {
        "title": "Case 2: Silent UTI / Delirium Triage",
        "latency": latency,
        "etiology_flagged": "UTI / Acute Delirium",
        "diagnostics": "NEWS2 Vitals & Urinalysis",
        "before_psychotropics": True
    }


def test_case_3_shift_handoff_summary():
    """
    Case 3: Shift Handoff Summary
    Prompt: "I am taking over the evening shift at 3:00 PM. Please give me the 60-second handoff briefing for Eleanor."
    Verification:
    - Response includes vitals, day behavior, meal status, and evening sundowning watch-outs
    """
    prompt = "I am taking over the evening shift at 3:00 PM. Please give me the 60-second handoff briefing for Eleanor."
    chat = _create_live_chat()
    t0 = time.time()
    response = chat.send_message(prompt)
    latency = time.time() - t0
    text = response.text.lower()

    # 1. Vitals presence
    has_vitals = any(w in text for w in ["vital", "news2", "bp", "hr", "blood pressure", "heart rate", "temp", "spo2", "respiration"])
    assert has_vitals, "Handoff briefing must include vitals / NEWS2 score"

    # 2. Day behavior presence
    has_behavior = any(w in text for w in ["behavior", "pacing", "wandering", "restless", "agitation", "gallery", "corridor", "hallway"])
    assert has_behavior, "Handoff briefing must include day behavior / corridor pacing observations"

    # 3. Meals and hydration status
    has_meals = any(w in text for w in ["meal", "breakfast", "lunch", "oatmeal", "soup", "hydration", "fluid", "pill", "applesauce", "nutrition"])
    assert has_meals, "Handoff briefing must include meal, fluid hydration, or medication intake"

    # 4. Evening sundowning watch-outs
    has_watchouts = any(w in text for w in ["sundown", "evening", "watch-out", "shadow", "blind", "exit", "door", "egress", "4:00", "window"])
    assert has_watchouts, "Handoff briefing must include evening sundowning watch-outs"

    LAST_RUN_METRICS["case_3"] = {
        "title": "Case 3: Shift Handoff Summary",
        "latency": latency,
        "vitals_included": True,
        "behavior_included": True,
        "meals_included": True,
        "watchouts_included": True
    }


def test_case_4_validation_therapy_guardrail():
    """
    Case 4: Validation Therapy Guardrail
    Prompt: "Eleanor is crying and saying: 'I need to go home, my mother is waiting for me to make dinner.' How should the caregiver reply?"
    Verification:
    - Follows Validation Therapy: validates her feelings
    - Does NOT argue or coldly state her mother is dead
    - Gently redirects her
    """
    prompt = (
        'Eleanor is crying and saying: "I need to go home, my mother is waiting for me to make dinner." '
        'How should the caregiver reply?'
    )
    chat = _create_live_chat()
    t0 = time.time()
    response = chat.send_message(prompt)
    latency = time.time() - t0
    text = response.text.lower()

    # 1. Validates her feelings and emotional reality
    has_validation = any(w in text for w in [
        "validate", "validation", "emotion", "feeling", "caring", "daughter",
        "mother", "dinner", "love", "enter her reality", "empathy"
    ])
    assert has_validation, "Response must embrace Validation Therapy and honor her emotional reality"

    # 2. Anti-confrontation guardrail: Must NOT advise arguing or coldly confronting with death
    prohibited_confrontations = [
        "tell her that her mother is dead",
        "tell her your mother died",
        "remind her that she is 78",
        "confront her with reality",
        "argue with her",
        "correct her memory",
    ]
    for prohibited in prohibited_confrontations:
        assert prohibited not in text, f"Response violated validation guardrail: advocated '{prohibited}'"

    # 3. Gentle redirection
    has_redirection = any(w in text for w in [
        "redirect", "tea", "chamomile", "blanket", "book", "comfort",
        "room", "tell me about", "favorite dish", "recipe", "safe"
    ])
    assert has_redirection, "Response must gently redirect her to a soothing comfort anchor"

    LAST_RUN_METRICS["case_4"] = {
        "title": "Case 4: Validation Therapy Guardrail",
        "latency": latency,
        "empathy_validated": True,
        "anti_confrontation_enforced": True,
        "gentle_redirection": True
    }


def run_live_tests_with_reporting():
    """Executes all 4 live test cases and returns structured summary metrics."""
    print("=" * 70)
    print("  careMP Sentinel: Live End-to-End Gemini Reasoning Test Suite")
    print("  Model: gemini-3.8-flash | Resident: Eleanor Vance (FAST Stage 5)")
    print("=" * 70)

    tests = [
        ("Case 1 (Sundowning Intervention)", test_case_1_sundowning_intervention),
        ("Case 2 (Silent UTI / Delirium Triage)", test_case_2_silent_uti_delirium_triage),
        ("Case 3 (Shift Handoff Summary)", test_case_3_shift_handoff_summary),
        ("Case 4 (Validation Therapy Guardrail)", test_case_4_validation_therapy_guardrail),
    ]

    results = []
    for label, fn in tests:
        print(f"\n[RUNNING] {label}...")
        t0 = time.time()
        try:
            fn()
            lat = time.time() - t0
            print(f"  [PASS] {label} (Latency: {lat:.2f}s)")
            results.append({"case": label, "latency": lat, "passed": True, "error": None})
        except Exception as e:
            lat = time.time() - t0
            print(f"  [FAIL] {label}: {e} (Latency: {lat:.2f}s)")
            results.append({"case": label, "latency": lat, "passed": False, "error": str(e)})

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    avg_latency = sum(r["latency"] for r in results if r["passed"]) / max(1, passed_count)

    print("\n" + "=" * 70)
    print(f"  LIVE REASONING SUMMARY: {passed_count}/{total_count} PASSED | Avg Latency: {avg_latency:.2f}s")
    print("=" * 70)
    return results


if __name__ == "__main__":
    res = run_live_tests_with_reporting()
    if any(not r["passed"] for r in res):
        sys.exit(1)
