# Edge Function `webhook` — Endpoint receptor de eventos (S2+S3+S4 / DEV-32, DEV-33, DEV-34)

Endpoint HTTP que recibe los **eventos crudos** del webhook del equipo de
conversación (agente WhatsApp de "Aquí hace falta").

## Rutas

| Método | Ruta (local) | Descripción |
|--------|--------------|-------------|
| `POST` | `http://127.0.0.1:54341/functions/v1/webhook` | Recibe un evento crudo |
| `POST` | `http://127.0.0.1:54341/functions/v1/webhook/events` | Alias del contrato |

En producción la base es `https://<project-ref>.supabase.co/functions/v1/webhook`.

## Cuerpo mínimo del evento

```json
{
  "id": "evt_001",
  "type": "message.received",
  "conversation_id": "conv_001",
  "data": {
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}
```

- `id`, `type` y `conversation_id`: strings no vacíos (obligatorios).
- `body`: contenido del mensaje; se acepta en `data.body` (shape documentado)
  o en `body` (shape plano).
- `type` no condiciona la aceptación: cualquier string no vacío.
- No se requieren coordenadas (el geocoding es la historia S5).
- Autenticación abierta por ahora (deuda de seguridad, ver S8).

## Respuestas

| Caso | HTTP | Body |
|------|------|------|
| Evento válido (ACK) | `200` | `{ "ok": true, "status": "accepted", "event_id": "...", "type": "...", "persisted": true, "record": {...}, "mapping": { ... } }` |
| Reenvío del mismo `event.id` | `200` | igual, con `persisted: false`, `duplicate: true` y `record` = fila existente |
| Body no es JSON válido | `400` | `{ "error": "invalid_json", ... }` |
| Campos mínimos faltantes / formato inválido | `400` | `{ "error": "validation_failed", "details": { "issues": [...] } }` |
| Error de persistencia | `500` | `{ "error": "persistence_failed", ... }` |
| Content-Type no es JSON | `415` | `{ "error": "invalid_content_type", ... }` |
| Método distinto de POST | `405` | `{ "error": "method_not_allowed", ... }` |

## Persistencia del evento crudo (S4)

Cada evento válido se persiste en `ingest_responses` (auditoría). La fila
guarda:

- `raw_event` (y `raw_payload`, alias S1): el **JSON completo del evento sin
  modificar**.
- `body`: el contenido del mensaje (`data.body` o `body` plano).
- Metadatos: `event_id`, `type`, `conversation_id`, `from`, `message_type`
  (canónico), `workflow_step` (canónico).
- `processing_status = 'RECEIVED'`, `received_at` y `created_at`.

**Idempotencia por `event.id`:** la tabla tiene `UNIQUE (event_id)` (S1). El
endpoint hace `INSERT ... ON CONFLICT (event_id) DO NOTHING`; en un reenvío se
devuelve la fila existente y **no se crea ni se modifica nada** (el `raw_event`
y los timestamps originales quedan intactos). La idempotencia aplica por
`event.id`, no por `conversation_id`: eventos distintos de la misma conversación
generan filas separadas.

Un evento sin campos obligatorios (`id`, `type`, `conversation_id`, `body`)
devuelve `400` y **no se persiste ninguna fila**. Un evento sin coordenadas se
persiste tal cual (el geocoding queda pendiente para S5).

El ACK `200` incluye el resultado de la persistencia:

```json
{
  "ok": true,
  "status": "accepted",
  "event_id": "evt_001",
  "type": "message.received",
  "persisted": true,
  "duplicate": false,
  "record": {
    "id": "…uuid…",
    "event_id": "evt_001",
    "processing_status": "RECEIVED",
    "received_at": "…",
    "created_at": "…"
  },
  "mapping": { … }
}
```

## Mapeo a borrador de Need (S3)

El ACK `200` incluye una sección `mapping` con el resumen del borrador de
`Need` generado por la validación + mapeo (`supabase/functions/_shared/need-mapper.ts`):

```json
{
  "ok": true,
  "status": "accepted",
  "event_id": "evt_001",
  "type": "message.received",
  "mapping": {
    "result": "mapped",
    "message_type": "TEXT",
    "workflow_step": "AWAITING_LOCATION",
    "contribution": "LOCATION",
    "builds_incident": true,
    "incident_ready": false,
    "priority": "MEDIUM",
    "status": "NEED_HELP_NOW",
    "verification_status": "PENDING_VERIFICATION",
    "source": "WhatsApp",
    "contact_whatsapp": "573001234567",
    "location_pending_geocoding": true
  }
}
```

- `message_type` se normaliza a un valor canónico (`TEXT`, `IMAGE`, `AUDIO`,
  `VIDEO`, `DOCUMENT`, `LOCATION`, `UNKNOWN`); un formato desconocido no invalida
  el evento (genérico).
- `workflow.step` se normaliza a `AWAITING_LOCATION`, `AWAITING_DETAILS`,
  `COMPLETED` o `UNKNOWN`; `incident_ready=true` señala que la conversación está
  lista para crear el incidente (delegado a S5).
- Defaults: `priority=MEDIUM`, `status=NEED_HELP_NOW`,
  `verification_status=PENDING_VERIFICATION`, `source=WhatsApp`.
- `contact_whatsapp` se toma de `data.from` cuando está presente.
- `builds_incident=false` para eventos de type distinto a `message.received`
  (p. ej. `conversation_completed`): pasan la validación pero no arman incidente
  directamente (insumo de S5).
- `location_pending_geocoding=true` cuando el evento no trae coordenadas
  (el geocoding es S5); `address`/`neighborhood` se conservan desde el body
  cuando vienen incluidos.
- La deduplicación por `event.id` en la capa de mapeo devuelve
  `status: "duplicate"` sin borrador para reenvíos; la confirmación durable es
  S4/S6 (constraint `UNIQUE` en `ingest_responses.event_id`).

## Ejecución local

```bash
supabase start          # (opcional) levanta el stack local
supabase functions serve webhook
# POST http://127.0.0.1:54341/functions/v1/webhook
```

El bootstrap (`index.ts`) crea el store de `ingest_responses` contra PostgREST
usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (las inyecta la plataforma o
el CLI local). Con el rol `service_role` se escribe en `ingest_responses`
(BYPASSRLS; el anon está bloqueado por RLS, ver S1).

## Notas

- Esta historia NO crea el incidente (S5) ni confirma la idempotencia como
  respuesta de negocio distinta (S6): la idempotencia durable ya queda
  garantizada por el `UNIQUE (event_id)` + `ON CONFLICT DO NOTHING` al persistir
  (S4).
- La deduplicación por `event_id` se delega a la capa de persistencia (S4/S6);
  el endpoint acepta reenvíos y responde `200` devolviendo la fila existente.
