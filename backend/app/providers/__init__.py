from backend.app.providers.base import AIProvider
from backend.app.providers.local import LocalProvider
from backend.app.providers.gemini import GeminiProvider

def get_provider(name: str) -> AIProvider:
    """
    Factory to retrieve an AIProvider implementation.
    """
    providers = {
        "local": LocalProvider,
        "gemini": GeminiProvider
    }
    
    normalized_name = name.lower().strip()
    if normalized_name not in providers:
        raise ValueError(f"Unknown AI Provider: '{name}'. Supported values: {list(providers.keys())}")
        
    return providers[normalized_name]()

__all__ = ["AIProvider", "LocalProvider", "GeminiProvider", "get_provider"]
