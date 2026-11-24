"""
Dementia Memory Care, Sundowning, Wandering & Circadian Tools for Care Coach Agent
Integrates Validation Therapy, non-pharmacological calming redirection, and 60-second shift briefings.
"""
from typing import Dict, Any
from ..api_client import api_client, parse_resident_id


def get_sundowning_and_wandering(resident_id: int = 1) -> Dict[str, Any]:
    """
    Retrieves real-time sundowning agitation index and spatial wandering safety status.
    Provides non-pharmacological calming suggestions anchored in the resident's life story.

    Returns:
        Dict containing:
        - agitationIndex: Numerical score (0-100) indicating restlessness/agitation severity.
        - alertLevel: 'CALM' | 'RESTLESS' | 'SUNDOWNING_SURGE'
        - wanderingStatus: 'SAFE_IN_ROOM' | 'HALLWAY_PACING' | 'NOCTURNAL_BED_EXIT' | 'PERIMETER_ALERT'
        - locationZone: Current facility room or zone (e.g., 'North Memory Corridor Gallery').
        - calmingSuggestions: Non-pharmacological redirection actions using LTM life anchors.

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.get_sundowning_and_wandering(clean_id)


def get_circadian_sleep_profile(resident_id: int = 1) -> Dict[str, Any]:
    """
    Retrieves 24-hour circadian sleep-wake rhythm regularity, daytime napping, and sleep fragmentation metrics.
    Monitors for day-night reversal common in moderate-to-advanced dementia.

    Returns:
        Dict containing:
        - dayNapMinutes: Total minutes slept or napped during daytime hours.
        - nightSleepMinutes: Total nighttime sleep duration in minutes.
        - sleepFragmentationEvents: Count of nocturnal awakenings or bed-exit disruptions.
        - circadianRegularityScore: Sleep-wake regularity score (0-100).
        - dayNightStatus: 'NORMAL' | 'MILD' | 'SEVERE_REVERSAL'

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.get_circadian_sleep_profile(clean_id)


def generate_shift_handoff_brief(resident_id: int = 1) -> Dict[str, Any]:
    """
    Synthesizes a structured 60-second clinical shift handoff card for memory care nursing staff.
    Combines physiological vitals, behavioral observations, meals/hydration, and evening watch-outs.

    Returns:
        Dict containing:
        - vitalsSummary: Physiological vitals, temperature, and NEWS2 acuity score.
        - behavioralObservations: Sundowning agitation index, wandering/pacing status, and mood.
        - mealsHydration: Dietary intake, hydration status, and morning pill administration notes.
        - eveningWatchOuts: Crucial night shift warnings, shadow triggers, and infection differentials.

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.generate_shift_handoff_brief(clean_id)
