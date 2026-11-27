"""
Care Coach Agent Configuration
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file relative to this file's location or project root
agent_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=agent_dir / ".env")
load_dotenv()  # Fallback to standard CWD search

# Model Configuration (Google Gemini via ADK / google-genai)
MODEL_NAME = os.getenv("ADK_MODEL", "gemini-3.5-flash-lite")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")

# Vertex AI Settings
USE_VERTEX_AI = os.getenv("USE_VERTEX_AI", "false").lower() in ("true", "1", "yes")
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

# Ensure Google GenAI SDK uses the exact verified key from environment or .env
if GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

# Mock vs Live API Mode
# Set to 'false' in .env once backend NestJS endpoints are deployed
USE_MOCK_API = os.getenv("USE_MOCK_API", "false").lower() in ("true", "1", "yes")

# ADK Session Context Compaction Settings
TOKEN_THRESHOLD = int(os.getenv("TOKEN_THRESHOLD", "4000"))
EVENT_RETENTION_SIZE = int(os.getenv("EVENT_RETENTION_SIZE", "5"))

# Health Memory System Constraints
MAX_LTM_CHAR_LIMIT = 6000
MAX_STM_CHAR_LIMIT = 500
DEFAULT_STM_TTL_DAYS = 7
MAX_COMPACTION_TOKENS = 1500

# Backend NestJS API Configuration
def _clean_url(val: str | None) -> str | None:
    if not val:
        return None
    cleaned = val.strip().rstrip('/')
    if cleaned in ("https:", "http:", "https://", "http://", "https:/", "http:/", ""):
        return None
    from urllib.parse import urlparse
    parsed = urlparse(cleaned)
    if not parsed.scheme or not parsed.netloc:
        return None
    return cleaned

clean_api_base = _clean_url(os.getenv("API_BASE_URL"))
clean_base = _clean_url(os.getenv("BASE_URL"))

raw_base_url = clean_api_base or clean_base or "http://localhost:4000"
raw_base_url = raw_base_url.rstrip('/')
if not raw_base_url.endswith("/v1"):
    API_BASE_URL = f"{raw_base_url}/v1"
else:
    API_BASE_URL = raw_base_url
BASE_URL = API_BASE_URL.rsplit('/v1', 1)[0]

API_BEARER_TOKEN = os.getenv("API_BEARER_TOKEN", "")
API_USER_EMAIL = os.getenv("API_USER_EMAIL", "sadmin@caremp.ai")
API_USER_PASSWORD = os.getenv("API_USER_PASSWORD", "sadmin@123#")

# Engines Microservice URL (FastAPI)
clean_engines = _clean_url(os.getenv("ENGINES_API_URL"))
raw_engines_url = clean_engines or "http://localhost:5001/engines"
raw_engines_url = raw_engines_url.rstrip('/')
if not raw_engines_url.endswith("/api/engines") and not raw_engines_url.endswith("/engines"):
    ENGINES_API_URL = f"{raw_engines_url}/engines"
else:
    ENGINES_API_URL = raw_engines_url
