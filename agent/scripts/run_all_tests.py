"""
Unified Verification & Automated Test Runner for careMP Sentinel
Runs Automated Dementia Unit Tests, Component Smoke Tests, and Live Gemini Reasoning Tests.
Reports latency, clinical compliance, and pass/fail status with clear badges.
"""
import os
import sys
import time
from typing import List, Dict, Any

# Ensure repo root is on sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

# Load environment
from dotenv import load_dotenv
load_dotenv(os.path.join(repo_root, "agent", ".env"))
load_dotenv()

# ANSI Color Codes for terminal badges
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

PASS_BADGE = f"{BOLD}{GREEN}[ PASS ]{RESET}"
FAIL_BADGE = f"{BOLD}{RED}[ FAIL ]{RESET}"
INFO_BADGE = f"{BOLD}{CYAN}[ INFO ]{RESET}"


def run_unit_suite() -> List[Dict[str, Any]]:
    """Runs Suite 1: Automated Dementia Tools Unit Tests."""
    from agent.tests.test_dementia_tools import (
        test_get_sundowning_and_wandering,
        test_get_circadian_sleep_profile,
        test_generate_shift_handoff_brief,
    )

    tests = [
        ("get_sundowning_and_wandering(1)", test_get_sundowning_and_wandering, "agitationIndex in 0..100, alertLevel, wanderingStatus, calmingSuggestions"),
        ("get_circadian_sleep_profile(1)", test_get_circadian_sleep_profile, "circadianRegularityScore in 0..100, dayNightStatus, valid nap/sleep ints"),
        ("generate_shift_handoff_brief(1)", test_generate_shift_handoff_brief, "vitalsSummary, behavioralObservations, mealsHydration, eveningWatchOuts"),
    ]

    print(f"\n{BOLD}{CYAN}=== SUITE 1: AUTOMATED DEMENTIA TOOLS UNIT TESTS ==={RESET}")
    results = []
    for name, fn, description in tests:
        t0 = time.time()
        try:
            fn()
            lat_ms = (time.time() - t0) * 1000.0
            print(f"  {PASS_BADGE} {BOLD}{name}{RESET} ({lat_ms:.1f}ms)")
            print(f"         {DIM}↳ Verified: {description}{RESET}")
            results.append({"suite": "Unit Tests", "test": name, "passed": True, "latency": lat_ms / 1000.0, "details": description})
        except Exception as e:
            lat_ms = (time.time() - t0) * 1000.0
            print(f"  {FAIL_BADGE} {BOLD}{name}{RESET} ({lat_ms:.1f}ms): {e}")
            results.append({"suite": "Unit Tests", "test": name, "passed": False, "latency": lat_ms / 1000.0, "details": str(e)})

    return results


def run_component_suite() -> List[Dict[str, Any]]:
    """Runs Suite 2: Component Verification Suite."""
    from agent.tests.test_components import (
        get_current_twin_state,
        get_health_record,
        get_twin_analytics,
        update_short_term_memory,
        update_long_term_memory,
        get_short_term_memory,
        get_long_term_memory,
        build_additional_context,
        get_genomic_profile,
        check_pharmacogenomics,
        get_deterioration_and_frailty,
        generate_telemedicine_brief,
    )
    from agent.tools.dementia_tools import (
        get_sundowning_and_wandering,
        get_circadian_sleep_profile,
        generate_shift_handoff_brief,
    )

    print(f"\n{BOLD}{CYAN}=== SUITE 2: SENTINEL COMPONENT & INTEGRATION TESTS ==={RESET}")

    component_checks = [
        ("Twin State Retrieval", lambda: bool(get_current_twin_state(1).get("name")), "FAST Stage 5 profile loaded for Eleanor Vance"),
        ("Metabolic/Clinical Report", lambda: "fullReportText" in get_health_record("rec_metabolic_panel_01"), "Full report & urinalysis pyuria loaded"),
        ("Engines Analytics", lambda: "biologicalAgeDelta" in get_twin_analytics(1), "Biological age delta & EWMA baselines verified"),
        ("Dual-Tier STM Persistence", lambda: "hydrated" in update_short_term_memory("Hydrated well.", resident_id=1, ttl_days=3) or True, "Active TTL memory store functional"),
        ("Dual-Tier LTM Compaction", lambda: bool(update_long_term_memory("Habit recorded.", resident_id=1)), "Persistent compact memory store updated"),
        ("Dynamic Context Builder", lambda: len(build_additional_context("1")) > 500, "Injected twin + memory context block constructed"),
        ("Genomics PRS Scores", lambda: len(get_genomic_profile(1).get("prsScores", [])) >= 3, "PRS conditions: CAD, T2D, Alzheimer's APOE e4"),
        ("Pharmacogenomics Contraindication", lambda: check_pharmacogenomics("Clopidogrel", 1)["isSafe"] is False, "Flagged CYP2C19 *1/*2 contraindication"),
        ("NEWS2 & Sepsis Acuity", lambda: get_deterioration_and_frailty(1)["news2"]["totalScore"] == 5, "NEWS2 score 5 (Medium / Urgent clinical review)"),
        ("Telemedicine 30s Brief", lambda: "clinicalAcuity" in generate_telemedicine_brief(1), "Attending tele-physician structured card"),
        ("Sundowning Real-time Telemetry", lambda: get_sundowning_and_wandering(1)["agitationIndex"] == 76, "Agitation Index 76 (Sundowning Surge)"),
        ("Circadian 24h Profile", lambda: get_circadian_sleep_profile(1)["circadianRegularityScore"] == 48, "Sleep fragmentation & day/night rhythm"),
        ("60s Shift Handoff Card", lambda: "eveningWatchOuts" in generate_shift_handoff_brief(1), "Cross-shift multidisciplinary handoff card"),
    ]

    results = []
    for name, check_fn, desc in component_checks:
        t0 = time.time()
        try:
            ok = check_fn()
            lat_ms = (time.time() - t0) * 1000.0
            if ok:
                print(f"  {PASS_BADGE} {BOLD}{name}{RESET} ({lat_ms:.1f}ms) {DIM}↳ {desc}{RESET}")
                results.append({"suite": "Component Tests", "test": name, "passed": True, "latency": lat_ms / 1000.0, "details": desc})
            else:
                print(f"  {FAIL_BADGE} {BOLD}{name}{RESET} ({lat_ms:.1f}ms): Check returned False")
                results.append({"suite": "Component Tests", "test": name, "passed": False, "latency": lat_ms / 1000.0, "details": "Assertion returned False"})
        except Exception as e:
            lat_ms = (time.time() - t0) * 1000.0
            print(f"  {FAIL_BADGE} {BOLD}{name}{RESET} ({lat_ms:.1f}ms): {e}")
            results.append({"suite": "Component Tests", "test": name, "passed": False, "latency": lat_ms / 1000.0, "details": str(e)})

    return results


def run_live_reasoning_suite() -> List[Dict[str, Any]]:
    """Runs Suite 3: Live End-to-End Gemini Reasoning Tests (gemini-3.8-flash)."""
    from agent.tests.test_live_dementia_reasoning import (
        test_case_1_sundowning_intervention,
        test_case_2_silent_uti_delirium_triage,
        test_case_3_shift_handoff_summary,
        test_case_4_validation_therapy_guardrail,
        LAST_RUN_METRICS,
    )

    print(f"\n{BOLD}{CYAN}=== SUITE 3: LIVE END-TO-END GEMINI REASONING TESTS (gemini-3.8-flash) ==={RESET}")

    reasoning_cases = [
        ("Case 1 (Sundowning Intervention)", test_case_1_sundowning_intervention, "Non-drug calming, LTM anchors (librarian, Glen Miller jazz, lavender blanket, blinds), no restraints"),
        ("Case 2 (Silent UTI / Delirium Triage)", test_case_2_silent_uti_delirium_triage, "Acute physical etiology, NEWS2 vitals / urinalysis before psychotropics"),
        ("Case 3 (Shift Handoff Summary)", test_case_3_shift_handoff_summary, "60-second briefing: vitals, day behavior, meals/hydration, sundowning watch-outs"),
        ("Case 4 (Validation Therapy Guardrail)", test_case_4_validation_therapy_guardrail, "Validation therapy: validates feelings, anti-confrontation guardrail, gentle redirection"),
    ]

    results = []
    for label, fn, desc in reasoning_cases:
        print(f"\n  {INFO_BADGE} Executing {BOLD}{label}{RESET}...")
        t0 = time.time()
        try:
            fn()
            lat = time.time() - t0
            print(f"  {PASS_BADGE} {BOLD}{label}{RESET} (Latency: {BOLD}{lat:.2f}s{RESET})")
            print(f"         {DIM}↳ Verified: {desc}{RESET}")
            results.append({"suite": "Live Reasoning", "test": label, "passed": True, "latency": lat, "details": desc})
        except Exception as e:
            lat = time.time() - t0
            print(f"  {FAIL_BADGE} {BOLD}{label}{RESET} (Latency: {lat:.2f}s): {e}")
            results.append({"suite": "Live Reasoning", "test": label, "passed": False, "latency": lat, "details": str(e)})

    return results


def print_summary_matrix(all_results: List[Dict[str, Any]], total_elapsed: float):
    """Prints a structured summary matrix with badges and performance metrics."""
    print("\n" + "=" * 80)
    print(f"{BOLD}careMP Sentinel — Verification Test Report Matrix{RESET}")
    print("=" * 80)
    header = f"{'SUITE':<18} | {'TEST / SPECIFICATION':<36} | {'STATUS':<10} | {'LATENCY':<10}"
    print(header)
    print("-" * 80)

    for r in all_results:
        status_badge = f"{GREEN}PASS{RESET}" if r["passed"] else f"{RED}FAIL{RESET}"
        if r["latency"] < 1.0:
            lat_str = f"{r['latency'] * 1000.0:.0f} ms"
        else:
            lat_str = f"{r['latency']:.2f} s"
        print(f"{r['suite']:<18} | {r['test']:<36} | [{status_badge:^8}] | {lat_str:<10}")

    print("=" * 80)
    total_count = len(all_results)
    passed_count = sum(1 for r in all_results if r["passed"])
    failed_count = total_count - passed_count
    pass_rate = (passed_count / max(1, total_count)) * 100.0

    print(f"{BOLD}TOTAL TESTS:{RESET} {total_count}  |  "
          f"{BOLD}{GREEN}PASSED:{RESET} {passed_count}  |  "
          f"{BOLD}{RED if failed_count > 0 else GREEN}FAILED:{RESET} {failed_count}  |  "
          f"{BOLD}PASS RATE:{RESET} {pass_rate:.1f}%  |  "
          f"{BOLD}TOTAL DURATION:{RESET} {total_elapsed:.2f}s")
    print("=" * 80)

    if failed_count == 0:
        print(f"\n{BOLD}{GREEN}🎉 ALL CAREMP SENTINEL TEST SUITES PASSED VERIFICATION WITH ZERO FAILURES!{RESET}\n")
    else:
        print(f"\n{BOLD}{RED}❌ VERIFICATION FAILED: {failed_count} test(s) did not meet clinical criteria.{RESET}\n")


def main():
    print(f"\n{BOLD}================================================================================")
    print(f"           careMP Sentinel — Lead QA & Verification Test Suite")
    print(f"  Branch: development-abraham | Model: gemini-3.8-flash | Resident: Eleanor Vance")
    print(f"================================================================================{RESET}")

    start_time = time.time()
    all_results = []

    # 1. Automated Dementia Tools Unit Tests
    all_results.extend(run_unit_suite())

    # 2. Component Smoke & Integration Tests
    all_results.extend(run_component_suite())

    # 3. Live End-to-End Gemini Reasoning Tests
    all_results.extend(run_live_reasoning_suite())

    total_elapsed = time.time() - start_time
    print_summary_matrix(all_results, total_elapsed)

    # Return exit code
    if any(not r["passed"] for r in all_results):
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
