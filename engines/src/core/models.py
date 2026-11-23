from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class VitalReading(BaseModel):
    """
    Standard vital snapshot decoupled from source ingestion.
    """
    id: Optional[int] = None
    resident_id: int
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    body_temperature: Optional[float] = None
    skin_temperature: Optional[float] = None

    deep_sleep_time: Optional[int] = None
    light_sleep_time: Optional[int] = None
    rem_sleep_time: Optional[int] = None
    awake_sleep_time: Optional[int] = None
    total_sleep_time: Optional[int] = None
    sleep_computation_state: Optional[int] = None

class DigitalTwinPayload(BaseModel):
    """
    Full Digital Twin payload exchanging data between API, Agent, and Engines.
    Extended for careMP Sentinel with genomics, deterioration, and frailty diagnostics.
    """
    resident_id: int
    physiology: Dict[str, Any] = Field(default_factory=dict)
    baseline: Optional[Dict[str, Any]] = None
    trend: Optional[Dict[str, Any]] = None
    correlation: Optional[Dict[str, Any]] = None
    healthy_ageing: Optional[Dict[str, Any]] = None
    ai_summary: Optional[Dict[str, Any]] = None
    genomics: Optional[Dict[str, Any]] = None
    deterioration: Optional[Dict[str, Any]] = None
    frailty: Optional[Dict[str, Any]] = None
