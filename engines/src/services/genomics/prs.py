"""
Polygenic Risk Score (PRS) Engine & Pheno-Genomic Calibration
Evaluates genetic predisposition percentiles and customizes vital baseline alerting thresholds.
"""
from typing import Dict, Any, List, Optional
from .models import PolygenicRiskScore, PhenoGenomicCalibration


def calculate_prs_level(percentile: float) -> str:
    if percentile >= 80.0:
        return "HIGH"
    elif percentile >= 60.0:
        return "ELEVATED"
    elif percentile <= 25.0:
        return "LOW"
    return "AVERAGE"


def evaluate_polygenic_profile(prs_inputs: Dict[str, float]) -> List[PolygenicRiskScore]:
    """
    Transforms raw percentile inputs into validated PolygenicRiskScore objects with clinical implications.
    """
    scores: List[PolygenicRiskScore] = []

    # 1. Coronary Artery Disease (CAD / CVD)
    if "cad" in prs_inputs or "cvd" in prs_inputs:
        pct = float(prs_inputs.get("cad", prs_inputs.get("cvd", 50.0)))
        level = calculate_prs_level(pct)
        or_val = round(1.0 + (pct - 50.0) * 0.025, 2) if pct > 50 else round(1.0 - (50.0 - pct) * 0.012, 2)
        implication = (
            "Elevated lifetime vascular resistance risk; requires strict systolic BP auto-regulation and nocturnal dip monitoring."
            if pct >= 60 else "Standard cardiovascular risk trajectory."
        )
        scores.append(PolygenicRiskScore(
            condition="Coronary Artery Disease (CAD)",
            percentile=pct,
            risk_level=level,
            odds_ratio=max(0.5, or_val),
            snps_evaluated=182,
            clinical_implication=implication
        ))

    # 2. Type 2 Diabetes (T2D)
    if "t2d" in prs_inputs or "diabetes" in prs_inputs:
        pct = float(prs_inputs.get("t2d", prs_inputs.get("diabetes", 50.0)))
        level = calculate_prs_level(pct)
        or_val = round(1.0 + (pct - 50.0) * 0.02, 2) if pct > 50 else round(1.0 - (50.0 - pct) * 0.01, 2)
        implication = (
            "Metabolic dysregulation susceptibility; higher autonomic HRV sensitivity to postprandial glycemic excursions."
            if pct >= 60 else "Population baseline metabolic risk profile."
        )
        scores.append(PolygenicRiskScore(
            condition="Type 2 Diabetes (T2D)",
            percentile=pct,
            risk_level=level,
            odds_ratio=max(0.5, or_val),
            snps_evaluated=240,
            clinical_implication=implication
        ))

    # 3. Late-Onset Alzheimer's Disease / APOE Status
    if "alzheimers" in prs_inputs or "apoe" in prs_inputs:
        pct = float(prs_inputs.get("alzheimers", 50.0))
        level = calculate_prs_level(pct)
        or_val = round(1.0 + (pct - 50.0) * 0.035, 2) if pct > 50 else 0.8
        implication = (
            "Neurodegenerative vulnerability marker; prioritized for circadian rhythm stability, deep/REM sleep duration, and cognitive vitality tracking."
            if pct >= 60 else "Standard neurocognitive longevity baseline."
        )
        scores.append(PolygenicRiskScore(
            condition="Late-Onset Alzheimer's Disease",
            percentile=pct,
            risk_level=level,
            odds_ratio=max(0.6, or_val),
            snps_evaluated=95,
            clinical_implication=implication
        ))

    # 4. Sarcopenia / Musculoskeletal Frailty
    if "sarcopenia" in prs_inputs or "osteoporosis" in prs_inputs:
        pct = float(prs_inputs.get("sarcopenia", prs_inputs.get("osteoporosis", 50.0)))
        level = calculate_prs_level(pct)
        or_val = round(1.0 + (pct - 50.0) * 0.018, 2)
        implication = (
            "Accelerated age-related muscle mass/strength loss predisposition; triggers continuous gait cadence and recovery tracking."
            if pct >= 60 else "Normal musculoskeletal age trajectory."
        )
        scores.append(PolygenicRiskScore(
            condition="Sarcopenia & Musculoskeletal Frailty",
            percentile=pct,
            risk_level=level,
            odds_ratio=max(0.7, or_val),
            snps_evaluated=110,
            clinical_implication=implication
        ))

    return scores


def calibrate_vital_thresholds(prs_scores: List[PolygenicRiskScore]) -> List[PhenoGenomicCalibration]:
    """
    Dynamically adjusts vital thresholds and alarm limits based on PRS.
    """
    calibrations: List[PhenoGenomicCalibration] = []

    for score in prs_scores:
        if score.condition.startswith("Coronary") and score.risk_level in ("ELEVATED", "HIGH"):
            calibrations.append(PhenoGenomicCalibration(
                condition="Coronary Artery Disease (CAD)",
                adjusted_metrics={
                    "systolic_bp_target_max": 125.0,  # Tightened from standard 140
                    "diastolic_bp_target_max": 80.0,   # Tightened from standard 90
                    "nocturnal_dip_min_percent": 10.0, # Flag if dipping < 10%
                    "resting_hr_upper_alert": 85.0     # Lower threshold for tachycardia alert
                },
                rationale="High genetic CVD burden requires tighter hemodynamic control to prevent microvascular remodeling."
            ))

        elif score.condition.startswith("Late-Onset") and score.risk_level in ("ELEVATED", "HIGH"):
            calibrations.append(PhenoGenomicCalibration(
                condition="Late-Onset Alzheimer's Disease",
                adjusted_metrics={
                    "min_deep_sleep_minutes": 60,
                    "min_rem_sleep_minutes": 60,
                    "max_sleep_fragmentation_events": 3
                },
                rationale="APOE4 carriers require optimized glymphatic clearance through sustained slow-wave deep sleep."
            ))

        elif score.condition.startswith("Type 2") and score.risk_level in ("ELEVATED", "HIGH"):
            calibrations.append(PhenoGenomicCalibration(
                condition="Type 2 Diabetes (T2D)",
                adjusted_metrics={
                    "hrv_rmssd_warning_min": 25.0,
                    "autonomic_strain_threshold": 65.0
                },
                rationale="Diabetic autonomic neuropathy early screening through tightened parasympathetic HRV tolerance."
            ))

    return calibrations
