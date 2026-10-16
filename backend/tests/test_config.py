import pytest
import os
from backend.app.core.config import Settings, settings
from backend.app.schemas.schemas import TaskOut, GoalOut, ProfileOut, UserOut, CareerStateOut

def test_default_settings():
    """
    Verify safe, local-first defaults for the application settings.
    """
    assert settings.PROJECT_NAME == "PathPilot"
    assert settings.API_V1_STR == "/api"
    assert settings.HOST == "127.0.0.1"
    assert settings.PORT == 8000
    assert "sqlite" in settings.DATABASE_URL
    assert settings.DEFAULT_USER_EMAIL == "pilot@pathpilot.ai"
    assert settings.DEFAULT_USER_NAME == "Alex Pilot"
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert settings.AI_PROVIDER == "local"
    # GEMINI_API_KEY is optional (either None or string from local environment)
    assert settings.GEMINI_API_KEY is None or isinstance(settings.GEMINI_API_KEY, str)

def test_settings_without_credentials(monkeypatch):
    """
    Verify that absence of external AI credentials does not fail validation
    and preserves local offline startup.
    """
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    custom_settings = Settings()
    assert custom_settings.GEMINI_API_KEY is None
    assert custom_settings.AI_PROVIDER == "local"

def test_settings_with_explicit_credentials(monkeypatch):
    """
    Verify that when credentials are provided via environment variables,
    they are correctly parsed into Settings.
    """
    monkeypatch.setenv("GEMINI_API_KEY", "test_mock_key_123")
    custom_settings = Settings()
    assert custom_settings.GEMINI_API_KEY == "test_mock_key_123"

def test_settings_ignores_unknown_extra_vars(monkeypatch):
    """
    Verify that extra arbitrary environment variables are ignored safely
    instead of throwing ValidationError on startup.
    """
    monkeypatch.setenv("UNKNOWN_HOST_VAR_12345", "some_random_value")
    custom_settings = Settings()
    assert not hasattr(custom_settings, "UNKNOWN_HOST_VAR_12345")

def test_schema_model_config_from_attributes():
    """
    Verify that all SQLAlchemy-mapped Pydantic schemas have Pydantic V2
    from_attributes enabled for ORM serialization.
    """
    for schema_cls in [TaskOut, GoalOut, ProfileOut, UserOut, CareerStateOut]:
        assert schema_cls.model_config.get("from_attributes") is True
