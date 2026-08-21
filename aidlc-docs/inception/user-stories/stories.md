# User Stories — Receptor de eventos del bot de WhatsApp

## S1 — Esquema de datos en Supabase
Como ingeniero del receptor, quiero tablas en Supabase (`needs` y `ingest_responses`) con RLS, para persistir incidentes y los eventos crudos del webhook.

**Criterios de aceptación:**
- Migración SQL crea `needs` espejando el modelo `Need` (categorías, tipo de lugar, prioridad, estado, verificación, contacto, ubicación).
- `ingest_responses` guarda el evento crudo + metadatos (`event_id`, `type`, `conversation_id`, `from`, `body`, `message_type`, `workflow_step`, timestamps).
- RLS: solo service role escribe; sin acceso anónimo.

## S2 — Endpoint receptor de eventos
Como sistema receptor, quiero un endpoint HTTP que reciba los eventos del webhook del equipo de conversación.

**Criterios de aceptación:**
- Acepta POST con JSON (eventos crudos de cualquier `type`).
- Autenticación abierta por ahora (sin auth; deuda de seguridad).
- Valida estructura mínima del body → 400 con errores detallados.
- Responde 200 por cada evento.

## S3 — Validación y mapeo de eventos
Como sistema receptor, quiero validar y mapear los eventos crudos a nuestro modelo (`Need`) para garantizar integridad.

**Criterios de aceptación:**
- Campos mínimos requeridos por evento (`id`, `type`, `conversation_id`, `body`).
- Normalización de `message_type` y `workflow.step` para armar el incidente.
- Defaults: `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `source=WhatsApp`.

## S4 — Persistencia del evento crudo
Como operador, quiero que cada evento recibido se guarde tal cual para auditoría.

**Criterios de aceptación:**
- Cada evento genera una fila en `ingest_responses` (cruda + metadatos + estado de procesamiento).
- Idempotencia por `event.id`; reintentos no duplican.

## S5 — Creación del incidente al completar la conversación
Como operador, quiero que al recibir el evento de completado (otro `type`) se cree un registro en `needs`.

**Criterios de aceptación:**
- Se acumulan mensajes por `conversation_id`; el evento de completado dispara la creación del incidente.
- Incidente con `source=WhatsApp`, `contact_whatsapp` desde `from` y pendiente de verificación.
- Si faltan coordenadas, se enriquece con geocoding + ciudad.
- Depende del schema del evento de completado.

## S6 — Idempotencia / deduplicación
Como operador, quiero que reenvíos del mismo evento no generen duplicados.

**Criterios de aceptación:**
- Clave de idempotencia: `event.id`.
- Reenvío con el mismo `event.id` no crea duplicados; se ignora o devuelve el existente.

## S7 — Confirmación al remitente (ACK)
Como equipo de conversación, quiero recibir confirmación de recepción de cada evento.

**Criterios de aceptación:**
- Respuesta 200 por evento recibido.
- Errores → códigos y mensajes estructurados (400/409/500).

**Escenarios (Gherkin):**

```gherkin
Scenario: Evento válido se confirma con 200
  Given el equipo de conversación envía un POST con un evento válido
    And el evento incluye `event.id`, `type`, `data.conversation_id` y `data.body`
  When el receptor procesa el evento
  Then responde 200 OK
    And el ACK confirma la recepción y devuelve el `event.id` del evento

Scenario: Body que no es JSON válido devuelve 400
  Given el equipo de conversación envía un POST con un body que no es JSON válido
  When el receptor intenta procesar el evento
  Then responde 400 Bad Request
    And el error es estructurado con `code` y `message`

Scenario Outline: Evento con un campo requerido faltante devuelve 400
  Given el equipo de conversación envía un evento sin el campo <campo>
  When el receptor valida el evento
  Then responde 400 Bad Request
    And el error estructurado indica el campo faltante (<campo>)

  Examples:
    | campo                |
    | event.id             |
    | type                 |
    | data.conversation_id |
    | data.body            |

Scenario: Evento con tipo de dato inválido devuelve 400
  Given el equipo de conversación envía un evento cuyo `type` no es una cadena válida
  When el receptor valida el evento
  Then responde 400 Bad Request
    And el error estructurado detalla la causa de validación

Scenario: Reenvío del mismo event.id devuelve 409
  Given el receptor ya procesó con éxito un evento con `event.id` "evt-123"
  When el equipo de conversación reenvía un POST con el mismo `event.id`
  Then responde 409 Conflict
    And el error estructurado indica que el evento ya fue recibido
    And no se crea un duplicado en `ingest_responses`

Scenario: Fallo interno de persistencia devuelve 500
  Given el receptor recibe un evento válido
    But la base de datos no está disponible
  When el receptor intenta persistir el evento
  Then responde 500 Internal Server Error
    And el error estructurado es genérico (sin exponer detalles internos)

Scenario: Evento de completado sin coordenadas se confirma con 200
  Given el equipo de conversación envía el evento de completado de una conversación sin coordenadas
  When el receptor confirma la recepción del evento
  Then responde 200 OK
    And el ACK confirma la recepción aunque falten coordenadas
    And el enriquecimiento por geocoding queda como paso posterior (no bloquea el ACK)
```

## S8 — Documentación del contrato de integración
Como equipo, quiero documentar el contrato para alinear a ambos equipos.

**Criterios de aceptación:**
- Documento con el esquema de los eventos crudos, el evento de completado, ejemplos y códigos de error.
- Nota explícita: autenticación abierta (deuda de seguridad).
