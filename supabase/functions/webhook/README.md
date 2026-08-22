# Edge Function `webhook` — Endpoint receptor de eventos (S2+S3 / DEV-32, DEV-33)

Endpoint HTTP que recibe los **eventos crudos** del webhook del equipo de
conversación (agente WhatsApp de "Aquí hace falta").

## Rutas

| Método | Ruta (local) | Descripción |
|--------|--------------|-------------|
| `POST` | `http://127.0.0.1:54321/functions/v1/webhook` | Recibe un evento crudo |
| `POST` | `http://127.0.0.1:54321/functions/v1/webhook/events` | Alias del contrato |

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
| Evento válido (ACK) | `200` | `{ "ok": true, "status": "accepted", "event_id": "...", "type": "...", "mapping": { ... } }` |
| Body no es JSON válido | `400` | `{ "error": "invalid_json", ... }` |
| Campos mínimos faltantes / formato inválido | `400` | `{ "error": "validation_failed", "details": { "issues": [...] } }` |
| Content-Type no es JSON | `415` | `{ "error": "invalid_content_type", ... }` |
| Método distinto de POST | `405` | `{ "error": "method_not_allowed", ... }` |

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
# POST http://127.0.0.1:54321/functions/v1/webhook
```

## Notas

- Esta historia NO persiste el evento (es S4), NO crea el incidente (S5) ni
  confirma la idempotencia de forma durable (S6): recibe, valida estructura
  mínima, mapea el borrador de Need (S3) y responde ACK 200 con el resumen.
- La deduplicación por `event_id` se delega a la capa de idempotencia (S4/S6);
  el endpoint es stateless y acepta reenvíos.
