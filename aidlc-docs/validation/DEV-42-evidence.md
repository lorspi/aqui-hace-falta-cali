# Evidencia de validación — DEV-42 (US-3: Endpoint de reconstrucción de conversación para el frontend)

Fecha: 2026-08-24
Rama: `agent/DEV-42`
Base: `feature/whatsappbot`

## Contexto

US-3 agrega al receptor de eventos un **endpoint de reconstrucción de
conversación** para que el frontend de validación muestre la conversación
formateada SIN interpretar `raw_event`:

- `GET /needs/{id}/conversation` reconstruye la conversación de un need:
  devuelve todas las filas de `ingest_responses` con su `conversation_id`,
  ordenadas por `received_at` ascendente, con cada `raw_event` normalizado al
  **formato uniforme** (`sender`, `content`, `type` canónico, `attachments`,
  `received_at`, `event_id`).
- La respuesta incluye los **datos ya mapeados** en `needs`: `title`,
  `description`, `contact_whatsapp`, `address`, `neighborhood`, `priority`,
  `status`, `verification_status`, junto con `conversation_id` y
  `source_event_id`.
- También se puede consultar por `conversation_id` (sin need asociado aún),
  para conversaciones en curso previas al evento de completado.
- `need.id` inexistente → `404` con error estructurado (`need_not_found`).

La normalización **reutiliza la lógica de `mapEventToNeedDraft` (S3)**: la misma
clasificación canónica de `message_type` (`normalizeMessageType`) y la extracción
de contenido/ubicación desde el `raw_event`. Los adjuntos (imagen y ubicación) se
extraen del propio `raw_event` (no existen tablas `messages`/`attachments`
separadas).

## Cambios en esta rama

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/_shared/conversation-rebuilder.ts` | **Nuevo.** Módulo PURE (NFR-4): `normalizeMessageRow` (fila → mensaje uniforme), `extractAttachments` (imagen/ubicación desde `raw_event`), `summarizeNeed`, `rebuildConversation` (orden cronológico + need). Reutiliza `mapEventToNeedDraft` / `normalizeMessageType` de `need-mapper.ts`. |
| `supabase/functions/conversation/handler.ts` | **Nuevo.** Handler HTTP PURE (Web Standards): `GET /needs/{id}/conversation`, `?need_id=` y `?conversation_id=`. 404 `need_not_found`, 400 `missing_parameter`, 405, 500 genérico con `logError`. |
| `supabase/functions/conversation/index.ts` | **Nuevo.** Bootstrap Deno de la Edge Function `conversation` con stores PostgREST reales (`ingest_responses` + `needs`). |
| `supabase/functions/_shared/needs-store.ts` | `NeedsStore.findById(id)` en la interfaz + implementaciones in-memory y PostgREST (US-3 necesita resolver el need por id y validar el 404). |
| `tests/unit/conversation-rebuilder.test.ts` | **Nuevo.** 23 tests cubriendo los 13 escenarios Gherkin US-3 + comportamiento HTTP (405/400/500/CORS). |
| `aidlc-docs/validation/dev42-conversation.sh` | **Nuevo.** Batería de evidencia en ejecución contra el stack real. |
| `aidlc-docs/validation/DEV-42-evidence.txt` | **Nuevo.** Volcado completo de la batería en ejecución. |

## Validaciones

### Unitarias (vitest)

- `npm run test` → **369 passed** (22 archivos; +22 tests nuevos de DEV-42).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `src/components/*` (migración Convex→Supabase, fuera de alcance; idénticos a
  los documentados en DEV-35/DEV-41). **0 errores** en `supabase/functions/**`
  ni `tests/**` (verificado con tsc standalone sobre `supabase/functions`).

### En ejecución (Edge Functions con Deno + Supabase local real)

Se sirvieron las Edge Functions con Deno (mismo runtime que Supabase Edge, según
S9) contra el Supabase local de RADAR (API 54341 / DB 54342) con las 4
migraciones del receptor aplicadas:

- `webhook` (siembra de eventos) en `http://127.0.0.1:8000/functions/v1/webhook`.
- `conversation` (endpoint US-3) en `http://127.0.0.1:8001/functions/v1/conversation`.

Batería completa en `aidlc-docs/validation/DEV-42-evidence.txt`:

| # | Escenario US-3 | Resultado |
|---|----------------|-----------|
| 1 | Conversación de un need con mensajes variados (texto, imagen, ubicación, desconocido) + completado → `GET /needs/{id}/conversation` | ✅ `200` — 4 mensajes **ordenados por `received_at` ascendente**; formato uniforme (`event_id`, `sender`, `content`, `type`, `attachments`, `received_at`); el completado NO aparece como mensaje |
| 2 | Datos estructurados del incidente | ✅ — `need.title`, `description`, `contact_whatsapp=573001234567`, `address`, `neighborhood`, `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `conversation_id`, `source_event_id=dev42_comp` |
| 3 | Conversación sin completado (`?conversation_id=…`) | ✅ `200` — `has_need=false`, `need=null`, mensajes disponibles normalizados |
| 4 | Mensaje de texto | ✅ — `type=TEXT`, `content="Necesito agua potable"`, `sender=573001234567`, `attachments=[]` |
| 5 | Mensaje con imagen | ✅ — `type=IMAGE`, `attachments=[{type:image, url:…/foto.jpg, mime:image/jpeg}]` |
| 6 | Mensaje de ubicación | ✅ — `type=LOCATION`, `attachments=[{type:location, latitude:3.4516, longitude:-76.532, address:"Calle 5 #10-20"}]` |
| 7 | Ubicación sin coordenadas | ✅ — adjunto `location` con `address` solamente; el resto de mensajes intactos |
| 8 | `message_type` desconocido | ✅ — `type=UNKNOWN`, no invalida la reconstrucción |
| 9 | Campos faltantes (sin body/from) | ✅ — la fila malformada insertada directamente en `ingest_responses` se normaliza tolerante (`content="Solicitud de ayuda vía WhatsApp"`, `sender=null`); no se pierde (auditoría). El webhook rechaza el evento con 400 en el borde (correcto) |
| 10 | Reenvío del mismo `event.id` | ✅ — `409 duplicate_event`; 1 sola fila en `ingest_responses`; aparece una sola vez en la reconstrucción |
| 11 | Evento de completado | ✅ — no se lista como mensaje; su `event.id` queda en `need.source_event_id` |
| 12 | `need.id` inexistente | ✅ — `404` con `code=need_not_found` y `details.need_id` (incluye id no-UUID `need_999` y UUID bien formado inexistente) |
| 13 | Conversación sin mensajes | ✅ — `messages=[]`, `conversation_id` presente, `has_need=false` (contrato intacto) |

Verificación en BD (SQL directo vía `docker exec`):

- Las filas de `ingest_responses` de `dev42_conv_full` se leen en orden por
  `received_at` (`dev42_m1` → `dev42_m4` → `dev42_comp`).
- `dev42_comp` tiene **1 sola fila** en `ingest_responses` (reenvío no duplicó).
- Datos de prueba con prefijo `dev42%` eliminados al final (stack limpio y
  reproducible): `needs=0`, `ingest_responses=0`.

## Decisiones técnicas

- **Normalización reutiliza S3**: `normalizeMessageRow` usa `mapEventToNeedDraft`
  cuando la fila es válida (misma clasificación canónica de `message_type` y
  extracción de contenido/ubicación). Para filas que no cumplen la validación
  mínima (p. ej. sin body), cae a una normalización **tolerante** (mismo
  `normalizeMessageType` de S3) sin perder la fila.
- **Solo `message.received` se lista como mensaje**: el evento de completado no
  aparece con contenido; su `event.id` queda disponible en `source_event_id`.
- **Adjuntos dentro del `raw_event`**: IMAGE extrae URLs desde
  `data.attachments` (type `image`) o desde el body (URL directa); LOCATION arma
  un adjunto `{type:"location", latitude, longitude, address}` tolerante a la
  ausencia de coordenadas.
- **Nueva Edge Function `conversation`** (no se reutiliza `webhook`): GET de
  lectura para el frontend, separada del POST del webhook. Bootstrap con stores
  PostgREST reales usando `service_role` (BYPASSRLS; el frontend público no
  puede leer `ingest_responses`, ver S1).
- **404 para `need.id` no-UUID**: `needs.id` es columna UUID; un id no-UUID no
  puede existir, por lo que se responde `404 need_not_found` ANTES de consultar
  PostgREST (que rechazaría el valor con 400 "invalid input syntax for type
  uuid").
- **`findById` en `NeedsStore`**: se agregó a la interfaz y a los stores
  in-memory y PostgREST (US-3 necesita resolver el need por id).

## Nota de infraestructura

Como en DEV-34/35/40/41, el CLI `supabase functions serve` falla al arrancar el
edge-runtime en esta máquina. Para la evidencia se sirvieron las funciones con
Deno directamente (mismo runtime que usa Supabase Edge, según S9) contra el
stack local, con el bootstrap `index.ts` versionado de cada función. La función
`conversation` se sirvió en el puerto 8001 (la `webhook` ocupa el 8000) usando
un bootstrap local equivalente (mismo handler y mismos stores).
