"""
Digital Biomarker Electronic Frailty Index (e-FI) & Longevity Clock
Implements continuous cumulative deficit frailty calculation from wearable hemodynamics and mobility.
"""
from typing import Optional, List, Dict, Any, Tuple
from .models import FrailtyAssessment


def compute_frailty_and_longevity(
    resident_id: int,
    chronological_age: int,
    resting_hr: Optional[float],
    hrv_rmssd: Optional[float],
    systolic_bp: Optional[float],
    diastolic_bp: Optional[float],
    spo2: Optional[float],
    total_sleep_minutes: Optional[int] = None,
    deep_sleep_minutes: Optional[int] = None,
    step_count: Optional[int] = None
) -> FrailtyAssessment:
    """
    Computes continuous Rockwood e-FI deficit index and biological aging delta.
    """
    deficits: List[Tuple[str, float]] = []

    # Domain 1: Autonomic & Cardiovascular Resilience
    if resting_hr is not None:
        if resting_hr > 90:
            deficits.append(("Elevated resting tachycardia (>90 bpm)", 0.06))
        elif resting_hr < 50:
            deficits.append(("Resting bradycardia (<50 bpm)", 0.04))

    if hrv_rmssd is not None:
        if hrv_rmssd < 20:
            deficits.append(("Severely depressed HRV RMSSD (<20 ms)", 0.08))
        elif hrv_rmssd < 30:
            deficits.append(("Blunted parasympathetic vagal tone (HRV <30 ms)", 0.04))

    # Domain 2: Vascular Hemodynamics
    if systolic_bp is not None:
        if systolic_bp >= 160:
            deficits.append(("Stage 2 systolic hypertension (>=160 mmHg)", 0.08))
        elif systolic_bp >= 140:
            deficits.append(("Stage 1 systolic hypertension (>=140 mmHg)", 0.04))
        elif systolic_bp < 95:
            deficits.append(("Orthostatic hypotension susceptibility (<95 mmHg)", 0.06))

    # Domain 3: Oxygenation & Respiratory Reserve
    if spo2 is not None:
        if spo2 < 92:
            deficits.append(("Chronic hypoxemia reserve deficit (SpO2 <92%)", 0.08))
        elif spo2 < 95:
            deficits.append(("Mild desaturation (SpO2 <95%)", 0.03))

    # Domain 4: Sleep Architecture & Restorative Recovery
    if total_sleep_minutes is not None:
        if total_sleep_minutes < 300:  # < 5 hours
            deficits.append(("Severe sleep deprivation (<5 hours)", 0.06))
        elif total_sleep_minutes < 390: # < 6.5 hours
            deficits.append(("Suboptimal sleep duration (<6.5 hours)", 0.03))

    if deep_sleep_minutes is not None:
        if deep_sleep_minutes < 30:
            deficits.append(("Severely depleted slow-wave deep sleep (<30 mins)", 0.05))

    # Domain 5: Functional Locomotion & Sarcopenia proxy
    mobility_score = 80.0
    sarcopenia_risk = "LOW"
    if step_count is not None:
        if step_count < 1500:
            deficits.append(("Severe sedentary lifestyle (<1,500 daily steps)", 0.08))
            mobility_score = 35.0
            sarcopenia_risk = "HIGH"
        elif step_count < 3500:
            deficits.append(("Moderate physical inactivity (<3,500 steps)", 0.04))
            mobility_score = 60.0
            sarcopenia_risk = "MODERATE"
        else:
            mobility_score = 90.0
            sarcopenia_risk = "LOW"

    # Baseline cumulative score
    raw_deficit_sum = sum(score for _, score in deficits)
    # Add age-graded baseline frailty floor (0.0015 per year above 50)
    age_floor = max(0.0, (chronological_age - 50) * 0.0018)
    e_fi = min(0.95, round(raw_deficit_sum + age_floor, 3))

    # Classification
    if e_fi >= 0.25:
        classification = "FRAIL"
        bio_age_delta = round(e_fi * 18.0, 1)  # accelerated biological aging
    elif e_fi >= 0.12:
        classification = "PRE_FRAIL"
        bio_age_delta = round(e_fi * 10.0, 1)
    else:
        classification = "ROBUST"
        bio_age_delta = round(-2.5 + (e_fi * 10.0), 1)  # can be biologically younger

    # Autonomic resilience (0-100)
    autonomic_resilience = max(10.0, min(100.0, round(100.0 - (e_fi * 120.0), 1)))

    # Interventions
    interventions: List[str] = []
    if sarcopenia_risk in ("MODERATE", "HIGH"):
        interventions.append("Prescribe progressive resistance training (PRT) and targeted leucine/protein supplementation.")
    if any("sleep" in d[0].lower() for d in deficits):
        interventions.append("Implement circadian light entrainment and structured sleep hygiene protocol.")
    if any("hrv" in d[0].lower() for d in deficits):
        interventions.append("Recommend heart rate variability biofeedback (resonant breathing at 0.1 Hz).")
    if any("hypertension" in d[0].lower() for d in deficits):
        interventions.append("Review antihypertensive regimen and sodium-to-potassium dietary ratio.")

    factors = [f"{desc} (+{round(pts, 2)})" for desc, pts in deficits]

    return FrailtyAssessment(
        resident_id=resident_id,
        frailty_index=e_fi,
        classification=classification,
        biological_age_delta=bio_age_delta,
        sarcopenia_risk=sarcopenia_risk,
        mobility_cadence_score=mobility_score,
        autonomic_resilience=autonomic_resilience,
        contributing_factors=factors,
        longevity_interventions=interventions
    )
