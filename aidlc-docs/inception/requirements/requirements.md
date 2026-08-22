# Requirements — Receptor de incidentes del bot de WhatsApp

## Intent Analysis
- **User Request**: Bot de WhatsApp para registrar incidentes vía un agente conversacional.
- **Request Type**: New Feature (integración entre sistemas).
- **Scope Estimate**: Multiple Components (nuevo backend Supabase + Edge Function + esquema de datos).
- **Complexity Estimate**: Moderate.

## Contexto y Alcance
- La **conversación y el flujo del agente WhatsApp ya fueron construidos por otro equipo** (fuera de alcance).
- Nuestro lado: **persistir los eventos crudos** (webhooks) e **impactar nuestro sistema** (crear el incidente en la BD cuando la conversación se completa).
- **Backend objetivo**: Supabase (Postgres + Edge Functions + PostgREST). Se ignora el código Convex actual.
- Un "incidente" corresponde al modelo **`Need`** del proyecto (categorías `HelpCategory`, tipos de lugar `PlaceType`, prioridad `Priority`, estados `NeedStatus` / `VerificationStatus`).

## Contrato de integración confirmado
- **Transporte**: HTTP webhook — el otro equipo hace POST con JSON en el body hacia nuestra URL.
- **Payload**: eventos crudos (ej. `type: message.received`) con `data.body`, `data.from` (número del ciudadano), `data.conversation_id`, `data.message_type`, `data.workflow.step`.
- **Fin de conversación**: otro `type` de evento (pendiente su schema) dispara la creación del incidente.
- **Autenticación**: abierta por ahora (deuda de seguridad).
- **Tipos de eventos**: varios; empezamos por `message.received`.

## Decisiones clave (de la conversación)
- Registros con `source = 'WhatsApp'` y `verification_status = 'PENDING_VERIFICATION'`.
- Defaults alineados al modelo existente: `priority = MEDIUM`, `status = NEED_HELP_NOW`, `emergency_id = 'terremoto-cali-2026'`.
- Contacto del ciudadano desde `data.from` (`contact_whatsapp` / `contact_phone`).
- Idempotencia por `event.id` del webhook; agrupación por `data.conversation_id`.
- Respuesta ACK (200) por cada evento.

## Functional Requirements
- **FR-1**: Recibir eventos crudos del webhook (endpoint HTTP) aceptando distintos `type`.
- **FR-2**: (Fase posterior) Autenticar al remitente (API key/HMAC) — hoy abierto.
- **FR-3**: Persistir cada evento crudo de forma idempotente para auditoría/trazabilidad.
- **FR-4**: Validar y mapear los eventos crudos al modelo `Need` (categorías, tipos de lugar, prioridad).
- **FR-5**: Crear el incidente en `needs` al recibir el evento de completado (otro `type`), con los datos acumulados de la conversación.
- **FR-6**: Garantizar idempotencia por `event.id`.
- **FR-7**: Enriquecer ubicación (geocoding + detección de ciudad) si el incidente no tiene coordenadas.
- **FR-8**: Responder ACK (200) por cada evento.
- **FR-9**: Documentar el contrato de integración (eventos crudos + evento de completado).

## Non-Functional Requirements
- **NFR-1**: Seguridad — service role key solo en secrets; RLS en las tablas.
- **NFR-2**: Trazabilidad — cada evento queda registrado con estado de procesamiento.
- **NFR-3**: Robustez — errores devuelven códigos claros (400/409/500).
- **NFR-4**: Testabilidad — lógica pura (mapeo/dedupe) testeable sin dependencias.
- **NFR-5**: Seguridad (deuda) — añadir autenticación del webhook (API key/HMAC) en fase posterior.

## Open Questions
- Schema del **evento de completado** (nombre y campos) — bloqueante para FR-5 / DEV-35.
