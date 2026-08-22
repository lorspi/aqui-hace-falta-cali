# Edge Function `webhook` — Endpoint receptor de eventos (S2 / DEV-32)

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
| Evento válido (ACK) | `200` | `{ "ok": true, "status": "accepted", "event_id": "...", "type": "..." }` |
| Body no es JSON válido | `400` | `{ "error": "invalid_json", ... }` |
| Campos mínimos faltantes / formato inválido | `400` | `{ "error": "validation_failed", "details": { "issues": [...] } }` |
| Content-Type no es JSON | `415` | `{ "error": "invalid_content_type", ... }` |
| Método distinto de POST | `405` | `{ "error": "method_not_allowed", ... }` |

## Ejecución local

```bash
supabase start          # (opcional) levanta el stack local
supabase functions serve webhook
# POST http://127.0.0.1:54321/functions/v1/webhook
```

## Notas

- Esta historia NO persiste el evento (es S4), NO mapea (S3/S5) ni deduplica
  (S6): solo recibe, valida estructura mínima y responde ACK 200.
- La deduplicación por `event_id` se delega a la capa de idempotencia (S4/S6);
  el endpoint es stateless y acepta reenvíos.
