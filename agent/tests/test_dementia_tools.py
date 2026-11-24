"""
Unit Test Suite for careMP Sentinel Dementia Memory Care Tools
Validates sundowning agitation, spatial wandering safety, circadian sleep profiles,
and 60-second shift handoff briefings.
"""
try:
    import pytest
except ImportError:
    pytest = None
import sys
import os

# Ensure repo root is on sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from agent.tools.dementia_tools import (
    get_sundowning_and_wandering,
    get_circadian_sleep_profile,
    generate_shift_handoff_brief,
)


def test_get_sundowning_and_wandering():
    """
    Test get_sundowning_and_wandering(1):
    - Assert 'agitationIndex' is in 0..100
    - Assert 'alertLevel' in ['CALM', 'RESTLESS', 'SUNDOWNING_SURGE']
    - Assert 'wanderingStatus' in ['SAFE_IN_ROOM', 'HALLWAY_PACING', 'NOCTURNAL_BED_EXIT', 'PERIMETER_ALERT']
    - Assert 'calmingSuggestions' has non-empty list of actionable non-drug tips
    """
    res = get_sundowning_and_wandering(1)
    assert isinstance(res, dict), "Result must be a dictionary"

    # 1. Assert agitationIndex is in 0..100
    assert "agitationIndex" in res, "'agitationIndex' missing in result"
    agitation = res["agitationIndex"]
    assert isinstance(agitation, (int, float)), f"'agitationIndex' must be numeric, got {type(agitation)}"
    assert 0 <= agitation <= 100, f"agitationIndex {agitation} outside [0, 100]"

    # 2. Assert alertLevel in ['CALM', 'RESTLESS', 'SUNDOWNING_SURGE']
    assert "alertLevel" in res, "'alertLevel' missing in result"
    allowed_alerts = ["CALM", "RESTLESS", "SUNDOWNING_SURGE"]
    assert res["alertLevel"] in allowed_alerts, f"alertLevel '{res['alertLevel']}' not in {allowed_alerts}"

    # 3. Assert wanderingStatus in ['SAFE_IN_ROOM', 'HALLWAY_PACING', 'NOCTURNAL_BED_EXIT', 'PERIMETER_ALERT']
    assert "wanderingStatus" in res, "'wanderingStatus' missing in result"
    allowed_wandering = ["SAFE_IN_ROOM", "HALLWAY_PACING", "NOCTURNAL_BED_EXIT", "PERIMETER_ALERT"]
    assert res["wanderingStatus"] in allowed_wandering, f"wanderingStatus '{res['wanderingStatus']}' not in {allowed_wandering}"

    # 4. Assert calmingSuggestions has non-empty list of actionable non-drug tips
    assert "calmingSuggestions" in res, "'calmingSuggestions' missing in result"
    calming = res["calmingSuggestions"]
    assert isinstance(calming, (list, tuple)), "'calmingSuggestions' must be a list or tuple"
    assert len(calming) > 0, "'calmingSuggestions' must not be empty"
    assert all(isinstance(tip, str) and len(tip.strip()) > 0 for tip in calming), (
        "All items in calmingSuggestions must be non-empty strings"
    )


def test_get_circadian_sleep_profile():
    """
    Test get_circadian_sleep_profile(1):
    - Assert 'circadianRegularityScore' in 0..100
    - Assert 'dayNightStatus' in ['NORMAL', 'MILD', 'SEVERE_REVERSAL']
    - Assert 'dayNapMinutes' and 'nightSleepMinutes' are valid integers
    """
    res = get_circadian_sleep_profile(1)
    assert isinstance(res, dict), "Result must be a dictionary"

    # 1. Assert circadianRegularityScore in 0..100
    assert "circadianRegularityScore" in res, "'circadianRegularityScore' missing in result"
    score = res["circadianRegularityScore"]
    assert isinstance(score, (int, float)), f"'circadianRegularityScore' must be numeric, got {type(score)}"
    assert 0 <= score <= 100, f"circadianRegularityScore {score} outside [0, 100]"

    # 2. Assert dayNightStatus in ['NORMAL', 'MILD', 'SEVERE_REVERSAL']
    assert "dayNightStatus" in res, "'dayNightStatus' missing in result"
    allowed_statuses = ["NORMAL", "MILD", "SEVERE_REVERSAL"]
    assert res["dayNightStatus"] in allowed_statuses, f"dayNightStatus '{res['dayNightStatus']}' not in {allowed_statuses}"

    # 3. Assert dayNapMinutes and nightSleepMinutes are valid integers
    assert "dayNapMinutes" in res, "'dayNapMinutes' missing in result"
    assert isinstance(res["dayNapMinutes"], int), f"dayNapMinutes {res['dayNapMinutes']} is not an integer"
    assert res["dayNapMinutes"] >= 0, f"dayNapMinutes {res['dayNapMinutes']} must be >= 0"

    assert "nightSleepMinutes" in res, "'nightSleepMinutes' missing in result"
    assert isinstance(res["nightSleepMinutes"], int), f"nightSleepMinutes {res['nightSleepMinutes']} is not an integer"
    assert res["nightSleepMinutes"] >= 0, f"nightSleepMinutes {res['nightSleepMinutes']} must be >= 0"


def test_generate_shift_handoff_brief():
    """
    Test generate_shift_handoff_brief(1):
    - Assert presence of 'vitalsSummary', 'behavioralObservations', 'mealsHydration', and 'eveningWatchOuts'
    """
    res = generate_shift_handoff_brief(1)
    assert isinstance(res, dict), "Result must be a dictionary"

    # Assert presence of required top-level sections
    required_sections = ["vitalsSummary", "behavioralObservations", "mealsHydration", "eveningWatchOuts"]
    for section in required_sections:
        assert section in res, f"Required section '{section}' missing from shift handoff brief"

    # Check vitalsSummary details
    vitals = res["vitalsSummary"]
    assert isinstance(vitals, dict), "'vitalsSummary' must be a dict"
    assert len(vitals) > 0, "'vitalsSummary' must not be empty"

    # Check behavioralObservations details
    behavior = res["behavioralObservations"]
    assert isinstance(behavior, dict), "'behavioralObservations' must be a dict"
    assert len(behavior) > 0, "'behavioralObservations' must not be empty"

    # Check mealsHydration details
    meals = res["mealsHydration"]
    assert isinstance(meals, dict), "'mealsHydration' must be a dict"
    assert len(meals) > 0, "'mealsHydration' must not be empty"

    # Check eveningWatchOuts details
    watch_outs = res["eveningWatchOuts"]
    assert isinstance(watch_outs, (list, tuple)), "'eveningWatchOuts' must be a list or tuple"
    assert len(watch_outs) > 0, "'eveningWatchOuts' must have at least one clinical watch-out item"
    assert all(isinstance(w, str) and len(w.strip()) > 0 for w in watch_outs), (
        "All eveningWatchOuts items must be non-empty strings"
    )


if __name__ == "__main__":
    print("=" * 60)
    print("  Running Dementia Tools Unit Test Suite")
    print("=" * 60)
    test_get_sundowning_and_wandering()
    print("  [PASS] test_get_sundowning_and_wandering")
    test_get_circadian_sleep_profile()
    print("  [PASS] test_get_circadian_sleep_profile")
    test_generate_shift_handoff_brief()
    print("  [PASS] test_generate_shift_handoff_brief")
    print("=" * 60)
    print("  ALL DEMENTIA TOOLS UNIT TESTS PASSED (3/3)")
    print("=" * 60)
