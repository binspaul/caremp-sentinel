"""
Nocturnal Arrhythmia & Hypoxia Pattern Detector
Evaluates circadian hemodynamic dipping, sleep apnea desaturations, and nocturnal arrhythmic events.
"""
from typing import Optional, Dict, Any, List
from .models import NocturnalRiskAssessment


def evaluate_nocturnal_hemodynamics(
    is_sleep: bool,
    systolic_bp: Optional[float],
    daytime_sbp_baseline: Optional[float],
    heart_rate: Optional[float],
    spo2: Optional[float]
) -> NocturnalRiskAssessment:
    """
    Analyzes sleep telemetry for loss of nocturnal dipping, sleep hypoxemia, and nocturnal arrhythmias.
    """
    if not is_sleep:
        return NocturnalRiskAssessment(
            is_sleep_period=False,
            dipping_status="DAYTIME_ACTIVE",
            dip_percentage=None,
            hypoxia_desaturations=0,
            arrhythmia_detected=False,
            clinical_summary="Patient is in daytime active window."
        )

    # 1. Dipping calculation
    dip_pct: Optional[float] = None
    dipping_status = "UNKNOWN"
    summary_points: List[str] = []

    if systolic_bp is not None and daytime_sbp_baseline is not None and daytime_sbp_baseline > 0:
        dip_pct = round(((daytime_sbp_baseline - systolic_bp) / daytime_sbp_baseline) * 100.0, 1)

        if dip_pct >= 10.0 and dip_pct <= 20.0:
            dipping_status = "NORMAL_DIPPER"
            summary_points.append(f"Healthy nocturnal dipping ({dip_pct}%) preserving endothelial elasticity")
        elif dip_pct >= 0.0 and dip_pct < 10.0:
            dipping_status = "NON_DIPPER"
            summary_points.append(f"Blunted nocturnal dip ({dip_pct}% < 10%); elevated cardiovascular strain")
        elif dip_pct < 0.0:
            dipping_status = "REVERSE_DIPPER"
            summary_points.append(f"Dangerous reverse nocturnal dipping (BP increased {abs(dip_pct)}% during sleep); high stroke risk")
        else:  # > 20%
            dipping_status = "EXTREME_DIPPER"
            summary_points.append(f"Extreme nocturnal dipping ({dip_pct}%); monitor for cerebral hypoperfusion")

    # 2. Nocturnal Desaturation (Sleep Apnea Proxy)
    desat_count = 0
    if spo2 is not None and spo2 < 90.0:
        desat_count = 1
        summary_points.append(f"Nocturnal hypoxemia episode (SpO2 {spo2}%); indicates sleep-disordered breathing / apnea")

    # 3. Nocturnal Arrhythmia (Bradycardia or Sudden Tachycardia)
    arrhythmia = False
    if heart_rate is not None:
        if heart_rate > 110.0:
            arrhythmia = True
            summary_points.append(f"Nocturnal tachyarrhythmia spike ({heart_rate} bpm during sleep)")
        elif heart_rate < 45.0:
            arrhythmia = True
            summary_points.append(f"Severe nocturnal bradycardia run ({heart_rate} bpm)")

    clinical_summary = "; ".join(summary_points) if summary_points else "Restful nocturnal hemodynamics."

    return NocturnalRiskAssessment(
        is_sleep_period=True,
        dipping_status=dipping_status,
        dip_percentage=dip_pct,
        hypoxia_desaturations=desat_count,
        arrhythmia_detected=arrhythmia,
        clinical_summary=clinical_summary
    )
