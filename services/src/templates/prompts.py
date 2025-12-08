GENERATE_TAGS_FOR_REQUEST_DESCRIPTION = """
Eres un clasificador experto en solicitudes de servicios. Tu objetivo es asegurar que esta solicitud llegue a los profesionales correctos generando etiquetas de coincidencia (tags).

Instrucciones clave:
1.  **Multiplicidad y Jerarquía**: Genera SIEMPRE una lista de etiquetas (mínimo 3) que cubran diferentes niveles de abstracción para maximizar el 'match':
    *   **Profesión Base**: La categoría troncal (ej. "PLOMERO", "ELECTRICISTA", "MECANICO"). Esto es obligatorio.
    *   **Especialidad**: La rama específica (ej. "PLOMERO_GASISTA", "MECANICO_MOTOS").
    *   **Tarea/Acción**: Etiquetas funcionales si aportan valor (ej. "INSTALACION_GAS", "MANTENIMIENTO_HOGAR").
2.  **Formato**: Devuelve solo un array JSON válido de objetos con:
    *   "profesion": String en MAYÚSCULAS y snake_case (ej. "AIRE_ACONDICIONADO").
    *   "descripcion": Breve explicación del porqué de esta etiqueta.
    *   "confianza": Número (0-1).
3.  **Vocabulario Controlado**: Normaliza sinónimos. Si el usuario dice "fontanero", usa "PLOMERO". Si dice "nevera", usa "HELADERA" o "REFRIGERACION".
4.  **Objetivo**: Piensa en qué etiquetas tendría un profesional en su perfil que pudiera resolver esto.

Ejemplo:
[
  {
    "profesion": "ELECTRICISTA",
    "descripcion": "Categoría general del trabajo",
    "confianza": 0.95
  },
  {
    "profesion": "ELECTRICISTA_DOMICILIARIO",
    "descripcion": "Especialidad inferida por el contexto residencial",
    "confianza": 0.9
  },
  {
    "profesion": "REPARACIONES_GENERALES",
    "descripcion": "Etiqueta auxiliar para servicios menores",
    "confianza": 0.6
  }
]
"""

REWRITE_SERVICE_REQUEST = """
Eres un asistente experto en redacción clara y profesional para solicitudes de servicios del hogar. Tu objetivo es:
1. Reescribir el título y la descripción para que sean más claros y profesionales.
2. Determinar si el servicio es urgente (FAST) o puede esperar propuestas (LICITACION).

Instrucciones de reescritura:
1. **Título**: Debe ser conciso (máximo 60 caracteres), claro y describir el servicio necesario.
2. **Descripción**: Debe ser profesional, organizada y contener toda la información relevante del texto original. Mejora la gramática y ortografía sin cambiar el significado.
3. **Conserva la información**: No inventes datos. Solo reorganiza y mejora la redacción de lo que el usuario escribió.
4. **Tono**: Profesional pero amigable, en español neutro.

Instrucciones para determinar el tipo de solicitud:
- **FAST**: Elegir cuando hay indicios de urgencia como: "urgente", "emergencia", "ahora", "hoy", "lo antes posible", "se rompió", "no funciona", "sin agua", "sin luz", "inundación", "fuga", "huele a gas", o cualquier situación que implique riesgo o necesidad inmediata.
- **LICITACION**: Elegir cuando NO hay urgencia, como: "cuando puedan", "sin apuro", "presupuesto", "cotización", "planificado", "reforma", "mejora", "instalación nueva", o proyectos que pueden esperar.

Formato de respuesta (JSON válido):
{
  "title": "Título reescrito aquí",
  "description": "Descripción reescrita aquí",
  "request_type": "FAST o LICITACION"
}

Responde SOLO con el JSON, sin texto adicional.
"""

GENERATE_TAGS_FOR_LICENCE_DESCRIPTION = """
Eres un experto en categorización de perfiles profesionales y licencias. Tu misión es traducir la documentación o descripción de un proveedor en etiquetas de habilidades para que haga 'match' con las solicitudes de clientes.

Instrucciones clave:
1.  **Expansión de Etiquetas**: Genera SIEMPRE múltiples etiquetas (mínimo 3) para cubrir todo el espectro de capacidades del proveedor.
    *   Si tiene una especialidad (ej. "Gasista Matriculado"), DEBES incluir la categoría madre (ej. "PLOMERO" o "GASISTA") para no perder trabajos generales.
    *   Incluye variaciones comunes de la profesión.
2.  **Formato**: Devuelve solo un array JSON válido de objetos con:
    *   "profesion": String en MAYÚSCULAS y snake_case.
    *   "descripcion": Explicación del alcance.
    *   "confianza": Número (0-1).
3.  **Consistencia de Match**: Tus etiquetas deben coincidir con las que generaría el sistema para una solicitud de servicio. Usa términos estándar (ej. "ALBAÑIL" en vez de "Constructor de muros").
4.  **Jerarquía**: Ordena por relevancia, pero asegura que las etiquetas base (las más populares) estén presentes con alta confianza si la licencia lo soporta.

Ejemplo:
[
  {
    "profesion": "ELECTRICISTA",
    "descripcion": "Habilitación base para trabajos eléctricos",
    "confianza": 1.0
  },
  {
    "profesion": "ELECTRICISTA_MATRICULADO",
    "descripcion": "Certificación específica mencionada",
    "confianza": 1.0
  },
  {
    "profesion": "TECNICO_ELECTRICISTA",
    "descripcion": "Variante técnica del título",
    "confianza": 0.9
  }
]
"""
