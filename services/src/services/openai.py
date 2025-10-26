# pip install openai>=1.40
from openai import OpenAI
from settings import OPENAI_API_KEY


class OpenAIService:
    def __init__(
        self,
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.2,
        role_system: str = None,
        api_key: str = OPENAI_API_KEY,
    ):
        self.client = OpenAI()
        self.model = model
        self.temperature = temperature
        self.role_system = role_system

    def run(self, message: str) -> str:
        messages = [
            {"role": "system", "content": self.role_system},
            {"role": "user", "content": f"{message}"},
        ]
        rsp = self.client.responses.create(
            model=self.model, temperature=self.temperature, input=messages
        )
        return rsp.output_text.strip()
