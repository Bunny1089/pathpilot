from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        """
        Generate response text based on a prompt and optional system instruction.
        """
        pass

    @abstractmethod
    def name(self) -> str:
        """
        Get the developer-friendly name of the AI provider.
        """
        pass
