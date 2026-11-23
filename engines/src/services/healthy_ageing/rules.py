from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

# Trend metrics and correlation pairs the rules below depend on for readiness check
REQUIRED_TREND_METRICS = ["heart_rate", "hrv"]
REQUIRED_CORRELATION_PAIRS = [("heart_rate", "oxygen_saturation"), ("heart_rate", "hrv")]
OPTIONAL_TREND_METRICS = ["total_sleep_time"]


def _baseline(context: Dict[str, Any], metric: str) -> Optional[float]:
    return context.get("baselines", {}).get(metric)


def _trend(context: Dict[str, Any], metric: str) -> Optional[Dict[str, Any]]:
    # Trends can be nested by window {"30m": {...}} or direct
    metric_trends = context.get("trends", {}).get(metric, {})
    if isinstance(metric_trends, dict) and "30m" in metric_trends:
        return metric_trends["30m"]
    return metric_trends if isinstance(metric_trends, dict) else None


def _correlation(context: Dict[str, Any], metric_a: str, metric_b: str) -> Optional[Dict[str, Any]]:
    return context.get("correlations", {}).get(f"{metric_a}-{metric_b}")


def _significant_bp_elevation(context: Dict[str, Any]) -> bool:
    systolic = _baseline(context, "systolic_bp")
    diastolic = _baseline(context, "diastolic_bp")
    if systolic is None or diastolic is None:
        return False
    return systolic >= 140 or diastolic >= 90


def _mild_bp_elevation(context: Dict[str, Any]) -> bool:
    if _significant_bp_elevation(context):
        return False
    systolic = _baseline(context, "systolic_bp")
    diastolic = _baseline(context, "diastolic_bp")
    if systolic is None or diastolic is None:
        return False
    return (130 <= systolic < 140) or (80 <= diastolic < 90)


def _resting_heart_rate_elevated(context: Dict[str, Any]) -> bool:
    heart_rate = _baseline(context, "heart_rate")
    return heart_rate is not None and heart_rate > 100


def _resting_heart_rate_low(context: Dict[str, Any]) -> bool:
    heart_rate = _baseline(context, "heart_rate")
    return heart_rate is not None and heart_rate < 50


def _low_oxygen_saturation(context: Dict[str, Any]) -> bool:
    spo2 = _baseline(context, "oxygen_saturation")
    return spo2 is not None and spo2 < 94


def _elevated_body_temperature(context: Dict[str, Any]) -> bool:
    temperature = _baseline(context, "body_temperature")
    return temperature is not None and temperature > 37.5


def _heart_rate_trending_up(context: Dict[str, Any]) -> bool:
    trend = _trend(context, "heart_rate")
    if trend is None or trend.get("status") != "ready":
        return False
    return trend["direction"] == "Increasing" and trend["strength"] >= 0.5


def _hrv_trending_down(context: Dict[str, Any]) -> bool:
    trend = _trend(context, "hrv")
    if trend is None or trend.get("status") != "ready":
        return False
    return trend["direction"] == "Decreasing" and trend["strength"] >= 0.5


def _abnormal_hr_spo2_correlation(context: Dict[str, Any]) -> bool:
    correlation = _correlation(context, "heart_rate", "oxygen_saturation")
    if correlation is None or correlation.get("status") != "ready":
        return False
    return correlation["direction"] == "Negative" and correlation["strength"] == "Strong"


def _insufficient_sleep(context: Dict[str, Any]) -> bool:
    total_sleep = _baseline(context, "total_sleep_time")
    return total_sleep is not None and total_sleep < 360


def _declining_sleep_trend(context: Dict[str, Any]) -> bool:
    trend = _trend(context, "total_sleep_time")
    if trend is None or trend.get("status") != "ready":
        return False
    return trend["direction"] == "Decreasing" and trend["strength"] >= 0.5


def _widening_pulse_pressure(context: Dict[str, Any]) -> bool:
    systolic = _baseline(context, "systolic_bp")
    diastolic = _baseline(context, "diastolic_bp")
    if systolic is None or diastolic is None:
        return False
    return (systolic - diastolic) > 60


def _hr_hrv_coupling_lost(context: Dict[str, Any]) -> bool:
    correlation = _correlation(context, "heart_rate", "hrv")
    if correlation is None or correlation.get("status") != "ready":
        return False
    if correlation["direction"] == "None":
        return True
    return correlation["direction"] == "Positive" and correlation["strength"] in ("Moderate", "Strong")


@dataclass
class Rule:
    id: str
    description: str
    penalty: float
    condition: Callable[[Dict[str, Any]], bool]


RULES: List[Rule] = [
    Rule("significant_bp_elevation", "Baseline blood pressure indicates hypertension (>=140/90)", 20, _significant_bp_elevation),
    Rule("mild_bp_elevation", "Baseline blood pressure is mildly elevated (130-139/80-89)", 8, _mild_bp_elevation),
    Rule("resting_heart_rate_elevated", "Baseline resting heart rate is high (>100 bpm)", 12, _resting_heart_rate_elevated),
    Rule("resting_heart_rate_low", "Baseline resting heart rate is low (<50 bpm)", 10, _resting_heart_rate_low),
    Rule("low_oxygen_saturation", "Baseline SpO2 is below a healthy threshold (<94%)", 20, _low_oxygen_saturation),
    Rule("elevated_body_temperature", "Baseline body temperature suggests possible fever (>37.5C)", 15, _elevated_body_temperature),
    Rule("heart_rate_trending_up", "Heart rate has a strong upward trend over the last 30 minutes", 10, _heart_rate_trending_up),
    Rule("hrv_trending_down", "HRV has a strong downward trend over the last 30 minutes", 10, _hrv_trending_down),
    Rule("abnormal_hr_spo2_correlation", "Heart rate and SpO2 are strongly negatively correlated", 10, _abnormal_hr_spo2_correlation),
    Rule("insufficient_sleep", "Baseline total sleep time is below a healthy threshold (<6h)", 12, _insufficient_sleep),
    Rule("declining_sleep_trend", "Total sleep time has a strong downward trend across recent nights", 8, _declining_sleep_trend),
    Rule("widening_pulse_pressure", "Baseline pulse pressure (systolic-diastolic gap) is elevated (>60 mmHg)", 12, _widening_pulse_pressure),
    Rule("hr_hrv_coupling_lost", "Heart rate and HRV have lost their normal negative coupling", 10, _hr_hrv_coupling_lost),
]

# Score-to-category bands
CATEGORY_BANDS = [
    (90, "Excellent"),
    (75, "Good"),
    (60, "Fair"),
    (40, "Poor"),
]
DEFAULT_CATEGORY = "Critical"

CATEGORY_THRESHOLDS = {
    "Excellent": 90.0,
    "Good": 75.0,
    "Fair": 60.0,
    "Poor": 40.0,
}


def evaluate_rules(context: Dict[str, Any]) -> List[Rule]:
    """Returns the subset of RULES whose condition is triggered by the given context."""
    return [rule for rule in RULES if rule.condition(context)]


def calculate_score(triggered_rules: List[Rule]) -> float:
    """Starts at 100 and subtracts each triggered rule's penalty, clamped to [0, 100]."""
    score = 100.0 - sum(rule.penalty for rule in triggered_rules)
    return max(0.0, min(100.0, score))


def determine_category(
    score: float,
    previous_category: Optional[str] = None,
    buffer: float = 1.5
) -> str:
    """
    Maps a 0-100 score to a category band.
    Includes a small hysteresis buffer to prevent UI alert flickering on boundaries.
    """
    # If resident has an established previous category, apply deadband buffer
    if previous_category and previous_category in CATEGORY_THRESHOLDS:
        threshold = CATEGORY_THRESHOLDS[previous_category]
        # Keep previous category if score is within the deadband buffer
        if score >= (threshold - buffer):
            # Check if score actually climbed into a higher category
            for higher_threshold, higher_category in CATEGORY_BANDS:
                if higher_threshold > threshold and score >= higher_threshold:
                    return higher_category
            return previous_category

    # Standard threshold mapping
    for threshold, category in CATEGORY_BANDS:
        if score >= threshold:
            return category
    return DEFAULT_CATEGORY
