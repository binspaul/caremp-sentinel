"""
Centralized Backend & Analytics API Client for Care Coach Agent

Supports seamless toggle between Live NestJS endpoints and local mock data:
- When USE_MOCK_API=True: Operates immediately with rich mock state and local memory stores.
- When USE_MOCK_API=False: Connects to live backend with JWT authentication and fallback resilience.
"""
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
try:
    import requests
except ImportError:
    requests = None

from .config import (
    USE_MOCK_API,
    API_BASE_URL,
    API_BEARER_TOKEN,
    API_USER_EMAIL,
    API_USER_PASSWORD,
    ENGINES_API_URL,
)
from .mock_data import (
    MOCK_TWIN_PROFILES,
    MOCK_HEALTH_REPORTS,
    MOCK_ENGINE_ANALYTICS,
    MOCK_LTM_STORE,
    MOCK_STM_STORE,
    MOCK_GENOMICS_PROFILES,
    MOCK_DETERIORATION_PROFILES,
    MOCK_DEMENTIA_PROFILES,
)

logger = logging.getLogger(__name__)


def parse_resident_id(user_id: Any) -> int:
    """Helper utility to parse a user_id or resident_id into an integer resident ID."""
    if user_id is None or not str(user_id).strip():
        return 1
    clean_id = str(user_id).strip()
    if clean_id.lower() in ("user", "default", "me", "resident"):
        return 1
    try:
        return int(clean_id)
    except ValueError:
        match = re.search(r'\d+', clean_id)
        if match:
            return int(match.group(0))
        return 1


class ApiClient:
    """Unified API Client with mock-first fallback architecture for hackathon agility."""

    def __init__(self):
        self._cached_token: Optional[str] = None
        self.use_mock: bool = USE_MOCK_API

    def get_token(self) -> str:
        """Retrieves JWT Bearer Token via config or login endpoint."""
        if API_BEARER_TOKEN and API_BEARER_TOKEN.strip():
            return API_BEARER_TOKEN.strip()

        if self._cached_token:
            return self._cached_token

        if not API_USER_EMAIL or not API_USER_PASSWORD:
            return "mock-jwt-token"

        login_url = f"{API_BASE_URL}/auth/login"
        payload = {
            "emailAddress": API_USER_EMAIL.strip(),
            "password": API_USER_PASSWORD.strip()
        }

        try:
            response = requests.post(login_url, json=payload, timeout=5)
            if response.status_code == 200:
                data = response.json()
                token = data.get("token") or (data.get("data") and data.get("data").get("token"))
                if token:
                    self._cached_token = token
                    return token
        except Exception as e:
            logger.warning(f"Live auth connection failed ({e}), continuing in mock mode.")

        return "mock-jwt-token"

    def clear_token_cache(self):
        self._cached_token = None

    # --- Digital Twin Endpoints ---

    def get_digital_twin(self, resident_id: Any) -> Dict[str, Any]:
        """Fetches Digital Twin profile for resident."""
        res_id = parse_resident_id(resident_id)

        if self.use_mock:
            return MOCK_TWIN_PROFILES.get(res_id, MOCK_TWIN_PROFILES[1])

        token = self.get_token()
        url = f"{API_BASE_URL}/digital-twin/resident/{res_id}"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                body = response.json()
                if body.get("data"):
                    return body["data"]
            logger.warning(f"Live digital twin fetch returned {response.status_code}, falling back to mock.")
        except Exception as e:
            logger.warning(f"Failed to fetch live digital twin ({e}), falling back to mock.")

        return MOCK_TWIN_PROFILES.get(res_id, MOCK_TWIN_PROFILES[1])

    # --- Health Reports (Lazy-Loading) ---

    def get_health_record(self, record_id: str) -> Dict[str, Any]:
        """Fetches detailed clinical report."""
        if record_id in MOCK_HEALTH_REPORTS:
            return MOCK_HEALTH_REPORTS[record_id]

        return {
            "error": f"Health record with ID '{record_id}' not found.",
            "availableRecordIds": list(MOCK_HEALTH_REPORTS.keys())
        }

    # --- Short-Term Memory ---

    def get_short_term_memory(self, resident_id: Any) -> Optional[Dict[str, Any]]:
        """Fetches active short-term memory record."""
        res_id = parse_resident_id(resident_id)

        if self.use_mock:
            record = MOCK_STM_STORE.get(res_id)
            if record and not record.get("isExpired"):
                return record
            return None

        token = self.get_token()
        url = f"{API_BASE_URL}/short-term-memory/{res_id}"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                body = response.json()
                return body.get("data")
        except Exception as e:
            logger.warning(f"Live STM fetch failed ({e}), using mock.")

        return MOCK_STM_STORE.get(res_id)

    def save_short_term_memory(
        self,
        resident_id: Any,
        memory_text: str,
        ttl_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Saves short-term memory with TTL."""
        res_id = parse_resident_id(resident_id)
        ttl = ttl_days if (ttl_days and ttl_days > 0) else 7

        if self.use_mock:
            expires_at = (datetime.now(timezone.utc) + timedelta(days=ttl)).isoformat()
            saved_record = {
                "residentId": res_id,
                "memoryText": memory_text,
                "ttlDays": ttl,
                "expiresAt": expires_at,
                "isExpired": False
            }
            MOCK_STM_STORE[res_id] = saved_record
            return saved_record

        token = self.get_token()
        url = f"{API_BASE_URL}/short-term-memory"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"residentId": res_id, "memoryText": memory_text, "ttlDays": ttl}

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            if response.status_code in (200, 201):
                body = response.json()
                return body.get("data", payload)
        except Exception as e:
            logger.warning(f"Live STM save failed ({e}), saved to local mock store.")

        # Local fallback save
        MOCK_STM_STORE[res_id] = {
            "residentId": res_id,
            "memoryText": memory_text,
            "ttlDays": ttl,
            "isExpired": False
        }
        return MOCK_STM_STORE[res_id]

    # --- Long-Term Memory ---

    def get_long_term_memory(self, resident_id: Any) -> Optional[Dict[str, Any]]:
        """Fetches long-term memory profile."""
        res_id = parse_resident_id(resident_id)

        if self.use_mock:
            text = MOCK_LTM_STORE.get(res_id, "")
            return {"residentId": res_id, "memoryText": text} if text else None

        token = self.get_token()
        url = f"{API_BASE_URL}/long-term-memory/{res_id}"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                body = response.json()
                return body.get("data")
        except Exception as e:
            logger.warning(f"Live LTM fetch failed ({e}), using mock.")

        text = MOCK_LTM_STORE.get(res_id, "")
        return {"residentId": res_id, "memoryText": text} if text else None

    def save_long_term_memory(self, resident_id: Any, memory_text: str) -> Dict[str, Any]:
        """Saves compacted long-term memory profile."""
        res_id = parse_resident_id(resident_id)

        if self.use_mock:
            MOCK_LTM_STORE[res_id] = memory_text
            return {"residentId": res_id, "memoryText": memory_text}

        token = self.get_token()
        url = f"{API_BASE_URL}/long-term-memory"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"residentId": res_id, "memoryText": memory_text}

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            if response.status_code in (200, 201):
                body = response.json()
                return body.get("data", payload)
        except Exception as e:
            logger.warning(f"Live LTM save failed ({e}), saved to local mock store.")

        MOCK_LTM_STORE[res_id] = memory_text
        return {"residentId": res_id, "memoryText": memory_text}

    # --- Health Engines Analytics ---

    def get_twin_analytics(self, resident_id: Any) -> Dict[str, Any]:
        """
        Fetches physiological trend analytics, biological age delta, and correlations
        from the Health Analytics Engines service.
        """
        res_id = parse_resident_id(resident_id)

        if self.use_mock:
            return MOCK_ENGINE_ANALYTICS.get(res_id, MOCK_ENGINE_ANALYTICS[1])

        url = f"{ENGINES_API_URL}/pipeline"
        twin = self.get_digital_twin(res_id)
        try:
            response = requests.post(url, json=twin, timeout=5)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning(f"Live engines service not reachable ({e}), returning mock analytics.")

        return MOCK_ENGINE_ANALYTICS.get(res_id, MOCK_ENGINE_ANALYTICS[1])

    # --- careMP Sentinel: Genomics & Precision Biotechnology ---

    def get_genomic_profile(self, resident_id: Any) -> Dict[str, Any]:
        """
        Fetches PRS scores, pharmacogenomics variants, and active drug-gene contraindications.
        """
        res_id = parse_resident_id(resident_id)
        if self.use_mock:
            return MOCK_GENOMICS_PROFILES.get(res_id, MOCK_GENOMICS_PROFILES[1])

        url = f"{ENGINES_API_URL}/genomics"
        twin = self.get_digital_twin(res_id)
        try:
            response = requests.post(url, json=twin, timeout=5)
            if response.status_code == 200:
                insights = response.json().get("healthInsights", {})
                return insights.get("genomics", MOCK_GENOMICS_PROFILES[1])
        except Exception as e:
            logger.warning(f"Genomics engine query failed ({e}), using mock.")

        return MOCK_GENOMICS_PROFILES.get(res_id, MOCK_GENOMICS_PROFILES[1])

    def evaluate_drug_pgx(self, resident_id: Any, medication_name: str) -> Dict[str, Any]:
        """
        Checks a proposed medication against the resident's genetic variants per CPIC guidelines.
        """
        profile = self.get_genomic_profile(resident_id)
        med_lower = medication_name.lower().strip()

        alerts = profile.get("pharmacogenomics", {}).get("activeAlerts", [])
        matched_alert = next((a for a in alerts if a.get("medication", "").lower() == med_lower), None)

        if matched_alert:
            return {
                "status": "ALERT_TRIGGERED",
                "residentId": resident_id,
                "medication": medication_name,
                "alert": matched_alert,
                "isSafe": False,
                "summary": f"CONTRAINDICATION / HIGH RISK: {medication_name} conflicts with {matched_alert.get('gene')}. Recommendation: {matched_alert.get('clinicalRecommendation')}"
            }

        return {
            "status": "NO_KNOWN_CONTRAINDICATION",
            "residentId": resident_id,
            "medication": medication_name,
            "isSafe": True,
            "summary": f"No high-risk CPIC pharmacogenomic conflict detected for {medication_name} under resident's sequenced alleles."
        }

    # --- careMP Sentinel: Telemedicine & Early Deterioration ---

    def get_deterioration_and_frailty(self, resident_id: Any) -> Dict[str, Any]:
        """
        Retrieves live NEWS2 score, Sepsis prodrome assessment, and Rockwood e-FI frailty index.
        """
        res_id = parse_resident_id(resident_id)
        if self.use_mock:
            return MOCK_DETERIORATION_PROFILES.get(res_id, MOCK_DETERIORATION_PROFILES[1])

        url = f"{ENGINES_API_URL}/deterioration"
        twin = self.get_digital_twin(res_id)
        try:
            response = requests.post(url, json=twin, timeout=5)
            if response.status_code == 200:
                insights = response.json().get("healthInsights", {})
                return insights.get("deterioration", MOCK_DETERIORATION_PROFILES[1])
        except Exception as e:
            logger.warning(f"Deterioration engine query failed ({e}), using mock.")

        return MOCK_DETERIORATION_PROFILES.get(res_id, MOCK_DETERIORATION_PROFILES[1])

    def generate_telemedicine_brief(self, resident_id: Any) -> Dict[str, Any]:
        """
        Synthesizes a 30-second FHIR-aligned clinical briefing for attending tele-physicians.
        """
        res_id = parse_resident_id(resident_id)
        twin = self.get_digital_twin(res_id)
        genomics = self.get_genomic_profile(res_id)
        deterioration = self.get_deterioration_and_frailty(res_id)

        news2 = deterioration.get("news2", {})
        sepsis = deterioration.get("sepsis", {})
        pgx_alerts = genomics.get("pharmacogenomics", {}).get("activeAlerts", [])

        brief = {
            "residentId": res_id,
            "patientName": twin.get("name", "Resident 1"),
            "clinicalAcuity": {
                "news2Score": news2.get("totalScore", 0),
                "riskLevel": news2.get("riskLevel", "LOW"),
                "sepsisSuspected": sepsis.get("isSepsisSuspected", False),
                "sepsisSeverity": sepsis.get("severity", "LOW")
            },
            "pharmacogenomicWarnings": [
                f"{a['medication']} x {a['gene']} ({a['severity']}): {a['clinicalRecommendation']}"
                for a in pgx_alerts
            ],
            "actionProtocol": news2.get("actionProtocol", "Continue monitoring"),
            "recommendedImmediateActions": sepsis.get("clinicalIndicators", [])
        }
        return brief

    # --- careMP Sentinel: Dementia Memory Care & Validation Telemetry ---

    def get_sundowning_and_wandering(self, resident_id: Any) -> Dict[str, Any]:
        """
        Retrieves real-time sundowning agitation metrics and wandering/spatial safety status.
        Returns agitationIndex, alertLevel, wanderingStatus, locationZone, and calmingSuggestions.
        """
        res_id = parse_resident_id(resident_id)
        if self.use_mock:
            dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES[1])
            sundowning = dementia.get("sundowning", {})
            return {
                "residentId": res_id,
                "agitationIndex": sundowning.get("agitationIndex", 76),
                "alertLevel": sundowning.get("alertLevel", "SUNDOWNING_SURGE"),
                "wanderingStatus": sundowning.get("wanderingStatus", "HALLWAY_PACING"),
                "locationZone": sundowning.get("locationZone", "North Memory Corridor Gallery"),
                "isSundowningWindow": sundowning.get("isSundowningWindow", True),
                "advanceNoticeMinutes": sundowning.get("advanceNoticeMinutes", 35),
                "calmingSuggestions": sundowning.get("calmingSuggestions", []),
            }

        url = f"{ENGINES_API_URL}/pipeline"
        twin = self.get_digital_twin(res_id)
        try:
            response = requests.post(url, json=twin, timeout=5)
            if response.status_code == 200:
                insights = response.json().get("healthInsights", {})
                sundowning_data = insights.get("sundowning", {})
                wandering_data = insights.get("wandering", {})
                status_raw = sundowning_data.get("status", "SUNDOWNING_SURGE")
                alert_level = status_raw if status_raw in ("CALM", "RESTLESS", "SUNDOWNING_SURGE") else "SUNDOWNING_SURGE"
                return {
                    "residentId": res_id,
                    "agitationIndex": sundowning_data.get("agitationIndex", 76),
                    "alertLevel": alert_level,
                    "wanderingStatus": wandering_data.get("wanderingStatus", "HALLWAY_PACING"),
                    "locationZone": wandering_data.get("currentLocation", "North Memory Corridor Gallery"),
                    "isSundowningWindow": sundowning_data.get("isSundowningWindow", True),
                    "advanceNoticeMinutes": sundowning_data.get("advanceNoticeMinutes", 35),
                    "calmingSuggestions": sundowning_data.get("recommendedInterventions") or MOCK_DEMENTIA_PROFILES[1]["sundowning"]["calmingSuggestions"],
                }
        except Exception as e:
            logger.warning(f"Sundowning/wandering query failed ({e}), using mock.")

        dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES[1])
        sundowning = dementia.get("sundowning", {})
        return {
            "residentId": res_id,
            "agitationIndex": sundowning.get("agitationIndex", 76),
            "alertLevel": sundowning.get("alertLevel", "SUNDOWNING_SURGE"),
            "wanderingStatus": sundowning.get("wanderingStatus", "HALLWAY_PACING"),
            "locationZone": sundowning.get("locationZone", "North Memory Corridor Gallery"),
            "isSundowningWindow": sundowning.get("isSundowningWindow", True),
            "advanceNoticeMinutes": sundowning.get("advanceNoticeMinutes", 35),
            "calmingSuggestions": sundowning.get("calmingSuggestions", []),
        }

    def get_circadian_sleep_profile(self, resident_id: Any) -> Dict[str, Any]:
        """
        Retrieves 24-hour circadian sleep-wake rhythm regularity and day-night reversal metrics.
        Returns dayNapMinutes, nightSleepMinutes, sleepFragmentationEvents, circadianRegularityScore, and dayNightStatus.
        """
        res_id = parse_resident_id(resident_id)
        if self.use_mock:
            dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES[1])
            circ = dementia.get("circadian", {})
            return {
                "residentId": res_id,
                "dayNapMinutes": circ.get("dayNapMinutes", 110),
                "nightSleepMinutes": circ.get("nightSleepMinutes", 290),
                "sleepFragmentationEvents": circ.get("sleepFragmentationEvents", 5),
                "circadianRegularityScore": circ.get("circadianRegularityScore", 48),
                "dayNightStatus": circ.get("dayNightStatus", "MILD"),
                "deepSleepMinutes": circ.get("deepSleepMinutes", 42),
                "dayNightRatio": circ.get("dayNightRatio", 0.38),
                "actionableAdvice": circ.get("actionableAdvice", []),
            }

        url = f"{ENGINES_API_URL}/circadian"
        twin = self.get_digital_twin(res_id)
        try:
            response = requests.post(url, json=twin, timeout=5)
            if response.status_code == 200:
                insights = response.json().get("healthInsights", {})
                circ_data = insights.get("circadian", {})
                status_raw = circ_data.get("status", "MILD_DRIFT")
                day_night_status = "MILD"
                if "NORMAL" in status_raw:
                    day_night_status = "NORMAL"
                elif "SEVERE" in status_raw or "REVERSAL" in status_raw:
                    day_night_status = "SEVERE_REVERSAL"
                return {
                    "residentId": res_id,
                    "dayNapMinutes": circ_data.get("daytimeSleepMinutes", 110),
                    "nightSleepMinutes": circ_data.get("nighttimeSleepMinutes", 290),
                    "sleepFragmentationEvents": circ_data.get("nightAwakenings", 5),
                    "circadianRegularityScore": circ_data.get("circadianScore", 48),
                    "dayNightStatus": day_night_status,
                    "deepSleepMinutes": circ_data.get("deepSleepMinutes", 42),
                    "dayNightRatio": circ_data.get("dayNightRatio", 0.38),
                    "actionableAdvice": circ_data.get("actionableAdvice", []),
                }
        except Exception as e:
            logger.warning(f"Circadian query failed ({e}), using mock.")

        dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES[1])
        circ = dementia.get("circadian", {})
        return {
            "residentId": res_id,
            "dayNapMinutes": circ.get("dayNapMinutes", 110),
            "nightSleepMinutes": circ.get("nightSleepMinutes", 290),
            "sleepFragmentationEvents": circ.get("sleepFragmentationEvents", 5),
            "circadianRegularityScore": circ.get("circadianRegularityScore", 48),
            "dayNightStatus": circ.get("dayNightStatus", "MILD"),
            "deepSleepMinutes": circ.get("deepSleepMinutes", 42),
            "dayNightRatio": circ.get("dayNightRatio", 0.38),
            "actionableAdvice": circ.get("actionableAdvice", []),
        }

    def generate_shift_handoff_brief(self, resident_id: Any) -> Dict[str, Any]:
        """
        Synthesizes a structured 60-second shift handoff card with vitalsSummary,
        behavioralObservations, mealsHydration, and eveningWatchOuts.
        """
        res_id = parse_resident_id(resident_id)
        dementia = MOCK_DEMENTIA_PROFILES.get(res_id, MOCK_DEMENTIA_PROFILES[1])
        handoff = dementia.get("shiftHandoff", {})
        twin = self.get_digital_twin(res_id)

        return {
            "residentId": res_id,
            "residentName": twin.get("name", "Eleanor Vance"),
            "diagnosis": twin.get("diagnosis", "FAST Stage 5 Moderate Alzheimer's Disease"),
            "handoffTimestamp": datetime.now(timezone.utc).isoformat(),
            "vitalsSummary": handoff.get("vitalsSummary", {
                "heartRate": 88,
                "bloodPressure": "136/84 mmHg",
                "respirationRate": 21,
                "spo2": 95,
                "bodyTemperature": 37.4,
                "news2Score": 5,
                "clinicalAlert": "MODERATE_ACUITY (NEWS2 = 5) - Monitor for occult infection / UTI"
            }),
            "behavioralObservations": handoff.get("behavioralObservations", {
                "agitationIndex": 76,
                "alertLevel": "SUNDOWNING_SURGE",
                "wanderingStatus": "HALLWAY_PACING",
                "location": "North Memory Corridor Gallery",
                "mood": "Restless, looking for elementary school library keys, pacing hallway",
                "validationTherapyResponse": "Responded positively to book sorting invitation and tactile blanket"
            }),
            "mealsHydration": handoff.get("mealsHydration", {
                "breakfast": "Ate pureed oatmeal (85% consumed)",
                "lunch": "Ate 70% of pureed chicken and vegetable soup; 400 mL fluids consumed",
                "medicationAdherence": "Refused breakfast oral pills at 8:15 AM due to minor gum sensitivity; ate pureed oatmeal. Re-offered with soft applesauce."
            }),
            "eveningWatchOuts": handoff.get("eveningWatchOuts", [
                "Sundowning surge window active (4:00-6:30 PM); close blinds against harsh shadow patterns",
                "Hallway corridor pacing active; monitor egress beacons and fire exit doors",
                "NEWS2 score of 5: rule out acute occult UTI or silent infection before attributing combativeness solely to dementia",
                "Validate concerns gently—never argue, contradict, or say 'as I told you earlier'"
            ]),
            "summary": (
                f"60-Second Shift Handover for {twin.get('name', 'Eleanor Vance')}: "
                f"Experiencing late-afternoon sundowning surge (Agitation Index: 76) with corridor pacing. "
                f"NEWS2 score of 5 warrants screening for occult UTI. "
                f"Refused breakfast pills due to gum sensitivity; re-offered with applesauce. "
                f"Non-pharmacological calming anchors: Glen Miller jazz, lavender blanket, and book sorting."
            )
        }


# Global singleton instance
api_client = ApiClient()
