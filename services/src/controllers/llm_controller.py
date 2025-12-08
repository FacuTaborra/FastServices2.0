import json
from typing import List

from services.openai import OpenAIService
from templates.prompts import (
    GENERATE_TAGS_FOR_LICENCE_DESCRIPTION,
    GENERATE_TAGS_FOR_REQUEST_DESCRIPTION,
    REWRITE_SERVICE_REQUEST,
    REWRITE_PROPOSAL_NOTES,
)


class LLMController:
    def __init__(self):
        self.openai_service = OpenAIService()

    def create_tag_of_licences(self, description: str, existing_tags: List[str] = None):
        """Genera tags para una licencia, considerando tags existentes."""
        tags_context = self._format_existing_tags(existing_tags)
        system_prompt = GENERATE_TAGS_FOR_LICENCE_DESCRIPTION.format(
            existing_tags=tags_context
        )
        response = self.openai_service.run(
            role_system=system_prompt,
            message=f"{description}",
        )
        return response

    def create_tags_for_request(self, payload: str, existing_tags: List[str] = None):
        """Genera tags para una solicitud, considerando tags existentes."""
        tags_context = self._format_existing_tags(existing_tags)
        system_prompt = GENERATE_TAGS_FOR_REQUEST_DESCRIPTION.format(
            existing_tags=tags_context
        )
        response = self.openai_service.run(
            role_system=system_prompt,
            message=f"{payload}",
        )
        return response

    def _format_existing_tags(self, tags: List[str] = None) -> str:
        """Formatea la lista de tags para incluir en el prompt."""
        if not tags:
            return "No hay tags existentes aún. Puedes crear los que consideres apropiados."
        return f"[{', '.join(tags)}]"

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

    def rewrite_proposal_notes(
        self, request_title: str, request_description: str, notes: str
    ) -> dict:
        """Reescribe las notas de un presupuesto para hacerlas más claras."""
        prompt = REWRITE_PROPOSAL_NOTES.format(
            request_title=request_title or "Sin título",
            request_description=request_description or "Sin descripción",
        )
        response = self.openai_service.run(
            role_system=prompt,
            message=f"Notas del prestador:\n{notes}",
        )
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"notes": notes}
