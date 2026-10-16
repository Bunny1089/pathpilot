from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PathPilot"
    API_V1_STR: str = "/api"
    
    # Default to a local SQLite database file in the backend root
    DATABASE_URL: str = "sqlite:///./pathpilot.db"

    # Default Active Local User details (for Phase 1 local-first experience)
    DEFAULT_USER_EMAIL: str = "pilot@pathpilot.ai"
    DEFAULT_USER_NAME: str = "Alex Pilot"
    
    # Allow local CORS request from the Vite dev server
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
