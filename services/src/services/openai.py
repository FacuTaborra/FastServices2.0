# pip install openai>=1.40
from openai import OpenAI
from settings import OPENAI_API_KEY


class OpenAIService:
    def __init__(
        self,
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.2,
        api_key: str = OPENAI_API_KEY,
    ):
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.temperature = temperature

    def run(self, role_system: str, message: str) -> str:
        messages = [
            {"role": "system", "content": role_system},
            {"role": "user", "content": f"{message}"},
        ]
        rsp = self.client.responses.create(
            model=self.model, temperature=self.temperature, input=messages
        )
        return rsp.output_text.strip()
