import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Automatically load engines/.env into environment
load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "careMP Sentinel Analytics Engine API"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5001"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

settings = Settings()
