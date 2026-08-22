# Evidencia de validación — DEV-37 (S7: Confirmación al remitente / ACK)

Fecha: 2026-08-22
Rama: `agent/DEV-37`
Base: `feature/whatsappbot`

## Resumen

La historia S7 define el contrato de confirmación de cada evento al remitente.
Sobre la base ya implementada (S2 validación, S3 mapeo, S4 persistencia, S5
incidente, S6 deduplicación) esta historia agrega:

- **ACK 200 por evento recibido**: el ACK devuelve el `event.id` y el `type`.
- **Errores → códigos y mensajes estructurados**: se unifica el contrato de
  error con `code` + `message` (antes `error`) en todos los códigos del
  endpoint (400/405/409/415/500).
- **Reenvío del mismo `event.id` → `409 Conflict`** (`duplicate_event`): el
  contrato S7 exige señalarlo como error estructurado (antes S6 respondía 200
  con `duplicate=true`). El 409 incluye la fila existente en `details.record`,
  NO crea un duplicado en `ingest_responses` y NO re-ejecuta el pipeline aguas
  abajo (S3 mapeo / S5 incidente).
- **500 interno genérico**: los errores internos de persistencia / creación del
  incidente ya no exponen `details.cause` (detalle interno). La causa real se
  registra server-side vía un `logError` inyectable (bootstrap → `console.error`).
- **Completado sin coordenadas → 200 OK**: el ACK confirma la recepción aunque
  falten coordenadas; el enriquecimiento por geocoding queda como paso
  posterior (`location_enrichment_status=PENDING`) y no bloquea el ACK.

## Cambios

- `supabase/functions/webhook/handler.ts`: renombra `error` → `code` en todos
  los errores; el reenvío (S6 duplicate) pasa de 200 a **409** `duplicate_event`
  con la fila existente en `details.record`; los 500 dejan de exponer la causa
  y delegan el detalle a `deps.logError` (nueva dependencia opcional).
- `supabase/functions/webhook/index.ts`: inyecta `logError` (console.error) en
  el bootstrap real.
- `supabase/functions/webhook/README.md`: documenta la sección ACK (S7) y la
  tabla de respuestas con `code`.
- `tests/unit/ack-confirmation.test.ts` (nuevo): cubre los **7 escenarios
  Gherkin S7** a nivel HTTP + validación pura.
- `tests/unit/webhook-endpoint.test.ts`, `tests/unit/idempotency.test.ts`,
  `tests/unit/webhook-incident-endpoint.test.ts`: actualizados al contrato S7
  (409 en reenvíos, `code` en errores, 500 sin `cause`).
- `aidlc-docs/validation/dev37-webhook-ack.sh` + `DEV-37-evidence.txt`:
  batería reproducible + volcado de la evidencia en ejecución.

## Validaciones

### Unitarias (vitest)

- `npm run test` → **310 passed** (20 archivos). El archivo
  `tests/unit/ack-confirmation.test.ts` aporta los 7 escenarios Gherkin de S7.
  Subtotal de archivos tocados por DEV-37: **25 tests** en el archivo nuevo +
  los actualizados en S4/S5/S6.
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `feature/whatsappbot` (componentes de la migración Convex→Supabase fuera del
  alcance, mismo conteo que DEV-33/34/35/36). Ninguno de los archivos de DEV-37
  está en el `include` de `tsc` (`tsconfig.json` → `src/`). Verificado con `tsc`
  standalone sobre `supabase/functions/**` (excl. `index.ts` que requiere tipos
  Deno) y los tests de esta historia: **0 errores**.

### En ejecución (bootstrap Node + PostgREST local + Postgres 17)

Se sirvió la Edge Function `webhook` con un bootstrap mínimo NO versionado
(Node + `--experimental-strip-types`, mismo handler PURE, stores PostgREST
reales contra el stack local `127.0.0.1:54341`) en `http://127.0.0.1:8081`,
replicando el enfoque de DEV-34/35/36. Se ejecutó la batería de
`aidlc-docs/validation/dev37-webhook-ack.sh` (volcado completo en
`aidlc-docs/validation/DEV-37-evidence.txt`):

| # | Escenario S7 | Resultado |
|---|--------------|-----------|
| 1 | Evento válido se confirma con 200 y el ACK devuelve el `event.id` | ✅ `200` — `ok=true`, `status=accepted`, `event_id=evt_s7_001`; fila en `ingest_responses` (`RECEIVED`) |
| 2 | Body que no es JSON válido devuelve 400 | ✅ `400` — `code=invalid_json`, `message`, `details.issues` |
| 3 | Evento con un campo requerido faltante devuelve 400 e indica el campo | ✅ `400` — `code=validation_failed`; sin `id` → `issues[["id"]]`; sin `conversation_id` → `issues[["conversation_id"]]` |
| 4 | Evento con tipo de dato inválido devuelve 400 y detalla la causa | ✅ `400` — `type=42` → `issues[["type"]]` con `message` |
| 5 | Reenvío del mismo `event.id` devuelve 409 sin duplicado | ✅ primero `200 persisted=true`; reenvío `409` `code=duplicate_event` con `details.record` = fila existente; `count(ingest WHERE evt-123)=1` |
| 6 | Fallo interno de persistencia devuelve 500 genérico | ✅ `500` — body = `{"code":"persistence_failed","message":"Error interno..."}` SIN `cause`; la causa real (`password authentication failed`) aparece SOLO en el log server-side vía `logError` |
| 7 | Completado sin coordenadas se confirma con 200 | ✅ `200` — ACK devuelve `event_id=evt_s7_c1`; incidente creado con `latitude/longitude=null`, `location_enrichment_status=PENDING` (el geocoding queda como paso posterior, no bloquea el ACK) |

## Decisiones técnicas

- **`error` → `code` en el contrato de errores**: S7 pide "códigos y mensajes
  estructurados". Se usó `code` como nombre canónico del código (semántica
  idéntica al `error` anterior), manteniendo `message` y `details` para el
  contexto. Todos los errores del endpoint (400/405/409/415/500) quedan
  alineados. Los tests existentes se actualizaron al nuevo nombre.
- **Reenvío 409 (no 200)**: S6 respondía 200 con `duplicate=true`. El escenario
  Gherkin S7 "Reenvío del mismo event.id devuelve 409" exige 409 Conflict. La
  idempotencia durable (UNIQUE(event_id) + `ON CONFLICT DO NOTHING`) no cambia:
  el 409 es la confirmación al remitente de que el evento ya fue recibido. Se
  mantiene la fila existente en `details.record` para trazabilidad y se corta
  el pipeline aguas abajo (no se re-mapea ni se re-crea el incidente).
- **500 genérico sin detalles internos**: antes `persistence_failed` /
  `incident_creation_failed` exponían `details.cause` (mensaje interno del
  error, p. ej. credenciales de BD). S7 pide un error genérico que no exponga
  detalles internos. El `code` y `message` se mantienen (para que el remitente
  distinga un 400 de un 500), pero el `cause` real se registra server-side con
  `deps.logError` (bootstrap → `console.error`). Esto cumple NFR-3 (errores con
  códigos claros) y la regla de no filtrar internals.
- **Completado sin coordenadas → 200**: el flujo S5 ya creaba el incidente con
  lat/lng NULL y `PENDING`; S7 lo confirma explícitamente: el ACK no depende del
  geocoding. El enriquecimiento sigue siendo un paso posterior (S5) y no
  bloquea la confirmación.
- **Módulos PURE sin dependencias (NFR-4)**: la lógica S7 sigue en `_shared/` +
  `handler.ts` (Web Standards); `logError` es una dependencia opcional inyectada
  (también testeable/espiable en vitest).
- **Fuera del alcance**: la autenticación del webhook sigue abierta (deuda S8);
  no se tocan migraciones (el 409 no requiere DDL nuevo: la idempotencia ya
  existía).

## Nota de infraestructura

Como en DEV-34/35/36, el CLI `supabase functions serve webhook` de esta máquina
falla al arrancar el edge-runtime (`failed to determine entrypoint`). Para la
evidencia se sirvió la función con un bootstrap mínimo en Node (mismo handler
PURE, stores PostgREST reales contra el stack local `127.0.0.1:54341`). El
bootstrap (`/tmp/dev37-bootstrap.ts`) es solo para la evidencia local y no se
versiona en la rama.
