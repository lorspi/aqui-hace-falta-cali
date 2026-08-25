# Edge Function `conversation` — Reconstrucción de conversación (US-3 / DEV-42)

Endpoint de **lectura** para el frontend de validación: reconstruye la
conversación de un need (o de un `conversation_id` aún sin need asociado) y la
devuelve **formateada**, de modo que el frontend **no tiene que interpretar
`raw_event`**.

## Rutas

| Método | Ruta (local) | Descripción |
|--------|--------------|-------------|
| `GET` | `http://127.0.0.1:8001/functions/v1/conversation/needs/{id}` | Reconstruye la conversación de un need |
| `GET` | `http://127.0.0.1:8001/functions/v1/conversation?need_id={id}` | Variante por query |
| `GET` | `http://127.0.0.1:8001/functions/v1/conversation?conversation_id={conv}` | Reconstruye por conversación (puede no tener need) |

En producción la base es `https://<project-ref>.supabase.co/functions/v1/conversation`.

> La ruta canónica del contrato es `GET /needs/{id}/conversation`. El prefijo
> `/functions/v1/conversation` lo inyecta la plataforma Supabase al servir la
> Edge Function.

## Respuesta

```json
{
  "conversation_id": "conv_001",
  "has_need": true,
  "need": {
    "id": "…uuid…",
    "title": "Necesito agua potable",
    "description": "Necesito agua potable | …",
    "contact_whatsapp": "573001234567",
    "address": "Calle 5 #10-20",
    "neighborhood": "San Fernando",
    "priority": "MEDIUM",
    "status": "NEED_HELP_NOW",
    "verification_status": "PENDING_VERIFICATION",
    "conversation_id": "conv_001",
    "source_event_id": "evt_c1"
  },
  "messages": [
    {
      "event_id": "evt_msg_1",
      "sender": "573001234567",
      "content": "Necesito agua potable",
      "type": "TEXT",
      "attachments": [],
      "received_at": "2026-08-24T19:20:48.547+00:00"
    }
  ]
}
```

### Formato uniforme de mensaje

Cada mensaje se normaliza desde la fila de `ingest_responses`:

| Campo | Descripción |
|-------|-------------|
| `event_id` | event.id del evento crudo (trazabilidad) |
| `sender` | `data.from` del mensaje, o `null` |
| `content` | contenido del mensaje (body / `data.body`) |
| `type` | `message_type` **canónico** (S3): `TEXT` / `IMAGE` / `AUDIO` / `VIDEO` / `DOCUMENT` / `LOCATION` / `UNKNOWN` |
| `attachments` | adjuntos extraídos del `raw_event` (imagen y/o ubicación) |
| `received_at` | timestamp de la fila (orden cronológico) |

**Adjuntos** (no existen tablas `messages`/`attachments`; viajan dentro del
`raw_event`):

```json
// IMAGE
{ "type": "image", "url": "https://…/foto.jpg", "mime": "image/jpeg" }

// LOCATION (coordenadas opcionales; no rompe la reconstrucción)
{ "type": "location", "latitude": 3.4516, "longitude": -76.532, "address": "Calle 5 #10-20" }
```

### Comportamiento

- **Solo los `message.received` se listan como mensajes**: el evento de
  completado NO aparece con contenido; su `event.id` queda disponible en
  `need.source_event_id`.
- **Conversación sin completado** (`?conversation_id=`): `has_need=false`,
  `need=null` y los mensajes disponibles normalizados.
- **Fila malformada** (sin body / sin `data.from`): se normaliza de forma
  **tolerante** (content por defecto, `sender=null`) y no se pierde (auditoría).
- **Reenvíos**: la capa de ingestión ya deduplicó por `event_id` (UNIQUE S1/S6);
  la reconstrucción lee las filas tal cual y cada `event_id` aparece una sola vez.
- **`need.id` inexistente** → `404` `need_not_found` (incluye ids no-UUID, que no
  pueden existir en una columna UUID).
- **Conversación sin mensajes** → `messages=[]` con los metadatos (no rompe el
  contrato).

## Errores

| Caso | HTTP | Body |
|------|------|------|
| Falta `need_id` y `conversation_id` | `400` | `{ "code": "missing_parameter", ... }` |
| `need.id` inexistente | `404` | `{ "code": "need_not_found", "details": { "need_id": "…" } }` |
| Método distinto de GET | `405` | `{ "code": "method_not_allowed", ... }` |
| Error interno de reconstrucción | `500` | `{ "code": "conversation_rebuild_failed", ... }` (genérico; causa vía log) |

## Ejecución local

```bash
supabase start          # (opcional) levanta el stack local
supabase functions serve conversation
# GET http://127.0.0.1:54341/functions/v1/conversation/needs/{id}
```

Si el CLI falla (ver nota de DEV-42), se sirve la función con Deno directamente:

```bash
deno run --allow-net --allow-env --allow-read \
  --env-file=/tmp/radar_edge.env supabase/functions/conversation/index.ts
```

El bootstrap (`index.ts`) crea los stores de `ingest_responses` y `needs`
contra PostgREST usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. El rol
`service_role` lee `ingest_responses` (BYPASSRLS; el anon está bloqueado por RLS,
ver S1).
