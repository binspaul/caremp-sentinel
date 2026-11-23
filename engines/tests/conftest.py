import pytest
from src.core.models import VitalReading

@pytest.fixture
def sample_reading():
    return VitalReading(
        resident_id=101,
        heart_rate=72.0,
        systolic_bp=120.0,
        diastolic_bp=80.0
    )
