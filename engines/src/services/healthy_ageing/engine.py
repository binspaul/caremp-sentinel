from typing import Any, Dict, Optional
from ...core.base import BaseEngine
from ...core.models import VitalReading
from ..baseline.engine import BaselineEngine
from ..trend.engine import TrendEngine
from ..correlation.engine import CorrelationEngine
from . import rules

RECALCULATE_EVERY = 1


class HealthyAgeingEngine(BaseEngine):
    """
    Healthy Ageing Engine that evaluates predefined clinical health rules against
    Baseline, Trend, and Correlation engines' current state for a resident,
    and derives a 0-100 score and category from triggered rules.
    Enhanced with boundary hysteresis to prevent alert flapping.
    """

    def __init__(
        self,
        baseline_engine: Optional[BaselineEngine] = None,
        trend_engine: Optional[TrendEngine] = None,
        correlation_engine: Optional[CorrelationEngine] = None,
        recalculate_every: int = RECALCULATE_EVERY
    ):
        self.baseline_engine = baseline_engine or BaselineEngine()
        self.trend_engine = trend_engine or TrendEngine()
        self.correlation_engine = correlation_engine or CorrelationEngine()
        self.recalculate_every = recalculate_every
        self._readings_since_recalculation: Dict[int, int] = {}
        
        # In-memory category memory for hysteresis deadbands: resident_id -> category string
        self._last_category: Dict[int, str] = {}

    @property
    def name(self) -> str:
        return "Healthy Ageing Engine"

    def process_reading(self, reading: VitalReading) -> Dict[str, Any]:
        """
        Calculates and returns the resident's current healthy ageing assessment.
        """
        resident_id = reading.resident_id
        result = self.get_current_assessment(resident_id)

        return {
            "resident_id": resident_id,
            "healthy_ageing": result,
            "status": "updated"
        }

    def get_current_assessment(self, resident_id: int) -> Dict[str, Any]:
        """
        Returns the current health assessment for a resident based on the latest
        Baseline, Trend, and Correlation state.
        """
        # Fetch trends for required and optional metrics
        trends = {
            metric: self.trend_engine.get_current_trend(resident_id, metric)
            for metric in rules.REQUIRED_TREND_METRICS + rules.OPTIONAL_TREND_METRICS
        }
        correlations = self.correlation_engine.get_current_correlations(resident_id)

        # 1. Gate readiness on required inputs being past their learning phase
        pending_trends = [
            metric for metric in rules.REQUIRED_TREND_METRICS
            if trends.get(metric) is None or trends[metric]["status"] == "learning"
        ]
        pending_correlations = [
            f"{metric_a}-{metric_b}" for metric_a, metric_b in rules.REQUIRED_CORRELATION_PAIRS
            if correlations.get(f"{metric_a}-{metric_b}", {}).get("status") == "learning"
        ]

        if pending_trends or pending_correlations:
            result: Dict[str, Any] = {"status": "learning"}
            if pending_trends:
                result["pending_trends"] = pending_trends
            if pending_correlations:
                result["pending_correlations"] = pending_correlations
            return result

        # 2. All required inputs are ready: evaluate clinical rules
        baselines = self.baseline_engine.get_current_baselines(resident_id)
        context = {"baselines": baselines, "trends": trends, "correlations": correlations}

        triggered = rules.evaluate_rules(context)
        score = rules.calculate_score(triggered)
        
        # Apply category determination with resident's previous category deadband
        prev_cat = self._last_category.get(resident_id)
        category = rules.determine_category(score, previous_category=prev_cat)
        self._last_category[resident_id] = category

        return {
            "status": "ready",
            "score": round(score, 2),
            "category": category,
            "triggered_rules": [rule.id for rule in triggered]
        }
