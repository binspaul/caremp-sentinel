from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FrailtyAssessment(BaseModel):
    resident_id: int
    frailty_index: float = Field(..., ge=0.0, le=1.0, description="Rockwood e-FI score from 0.00 to 1.00")
    classification: str = Field(..., description="ROBUST (<0.12) | PRE_FRAIL (0.12-0.24) | FRAIL (>0.24)")
    biological_age_delta: float = Field(default=0.0, description="Biological age relative to chronological age (+/- years)")
    sarcopenia_risk: str = Field(default="LOW", description="LOW | MODERATE | HIGH")
    mobility_cadence_score: float = Field(default=80.0, description="Locomotion and step cadence index (0-100)")
    autonomic_resilience: float = Field(default=75.0, description="Autonomic recovery score (0-100)")
    contributing_factors: List[str] = Field(default_factory=list)
    longevity_interventions: List[str] = Field(default_factory=list)
