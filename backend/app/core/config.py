from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PathPilot"
    API_V1_STR: str = "/api"
    
    # Server network bindings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Default to a local SQLite database file in the backend root
    DATABASE_URL: str = "sqlite:///./pathpilot.db"

    # Default Active Local User details (for local-first experience)
    DEFAULT_USER_EMAIL: str = "pilot@pathpilot.ai"
    DEFAULT_USER_NAME: str = "Alex Pilot"

    # Allow local CORS request from the Vite dev server
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # AI provider configuration (defaults to local mock/deterministic)
    AI_PROVIDER: str = "local"
    GEMINI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
