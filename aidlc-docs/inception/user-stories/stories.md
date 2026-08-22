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

## S8 — Documentación del contrato de integración
Como equipo, quiero documentar el contrato para alinear a ambos equipos.

**Criterios de aceptación:**
- Documento con el esquema de los eventos crudos, el evento de completado, ejemplos y códigos de error.
- Nota explícita: autenticación abierta (deuda de seguridad).

## S9 — Pruebas e2e del receptor
Como equipo, quiero una suite de pruebas end-to-end contra el stack real (Edge Function + Supabase local) para verificar que el receptor funciona completamente y detectar regresiones.

**Criterios de aceptación:**
- La suite se ejecuta contra el endpoint real servido con Deno (`deno run --allow-net --env-file=… index.ts`, puerto 8000) y la BD local de Supabase de RADAR (API 54341 / DB 54342), con las 4 migraciones aplicadas.
- Cubre los escenarios S2-S7 sobre el stack real: HTTP real + persistencia real verificada con SQL.
- Cobertura mínima (10 escenarios): evento válido, JSON inválido, content-type no JSON, campos faltantes, método no permitido, reenvío (duplicate_event), completado sin mensajes (no_messages), flujo completo (mensajes + completado → incidente creado), reenvío del completado, y verificación en BD (raw_event intacto, processing_status=RECEIVED, sin duplicados).
- Es reproducible: `python3 e2e/run_e2e.py` limpia y pasa con 0 fallos; los datos de prueba (`e2e_%`) se eliminan al final.
- El mapping del ACK normaliza `message_type`/`workflow_step` a mayúsculas (TEXT, AWAITING_LOCATION).

**Escenarios Gherkin:**

```gherkin
Scenario: Evento válido message.received
  Given el endpoint webhook sirviendo con Deno y la BD local de RADAR
  When se envía POST con un evento message.received válido
  Then responde 200 con status "accepted"
  And el ACK devuelve event_id, type y persisted=true
  And el mapping normaliza message_type=TEXT y workflow_step=AWAITING_LOCATION
  And contact_whatsapp se mapea desde data.from y builds_incident=true
  And location_pending_geocoding=true (sin coordenadas)

Scenario: JSON inválido
  Given el endpoint webhook
  When se envía POST con body que no es JSON válido
  Then responde 400 con code "invalid_json" y details.issues

Scenario: Content-Type no JSON
  Given el endpoint webhook
  When se envía POST con Content-Type text/plain
  Then responde 415 con code "invalid_content_type"

Scenario: Campos mínimos faltantes
  Given el endpoint webhook
  When se envía POST con un evento sin type ni data
  Then responde 400 con code "validation_failed" y details.issues con el detalle

Scenario: Método no permitido
  Given el endpoint webhook
  When se envía GET
  Then responde 405 con code "method_not_allowed"

Scenario: Reenvío del mismo event.id (idempotencia S6/S7)
  Given un evento ya procesado con éxito
  When se reenvía el mismo event.id (aunque con body distinto)
  Then responde 409 con code "duplicate_event"
  And details.record trae la fila existente
  And NO se crea una fila nueva en ingest_responses

Scenario: Completado sin mensajes acumulados (S5)
  Given un evento conversation.completed sin eventos previos de la conversación
  When se envía POST
  Then responde 409 con code "no_messages" y no crea incidente

Scenario: Flujo completo — mensajes + completado crean el incidente (S5)
  Given dos eventos message.received de la misma conversación ya persistidos
  When se envía el evento conversation.completed de esa conversación
  Then responde 200
  And el ACK incluye incident con outcome=created
  And el incidente tiene conversation_id, source=WhatsApp, contact_whatsapp y PENDING_VERIFICATION

Scenario: Reenvío del evento de completado
  Given un completado ya procesado con incidente creado
  When se reenvía el mismo event.id de completado
  Then responde 409 con code "duplicate_event"
  And NO se crea un segundo incidente

Scenario: Verificación en BD
  Given la suite ejecutada
  When se consulta la BD local
  Then ingest_responses contiene los eventos e2e con raw_event intacto y processing_status=RECEIVED
  And needs contiene el incidente del flujo completo
  And los reenvíos no duplicaron filas
```
