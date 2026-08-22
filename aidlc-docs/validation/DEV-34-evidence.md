# Evidencia de validación — DEV-34 (S4: Persistencia del evento crudo)

Fecha: 2026-08-21/22
Rama: `agent/DEV-34`
Base: `feature/whatsappbot`

## Resumen

Se implementó la persistencia del evento crudo en `ingest_responses`:

- **`supabase/functions/_shared/ingest-persistence.ts`** (nuevo): módulo PURE sin
  dependencias (solo Web Standards) que construye la fila de auditoría
  (`raw_event` intacto + metadatos + `processing_status=RECEIVED` + timestamps),
  extrae metadatos (`event_id`, `type`, `conversation_id`, `from`,
  `message_type` canónico, `workflow_step` canónico) y provee dos stores:
  - `createInMemoryIngestResponsesStore` (tests / demo).
  - `createPostgrestIngestResponsesStore` (real, `INSERT ... ON CONFLICT
    (event_id) DO NOTHING` + GET de la fila existente en reenvíos).
- **`supabase/functions/webhook/handler.ts`**: acepta `deps.ingestStore` e
  integra la persistencia tras la validación/mapeo. El ACK 200 ahora incluye
  `persisted`, `duplicate` y `record`. Error de persistencia → 500
  `persistence_failed`.
- **`supabase/functions/webhook/index.ts`**: bootstrap real inyecta el store
  PostgREST con `SUPABASE_SERVICE_ROLE_KEY` (BYPASSRLS).
- **`supabase/migrations/20260821170000_s4_ingest_raw_event.sql`** (nuevo):
  agrega `ingest_responses.raw_event JSONB` (columna canónica del contrato S4)
  de forma idempotente + GRANTs de tabla (replican los default privileges de
  Supabase; RLS sigue bloqueando a anon/authenticated).
- Tests: `tests/unit/ingest-persistence.test.ts` (puro) y
  `tests/unit/ingest-migration.test.ts` (DDL S4) + casos HTTP de persistencia en
  `tests/unit/webhook-endpoint.test.ts`.

## Validaciones

### Unitarias (vitest)

- `npm run test` → **222 passed** (12 archivos). El archivo
  `tests/unit/ingest-persistence.test.ts` aporta los escenarios de persistencia
  y `tests/unit/webhook-endpoint.test.ts` suma 7 casos HTTP de S4.
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `feature/whatsappbot` (componentes de la migración Convex→Supabase fuera del
  alcance). Ninguno de los archivos de DEV-34 está en el `include` de `tsc`
  (`tsconfig.json` → `src/`). Verificado con `tsc` standalone sobre
  `supabase/functions/**` y `tests/**`: **0 errores** en los archivos de esta
  historia.

### En ejecución (Edge Function local + Postgres 17)

Se levantó el stack Supabase local y se aplicó la migración S4
(`raw_event` + grants). Se sirvió la Edge Function `webhook` localmente y se
ejecutó la batería de 8 escenarios de `aidlc-docs/validation/dev34-webhook-persist.sh`
(volcado completo en `aidlc-docs/validation/DEV-34-evidence.txt`):

| # | Escenario S4 | Resultado |
|---|--------------|-----------|
| 1 | Evento válido (`message.received`) con `id`, `type`, `data` completos → fila en `ingest_responses` | ✅ `200` — `persisted=true`, `processing_status=RECEIVED`, `record.event_id=evt_001`; en DB: `raw_event` = JSON completo intacto; metadatos copiados a `event_id/type/conversation_id/from/message_type/workflow_step`; `received_at`/`created_at` registrados |
| 2 | Reenvío con el mismo `event.id` → no crea fila duplicada y devuelve la existente | ✅ `200` — `persisted=false`, `duplicate=true`, mismo `record.id`; `SELECT count(*) WHERE event_id='evt_001'` → **1** |
| 3 | Reenvío con el mismo `id` pero `body` distinto → no modifica la fila original | ✅ `200` — `duplicate=true`; la fila conserva `body` y `raw_event` ORIGINALES y sus timestamps |
| 4 | Evento sin campos obligatorios → 400 con campos faltantes, sin persistir | ✅ `400` — `validation_failed` con `issues` para `conversation_id` y `body`; `SELECT count(*) WHERE event_id='evt_004'` → **0** |
| 5 | Evento sin coordenadas → se persiste tal cual, geocoding pendiente | ✅ `200` — `persisted=true`, `processing_status=RECEIVED`; `mapping.location_pending_geocoding=true` (S5) |
| 6 | Eventos distintos de la misma `conversation_id` → filas separadas (idempotencia por `event.id`) | ✅ `200` en ambos; `SELECT ... WHERE conversation_id='conv_002'` → **2 filas** (`evt_conv_a`, `evt_conv_b`) |

Nota de infraestructura: el CLI `supabase functions serve` de esta máquina
intenta usar la imagen `edge-runtime:v1.68.4`, que en este entorno falla al
arrancar (`failed to determine entrypoint` / `Is a directory`). Para la
evidencia se sirvió la función con la misma imagen `edge-runtime:v1.74.3` que
usó DEV-33 (ya descargada), mediante un bootstrap mínimo que replica el de la
CLI (`verifyJWT=false`; la función webhook no autentica, deuda S8). El endpoint
quedó en `http://127.0.0.1:8081/webhook`. Este bootstrap es solo para la
evidencia local y no se versiona en la rama.

## Decisiones técnicas

- **`raw_event` como columna canónica del contrato S4**: guarda el JSON completo
  del evento sin modificar. `raw_payload` (S1) se conserva como alias de
  compatibilidad y se puebla con el mismo valor.
- **Idempotencia durable por `event.id`**: la tabla tiene `UNIQUE (event_id)`
  (S1). El store real hace `INSERT ... ON CONFLICT (event_id) DO NOTHING`
  (`Prefer: resolution=ignore-duplicates`) y, si el insert no afecta filas,
  hace un `GET` por `event_id` y devuelve la fila existente **sin modificarla**.
  Esto cubre S4 y deja confirmada la parte durable de S6.
- **`processing_status=RECEIVED`**: al persistir, el estado queda en `RECEIVED`
  (distinto del default `PENDING` de la migración S1). El flujo de
  procesamiento (S5+) actualizará a `PROCESSED`/`FAILED` cuando corresponda.
- **GRANTs de tabla en la migración S4**: en un proyecto Supabase los default
  privileges otorgan SELECT/INSERT a `service_role`/`anon`/`authenticated` al
  crear tablas vía migraciones del CLI. Como la migración S1 se aplicó aquí con
  SQL directo, la persistencia fallaba con 403 (`permission denied for table
  ingest_responses`). La migración S4 agrega los GRANTs (idempotentes); el RLS
  sin políticas (S1) sigue bloqueando a `anon`/`authenticated` a nivel de fila.
- **`handler.ts` PURE con inyección de store**: el handler sigue sin depender de
  Deno ni npm. `index.ts` (bootstrap) crea el store PostgREST con la
  `SUPABASE_SERVICE_ROLE_KEY`; los tests inyectan el store en memoria.
- **Error de persistencia → 500 estructurado**: `persistence_failed` con
  `details.cause`, para que el remitente distinga un fallo transitorio del
  servidor de un 400 de validación.
