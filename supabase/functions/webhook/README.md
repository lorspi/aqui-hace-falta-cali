# Edge Function `webhook` — Endpoint receptor de eventos (S2–S7 / DEV-32 .. DEV-37)

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

También se acepta el `conversation_id` en `data.conversation_id` (shape
documentado del contrato S8), idéntico al criterio de `body`:

```json
{
  "id": "evt_001",
  "type": "message.received",
  "data": {
    "conversation_id": "conv_001",
    "body": "Necesito agua potable en mi barrio",
    "from": "573001234567",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}
```

- `id`, `type` y `conversation_id`: strings no vacíos (obligatorios). El
  `conversation_id` se acepta en `conversation_id` (plano) o en
  `data.conversation_id` (shape documentado); cuando vienen ambos, se prefiere
  el plano.
- `body`: contenido del mensaje; se acepta en `data.body` (shape documentado)
  o en `body` (shape plano).
- `type` no condiciona la aceptación: cualquier string no vacío.
- No se requieren coordenadas (el geocoding es la historia S5).
- Autenticación (S8): `Authorization: Bearer <service role key o secret key
  del proyecto receptor>` (server-to-server). El gateway exige JWT válido
  (`verify_jwt = true`) y el handler compara el token en tiempo constante
  contra las keys privilegiadas inyectadas (`expectedBearerTokens`). Las
  publishable keys y la anon key (públicas) se rechazan.

## Respuestas

| Caso | HTTP | Body |
|------|------|------|
| Evento válido (ACK) | `200` | `{ "ok": true, "status": "accepted", "event_id": "...", "type": "...", "persisted": true, "record": {...}, "mapping": { ... } }` |
| Reenvío del mismo `event.id` | `409` | `{ "code": "duplicate_event", "message": "El evento con event.id '...' ya fue recibido...", "details": { "event_id": "...", "record": {...} } }` |
| Body no es JSON válido | `400` | `{ "code": "invalid_json", "message": "...", "details": { "issues": [...] } }` |
| Campos mínimos faltantes / formato inválido | `400` | `{ "code": "validation_failed", "message": "...", "details": { "issues": [...] } }` |
| Error de persistencia (interno) | `500` | `{ "code": "persistence_failed", "message": "Error interno al persistir el evento. Inténtalo de nuevo." }` |
| Error al crear el incidente (interno) | `500` | `{ "code": "incident_creation_failed", "message": "Error interno al crear el incidente. Inténtalo de nuevo." }` |
| Content-Type no es JSON | `415` | `{ "code": "invalid_content_type", ... }` |
| Método distinto de POST | `405` | `{ "code": "method_not_allowed", ... }` |
| Sin `Authorization: Bearer <token>` | `401` | `{ "code": "missing_authorization", ... }` |
| Token distinto a la service role key | `401` | `{ "code": "unauthorized", ... }` |

## Confirmación al remitente — ACK (S7 / DEV-37)

La historia S7 define el contrato de confirmación de cada evento:

- **Respuesta 200 por evento recibido**: el ACK devuelve el `event.id` y el
  `type` del evento en el body.
- **Errores → códigos y mensajes estructurados**: todos los errores usan
  `code` + `message` (con `details` para el contexto de validación).
  - `400` → validación (JSON inválido / campos faltantes / formato inválido).
  - `409` → reenvío del mismo `event.id` (`duplicate_event`): el evento ya fue
    recibido; no se crea un duplicado en `ingest_responses`.
  - `500` → fallo interno de persistencia / creación del incidente. El error es
    **genérico**: no expone detalles internos (la causa real se registra
    server-side vía el logger inyectado).
- **Evento de completado sin coordenadas** → `200` OK: el ACK confirma la
  recepción aunque falten coordenadas; el enriquecimiento por geocoding queda
  como paso posterior (`location_enrichment_status=PENDING`) y **no bloquea** el
  ACK.

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

## Creación del incidente al completar la conversación (S5)

Cuando llega el **evento de completado** (otro `type` distinto de
`message.received`, p. ej. `conversation_completed`), el receptor crea el
registro del incidente en `needs` con los **mensajes acumulados** de la
conversación:

```bash
# 1) Los message.received se acumulan (S4 ya los persiste en ingest_responses)
POST {SUPABASE_URL}/functions/v1/webhook
{ "id": "evt_msg_1", "type": "message.received", "conversation_id": "conv_001",
  "data": { "body": "Necesito agua potable", "from": "573001234567" } }

# 2) El evento de completado dispara la creación del incidente
POST {SUPABASE_URL}/functions/v1/webhook
{ "id": "evt_c1", "type": "conversation_completed", "conversation_id": "conv_001",
  "data": { "body": "Conversación finalizada", "from": "573001234567" } }
```

El ACK `200` incluye la sección `incident`:

```json
{
  "ok": true,
  "status": "accepted",
  "event_id": "evt_c1",
  "type": "conversation_completed",
  "incident": {
    "outcome": "created",
    "id": "…uuid…",
    "conversation_id": "conv_001",
    "source_event_id": "evt_c1",
    "title": "Necesito agua potable",
    "description": "Necesito agua potable",
    "source": "WhatsApp",
    "contact_whatsapp": "573001234567",
    "priority": "MEDIUM",
    "status": "NEED_HELP_NOW",
    "verification_status": "PENDING_VERIFICATION",
    "latitude": null,
    "longitude": null,
    "city_id": "cali",
    "location_enrichment_status": "PENDING"
  }
}
```

- **Defaults del contrato**: `priority=MEDIUM`, `status=NEED_HELP_NOW`,
  `verification_status=PENDING_VERIFICATION`, `source=WhatsApp`,
  `emergency_id=terremoto-cali-2026`, `city_id=cali`.
- **`contact_whatsapp`** se toma de `data.from` del completado (o del primer
  mensaje acumulado que lo traiga).
- **Acumulación**: la descripción y la ubicación se arman con los mensajes
  `message.received` de la misma `conversation_id` (no se mezclan conversaciones).
- **Ubicación**:
  - Si los mensajes traen coordenadas → el incidente queda con
    `location_enrichment_status=RESOLVED` y `city_id` resuelto por las
    coordenadas (**no** se invoca geocoding).
  - Si faltan coordenadas pero hay `address`/`neighborhood` → se invoca el
    geocoder (Nominatim); si resuelve, actualiza lat/lng y `city_id`.
  - Si no hay geocoding disponible o no resuelve → el incidente se crea **igual**
    con lat/lng NULL y `location_enrichment_status=PENDING` (el flujo no rechaza
    el evento de completado).

### Códigos de error S5

| Caso | HTTP | Body |
|------|------|------|
| `conversation_id` vacío/faltante en el completado | `400` | `{ "code": "validation_failed" \| "missing_conversation_id", ... }` |
| `data.from` inválido (no E.164) | `400` | `{ "code": "invalid_from", ... }` — el evento queda en `ingest_responses` (auditoría) |
| Sin mensajes acumulados previos | `409` | `{ "code": "no_messages", ... }` |
| Reenvío del mismo `event.id` de completado | `409` | `{ "code": "duplicate_event", ... }` — la idempotencia durable (UNIQUE `source_event_id` / `conversation_id`) evita el duplicado |
| Error al crear el incidente | `500` | `{ "code": "incident_creation_failed", ... }` (genérico, sin detalles internos) |

### Idempotencia

- `needs.source_event_id` (event.id del completado) tiene un **índice único
  parcial** → un reenvío del mismo completado no crea un segundo incidente.
- `needs.conversation_id` tiene un **índice único parcial** → una conversación
  genera un solo incidente (no se mezclan conversaciones).

> **Dependencia**: el schema exacto del evento de completado está pendiente de
> confirmación por el equipo de conversación. Se soportan los `type`
> `conversation_completed` y `conversation.completed`, y la señal
> `workflow.step=COMPLETED`. Ajustar `COMPLETION_EVENT_TYPES` en
> `_shared/incident-builder.ts` cuando se confirme el nombre.

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

- **Contrato de integración**: el documento canónico para ambos equipos está en
  `documentacion/Contrato-de-Integracion.md` (S8 / DEV-38). Este README es la
  referencia operativa del endpoint; el contrato es la fuente de verdad.
- S5 (creación del incidente al completar la conversación) está implementada: el
  evento de completado crea el registro en `needs` con los mensajes acumulados de
  la conversación, geocoding cuando faltan coordenadas e idempotencia por
  `event.id`. Ver sección "Creación del incidente al completar la conversación (S5)".
- La deduplicación por `event_id` se delega a la capa de persistencia (S4/S6):
  un reenvío del mismo `event.id` responde **`409`** `duplicate_event` (S7) sin
  crear duplicado ni modificar la fila original.
