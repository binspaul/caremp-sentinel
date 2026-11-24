from typing import List, Optional
from pydantic import BaseModel, Field


class CircadianAssessment(BaseModel):
    """
    Standard assessment output representing the resident's 24-hour circadian sleep-wake rhythm.
    """
    resident_id: int
    circadian_score: float = Field(..., ge=0.0, le=100.0, description="Overall sleep-wake rhythm regularity score (0-100)")
    status: str = Field(..., description="NORMAL_RHYTHM | MILD_DRIFT | SEVERE_REVERSAL")
    severity: str = Field(..., description="NORMAL | LOW | MODERATE | HIGH")
    daytime_sleep_minutes: int = Field(default=0, description="Total minutes slept/napped during daytime hours")
    nighttime_sleep_minutes: int = Field(default=0, description="Total minutes slept in bed during night hours")
    day_night_ratio: float = Field(default=0.0, description="Ratio of daytime napping to nighttime sleep")
    night_awakenings: int = Field(default=0, description="Count of nighttime wake-up or bed-exit episodes")
    deep_sleep_minutes: Optional[int] = Field(default=None, description="Restorative deep sleep minutes recorded")
    contributing_factors: List[str] = Field(default_factory=list, description="Dynamically assembled live rhythm factors")
    actionable_advice: List[str] = Field(default_factory=list, description="Targeted daylight, activity, and sleep hygiene advice")
