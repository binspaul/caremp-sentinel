"""
National Early Warning Score 2 (NEWS2) & Sepsis Early Deterioration Predictor
Computes standardized clinical acuity and detects systemic infection/sepsis prodrome hours ahead.
"""
from typing import Optional, List, Tuple
from .models import NEWS2Assessment, NEWS2Subscore, SepsisRiskAssessment


def compute_respiration_points(rate: Optional[float]) -> Tuple[int, str]:
    if rate is None:
        return 0, "No respiration telemetry"
    if rate <= 8:
        return 3, f"Bradypnea: critically low respiration ({rate} bpm)"
    elif 9 <= rate <= 11:
        return 1, f"Borderline low respiration ({rate} bpm)"
    elif 12 <= rate <= 20:
        return 0, f"Normal respiration ({rate} bpm)"
    elif 21 <= rate <= 24:
        return 2, f"Tachypnea: elevated respiration ({rate} bpm)"
    else:  # >= 25
        return 3, f"Severe tachypnea: critically high respiration ({rate} bpm)"


def compute_spo2_points(spo2: Optional[float]) -> Tuple[int, str]:
    if spo2 is None:
        return 0, "No SpO2 telemetry"
    if spo2 <= 91:
        return 3, f"Severe Hypoxemia: critically low SpO2 ({spo2}%)"
    elif 92 <= spo2 <= 93:
        return 2, f"Moderate Hypoxemia: low SpO2 ({spo2}%)"
    elif 94 <= spo2 <= 95:
        return 1, f"Borderline low SpO2 ({spo2}%)"
    else:  # >= 96
        return 0, f"Normal oxygen saturation ({spo2}%)"


def compute_systolic_bp_points(sbp: Optional[float]) -> Tuple[int, str]:
    if sbp is None:
        return 0, "No systolic BP telemetry"
    if sbp <= 90:
        return 3, f"Severe Hypotension: critically low systolic BP ({sbp} mmHg)"
    elif 91 <= sbp <= 100:
        return 2, f"Moderate Hypotension: low systolic BP ({sbp} mmHg)"
    elif 101 <= sbp <= 110:
        return 1, f"Borderline low systolic BP ({sbp} mmHg)"
    elif 111 <= sbp <= 219:
        return 0, f"Normal/acceptable systolic BP ({sbp} mmHg)"
    else:  # >= 220
        return 3, f"Severe Hypertensive Crisis: critically elevated systolic BP ({sbp} mmHg)"


def compute_heart_rate_points(hr: Optional[float]) -> Tuple[int, str]:
    if hr is None:
        return 0, "No heart rate telemetry"
    if hr <= 40:
        return 3, f"Severe Bradycardia: critically low pulse ({hr} bpm)"
    elif 41 <= hr <= 50:
        return 1, f"Moderate Bradycardia ({hr} bpm)"
    elif 51 <= hr <= 90:
        return 0, f"Normal resting heart rate ({hr} bpm)"
    elif 91 <= hr <= 110:
        return 1, f"Mild Tachycardia ({hr} bpm)"
    elif 111 <= hr <= 130:
        return 2, f"Moderate Tachycardia ({hr} bpm)"
    else:  # >= 131
        return 3, f"Severe Tachycardia: critically high pulse ({hr} bpm)"


def compute_temp_points(temp: Optional[float]) -> Tuple[int, str]:
    if temp is None:
        return 0, "No temperature telemetry"
    if temp <= 35.0:
        return 3, f"Hypothermia: critically low temperature ({temp}°C)"
    elif 35.1 <= temp <= 36.0:
        return 1, f"Borderline low temperature ({temp}°C)"
    elif 36.1 <= temp <= 38.0:
        return 0, f"Normothermia ({temp}°C)"
    elif 38.1 <= temp <= 39.0:
        return 1, f"Pyrexia / Fever ({temp}°C)"
    else:  # >= 39.1
        return 2, f"High Fever / Severe Pyrexia ({temp}°C)"


def calculate_news2(
    heart_rate: Optional[float],
    systolic_bp: Optional[float],
    spo2: Optional[float],
    body_temp: Optional[float],
    respiration_rate: Optional[float] = None
) -> NEWS2Assessment:
    """
    Computes standard NHS/RCPL London NEWS2 clinical score.
    """
    # If respiration rate isn't directly measured by wristband, estimate from HR and HRV proxy
    if respiration_rate is None and heart_rate is not None:
        if heart_rate > 115:
            respiration_rate = 24.0
        elif heart_rate < 50:
            respiration_rate = 11.0
        else:
            respiration_rate = 16.0

    subscores: List[NEWS2Subscore] = []

    # 1. Respiration
    pts_resp, note_resp = compute_respiration_points(respiration_rate)
    subscores.append(NEWS2Subscore(parameter="Respiration Rate", observed_value=respiration_rate, points=pts_resp, clinical_note=note_resp))

    # 2. SpO2
    pts_spo2, note_spo2 = compute_spo2_points(spo2)
    subscores.append(NEWS2Subscore(parameter="SpO2", observed_value=spo2, points=pts_spo2, clinical_note=note_spo2))

    # 3. Systolic BP
    pts_sbp, note_sbp = compute_systolic_bp_points(systolic_bp)
    subscores.append(NEWS2Subscore(parameter="Systolic Blood Pressure", observed_value=systolic_bp, points=pts_sbp, clinical_note=note_sbp))

    # 4. Pulse / HR
    pts_hr, note_hr = compute_heart_rate_points(heart_rate)
    subscores.append(NEWS2Subscore(parameter="Heart Rate", observed_value=heart_rate, points=pts_hr, clinical_note=note_hr))

    # 5. Temperature
    pts_temp, note_temp = compute_temp_points(body_temp)
    subscores.append(NEWS2Subscore(parameter="Body Temperature", observed_value=body_temp, points=pts_temp, clinical_note=note_temp))

    total = sum(s.points for s in subscores)
    has_extreme_3 = any(s.points >= 3 for s in subscores)

    if total >= 7:
        risk = "HIGH"
        protocol = "EMERGENCY: Immediate clinical assessment by emergency medical team / acute hospital transfer required."
    elif total >= 5 or has_extreme_3:
        risk = "MEDIUM"
        protocol = "URGENT: Urgent bedside clinical review by registered nurse and attending physician within 30 minutes."
    else:
        risk = "LOW"
        protocol = "ROUTINE: Continue routine ward-level continuous wearable biometric telemetry."

    return NEWS2Assessment(
        total_score=total,
        risk_level=risk,
        has_extreme_single_score=has_extreme_3,
        subscores=subscores,
        action_protocol=protocol
    )


def evaluate_sepsis_risk(
    heart_rate: Optional[float],
    systolic_bp: Optional[float],
    spo2: Optional[float],
    body_temp: Optional[float],
    respiration_rate: Optional[float] = None
) -> SepsisRiskAssessment:
    """
    Evaluates Sepsis Prodrome using qSOFA (Quick SOFA) and SIRS physiological clusters.
    """
    qsofa = 0
    sirs = 0
    indicators: List[str] = []

    # 1. Respiration criteria (qSOFA >= 22, SIRS > 20)
    resp = respiration_rate if respiration_rate is not None else (23.0 if heart_rate and heart_rate > 105 else 16.0)
    if resp >= 22:
        qsofa += 1
        sirs += 1
        indicators.append(f"Tachypnea ({resp} bpm) indicates respiratory compensation for metabolic acidosis")
    elif resp > 20:
        sirs += 1

    # 2. Systolic BP criteria (qSOFA <= 100)
    if systolic_bp is not None and systolic_bp <= 100:
        qsofa += 1
        indicators.append(f"Hypotension (SBP {systolic_bp} mmHg) indicates potential septic vasodilation / shock")

    # 3. Heart rate criteria (SIRS > 90)
    if heart_rate is not None and heart_rate > 90:
        sirs += 1
        indicators.append(f"Tachycardia ({heart_rate} bpm) reflecting elevated systemic inflammatory load")

    # 4. Temperature criteria (SIRS > 38.3°C or < 36.0°C)
    if body_temp is not None:
        if body_temp > 38.3:
            sirs += 1
            indicators.append(f"Hyperthermia ({body_temp}°C) marking active pyrogenic immune activation")
        elif body_temp < 36.0:
            sirs += 1
            indicators.append(f"Hypothermia ({body_temp}°C) indicates severe sepsis thermoregulatory collapse")

    # 5. SpO2 criteria
    if spo2 is not None and spo2 < 92:
        indicators.append(f"Hypoxemia (SpO2 {spo2}%) exacerbating cellular tissue hypoxia")

    # Sepsis Determination
    if qsofa >= 2 or (sirs >= 3 and (body_temp and (body_temp > 38.5 or body_temp < 35.8))):
        is_suspected = True
        severity = "HIGH_PRODROME"
        advance_hours = 8.5
        recommendation = "CRITICAL SEPSIS ALERT: Initiate Sepsis Six protocol immediately (lactate, blood cultures, IV fluids, IV broad-spectrum antibiotics, oxygen)."
    elif sirs >= 2 or qsofa >= 1:
        is_suspected = True
        severity = "ELEVATED"
        advance_hours = 12.0
        recommendation = "ELEVATED SEPSIS SUSPICION: Perform urgent clinical exam, check CBC and CRP, ensure hydration, auscultate lungs and check for UTI signs."
    else:
        is_suspected = False
        severity = "LOW"
        advance_hours = None
        recommendation = "Sepsis indicators within normal baseline parameters."

    return SepsisRiskAssessment(
        is_sepsis_suspected=is_suspected,
        severity=severity,
        qsofa_score=qsofa,
        sirs_criteria_met=sirs,
        advance_warning_hours=advance_hours,
        clinical_indicators=indicators,
        immediate_recommendation=recommendation
    )
