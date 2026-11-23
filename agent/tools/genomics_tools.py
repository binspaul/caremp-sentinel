"""
Genomic Risk & Pharmacogenomics Clinical Tools for Gemini Care Coach Agent
"""
from typing import Dict, Any, List
from ..api_client import api_client, parse_resident_id


def get_genomic_profile(resident_id: int = 1) -> Dict[str, Any]:
    """
    Returns the resident's comprehensive genomic risk profile, including:
    - Polygenic Risk Scores (PRS) for CAD, Type 2 Diabetes, Alzheimer's (APOE status), Sarcopenia.
    - Pharmacogenomic variants and metabolizer phenotypes (CYP2C19, SLCO1B1, CYP2D6, etc.).
    - Active CPIC drug-gene interaction alerts for currently prescribed medications.
    - Pheno-genomic vital threshold calibrations.

    Args:
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.get_genomic_profile(clean_id)


def check_pharmacogenomics(medication_name: str, resident_id: int = 1) -> Dict[str, Any]:
    """
    Evaluates a proposed or currently prescribed medication against the resident's genetic metabolizer profile.
    Returns CPIC Level A/B safety alerts, mechanisms of adverse risk, and recommended drug/dosage alternatives.

    Args:
        medication_name: Name of the drug (e.g., 'Clopidogrel', 'Atorvastatin', 'Simvastatin', 'Codeine', 'Metoprolol', 'Warfarin').
        resident_id: Integer ID of the resident (default 1).
    """
    clean_id = parse_resident_id(resident_id)
    return api_client.evaluate_drug_pgx(clean_id, medication_name.strip())
