from typing import List, Optional
from pydantic import BaseModel, Field


class SundowningAssessment(BaseModel):
    """
    Standard assessment output representing the resident's sundowning and agitation state.
    """
    resident_id: int
    agitation_index: float = Field(..., ge=0.0, le=100.0, description="Agitation and restlessness score (0-100)")
    status: str = Field(..., description="CALM | RESTLESS | SUNDOWNING_SURGE")
    severity: str = Field(..., description="NORMAL | LOW | MODERATE | HIGH")
    is_sundowning_window: bool = Field(default=False, description="True if reading occurred during late-afternoon window (15:00 - 19:30)")
    advance_notice_minutes: Optional[int] = Field(default=None, description="Early warning head start in minutes")
    contributing_factors: List[str] = Field(default_factory=list, description="Dynamically assembled live factors")
    recommended_interventions: List[str] = Field(default_factory=list, description="Targeted non-pharmacological calming actions")

