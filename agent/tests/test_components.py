"""
Unit and Component Smoke Tests for careMP Sentinel Care Coach Agent
Validates digital twin retrieval, clinical reports, engine analytics,
dual-tier memory tools, compactor, and context injection.
"""
import sys
import os

# Add project root to sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from agent.tools.twin_tools import (
    get_current_twin_state,
    get_health_record,
    get_twin_analytics,
)
from agent.tools.memory_tools import (
    update_short_term_memory,
    update_long_term_memory,
    get_short_term_memory,
    get_long_term_memory,
)
from agent.tools.genomics_tools import (
    get_genomic_profile,
    check_pharmacogenomics,
)
from agent.tools.telemedicine_tools import (
    generate_telemedicine_brief,
    get_deterioration_and_frailty,
)
from agent.memory.context_builder import build_additional_context


def run_component_tests():
    print("=" * 60)
    print("  careMP Sentinel Care Coach Agent — Component Verification")
    print("=" * 60)

    # 1. Test Twin State Retrieval
    print("\n[1] Testing get_current_twin_state()...")
    twin = get_current_twin_state(resident_id=1)
    assert twin is not None, "Twin state is None!"
    print(f"  [OK] Twin profile loaded: {twin.get('name')} (Age: {twin.get('age')})")
    print(f"  [OK] Primary Goal: {twin.get('primaryGoal')}")

    # 2. Test Lazy Clinical Record Retrieval
    print("\n[2] Testing get_health_record('rec_metabolic_panel_01')...")
    report = get_health_record("rec_metabolic_panel_01")
    assert "fullReportText" in report, "Full report text missing!"
    print(f"  [OK] Report Type: {report.get('type')}")
    print(f"  [OK] Physician: {report.get('physician')}")

    # 3. Test Health Engines Analytics
    print("\n[3] Testing get_twin_analytics()...")
    analytics = get_twin_analytics(resident_id=1)
    assert "biologicalAgeDelta" in analytics, "Analytics payload missing biologicalAgeDelta!"
    print(f"  [OK] Biological Age Delta: {analytics.get('biologicalAgeDelta')} years")
    print(f"  [OK] Longevity Resilience Score: {analytics.get('resilienceScore')}/100")

    # 4. Test Short-Term Memory Update
    print("\n[4] Testing update_short_term_memory()...")
    stm_msg = "Mild migraine after evening run; hydrated and resting."
    stm_result = update_short_term_memory(information=stm_msg, resident_id=1, ttl_days=3)
    print(f"  [OK] Result: {stm_result}")
    current_stm = get_short_term_memory("1")
    assert stm_msg in current_stm, "STM did not persist!"
    print(f"  [OK] Verified active STM: '{current_stm}'")

    # 5. Test Long-Term Memory Update & Compaction
    print("\n[5] Testing update_long_term_memory()...")
    ltm_update = "Recently adopted daily 10-minute mindfulness breathwork before bed."
    ltm_result = update_long_term_memory(information=ltm_update, resident_id=1)
    print(f"  [OK] Result: {ltm_result}")
    current_ltm = get_long_term_memory("1")
    assert "mindfulness" in current_ltm.lower() or "breathwork" in current_ltm.lower(), "LTM did not include new habit!"
    print(f"  [OK] Verified updated LTM contains habit.")

    # 6. Test Context Builder Injection
    print("\n[6] Testing build_additional_context()...")
    full_context = build_additional_context("1")
    assert "Current Digital Twin State" in full_context
    assert "Long-Term Memory Profile" in full_context
    assert "Short-Term Memory" in full_context
    print("  [OK] Full health context block successfully constructed.")
    print(f"  [OK] Length: {len(full_context)} characters")

    # 7. Test Genomic Risk Profile
    print("\n[7] Testing get_genomic_profile()...")
    genomics = get_genomic_profile(resident_id=1)
    assert "prsScores" in genomics, "PRS scores missing in genomic profile!"
    assert len(genomics["prsScores"]) >= 3
    print(f"  [OK] Genetic Risk Tier: {genomics.get('overallGeneticRiskTier')}")
    print(f"  [OK] Conditions Evaluated: {[s['condition'] for s in genomics['prsScores']]}")

    # 8. Test Pharmacogenomics Conflict Check
    print("\n[8] Testing check_pharmacogenomics('Clopidogrel')...")
    pgx_res = check_pharmacogenomics(medication_name="Clopidogrel", resident_id=1)
    assert pgx_res["isSafe"] is False, "Clopidogrel should be flagged as unsafe for CYP2C19 *1/*2!"
    print(f"  [OK] Detected PGx Alert: {pgx_res['summary']}")

    # 9. Test Deterioration and NEWS2 Acuity
    print("\n[9] Testing get_deterioration_and_frailty()...")
    deterioration = get_deterioration_and_frailty(resident_id=1)
    assert "news2" in deterioration, "NEWS2 missing in deterioration profile!"
    print(f"  [OK] NEWS2 Score: {deterioration['news2']['totalScore']} ({deterioration['news2']['riskLevel']} Risk)")
    print(f"  [OK] Sepsis Suspected: {deterioration['sepsis']['isSuspected']} (qSOFA: {deterioration['sepsis']['qsofaScore']})")

    # 10. Test Telemedicine Clinical Briefing
    print("\n[10] Testing generate_telemedicine_brief()...")
    brief = generate_telemedicine_brief(resident_id=1)
    assert "clinicalAcuity" in brief, "Clinical acuity missing in telemedicine brief!"
    assert len(brief["pharmacogenomicWarnings"]) >= 1
    print(f"  [OK] Generated 30s Telehealth Brief for: {brief['patientName']}")
    print(f"  [OK] Action Protocol: {brief['actionProtocol']}")

    print("\n" + "=" * 60)
    print("  ALL SENTINEL COMPONENT TESTS PASSED SUCCESSFULLY! (10/10)")
    print("=" * 60)


if __name__ == "__main__":
    run_component_tests()
