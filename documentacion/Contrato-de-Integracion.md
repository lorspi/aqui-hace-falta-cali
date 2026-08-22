# 🔌 Contrato de Integración — Receptor de eventos del bot de WhatsApp

> **Versión**: 1.0 (2026-08-22) — S8
> **Estado**: Vigente
> **Audiencia**: equipos de **conversación** (remitente) y **receptor** (RA-DAR / Aquí Hace Falta).
> Este documento es la fuente de verdad del contrato HTTP entre el agente de
> WhatsApp de "Aquí hace falta" y el receptor de eventos.

---

## 1. Propósito

El equipo de **conversación** construyó el agente de WhatsApp que conversa con el
ciudadano. Cuando la conversación produce eventos, el agente los envía a nuestro
**receptor** mediante un webhook HTTP. Este documento define el formato exacto de
esos eventos, las respuestas que el receptor devuelve y el comportamiento
esperado de ambas partes para alinear la integración.

---

## 2. Transporte

El transporte es un **POST HTTP con JSON** al endpoint del receptor:

| Entorno | URL |
|---------|-----|
| Producción | `POST https://<project-ref>.supabase.co/functions/v1/webhook` |
| Alias del contrato | `POST https://<project-ref>.supabase.co/functions/v1/webhook/events` |
| Local (Supabase CLI) | `POST http://127.0.0.1:54341/functions/v1/webhook` |

- **Método**: `POST` (cualquier otro método responde `405`).
- **Content-Type**: `application/json` (otro responde `415`).
- **Body**: un objeto JSON que representa un **evento crudo** del webhook.
- El endpoint acepta **cualquier `type`** de evento (string no vacío): el `type`
  no condiciona la recepción.

> ⚠️ **Autenticación abierta (deuda de seguridad)** — ver [sección 9](#9-autenticación-deuda-de-seguridad).

---

## 3. Esquema de los eventos crudos

Cada evento que el equipo de conversación envía es un objeto JSON con esta
estructura:

| Campo | Tipo | ¿Requerido? | Descripción |
|-------|------|-------------|-------------|
| `id` | `string` | ✅ | Identificador **único del evento** (clave de idempotencia). Un reenvío con el mismo `id` no crea duplicados. |
| `type` | `string` | ✅ | Tipo de evento. Cualquier string no vacío es aceptado. Ej. `message.received`, `conversation_completed`. |
| `data.conversation_id` | `string` | ✅ | Identificador de la conversación de WhatsApp. Agrupa los mensajes de una misma conversación. |
| `data.from` | `string` | ⚠️ | Número de WhatsApp del ciudadano (E.164, ej. `573001234567`). Requerido para el flujo de completado. |
| `data.body` | `string` \| `object` | ✅ | Contenido del mensaje. Puede ser texto plano o un objeto estructurado (con `text`, `description`, `title`, ubicación, etc.). |
| `data.message_type` | `string` | — | Tipo de contenido del mensaje (p. ej. `text`, `image`, `audio`, `video`, `document`, `location`). Se normaliza a un valor canónico. |
| `data.workflow.step` | `string` | — | Paso del flujo conversacional (p. ej. `awaiting_location`, `awaiting_details`, `completed`). Se normaliza a un valor canónico. |
| `data.latitude` / `data.longitude` | `number` | — | Coordenadas del incidente **si el remitente las conoce**. No son requeridas (ver [enriquecimiento](#8-enriquecimiento-de-ubicación)). |
| `data.address` / `data.neighborhood` | `string` | — | Dirección / barrio cuando el mensaje los aporta. |

**Ejemplo mínimo válido (shape documentado):**

```json
{
  "id": "evt_001",
  "type": "message.received",
  "data": {
    "conversation_id": "conv_001",
    "from": "573001234567",
    "body": "Necesito agua potable en mi barrio",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}
```

### 3.1 Tolerancia de shapes

El receptor acepta el `conversation_id` en **dos posiciones** (misma convención
que `body`):

| Campo | Shape documentado | Shape plano (compatibilidad) |
|------|-------------------|------------------------------|
| `conversation_id` | `data.conversation_id` | `conversation_id` (raíz) |
| `body` | `data.body` | `body` (raíz) |

Cuando ambos vienen, el receptor prefiere el **plano** (raíz) y cae al shape
documentado. El shape documentado de este contrato es el de `data.*`.

### 3.2 Normalizaciones

El receptor normaliza los campos libres a valores canónicos (para el mapeo a
`Need`):

- **`message_type`** → `TEXT`, `IMAGE`, `AUDIO`, `VIDEO`, `DOCUMENT`,
  `LOCATION` o `UNKNOWN`. Un valor desconocido o ausente **no invalida** el
  evento (se clasifica `UNKNOWN`).
- **`workflow.step`** → `AWAITING_LOCATION`, `AWAITING_DETAILS`, `COMPLETED` o
  `UNKNOWN`. El paso `COMPLETED` (o el evento de completado) marca el fin de la
  conversación.

### 3.3 Campos mínimos y validación

Los campos **mínimos obligatorios** son `id`, `type`, `conversation_id` y
`body` (en cualquiera de sus shapes). Si falta alguno, o llega con formato
inválido (p. ej. `id` numérico), el receptor responde **`400 Bad Request`** con
un error estructurado que **indica el campo faltante** (ver [sección 6](#6-códigos-de-error)).

---

## 4. Eventos soportados

### 4.1 `message.received` — mensaje crudo

Es el evento principal de la conversación. El receptor lo **persiste** para
auditoría y lo **mapea** a un borrador de incidente (`Need`). No crea el
incidente por sí solo: los mensajes se acumulan por `conversation_id`.

```json
{
  "id": "evt_msg_1",
  "type": "message.received",
  "data": {
    "conversation_id": "conv_001",
    "from": "573001234567",
    "body": "Necesito agua potable en mi barrio",
    "message_type": "text",
    "workflow": { "step": "awaiting_location" }
  }
}
```

### 4.2 Evento de completado — fin de conversación

Es un evento con un **`type` distinto de `message.received`** (p. ej.
`conversation_completed` o `conversation.completed`, o `workflow.step=COMPLETED`)
que marca el **fin de la conversación**. Al recibirlo, el receptor **crea el
incidente en la tabla `needs`** con los mensajes acumulados de esa
`conversation_id`:

- `source = WhatsApp`
- `contact_whatsapp` desde `data.from`
- `verification_status = PENDING_VERIFICATION`
- Defaults: `priority = MEDIUM`, `status = NEED_HELP_NOW`,
  `emergency_id = terremoto-cali-2026`, `city_id = cali`
- Un solo incidente por conversación.

```json
{
  "id": "evt_c1",
  "type": "conversation_completed",
  "data": {
    "conversation_id": "conv_001",
    "from": "573001234567",
    "body": "Conversación finalizada",
    "workflow": { "step": "completed" }
  }
}
```

> El **schema del evento de completado** (nombre exacto del `type`) está
> **pendiente de confirmación** por el equipo de conversación. El receptor ya
> soporta los `type` `conversation_completed` y `conversation.completed`, y la
> señal `workflow.step=COMPLETED`. Si el equipo confirma otro nombre, se ajusta
> en `supabase/functions/_shared/incident-builder.ts` sin cambiar el resto del
> contrato.

---

## 5. Respuestas del receptor

### 5.1 ACK 200 — evento aceptado

Por cada evento **válido**, el receptor responde `200 OK` (confirmación /
ACK). El ACK devuelve el `event.id` y el `type` del evento:

```json
{
  "ok": true,
  "status": "accepted",
  "event_id": "evt_001",
  "type": "message.received",
  "message": "Evento aceptado.",
  "persisted": true,
  "duplicate": false,
  "record": {
    "id": "…uuid…",
    "event_id": "evt_001",
    "processing_status": "RECEIVED",
    "received_at": "…",
    "created_at": "…"
  },
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

Cuando el evento es de **completado** y se crea el incidente, el ACK incluye una
sección `incident`:

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
    "title": "Necesito agua potable en mi barrio",
    "description": "Necesito agua potable en mi barrio",
    "source": "WhatsApp",
    "contact_whatsapp": "573001234567",
    "address": "Por confirmar",
    "neighborhood": "Por confirmar",
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

> El ACK **200** no depende del geocoding: un evento de completado **sin
> coordenadas** se confirma igual (el enriquecimiento queda como paso posterior,
> `location_enrichment_status=PENDING`).

---

## 6. Códigos de error

Todos los errores del receptor usan un cuerpo **estructurado** con `code` +
`message` (+ `details` con el contexto de validación):

```json
{
  "code": "validation_failed",
  "message": "Estructura mínima inválida. Campos faltantes o con formato inválido.",
  "details": { "issues": [ { "path": ["id"], "message": "id: campo requerido (string no vacío)." } ] }
}
```

### Tabla de códigos

| HTTP | `code` | ¿Cuándo aplica? | Acción esperada del remitente |
|------|--------|-----------------|-------------------------------|
| `400` | `invalid_json` | El body no es un JSON válido o está vacío. | Revisar el body y reintentar con un JSON válido. |
| `400` | `validation_failed` | Falta un campo mínimo (`id`, `type`, `conversation_id`, `body`) o tiene formato inválido. `details.issues` indica el campo (`path`) y la causa. | Corregir el evento agregando/corrigiendo el campo indicado. No se persiste nada. |
| `400` | `missing_conversation_id` | Evento de completado sin `conversation_id` (no puede agrupar la conversación). | Enviar el completado con `conversation_id` (o `data.conversation_id`). |
| `400` | `invalid_from` | Evento de completado con `data.from` que no es un número de WhatsApp válido (E.164). El evento crudo queda registrado para auditoría, pero **no** se crea el incidente. | Corregir `data.from` y reenviar el completado con un nuevo `id` (o completar la conversación de nuevo). |
| `409` | `duplicate_event` | Reenvío de un `event.id` **ya procesado con éxito**. El receptor es idempotente por `event.id`: **no crea duplicados** ni modifica la fila original. Incluye la fila existente en `details.record`. | El remitente puede **ignorar** el 409 (el evento ya fue recibido) o usarlo para detener reintentos. |
| `409` | `no_messages` | Evento de completado sin mensajes acumulados previos en la conversación. No se crea el incidente. | Asegurar que los `message.received` de la conversación lleguen antes del completado. |
| `500` | `persistence_failed` | Error interno al persistir el evento crudo. El error es **genérico**: no expone detalles internos (la causa real queda en los logs server-side). | Reintentar con **backoff**. Si persiste, reportar al equipo receptor. |
| `500` | `incident_creation_failed` | Error interno al crear el incidente en `needs`. Error genérico (sin detalles internos). | Reintentar con **backoff**. Si persiste, reportar al equipo receptor. |
| `405` | `method_not_allowed` | Método distinto de `POST`. | Usar `POST`. |
| `415` | `invalid_content_type` | `Content-Type` no es `application/json`. | Enviar `Content-Type: application/json`. |

### 6.1 Validación de campos faltantes

Cuando un evento llega **sin un campo obligatorio**, el receptor responde
`400 Bad Request` y el error estructurado **indica el campo faltante** en
`details.issues[].path`:

| Campo faltante | `path` en `issues` |
|----------------|--------------------|
| `event.id` | `["id"]` |
| `type` | `["type"]` |
| `data.conversation_id` | `["conversation_id"]` |
| `data.body` | `["body"]` |

Ejemplo — evento sin `id`:

```bash
curl -s -X POST http://127.0.0.1:54341/functions/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{ "type": "message.received", "data": { "conversation_id": "conv_001", "body": "hola" } }'
```

```json
{
  "code": "validation_failed",
  "message": "Estructura mínima inválida. Campos faltantes o con formato inválido.",
  "details": { "issues": [ { "path": ["id"], "message": "id: campo requerido (string no vacío)." } ] }
}
```

---

## 7. Idempotencia y reenvíos

- **Clave de idempotencia**: `event.id`.
- Un **reenvío con el mismo `event.id`** (incluso con body distinto) **no crea
  duplicados** en `ingest_responses` ni re-ejecuta el procesamiento aguas abajo
  (no se re-mapea ni se re-crea el incidente).
- El reenvío de un `event.id` ya procesado con éxito responde **`409 Conflict`**
  con `code=duplicate_event` e incluye la fila existente en `details.record`.
- La idempotencia aplica **por `event.id`**, **no** por `conversation_id`:
  eventos distintos de la misma conversación generan filas separadas.
- Un evento **sin `id`** responde `400` y no se persiste.
- Un reenvío tras un intento **fallido** de validación se procesa como nuevo
  (el intento fallido no persistió nada).

**Ejemplo:**

```bash
# Primer envío → 200
curl -s -w "\nHTTP %{http_code}\n" -X POST http://127.0.0.1:54341/functions/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{ "id": "evt-123", "type": "message.received", "data": { "conversation_id": "conv_001", "body": "Necesito ayuda", "from": "573001234567" } }'

# Reenvío del mismo event.id → 409 (no duplica)
curl -s -w "\nHTTP %{http_code}\n" -X POST http://127.0.0.1:54341/functions/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{ "id": "evt-123", "type": "message.received", "data": { "conversation_id": "conv_001", "body": "Necesito ayuda", "from": "573001234567" } }'
```

---

## 8. Enriquecimiento de ubicación

Cuando un evento de **completado** llega **sin coordenadas** y **sin ciudad
resuelta**:

1. El receptor intenta **enriquecer el incidente** con:
   - **Geocoding** (Nominatim / OpenStreetMap): si los mensajes aportan
     `address`/`neighborhood`, convierte la dirección en lat/lng.
   - **Detección de ciudad**: las coordenadas (del evento o del geocoding) se
     resuelven a un `city_id` del Valle del Cauca (radio de la ciudad). Si no
     caen en ninguna, se usa `cali` (default regional).
2. Si el geocoding **no está disponible o no resuelve**, el incidente se crea
   **igual** con `latitude`/`longitude = NULL` y
   `location_enrichment_status = PENDING`.
3. **La falta de coordenadas no bloquea la confirmación (ACK) del evento**: el
   receptor responde `200 OK` de todas formas.

Estados de `location_enrichment_status`:

| Estado | Significado |
|--------|-------------|
| `RESOLVED` | El incidente tiene coordenadas (del evento o resueltas por geocoding). |
| `PENDING` | Sin coordenadas; pendiente de enriquecimiento posterior. |

---

## 9. Autenticación (deuda de seguridad)

> ⚠️ **NOTA EXPLÍCITA**: actualmente la autenticación del webhook está
> **ABIERTA** — el endpoint acepta eventos sin verificar la identidad del
> remitente.

Esto es una **deuda de seguridad pendiente de resolver**. El plan es autenticar
al remitente con **API key / HMAC** (firma de los payloads) en una fase
posterior (FR-2 / NFR-5 del plan). Mientras tanto:

- El endpoint **no exige** headers de autorización.
- Cualquiera que conozca la URL puede enviar eventos.
- Ambos equipos deben coordinarse para migrar a API key/HMAC sin romper la
  integración (el cambio será **aditivo**: se exigirá la firma sin dejar de
  aceptar el formato de eventos de este contrato).

---

## 10. Persistencia para auditoría

Cada evento válido se persiste **tal cual** en la tabla `ingest_responses`
(columnas `raw_event`/`raw_payload` con el JSON completo sin modificar) con los
metadatos normalizados (`event_id`, `type`, `conversation_id`, `from`,
`message_type`, `workflow_step`), `processing_status = RECEIVED` y timestamps.
Esto garantiza trazabilidad y permite reproducir el procesamiento.

---

## 11. Disponibilidad y versionado

- Este documento vive en el **lugar compartido del proyecto**:
  `documentacion/Contrato-de-Integracion.md` (wiki versionada en git del
  repositorio `aqui-hace-falta-cali`).
- Está **versionado** con el repositorio: cualquier cambio en el contrato debe
  actualizar este documento y mantener **sincronizados los ejemplos y los
  códigos de error**.
- La versión vigente es la del encabezado de este documento. El código fuente de
  referencia del receptor está en `supabase/functions/webhook/` (handler) y
  `supabase/functions/_shared/` (validación, mapeo, persistencia, completado).

### Referencias en el código

| Pieza | Archivo |
|-------|---------|
| Validación de eventos crudos | `supabase/functions/_shared/webhook-event.ts` |
| Mapeo a `Need` | `supabase/functions/_shared/need-mapper.ts` |
| Persistencia del evento crudo | `supabase/functions/_shared/ingest-persistence.ts` |
| Evento de completado → incidente | `supabase/functions/_shared/incident-builder.ts`, `completion-service.ts` |
| Geocoding / detección de ciudad | `supabase/functions/_shared/geocoding.ts` |
| Endpoint HTTP | `supabase/functions/webhook/handler.ts` |
| Esquema `needs` + `ingest_responses` | `supabase/migrations/` (S1, S4, S5, S6) |
| README del endpoint | `supabase/functions/webhook/README.md` |
