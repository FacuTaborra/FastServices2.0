from __future__ import annotations

import json
import logging
import re
from typing import Callable, Iterable, List, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ProviderLicenseTag, ServiceRequestTag, Tag

logger = logging.getLogger(__name__)


class TagsController:
    """Expone utilidades para crear y asociar tags a licencias."""

    @classmethod
    async def _get_all_tag_names(cls, db: AsyncSession) -> List[str]:
        """Obtiene todos los nombres de tags existentes en la BD."""
        result = await db.execute(select(Tag.name))
        return [row[0] for row in result.fetchall()]

    @classmethod
    async def generate_tags_for_licenses(
        cls,
        db: AsyncSession,
        licenses: Sequence,
        raw_tag_generator: Callable[[str, List[str]], str],
    ) -> None:
        if not licenses:
            return

        # Obtener tags existentes una sola vez
        existing_tags = await cls._get_all_tag_names(db)
        logger.info(f"Tags existentes para contexto: {len(existing_tags)}")

        for license_model in licenses:
            await db.refresh(license_model, attribute_names=["tag_links"])
            prompt = cls._compose_prompt(license_model)
            if not prompt:
                continue

            try:
                raw_response = raw_tag_generator(prompt, existing_tags)
            except Exception:  # pragma: no cover - solo logueamos
                logger.exception(
                    "No se pudo obtener la sugerencia de tags del LLM para la licencia %s",
                    getattr(license_model, "id", "?"),
                )
                continue

            tag_entries = cls._parse_llm_response(raw_response)
            if not tag_entries:
                continue

            await cls._attach_tags(db, license_model, tag_entries)

    @classmethod
    async def generate_tags_for_service_request(
        cls,
        db: AsyncSession,
        service_request,
        raw_tag_generator: Callable[[str, List[str]], str],
    ) -> None:
        if service_request is None:
            return

        await db.flush()
        await db.refresh(service_request, attribute_names=["tag_links"])

        # Obtener tags existentes
        existing_tags = await cls._get_all_tag_names(db)
        logger.info(f"Tags existentes para contexto: {len(existing_tags)}")

        prompt = cls._compose_request_prompt(service_request)
        if not prompt:
            return

        try:
            raw_response = raw_tag_generator(prompt, existing_tags)
        except Exception:  # pragma: no cover - solo logueamos
            logger.exception(
                "No se pudo obtener la sugerencia de tags del LLM para la solicitud %s",
                getattr(service_request, "id", "?"),
            )
            return

        tag_entries = cls._parse_llm_response(raw_response)
        if not tag_entries:
            return

        await cls._attach_request_tags(db, service_request, tag_entries)

    @staticmethod
    def _compose_prompt(license_model) -> str:
        pieces = [license_model.title]
        if getattr(license_model, "description", None):
            pieces.append(license_model.description)
        if getattr(license_model, "issued_by", None):
            pieces.append(f"Entidad emisora: {license_model.issued_by}")
        return "\n".join(filter(None, pieces))

    @staticmethod
    def _compose_request_prompt(service_request) -> str:
        pieces = []
        if getattr(service_request, "title", None):
            pieces.append(f"Título: {service_request.title}")
        if getattr(service_request, "description", None):
            pieces.append(f"Descripción: {service_request.description}")
        request_type = getattr(service_request, "request_type", None)
        if request_type:
            pieces.append(f"Tipo: {getattr(request_type, 'value', request_type)}")
        city = getattr(service_request, "city_snapshot", None)
        if city:
            pieces.append(f"Ciudad: {city}")
        return "\n".join(filter(None, pieces))

    @classmethod
    def _parse_llm_response(cls, raw_response: str) -> List[dict]:
        if not raw_response:
            return []

        try:
            payload = json.loads(raw_response)
        except json.JSONDecodeError:
            logger.warning("Respuesta de tags inválida: %s", raw_response)
            return []

        if not isinstance(payload, list):
            logger.warning("Respuesta de tags no fue una lista: %s", payload)
            return []

        cleaned: List[dict] = []
        for entry in payload:
            profession = (entry or {}).get("profesion")
            if not profession:
                continue
            normalized_name = cls._standardize_tag_name(str(profession))
            if not normalized_name:
                continue
            cleaned.append(
                {
                    "profession": normalized_name,
                    "description": cls._normalize_description(entry.get("descripcion")),
                    "confidence": cls._normalize_confidence(entry.get("confianza")),
                }
            )
        return cleaned

    @staticmethod
    def _standardize_tag_name(value: str) -> str:
        if value is None:
            return ""
        # Permitimos A-Z, 0-9 y Ñ. Todo lo demás se convierte en guión bajo.
        transformed = re.sub(r"[^A-Z0-9Ñ]+", "_", value.upper()).strip("_")
        return transformed[:120]

    @staticmethod
    def _normalize_description(value) -> str | None:
        if value is None:
            return None
        description = str(value).strip()
        return description or None

    @staticmethod
    def _normalize_confidence(value) -> float | None:
        try:
            if value is None:
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    @classmethod
    async def _attach_tags(
        cls, db: AsyncSession, license_model, tag_entries: Iterable[dict]
    ) -> None:
        existing_tag_ids = {
            link.tag_id
            for link in getattr(license_model, "tag_links", [])
            if link.tag_id
        }

        created_links: List[ProviderLicenseTag] = []

        for entry in tag_entries:
            slug = cls._slugify(entry["profession"])
            if not slug:
                continue

            tag = await cls._get_or_create_tag(
                db,
                slug,
                entry["profession"],
                entry.get("description"),
            )
            if tag.id in existing_tag_ids:
                continue

            link = ProviderLicenseTag(
                license_id=license_model.id,
                tag_id=tag.id,
                confidence=entry["confidence"],
                source="llm",
            )
            db.add(link)
            created_links.append(link)
            existing_tag_ids.add(tag.id)

        if created_links:
            await db.commit()
            await db.refresh(license_model, attribute_names=["tag_links"])
            for link in created_links:
                await db.refresh(link, attribute_names=["tag"])

    @classmethod
    async def _attach_request_tags(
        cls, db: AsyncSession, service_request, tag_entries: Iterable[dict]
    ) -> None:
        existing_tag_ids = {
            link.tag_id
            for link in getattr(service_request, "tag_links", [])
            if link.tag_id
        }

        created_links: List[ServiceRequestTag] = []

        for entry in tag_entries:
            slug = cls._slugify(entry["profession"])
            if not slug:
                continue

            tag = await cls._get_or_create_tag(
                db,
                slug,
                entry["profession"],
                entry.get("description"),
            )
            if tag.id in existing_tag_ids:
                continue

            link = ServiceRequestTag(
                request_id=service_request.id,
                tag_id=tag.id,
                confidence=entry["confidence"],
                source="llm",
            )
            db.add(link)
            created_links.append(link)
            existing_tag_ids.add(tag.id)

        if created_links:
            await db.commit()
            await db.refresh(service_request, attribute_names=["tag_links"])
            for link in created_links:
                await db.refresh(link, attribute_names=["tag"])

    @classmethod
    async def _get_or_create_tag(
        cls, db: AsyncSession, slug: str, name: str, description: str | None
    ) -> Tag:
        result = await db.execute(select(Tag).where(Tag.slug == slug))
        tag = result.scalar_one_or_none()
        if tag:
            # Actualizar descripción si está vacía y ahora recibimos una nueva
            if not tag.description and description:
                tag.description = description
                await db.flush()
            return tag

        tag = Tag(slug=slug, name=name, description=description)
        db.add(tag)
        await db.flush()
        return tag

    @staticmethod
    def _slugify(value: str) -> str:
        if not value:
            return ""
        # Convertimos a minúsculas, manteniendo la ñ
        value = value.lower()
        # Permitimos a-z, 0-9 y ñ en el slug
        slug = re.sub(r"[^a-z0-9ñ]+", "-", value).strip("-")
        return slug[:120]
