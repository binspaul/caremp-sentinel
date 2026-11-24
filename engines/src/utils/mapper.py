from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any, Dict, List, Optional
from ..core.models import VitalReading

METRIC_NAME_MAP = {
    "heart_rate": "heartRate",
    "hrv": "hrv",
    "oxygen_saturation": "spo2",
    "systolic_bp": "systolicBP",
    "diastolic_bp": "diastolicBP",
    "body_temperature": "bodyTemperature",
}

SLEEP_METRIC_NAME_MAP = {
    "deep_sleep_time": "deep",
    "light_sleep_time": "light",
    "rem_sleep_time": "rem",
    "total_sleep_time": "totalDuration",
}

ALL_METRIC_NAME_MAP = {**METRIC_NAME_MAP, **SLEEP_METRIC_NAME_MAP}

TREND_DIRECTION_MAP = {"Increasing": "UP", "Decreasing": "DOWN", "Stable": "STABLE"}
CORRELATION_DIRECTION_MAP = {"Positive": "POSITIVE", "Negative": "NEGATIVE"}
CORRELATION_STRENGTH_MAP = {"Weak": "WEAK", "Moderate": "MODERATE", "Strong": "STRONG"}

CATEGORY_MAP = {
    "Excellent": "GOOD",
    "Good": "GOOD",
    "Fair": "WATCH",
    "Poor": "CONCERN",
    "Critical": "CONCERN",
}


def build_reading_from_twin(twin: Dict[str, Any]) -> VitalReading:
    """
    Extracts a VitalReading object from incoming digital twin payload.
    Supports both raw numbers and { value, unit } object structures.
    """
    resident_id = twin.get("residentId") or twin.get("resident_id", 0)
    physiology = twin.get("physiology") or {}

    def value_of(api_name: str) -> Optional[float]:
        entry = physiology.get(api_name)
        if isinstance(entry, dict):
            return entry.get("value")
        if isinstance(entry, (int, float)):
            return float(entry)
        return None

    generated_at = None
    for entry in physiology.values():
        if isinstance(entry, dict) and entry.get("timestamp"):
            try:
                generated_at = datetime.fromisoformat(str(entry["timestamp"]).replace("Z", "+00:00"))
                break
            except (ValueError, TypeError):
                continue
    if generated_at is None:
        generated_at = datetime.now(timezone.utc)

    sleep = physiology.get("sleep") or {}
    deep = sleep.get("deep")
    light = sleep.get("light")
    rem = sleep.get("rem")
    has_sleep = any(v not in (None, 0) for v in (deep, light, rem))

    return VitalReading(
        id=0,
        resident_id=int(resident_id),
        generated_at=generated_at,
        heart_rate=value_of("heartRate"),
        hrv=value_of("hrv"),
        oxygen_saturation=value_of("spo2"),
        systolic_bp=value_of("systolicBP"),
        diastolic_bp=value_of("diastolicBP"),
        body_temperature=value_of("bodyTemperature"),
        skin_temperature=value_of("skinTemperature"),
        deep_sleep_time=deep if has_sleep else None,
        light_sleep_time=light if has_sleep else None,
        rem_sleep_time=rem if has_sleep else None,
        awake_sleep_time=None,
        total_sleep_time=((deep or 0) + (light or 0) + (rem or 0)) if has_sleep else None,
        sleep_computation_state=2 if has_sleep else 0,
    )


def map_baselines(baseline_engine: Any, resident_id: int) -> Dict[str, Any]:
    """Maps BaselineEngine state into the twin's baselines shape."""
    resident_states = baseline_engine.repository.get_baselines_for_resident(resident_id)
    baselines: Dict[str, Any] = {}

    for internal_name, api_name in METRIC_NAME_MAP.items():
        state = resident_states.get(internal_name)
        if state and "baseline" in state:
            baselines[api_name] = {
                "value": round(state["baseline"], 4),
                "updatedAt": state.get("updated_at")
            }

    sleep_baselines: Dict[str, Any] = {}
    for internal_name, api_name in SLEEP_METRIC_NAME_MAP.items():
        state = resident_states.get(internal_name)
        if state and "baseline" in state:
            sleep_baselines[api_name] = {
                "value": round(state["baseline"], 4),
                "updatedAt": state.get("updated_at")
            }
    if sleep_baselines:
        baselines["sleep"] = sleep_baselines

    return baselines


def map_trends(trend_engine: Any, resident_id: int, window_name: str = "30m") -> List[Dict[str, Any]]:
    """Maps TrendEngine state into the twin's flat trends array."""
    trends: List[Dict[str, Any]] = []

    for internal_name, api_name in ALL_METRIC_NAME_MAP.items():
        trend = trend_engine.get_current_trend(resident_id, internal_name, window_name)
        if trend is None or trend.get("status") != "ready":
            continue

        percentage_change = trend.get("percentage_change")
        trends.append({
            "vital": api_name,
            "window": window_name,
            "direction": TREND_DIRECTION_MAP.get(trend["direction"], "STABLE"),
            "percentageChange": percentage_change if percentage_change is not None else 0.0,
            "rateOfChange": trend["slope"]
        })

    return trends


def map_correlations(correlation_engine: Any, resident_id: int) -> List[Dict[str, Any]]:
    """Maps CorrelationEngine state into the twin's flat correlations array."""
    correlations_state = correlation_engine.get_current_correlations(resident_id)
    correlations: List[Dict[str, Any]] = []

    for pair_key, stats in correlations_state.items():
        if stats.get("status") != "ready":
            continue
        if stats.get("direction") == "None":
            continue

        metric_a, metric_b = pair_key.split("-", 1)
        api_a = ALL_METRIC_NAME_MAP.get(metric_a, metric_a)
        api_b = ALL_METRIC_NAME_MAP.get(metric_b, metric_b)

        correlations.append({
            "vitalPair": f"{api_a}-{api_b}",
            "coefficient": stats["coefficient"],
            "strength": CORRELATION_STRENGTH_MAP.get(stats["strength"], "MODERATE"),
            "direction": CORRELATION_DIRECTION_MAP.get(stats["direction"], "POSITIVE")
        })

    return correlations


def map_healthy_ageing(healthy_ageing_engine: Any, resident_id: int) -> Optional[Dict[str, Any]]:
    """Maps HealthyAgeingEngine assessment into healthInsights.healthyAgeing."""
    assessment = healthy_ageing_engine.get_current_assessment(resident_id)
    if assessment.get("status") != "ready":
        return None

    return {
        "score": assessment["score"],
        "category": CATEGORY_MAP.get(assessment["category"], "GOOD"),
        "triggeredRules": assessment["triggered_rules"]
    }


def map_genomics(genomics_engine: Any, resident_id: int) -> Optional[Dict[str, Any]]:
    """Maps GenomicsEngine assessment into twin payload."""
    assessment = genomics_engine.get_assessment(resident_id)
    if not assessment:
        return None

    return {
        "overallGeneticRiskTier": assessment.overall_genetic_risk_tier,
        "prsScores": [
            {
                "condition": s.condition,
                "percentile": s.percentile,
                "riskLevel": s.risk_level,
                "oddsRatio": s.odds_ratio,
                "clinicalImplication": s.clinical_implication
            }
            for s in assessment.prs_scores
        ],
        "pharmacogenomics": {
            "variants": [
                {"gene": v.gene, "diplotype": v.diplotype, "phenotype": v.phenotype}
                for v in assessment.variants
            ],
            "activeAlerts": [
                {
                    "medication": a.medication,
                    "gene": a.gene,
                    "severity": a.severity,
                    "cpicLevel": a.cpic_level,
                    "mechanism": a.mechanism,
                    "clinicalRecommendation": a.clinical_recommendation,
                    "alternativeOptions": a.alternative_options
                }
                for a in assessment.active_pgx_alerts
            ]
        },
        "phenoGenomicCalibrations": [
            {
                "condition": c.condition,
                "adjustedMetrics": c.adjusted_metrics,
                "rationale": c.rationale
            }
            for c in assessment.pheno_calibrations
        ]
    }


def map_deterioration(deterioration_engine: Any, reading: VitalReading, is_sleep: bool = False) -> Dict[str, Any]:
    """Maps DeteriorationEngine assessment into twin payload."""
    assessment = deterioration_engine.assess_reading(reading, is_sleep=is_sleep)
    return {
        "news2": {
            "totalScore": assessment.news2.total_score,
            "riskLevel": assessment.news2.risk_level,
            "hasExtremeScore": assessment.news2.has_extreme_single_score,
            "actionProtocol": assessment.news2.action_protocol,
            "subscores": [
                {
                    "parameter": s.parameter,
                    "observedValue": s.observed_value,
                    "points": s.points,
                    "clinicalNote": s.clinical_note
                }
                for s in assessment.news2.subscores
            ]
        },
        "sepsis": {
            "isSuspected": assessment.sepsis.is_sepsis_suspected,
            "severity": assessment.sepsis.severity,
            "qsofaScore": assessment.sepsis.qsofa_score,
            "sirsCriteriaMet": assessment.sepsis.sirs_criteria_met,
            "advanceWarningHours": assessment.sepsis.advance_warning_hours,
            "clinicalIndicators": assessment.sepsis.clinical_indicators,
            "immediateRecommendation": assessment.sepsis.immediate_recommendation
        },
        "nocturnalHemodynamics": {
            "isSleepPeriod": assessment.nocturnal.is_sleep_period,
            "dippingStatus": assessment.nocturnal.dipping_status,
            "dipPercentage": assessment.nocturnal.dip_percentage,
            "hypoxiaDesaturations": assessment.nocturnal.hypoxia_desaturations,
            "arrhythmiaDetected": assessment.nocturnal.arrhythmia_detected,
            "clinicalSummary": assessment.nocturnal.clinical_summary
        },
        "overallClinicalPriority": assessment.overall_clinical_priority
    }


def map_frailty(frailty_engine: Any, reading: VitalReading, chronological_age: Optional[int] = None) -> Dict[str, Any]:
    """Maps FrailtyEngine assessment into twin payload."""
    assessment = frailty_engine.assess_reading(reading, chronological_age=chronological_age)
    return {
        "frailtyIndex": assessment.frailty_index,
        "classification": assessment.classification,
        "biologicalAgeDelta": assessment.biological_age_delta,
        "sarcopeniaRisk": assessment.sarcopenia_risk,
        "mobilityCadenceScore": assessment.mobility_cadence_score,
        "autonomicResilience": assessment.autonomic_resilience,
        "contributingFactors": assessment.contributing_factors,
        "longevityInterventions": assessment.longevity_interventions
    }


def map_sundowning(sundowning_engine: Any, reading: VitalReading) -> Dict[str, Any]:
    """Maps SundowningEngine assessment into twin payload."""
    assessment = sundowning_engine.assess_reading(reading)
    return {
        "agitationIndex": assessment.agitation_index,
        "status": assessment.status,
        "severity": assessment.severity,
        "isSundowningWindow": assessment.is_sundowning_window,
        "advanceNoticeMinutes": assessment.advance_notice_minutes,
        "contributingFactors": assessment.contributing_factors,
        "recommendedInterventions": assessment.recommended_interventions
    }


def map_wandering(wandering_engine: Any, reading: VitalReading, location_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Maps WanderingEngine assessment into twin payload."""
    location = location_data or {}
    zone_name = location.get("zone") or location.get("currentZone") or location.get("name") or "North Memory Corridor Gallery"
    zone_type = location.get("zoneType") or "corridor"
    is_safe = location.get("isSafePerimeter", True)

    assessment = wandering_engine.assess_movement(
        resident_id=reading.resident_id,
        current_zone=zone_name,
        zone_type=zone_type,
        is_safe_perimeter=is_safe,
        reading=reading
    )
    return {
        "wanderingStatus": assessment.wandering_status,
        "elopementRisk": assessment.elopement_risk,
        "riskScore": assessment.risk_score,
        "currentLocation": assessment.current_location,
        "isSafeZone": assessment.is_safe_zone,
        "nightBedExit": assessment.night_bed_exit,
        "pacingLoopCount": assessment.pacing_loop_count,
        "minutesOutOfBed": assessment.minutes_out_of_bed,
        "contributingFactors": assessment.contributing_factors,
        "actionAlert": assessment.action_alert
    }
