from typing import List, Optional
from pydantic import BaseModel, Field


class WanderingAssessment(BaseModel):
    """
    Standard assessment output representing the resident's spatial wandering and elopement risk.
    """
    resident_id: int
    wandering_status: str = Field(..., description="SAFE_IN_ROOM | HALLWAY_PACING | NOCTURNAL_BED_EXIT | PERIMETER_ALERT")
    elopement_risk: str = Field(..., description="LOW | ELEVATED | CRITICAL")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Spatial risk score (0-100)")
    current_location: str = Field(default="Unknown", description="Current room or zone name")
    is_safe_zone: bool = Field(default=True, description="True if resident is inside safe interior perimeter")
    night_bed_exit: bool = Field(default=False, description="True if resident is out of bed during night hours (23:00 - 05:00)")
    pacing_loop_count: int = Field(default=0, description="Corridor pacing laps detected in rolling 15 minutes")
    minutes_out_of_bed: float = Field(default=0.0, description="Elapsed minutes out of bed at night")
    contributing_factors: List[str] = Field(default_factory=list, description="Dynamically assembled live risk factors")
    action_alert: Optional[str] = Field(default=None, description="Actionable staff alert dispatched")
