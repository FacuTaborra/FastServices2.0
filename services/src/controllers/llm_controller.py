import json

from services.openai import OpenAIService
from templates.prompts import (
    GENERATE_TAGS_FOR_LICENCE_DESCRIPTION,
    GENERATE_TAGS_FOR_REQUEST_DESCRIPTION,
    REWRITE_SERVICE_REQUEST,
)


class LLMController:
    def __init__(self):
        self.openai_service = OpenAIService()

    def create_tag_of_licences(self, description: str):
        response = self.openai_service.run(
            role_system=GENERATE_TAGS_FOR_LICENCE_DESCRIPTION,
            message=f"{description}",
        )
        return response

    def create_tags_for_request(self, payload: str):
        response = self.openai_service.run(
            role_system=GENERATE_TAGS_FOR_REQUEST_DESCRIPTION,
            message=f"{payload}",
        )
        return response

    def rewrite_service_request(self, title: str, description: str) -> dict:
        """Reescribe el título y descripción de una solicitud para hacerlos más claros."""
        message = f"Título: {title}\n\nDescripción: {description}"
        response = self.openai_service.run(
            role_system=REWRITE_SERVICE_REQUEST,
            message=message,
        )
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"title": title, "description": description}
