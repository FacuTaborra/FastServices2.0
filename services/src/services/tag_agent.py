"""
Agente LangGraph para generación inteligente de tags.

Este módulo implementa un agente que:
1. Consulta los tags existentes en el sistema antes de generar nuevos
2. Puede pedir clarificación si la solicitud es muy ambigua
3. Genera múltiples profesiones base para maximizar el matching
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Tag
from settings import OPENAI_API_KEY

logger = logging.getLogger(__name__)


# ============================================================================
# TIPOS Y CONSTANTES
# ============================================================================


class TagGenerationStatus(str, Enum):
    """Estado del resultado de generación de tags."""

    COMPLETED = "completed"
    NEEDS_CLARIFICATION = "needs_clarification"
    ERROR = "error"


@dataclass
class TagGenerationResult:
    """Resultado de la generación de tags."""

    status: TagGenerationStatus
    tags: list[dict] | None = None
    clarification_question: str | None = None
    suggested_options: list[str] | None = None
    error_message: str | None = None


# ============================================================================
# CONTEXTO GLOBAL PARA LAS TOOLS
# ============================================================================

# Estas variables se setean antes de cada llamada al agente
_cached_tags: list[dict] | None = None


async def _fetch_all_tags(db: AsyncSession) -> list[dict]:
    """Obtiene todos los tags existentes de la DB."""
    result = await db.execute(select(Tag.slug, Tag.name, Tag.description))
    return [
        {"slug": row.slug, "name": row.name, "description": row.description or ""}
        for row in result.fetchall()
    ]


# ============================================================================
# TOOLS DEL AGENTE
# ============================================================================


@tool
def search_existing_tags(query: str) -> str:
    """
    Busca tags existentes en el sistema que coincidan con la query.
    Usa esta herramienta para verificar si ya existe un tag antes de crear uno nuevo.

    Args:
        query: Término de búsqueda (ej: "electricista", "plomero", "carpintero")

    Returns:
        Lista de tags existentes que matchean con la query.
    """
    if _cached_tags is None:
        return "Error: No se pudieron cargar los tags. Genera tags nuevos basándote en tu conocimiento."

    query_lower = query.lower().replace(" ", "_")
    matches = [
        tag
        for tag in _cached_tags
        if query_lower in tag["slug"] or query_lower in (tag["name"] or "").lower()
    ]

    if not matches:
        return f"No encontré tags que contengan '{query}'. Puedes crear uno nuevo con ese nombre."

    return json.dumps(matches[:15], ensure_ascii=False)  # Limitar a 15 resultados


@tool
def list_all_profession_tags() -> str:
    """
    Lista los tags de profesiones que ya existen en el sistema.

    IMPORTANTE: Solo usa esta herramienta si necesitas verificar el formato de tags existentes.
    NO estás obligado a usar tags de esta lista. Si la profesión correcta no está en la lista,
    CREA UN TAG NUEVO con el nombre apropiado.

    NUNCA uses un tag de esta lista solo porque existe. Usa SOLO tags que sean RELEVANTES
    para la solicitud del cliente.

    Returns:
        Lista de tags existentes (solo como referencia de formato).
    """
    if _cached_tags is None:
        return "No hay tags cargados. Genera los tags que consideres apropiados para la solicitud."

    if not _cached_tags:
        return (
            "El sistema no tiene tags aún. Crea los tags apropiados para la profesión."
        )

    return json.dumps(_cached_tags, ensure_ascii=False)


@tool
def request_clarification(question: str, suggested_options: str | None = None) -> str:
    """
    Pide más información al cliente cuando la solicitud es ambigua.

    USA ESTA HERRAMIENTA cuando:
    - No puedes identificar qué trabajo necesita el cliente
    - La descripción es muy corta o vaga: "arreglar cosa", "instalación", "ayuda"
    - Necesitas saber el material/tipo para elegir la profesión correcta:
      * "Arreglar puerta" → ¿Madera o aluminio?
      * "Problema con humedad" → ¿Filtración o condensación?

    NO la uses cuando puedes inferir la profesión:
    - "Arreglar piso" → ALBAÑIL (claro aunque no diga el material)
    - "Pintar pared" → PINTOR (obvio)
    - "Canilla rota" → PLOMERO (obvio)

    Args:
        question: Pregunta clara y concisa (ej: "¿Qué necesitás arreglar?")
        suggested_options: Opciones separadas por coma (ej: "Electricidad, Plomería, Pintura")

    Returns:
        Confirmación de que se solicitó clarificación
    """
    options_list = []
    if suggested_options:
        options_list = [opt.strip() for opt in suggested_options.split(",")]

    return json.dumps(
        {
            "clarification_requested": True,
            "question": question,
            "options": options_list,
        },
        ensure_ascii=False,
    )


# ============================================================================
# PROMPTS DEL AGENTE
# ============================================================================

SYSTEM_PROMPT_REQUEST = """Eres un clasificador experto en solicitudes de servicios del hogar. Tu objetivo es generar tags de PROFESIONES que puedan resolver la solicitud del cliente.

## PROCESO:

1. **LEE** la solicitud del cliente y entiende QUÉ NECESITA.

2. **PIENSA**: "¿Qué profesionales podrían resolver este problema?"
   - Para "arreglar piso": ALBAÑIL, COLOCADOR_PISOS, CERAMISTA, SOLADOR
   - Para "reparar canilla": PLOMERO
   - Para "pintar pared": PINTOR
   - Para "arreglar zócalo": ALBAÑIL, CARPINTERO, PINTOR
   - Para "problema eléctrico": ELECTRICISTA

3. **OPCIONAL**: Usa `list_all_profession_tags` solo para verificar el formato de tags existentes.

## REGLAS CRÍTICAS:

### A) RELEVANCIA ES LO MÁS IMPORTANTE
Solo genera tags de profesiones que REALMENTE pueden resolver el problema.
- ❌ INCORRECTO: Para "arreglar piso" poner ELECTRICISTA o PLOMERO (no tienen nada que ver)
- ✅ CORRECTO: Para "arreglar piso" poner ALBAÑIL, COLOCADOR_PISOS, CERAMISTA

### B) AL MENOS 3 PROFESIONES DIFERENTES
Piensa en todos los profesionales que podrían hacer el trabajo:
- "Arreglar piso de cerámica": ALBAÑIL, CERAMISTA, COLOCADOR_PISOS, SOLADOR
- "Instalar aire acondicionado": TECNICO_AIRE_ACONDICIONADO, ELECTRICISTA, REFRIGERACION
- "Arreglar mueble": CARPINTERO, EBANISTA

### C) USA TAGS EXISTENTES SOLO SI SON RELEVANTES
Si ya existe un tag que aplica a esta solicitud, úsalo.
Pero NO uses tags existentes que no tengan nada que ver con la solicitud.

### D) CREA NUEVOS TAGS SI ES NECESARIO
Si no existe un tag para la profesión correcta, créalo:
- COLOCADOR_PISOS, CERAMISTA, SOLADOR, TECHISTA, DURLOCK, etc.

### E) FORMATO DE RESPUESTA
Responde SOLO con un JSON válido:
```json
[
  {"profesion": "ALBAÑIL", "descripcion": "Profesional de construcción que puede reparar pisos", "confianza": 0.95},
  {"profesion": "COLOCADOR_PISOS", "descripcion": "Especialista en instalación y reparación de pisos", "confianza": 0.95},
  {"profesion": "CERAMISTA", "descripcion": "Experto en cerámicas y porcelanatos", "confianza": 0.85}
]
```

### F) VOCABULARIO
- MAYÚSCULAS y snake_case: AIRE_ACONDICIONADO, REPARACION_PISOS
- Normaliza: fontanero → PLOMERO, refrigerador → HELADERA

## EJEMPLOS:

Solicitud: "Quiero arreglar el piso de mi casa"
Respuesta correcta:
```json
[
  {"profesion": "ALBAÑIL", "descripcion": "Puede reparar pisos de cualquier tipo", "confianza": 0.95},
  {"profesion": "COLOCADOR_PISOS", "descripcion": "Especialista en pisos", "confianza": 0.95},
  {"profesion": "CERAMISTA", "descripcion": "Si el piso es de cerámica", "confianza": 0.85},
  {"profesion": "SOLADOR", "descripcion": "Especialista en solados y contrapisos", "confianza": 0.80},
  {"profesion": "REPARACION_PISOS", "descripcion": "Tag de tarea específica", "confianza": 0.90}
]
```

Solicitud: "Se rompió la canilla del baño"
Respuesta correcta:
```json
[
  {"profesion": "PLOMERO", "descripcion": "Profesional de instalaciones sanitarias", "confianza": 0.98},
  {"profesion": "PLOMERIA", "descripcion": "Servicio de plomería general", "confianza": 0.95}
]
```

## CLARIFICACIÓN - CUÁNDO PREGUNTAR

Usa la herramienta `request_clarification` cuando la solicitud sea ambigua y necesites más información para clasificar correctamente.

### DEBES PREGUNTAR cuando:
- No puedes identificar QUÉ necesita el cliente: "necesito ayuda", "tengo un problema"
- La descripción es muy corta y no da contexto: "arreglar cosa", "instalación"
- Podrías asignar profesiones completamente diferentes según la respuesta:
  - "Arreglar puerta" → ¿Es de madera (CARPINTERO) o de aluminio (HERRERO)?
  - "Problema con humedad" → ¿Es filtración (PLOMERO) o condensación (PINTOR)?
  - "Instalar" → ¿Instalar qué? (muy ambiguo)

### NO preguntes cuando:
- Puedes inferir razonablemente la profesión aunque falten detalles
- "Arreglar piso" → Claramente es ALBAÑIL/COLOCADOR_PISOS (no importa si es cerámica o madera)
- "Pintar habitación" → Claramente es PINTOR
- "Canilla que gotea" → Claramente es PLOMERO

### Ejemplos de cuándo PREGUNTAR:

Solicitud: "Necesito arreglar algo en mi casa"
→ Usa `request_clarification` con:
  - question: "¿Qué necesitás arreglar específicamente?"
  - suggested_options: "Electricidad, Plomería, Pintura, Albañilería, Otro"

Solicitud: "Instalación"
→ Usa `request_clarification` con:
  - question: "¿Qué tipo de instalación necesitás?"
  - suggested_options: "Aire acondicionado, Gas, Eléctrica, Sanitaria"

Solicitud: "Tengo un problema con la puerta"  
→ Usa `request_clarification` con:
  - question: "¿De qué material es la puerta?"
  - suggested_options: "Madera, Aluminio, Hierro/Metal, PVC"

## OBJETIVO:
Que la solicitud llegue SOLO a los profesionales que REALMENTE pueden resolver el problema. Si no estás seguro, PREGUNTA.
"""


SYSTEM_PROMPT_LICENSE = """Eres un experto en categorización de perfiles profesionales. Tu misión es generar tags para que un proveedor de servicios haga match con las solicitudes de clientes.

## FLUJO DE TRABAJO:

1. **PRIMERO**: Llama a `list_all_profession_tags` para ver los tags existentes.

2. **ANALIZA** la licencia/certificación del proveedor.

3. **GENERA TAGS** siguiendo estas reglas:

## REGLAS CRÍTICAS:

### A) INCLUYE LA PROFESIÓN BASE (OBLIGATORIO)
Si el proveedor tiene una especialidad (ej. "Gasista Matriculado"), DEBES incluir
la categoría madre para que reciba trabajos generales:
- Gasista Matriculado → GASISTA + PLOMERO + GASISTA_MATRICULADO
- Electricista Industrial → ELECTRICISTA + ELECTRICISTA_INDUSTRIAL

### B) PRIORIZA TAGS EXISTENTES
Usa los mismos slugs que ya existen en el sistema para garantizar matching.

### C) INCLUYE VARIANTES
Agrega variantes comunes de la profesión:
- ELECTRICISTA, TECNICO_ELECTRICISTA, ELECTRICISTA_MATRICULADO

### D) FORMATO DE RESPUESTA
```json
[
  {"profesion": "PROFESION_BASE", "descripcion": "Categoría general", "confianza": 1.0},
  {"profesion": "ESPECIALIDAD", "descripcion": "Certificación específica", "confianza": 1.0},
  {"profesion": "VARIANTE", "descripcion": "Variante del título", "confianza": 0.9}
]
```

## OBJETIVO:
Que el proveedor reciba tanto trabajos generales de su rubro como trabajos específicos de su especialidad.
"""


# ============================================================================
# AGENTE PRINCIPAL
# ============================================================================


class TagGeneratorAgent:
    """Agente que genera tags usando LangGraph con acceso a tags existentes."""

    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.2):
        self.model = ChatOpenAI(
            model=model,
            temperature=temperature,
            api_key=OPENAI_API_KEY,
        )
        self.tools = [
            search_existing_tags,
            list_all_profession_tags,
            request_clarification,
        ]
        self.tools_without_clarification = [
            search_existing_tags,
            list_all_profession_tags,
        ]

    async def generate_tags_for_request(
        self,
        db: AsyncSession,
        title: str,
        description: str,
        request_type: str | None = None,
        city: str | None = None,
    ) -> TagGenerationResult:
        """
        Genera tags para una solicitud de servicio.

        Args:
            db: Sesión de base de datos
            title: Título de la solicitud
            description: Descripción de la solicitud
            request_type: Tipo de solicitud (FAST/LICITACION)
            city: Ciudad de la solicitud

        Returns:
            TagGenerationResult con tags o pregunta de clarificación
        """
        global _cached_tags

        try:
            _cached_tags = await _fetch_all_tags(db)
        except Exception as e:
            logger.warning("No se pudieron cargar tags existentes: %s", e)
            _cached_tags = []

        agent = create_react_agent(
            model=self.model,
            tools=self.tools,
            prompt=SYSTEM_PROMPT_REQUEST,
        )

        # Construir mensaje del usuario
        user_message_parts = []
        if title:
            user_message_parts.append(f"Título: {title}")
        if description:
            user_message_parts.append(f"Descripción: {description}")
        if request_type:
            user_message_parts.append(f"Tipo: {request_type}")
        if city:
            user_message_parts.append(f"Ciudad: {city}")

        user_message = "\n".join(user_message_parts)

        try:
            result = agent.invoke(
                {"messages": [{"role": "user", "content": user_message}]}
            )

            # Extraer la respuesta del agente
            response_content = self._extract_agent_response(result)
            return self._parse_agent_response(response_content)
        except Exception as e:
            logger.exception("Error al generar tags con el agente: %s", e)
            return TagGenerationResult(
                status=TagGenerationStatus.ERROR,
                error_message=str(e),
            )

    async def generate_tags_for_license(
        self,
        db: AsyncSession,
        title: str,
        description: str | None = None,
        issued_by: str | None = None,
    ) -> TagGenerationResult:
        """
        Genera tags para una licencia de proveedor.

        Args:
            db: Sesión de base de datos
            title: Título de la licencia
            description: Descripción de la licencia
            issued_by: Entidad emisora

        Returns:
            TagGenerationResult con los tags generados
        """
        global _cached_tags

        try:
            _cached_tags = await _fetch_all_tags(db)
        except Exception as e:
            logger.warning("No se pudieron cargar tags existentes: %s", e)
            _cached_tags = []

        # Para licencias no permitimos clarificación
        agent = create_react_agent(
            model=self.model,
            tools=self.tools_without_clarification,
            prompt=SYSTEM_PROMPT_LICENSE,
        )

        # Construir mensaje
        pieces = [title]
        if description:
            pieces.append(f"Descripción: {description}")
        if issued_by:
            pieces.append(f"Entidad emisora: {issued_by}")

        user_message = "\n".join(pieces)

        try:
            result = agent.invoke(
                {"messages": [{"role": "user", "content": user_message}]}
            )

            response_content = self._extract_agent_response(result)
            return self._parse_agent_response(response_content)
        except Exception as e:
            logger.exception("Error al generar tags para licencia: %s", e)
            return TagGenerationResult(
                status=TagGenerationStatus.ERROR,
                error_message=str(e),
            )

    async def generate_tags_with_clarification(
        self,
        db: AsyncSession,
        original_title: str,
        original_description: str,
        clarification_answer: str,
        request_type: str | None = None,
        clarification_count: int = 1,
    ) -> TagGenerationResult:
        """
        Genera tags después de recibir respuesta a una clarificación.

        Args:
            db: Sesión de base de datos
            original_title: Título original de la solicitud
            original_description: Descripción original
            clarification_answer: Respuesta del usuario a la clarificación
            request_type: Tipo de solicitud
            clarification_count: Número de clarificaciones ya realizadas (1-3)

        Returns:
            TagGenerationResult con los tags generados
        """
        global _cached_tags

        try:
            _cached_tags = await _fetch_all_tags(db)
        except Exception as e:
            logger.warning("No se pudieron cargar tags existentes: %s", e)
            _cached_tags = []

        # Permitir más clarificaciones solo si no llegamos al máximo (3)
        max_clarifications = 3
        can_ask_again = clarification_count < max_clarifications

        logger.info(
            "Generando tags con clarificación #%d (puede preguntar de nuevo: %s)",
            clarification_count,
            can_ask_again,
        )

        agent = create_react_agent(
            model=self.model,
            tools=self.tools if can_ask_again else self.tools_without_clarification,
            prompt=SYSTEM_PROMPT_REQUEST,
        )

        # Construir mensaje con contexto completo
        user_message = f"""Solicitud original:
Título: {original_title}
Descripción: {original_description}
{f"Tipo: {request_type}" if request_type else ""}

Información adicional del cliente (clarificación #{clarification_count}): {clarification_answer}

Con esta información adicional, genera los tags apropiados.
{"Si todavía no tenés suficiente información, podés hacer UNA pregunta más." if can_ask_again else "Ya se hicieron 3 clarificaciones. Generá los tags con la información disponible."}"""

        try:
            result = agent.invoke(
                {"messages": [{"role": "user", "content": user_message}]}
            )

            response_content = self._extract_agent_response(result)
            return self._parse_agent_response(response_content)
        except Exception as e:
            logger.exception("Error al generar tags con clarificación: %s", e)
            return TagGenerationResult(
                status=TagGenerationStatus.ERROR,
                error_message=str(e),
            )

    def _extract_agent_response(self, result: dict) -> str:
        """
        Extrae el contenido de la respuesta del agente, incluyendo resultados de tools.

        Args:
            result: Resultado completo del agente

        Returns:
            String con todo el contenido relevante de la respuesta
        """
        messages = result.get("messages", [])
        all_content = []

        logger.info("Procesando %d mensajes del agente", len(messages))

        for i, msg in enumerate(messages):
            msg_type = type(msg).__name__

            # Obtener contenido según el tipo de mensaje
            if hasattr(msg, "content") and msg.content:
                content = msg.content
                if isinstance(content, str):
                    all_content.append(content)
                    logger.debug("Mensaje %d (%s): %s", i, msg_type, content[:100])

            # También revisar tool_calls si existen
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    tool_name = tool_call.get("name", "")
                    tool_args = tool_call.get("args", {})
                    logger.info(
                        "Tool call detectado: %s con args: %s", tool_name, tool_args
                    )

                    # Si es request_clarification, construir el JSON
                    if tool_name == "request_clarification":
                        clarification_json = json.dumps(
                            {
                                "clarification_requested": True,
                                "question": tool_args.get("question", ""),
                                "options": [
                                    opt.strip()
                                    for opt in (
                                        tool_args.get("suggested_options") or ""
                                    ).split(",")
                                    if opt.strip()
                                ],
                            }
                        )
                        all_content.append(clarification_json)
                        logger.info("Clarificación construida: %s", clarification_json)

        combined = "\n".join(all_content)
        logger.info("Contenido combinado: %s", combined[:500] if combined else "vacío")
        return combined

    def _parse_agent_response(self, content: str) -> TagGenerationResult:
        """
        Parsea la respuesta del agente y extrae tags o solicitud de clarificación.

        Args:
            content: Contenido de la respuesta del agente

        Returns:
            TagGenerationResult apropiado
        """
        logger.info(
            "Parseando respuesta del agente: %s", content[:500] if content else "vacío"
        )

        # Verificar si hay solicitud de clarificación
        if content and "clarification_requested" in content:
            logger.info("Detectada solicitud de clarificación en la respuesta")
            try:
                # Buscar el JSON de clarificación - pattern más flexible
                clarification_match = re.search(
                    r'\{[^{}]*"clarification_requested"\s*:\s*true[^{}]*\}',
                    content,
                    re.IGNORECASE,
                )
                if clarification_match:
                    clarification_data = json.loads(clarification_match.group())
                    logger.info("Clarificación parseada: %s", clarification_data)
                    return TagGenerationResult(
                        status=TagGenerationStatus.NEEDS_CLARIFICATION,
                        clarification_question=clarification_data.get("question"),
                        suggested_options=clarification_data.get("options"),
                    )
            except (json.JSONDecodeError, AttributeError) as e:
                logger.warning("Error parseando clarificación: %s", e)

        # Intentar extraer tags
        tags = self._extract_tags_from_response(content)

        if tags:
            logger.info("Tags extraídos exitosamente: %d tags", len(tags))
            return TagGenerationResult(
                status=TagGenerationStatus.COMPLETED,
                tags=tags,
            )

        logger.warning(
            "No se pudieron extraer tags ni clarificación de: %s",
            content[:200] if content else "vacío",
        )
        # Si no hay tags válidos, devolver error
        return TagGenerationResult(
            status=TagGenerationStatus.ERROR,
            error_message="No se pudieron extraer tags de la respuesta del agente",
        )

    def _extract_tags_from_response(self, content: str) -> list[dict] | None:
        """
        Extrae la lista de tags del contenido de la respuesta.

        Args:
            content: Contenido de la respuesta

        Returns:
            Lista de tags o None si no se encontraron
        """
        # Intentar parsear directamente como JSON
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return self._normalize_tags(data)
        except json.JSONDecodeError:
            pass

        # Buscar array JSON dentro del texto
        json_match = re.search(r"\[[\s\S]*?\]", content)
        if json_match:
            try:
                data = json.loads(json_match.group())
                if isinstance(data, list):
                    return self._normalize_tags(data)
            except json.JSONDecodeError:
                pass

        return None

    def _normalize_tags(self, tags: list[Any]) -> list[dict]:
        """
        Normaliza y valida la lista de tags.

        Args:
            tags: Lista de tags crudos

        Returns:
            Lista de tags normalizados
        """
        normalized = []
        for tag in tags:
            if not isinstance(tag, dict):
                continue

            profession = tag.get("profesion") or tag.get("profession")
            if not profession:
                continue

            # Normalizar el nombre de la profesión
            profession = str(profession).upper().strip()
            profession = re.sub(r"[^A-Z0-9Ñ]+", "_", profession).strip("_")

            if not profession:
                continue

            confidence = tag.get("confianza") or tag.get("confidence")
            try:
                confidence = float(confidence) if confidence is not None else 0.8
                confidence = max(0.0, min(1.0, confidence))  # Clamp entre 0 y 1
            except (TypeError, ValueError):
                confidence = 0.8

            normalized.append(
                {
                    "profession": profession,
                    "description": str(
                        tag.get("descripcion") or tag.get("description") or ""
                    ),
                    "confidence": confidence,
                }
            )

        return normalized if normalized else None


# ============================================================================
# SINGLETON
# ============================================================================

tag_agent = TagGeneratorAgent()
