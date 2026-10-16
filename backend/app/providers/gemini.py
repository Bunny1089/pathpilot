from backend.app.providers.base import AIProvider

class GeminiProvider(AIProvider):
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        # Phase 1: Placeholder shell
        return f"[GeminiProvider Placeholder] Simulated response to prompt: '{prompt}'"

    def name(self) -> str:
        return "google-gemini"
