import pytest
from datetime import datetime, timedelta
from src.services.correlation.engine import CorrelationEngine, MIN_READINGS, VITAL_PAIRS
from src.services.correlation.repository import InMemoryCorrelationRepository
from src.core.models import VitalReading

_BASE_TIME = datetime(2026, 7, 29, 13, 36, 0)

def test_correlation_learning_phase_until_minimum_readings():
    engine = CorrelationEngine(repository=InMemoryCorrelationRepository())

    for i in range(MIN_READINGS - 1):
        reading = VitalReading(
            resident_id=1,
            heart_rate=70.0 + i,
            oxygen_saturation=98.0 - (i % 2),
            hrv=50.0 - i,
            systolic_bp=120.0 + i,
            diastolic_bp=80.0 + i,
            body_temperature=36.6,
            generated_at=_BASE_TIME + timedelta(minutes=i)
        )
        result = engine.process_reading(reading)
        corr = result["correlations"]["heart_rate-oxygen_saturation"]
        assert corr["status"] == "learning"

def test_correlation_becomes_ready_once_minimum_readings_reached():
    engine = CorrelationEngine(repository=InMemoryCorrelationRepository())

    for i in range(MIN_READINGS):
        reading = VitalReading(
            resident_id=1,
            heart_rate=70.0 + i,
            oxygen_saturation=98.0,
            hrv=50.0 - i,  # HR increases while HRV decreases -> negative correlation
            systolic_bp=120.0 + i,
            diastolic_bp=80.0 + i,
            body_temperature=36.6,
            generated_at=_BASE_TIME + timedelta(minutes=i)
        )
        result = engine.process_reading(reading)

    hr_hrv = result["correlations"]["heart_rate-hrv"]
    assert hr_hrv["status"] == "ready"
    assert hr_hrv["direction"] == "Negative"
    assert hr_hrv["strength"] == "Strong"
    assert hr_hrv["coefficient"] == pytest.approx(-1.0)

def test_asynchronous_sensor_pairing_buffer():
    engine = CorrelationEngine(repository=InMemoryCorrelationRepository())

    # Send 10 pairs where HR and SpO2 arrive 10 seconds apart in separate readings
    for i in range(MIN_READINGS):
        t_hr = _BASE_TIME + timedelta(minutes=i)
        t_spo2 = t_hr + timedelta(seconds=10)

        # Reading with only heart rate
        engine.process_reading(VitalReading(resident_id=2, heart_rate=60.0 + i, generated_at=t_hr))
        
        # Reading 10 seconds later with only SpO2
        result = engine.process_reading(VitalReading(resident_id=2, oxygen_saturation=99.0 - (i * 0.2), generated_at=t_spo2))

    hr_spo2 = result["correlations"]["heart_rate-oxygen_saturation"]
    # Thanks to the 30s async pairing buffer, they paired up and exited learning mode!
    assert hr_spo2["status"] == "ready"
    assert hr_spo2["direction"] == "Negative"
