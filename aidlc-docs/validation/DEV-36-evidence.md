# Evidencia de validación — DEV-36 (S6: Idempotencia / deduplicación)

Fecha: 2026-08-22
Rama: `agent/DEV-36`
Base: `feature/whatsappbot`

## Resumen

La historia S6 exige que reenvíos del mismo evento no generen duplicados, con
`event.id` como clave de idempotencia. La parte durable ya venía de S4
(UNIQUE(event_id) en S1 + store `INSERT ... ON CONFLICT DO NOTHING`). Esta
historia la consolida y agrega lo que faltaba:

- **`supabase/functions/webhook/handler.ts`**: un **descarte del reenvío en la
  capa de ingestión**. Cuando el store resuelve el evento como `duplicate=true`
  (la UNIQUE(event_id) impidió el insert), el handler responde 200 con la fila
  existente y **NO vuelve a mapear (S3) ni re-ejecuta la creación del incidente
  aguas abajo (S5)**. Refactor de serialización del ACK (`serializeMapping` /
  `serializeIncident`) para no duplicar el cuerpo.
- **`supabase/migrations/20260821200000_s6_idempotencia.sql`** (nuevo): asegura
  de forma idempotente la constraint `ingest_responses_event_id_key
  UNIQUE(event_id)` (DO block sobre `pg_constraint`) y documenta `event_id`
  como clave de idempotencia del contrato. La unicidad es lo que resuelve la
  condición de carrera de reenvíos concurrentes.
- **Tests**:
  - `tests/unit/idempotency.test.ts` (nuevo): cubre los **8 escenarios Gherkin
    S6** a nivel HTTP + store PostgREST con fetch falso.
  - `tests/unit/idempotency-migration.test.ts` (nuevo): verifica la migración
    S6 (constraint idempotente + documentación).
  - `tests/unit/webhook-incident-endpoint.test.ts`: el reenvío del completado
    ahora se descarta en ingestión (S6) y NO re-crea el incidente (antes
    devolvía `incident.outcome=duplicate`).
  - `tests/unit/webhook-endpoint.test.ts` y `tests/unit/ingest-persistence.test.ts`:
    sin cambios (los escenarios S4/S6 que ya cubrían siguen en verde).

## Validaciones

### Unitarias (vitest)

- `npm run test` → **290 passed** (19 archivos). `tests/unit/idempotency.test.ts`
  aporta los 8 escenarios Gherkin de S6 y `tests/unit/idempotency-migration.test.ts`
  verifica la migración. Subtotal de archivos tocados por DEV-36: **53 tests**.
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `feature/whatsappbot` (componentes de la migración Convex→Supabase fuera del
  alcance, igual que en DEV-34/DEV-35). Ninguno de los archivos de DEV-36 está
  en el `include` de `tsc` (`tsconfig.json` → `src/`). Verificado con un `tsc`
  standalone sobre `supabase/functions/**` y los tests de esta historia:
  **0 errores**.

### En ejecución (bootstrap Node + PostgREST local + Postgres 17)

Se aplicó la migración S6 al stack local (`supabase migration up --local`) y se
verificó la constraint:
`SELECT conname FROM pg_constraint WHERE conname='ingest_responses_event_id_key'`
→ `ingest_responses_event_id_key|u` y el `COMMENT ON COLUMN` quedó documentado.

Se sirvió la Edge Function `webhook` con un bootstrap mínimo NO versionado
(Node + `--experimental-strip-types`, mismo handler PURE, stores PostgREST
reales contra `127.0.0.1:54341`) en `http://127.0.0.1:8081`, replicando el
bootstrap de la plataforma (mismo enfoque que DEV-34/DEV-35). Se ejecutó la
batería de `aidlc-docs/validation/dev36-webhook-idempotency.sh` (volcado
completo en `aidlc-docs/validation/DEV-36-evidence.txt`):

| # | Escenario S6 | Resultado |
|---|--------------|-----------|
| 1 | Primer evento `evt_s6_001` (id nuevo) se persiste una sola vez | ✅ `200` — `persisted=true`, `duplicate=false`, `record.event_id=evt_s6_001`, `processing_status=RECEIVED`; `count(ingest_responses WHERE event_id='evt_s6_001')=1` |
| 2 | Reenvío del mismo `event.id` (`evt_s6_001`) no crea duplicados | ✅ `200` — `persisted=false`, `duplicate=true`, mismo `record.id`; `count=1` |
| 3 | Mismo `event.id` con `body` distinto no duplica ni sobreescribe | ✅ `200` — `duplicate=true`; la fila conserva `body`/`raw_event` ORIGINALES y sus timestamps; `count=1` |
| 4 | Reenvíos concurrentes del mismo `event.id` (`evt_s6_004`) | ✅ dos POST simultáneos → uno `persisted=true`, el otro `duplicate=true`; `count(ingest_responses WHERE event_id='evt_s6_004')=1`. La UNIQUE(event_id) resuelve la carrera |
| 5 | Evento sin id → 400 detallando el campo, sin persistir | ✅ `400` — `validation_failed` con `issues[{"path":["id"],...}]`; `count=0` (no se invocó dedup) |
| 6 | Eventos distintos con event.id diferente (mismo contenido y conversation_id) | ✅ ambos `200` `persisted=true`; `count(conv_s6_shared)=2` (una fila por event.id) |
| 7 | Reenvío tras intento fallido de validación (`evt_s6_008`) | ✅ el intento fallido → `400` sin fila; el reenvío corregido con el mismo id → `200` `persisted=true`, fila `evt_s6_008` creada |
| 8 | Reenvío del completado `evt_s6_009` protege el pipeline | ✅ primer completado crea el incidente (`outcome=created`); el reenvío se descarta en ingestión (`duplicate=true`, sin bloque `incident` en la respuesta); `count(needs WHERE conv_s6_pipe)=1` y `count(ingest WHERE evt_s6_009)=1` |

## Decisiones técnicas

- **Descarte del reenvío en la capa de ingestión (S6 #8)**: antes, un reenvío
  del evento de completado volvía a recorrer el pipeline y el servicio de
  incidentes respondía `outcome=duplicate` (sin re-crear, pero con trabajo
  redundante). Ahora el handler corta antes de mapear/crear el incidente:
  `persistence?.duplicate → 200` con la fila existente. Es la materialización
  literal del escenario "el reenvío se descarta en la capa de ingestión".
- **Unicidad durable por `event.id`**: la constraint UNIQUE(event_id) (S1) es la
  garantía real; la migración S6 la asegura de forma idempotente (DO block) por
  si el esquema se recrea sin ella. El store real (`INSERT ... ON CONFLICT
  DO NOTHING` + GET de la fila existente, S4) la usa; el store en memoria la
  replica con un Map.
- **`event.id` tiene prioridad sobre el contenido**: un reenvío con body
  distinto devuelve la fila original sin modificarla (raw_event, body y
  timestamps intactos).
- **Validación de `id` antes de dedup**: un evento sin `id` (o con id vacío) es
  rechazado por `validateWebhookEvent` (S2) con 400 `validation_failed`
  detallando `["id"]`. La validación ocurre ANTES de la persistencia, por lo que
  no se persiste nada y no se invoca la deduplicación (escenario S6 #5).
- **Módulos PURE sin dependencias (NFR-4)**: la lógica S6 sigue en `_shared/` +
  `handler.ts` (Web Standards), testeable con vitest/Node y ejecutable en la
  Edge Runtime de Supabase.
- **Fuera del alcance**: la deduplicación del incidente al completar la
  conversación ya se cubre en S5 (índices únicos parciales sobre
  `needs(source_event_id)` / `needs(conversation_id)`); S6 protege la
  persistencia del evento crudo en `ingest_responses`. La autenticación del
  webhook es deuda de seguridad (S8).

## Nota de infraestructura

Como en DEV-34/DEV-35, el CLI `supabase functions serve webhook` de esta
máquina falla al arrancar el edge-runtime (`failed to determine entrypoint`).
Para la evidencia se sirvió la función con un bootstrap mínimo en Node (mismo
handler PURE, stores PostgREST reales contra el stack local `127.0.0.1:54341` y
geocoder Nominatim real). El bootstrap (`/tmp/dev36-bootstrap.ts`) es solo para
la evidencia local y no se versiona en la rama.
