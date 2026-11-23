from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NEWS2Subscore(BaseModel):
    parameter: str
    observed_value: Optional[float] = None
    points: int = 0
    clinical_note: str


class NEWS2Assessment(BaseModel):
    total_score: int = Field(..., ge=0, le=20)
    risk_level: str = Field(..., description="LOW | MEDIUM | HIGH")
    has_extreme_single_score: bool = Field(default=False, description="True if any single parameter scores 3")
    subscores: List[NEWS2Subscore] = Field(default_factory=list)
    action_protocol: str


class SepsisRiskAssessment(BaseModel):
    is_sepsis_suspected: bool = False
    severity: str = Field(default="LOW", description="LOW | ELEVATED | HIGH_PRODROME")
    qsofa_score: int = Field(default=0, ge=0, le=3)
    sirs_criteria_met: int = Field(default=0, ge=0, le=4)
    advance_warning_hours: Optional[float] = None
    clinical_indicators: List[str] = Field(default_factory=list)
    immediate_recommendation: str


class NocturnalRiskAssessment(BaseModel):
    is_sleep_period: bool = False
    dipping_status: str = Field(default="UNKNOWN", description="NORMAL_DIPPER | NON_DIPPER | REVERSE_DIPPER | EXTREME_DIPPER")
    dip_percentage: Optional[float] = None
    hypoxia_desaturations: int = 0
    arrhythmia_detected: bool = False
    clinical_summary: str


class DeteriorationAssessment(BaseModel):
    resident_id: int
    news2: NEWS2Assessment
    sepsis: SepsisRiskAssessment
    nocturnal: NocturnalRiskAssessment
    overall_clinical_priority: str = Field(default="ROUTINE", description="ROUTINE | URGENT_REVIEW | CRITICAL_EMERGENCY")
