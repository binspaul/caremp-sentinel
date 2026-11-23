"""
Scalable Telemedicine Consultation & Deterioration Tools for Gemini Agent
"""
from typing import Dict, Any
from ..api_client import api_client, parse_resident_id


def generate_telemedicine_brief(resident_id: int = 1) -> Dict[str, Any]:
    """
    Synthesizes a 30-second FHIR-aligned clinical briefing for an attending tele-physician, including:
    1. Primary physiological concerns and real-time National Early Warning Score (NEWS2).
    2. Sepsis prodrome status and estimated advance warning window.
    3. 7-day longitudinal vital trends and circadian hemodynamic dipping.
    4. Active Pharmacogenomic (PGx) drug-gene contraindications and alternatives.
    5. Actionable preventive micro-interventions for caregivers.

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.generate_telemedicine_brief(clean_id)


def get_deterioration_and_frailty(resident_id: int = 1) -> Dict[str, Any]:
    """
    Retrieves real-time clinical acuity and longevity metrics:
    - National Early Warning Score 2 (NEWS2 total and subscores)
    - Sepsis early warning (qSOFA criteria, SIRS markers, and early detection window)
    - Electronic Frailty Index (Rockwood e-FI) and biological aging delta (+/- years)
    - Nocturnal hemodynamic dipping profile and sleep desaturation index

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.get_deterioration_and_frailty(clean_id)
