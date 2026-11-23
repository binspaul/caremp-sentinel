"""
Digital Twin State, Clinical Report, and Engine Analytics Tools
"""
from typing import Dict, Any
from ..api_client import api_client, parse_resident_id


def get_current_twin_state(resident_id: int = 1) -> Dict[str, Any]:
    """
    Returns the complete digital twin health state required for clinical reasoning.
    Includes patient identity, baseline physiological vitals, health goals, and clinical report summaries.

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    return api_client.get_digital_twin(resident_id)


def get_health_record(record_id: str) -> Dict[str, Any]:
    """
    Returns the full detailed clinical health report for a specific record ID.
    Call this lazy-loading tool ONLY when specific detailed clinical report details or lab metrics are needed.

    Args:
        record_id: The unique ID of the health record to retrieve (e.g., 'rec_metabolic_panel_01', 'rec_cardio_scan_02', 'rec_sleep_study_03').
    """
    return api_client.get_health_record(record_id.strip())


def get_twin_analytics(resident_id: int = 1) -> Dict[str, Any]:
    """
    Returns high-order physiological analytics from the Health Analytics Engines.
    Provides chronological vs biological age delta, longevity resilience score,
    rolling EWMA vital baselines, 30-day vital trends, and cross-vital correlations.

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    return api_client.get_twin_analytics(resident_id)
