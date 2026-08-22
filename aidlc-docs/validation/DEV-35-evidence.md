# Evidencia de validación — DEV-35 (S5: Creación del incidente al completar la conversación)

Fecha: 2026-08-21/22
Rama: `agent/DEV-35`
Base: `feature/whatsappbot`

## Resumen

Se implementó la creación del incidente en `needs` cuando llega el **evento de
completado** de una conversación de WhatsApp:

- **`supabase/functions/_shared/incident-builder.ts`** (nuevo): lógica PURE de
  armado del incidente. Detecta el evento de completado (`conversation_completed`
  / `conversation.completed` / `workflow.step=COMPLETED`), valida el remitente
  (`data.from` E.164), y construye el registro con los mensajes acumulados de la
  conversación + defaults del contrato.
- **`supabase/functions/_shared/needs-store.ts`** (nuevo): persistencia del
  incidente en `needs`. Store in-memory (tests) y PostgREST (real) con
  idempotencia por `source_event_id` y `conversation_id`.
- **`supabase/functions/_shared/geocoding.ts`** (nuevo): geocoding Nominatim
  (gratuito, sin API key) + detección de ciudad por radio (ciudades del Valle del
  Cauca). PURE y con fetch inyectable para tests.
- **`supabase/functions/_shared/completion-service.ts`** (nuevo): orquesta la
  creación del incidente al completar: validación del remitente → idempotencia →
  verificación de mensajes acumulados → construcción → enriquecimiento de
  ubicación (geocoding + ciudad) → persistencia.
- **`supabase/functions/webhook/handler.ts`**: al recibir un evento de completado
  con `incidentService` inyectado, acumula los mensajes de la conversación desde
  `ingest_responses` y dispara el servicio. El ACK incluye `incident` con
  `outcome` (`created`/`duplicate`).
- **`supabase/functions/webhook/index.ts`**: bootstrap inyecta el store de
  `needs` y el geocoder Nominatim.
- **`supabase/migrations/20260821180000_s5_incident_webhook_columns.sql`**
  (nuevo): agrega a `needs` las columnas `source_event_id`, `conversation_id` y
  `location_enrichment_status`, con índices únicos parciales para idempotencia.
- Tests: `tests/unit/incident-builder.test.ts`, `tests/unit/needs-store.test.ts`,
  `tests/unit/completion-service.test.ts`, `tests/unit/webhook-incident-endpoint.test.ts`,
  `tests/unit/incident-migration.test.ts`.

## Validaciones

### Unitarias (vitest)

- `npm run test` → **276 passed** (17 archivos). Los archivos nuevos de DEV-35
  aportan 52 tests.
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `feature/whatsappbot` (componentes de la migración Convex→Supabase fuera del
  alcance). Ninguno de los archivos de DEV-35 está en el `include` de `tsc`
  (`tsconfig.json` → `src/`). Verificado con un `tsc` standalone sobre
  `supabase/functions/**` (los 7 módulos S5 + handler): **0 errores**.

### En ejecución (bootstrap Node + PostgREST local + Postgres 17)

Se aplicó la migración S5 al stack local (`needs.source_event_id`,
`conversation_id`, `location_enrichment_status` + índices únicos). Se sirvió la
Edge Function `webhook` con un bootstrap mínimo NO versionado (Node + tsx, mismo
handler PURE, stores PostgREST reales y geocoder Nominatim real) en
`http://127.0.0.1:8081`, replicando el bootstrap de la plataforma. Se ejecutó la
batería de 9 escenarios de `aidlc-docs/validation/dev35-webhook-incident.sh`
(volcado completo en `aidlc-docs/validation/DEV-35-evidence.txt`):

| # | Escenario S5 | Resultado |
|---|--------------|-----------|
| 1 | Conversación `conv_s5_a` acumula 2 `message.received`; el completado crea el incidente | ✅ `200` — `incident.outcome=created`, `source=WhatsApp`, `contact_whatsapp=573001234567`, `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `emergency_id=terremoto-cali-2026`, descripción = mensajes acumulados; fila en `needs` |
| 2 | Completado con coordenadas (`conv_s5_b`) | ✅ `200` — `latitude=3.4516`, `longitude=-76.532`, `city_id=cali`, `location_enrichment_status=RESOLVED`; **sin geocoding** |
| 3 | Sin coordenadas + `address/neighborhood` (`conv_s5_c`) | ✅ `200` — geocoding real (Nominatim) resolvió `3.4250619/-76.5463238`; `city_id=cali`, `RESOLVED` |
| 4 | Sin coordenadas ni dirección (`conv_s5_d`) | ✅ `200` — incidente creado igual con `latitude/longitude=NULL`, `location_enrichment_status=PENDING`; el flujo **no rechaza** el completado |
| 5 | Reenvío del mismo `event.id` de completado (`evt_s5_c1`) | ✅ `200` — `incident.outcome=duplicate`, mismo incidente; `count(needs WHERE conv_s5_a)=1` |
| 6 | Completado sin `conversation_id` | ✅ `400` — `validation_failed` con `issues[conversation_id]`; sin fila en `needs` |
| 7 | Completado sin mensajes acumulados previos (`conv_999`) | ✅ `409` — `no_messages`; sin fila en `needs` |
| 8 | Completado con `from` inválido (`conv_s5_h`) | ✅ `400` — `invalid_from`; sin fila en `needs`; el evento quedó en `ingest_responses` (auditoría) con `RECEIVED` |
| 9 | Conversaciones distintas (`conv_s5_e` / `conv_s5_f`) | ✅ — el incidente de `conv_s5_e` solo tiene mensajes de E; `conv_s5_f` permanece sin incidente |

## Decisiones técnicas

- **Módulos PURE y sin dependencias** (NFR-4): toda la lógica S5 está en
  `_shared/` (Web Standards + fetch inyectable), testeable con vitest/Node y
  ejecutable en la Edge Runtime de Supabase.
- **Detección del evento de completado tolerante al schema pendiente**: el schema
  exacto del evento de completado está pendiente de confirmación (dependencia
  DEV-35). Se soportan los `type` conocidos (`conversation_completed`,
  `conversation.completed`) y la señal `workflow.step=COMPLETED`. Cuando el
  equipo de conversación confirme el nombre exacto, solo hay que agregarlo al set
  `COMPLETION_EVENT_TYPES`.
- **Acumulación por `conversation_id`**: los mensajes se acumulan desde
  `ingest_responses` (cada `message.received` ya persiste su `raw_event` en S4);
  el completado lee las filas de la conversación y arma el incidente. No se
  mezclan conversaciones.
- **Idempotencia durable por `event.id`**: `needs.source_event_id` con índice
  único parcial + `conversation_id` con índice único parcial (migración S5). Un
  reenvío del mismo completado devuelve la fila existente (`outcome=duplicate`).
- **Geocoding no bloqueante**: si faltan coordenadas y hay dirección, se invoca
  el geocoder (Nominatim); si no resuelve o no hay geocoder, el incidente se crea
  igual con lat/lng NULL y `location_enrichment_status=PENDING`. El flujo nunca
  rechaza el completado por falta de geocoding.
- **`city_id` por coordenadas**: se resuelve por cercanía al centro de las
  ciudades del Valle del Cauca (misma lógica que `src/data/valleCities.ts`),
  con fallback `cali` (emergencia regional "terremoto-cali-2026").
- **`contact_whatsapp` desde `data.from`**: del evento de completado, o del
  primer mensaje acumulado que lo traiga.
- **Validaciones de negocio**: `conversation_id` vacío → 400; sin mensajes
  acumulados → 409; `from` inválido → 400 (el evento crudo ya quedó registrado en
  `ingest_responses` para auditoría). La autenticación del webhook sigue abierta
  (deuda S8).

## Nota de infraestructura

Como en DEV-34, el CLI `supabase functions serve webhook` de esta máquina falla al
arrancar el edge-runtime (`failed to determine entrypoint`). Para la evidencia se
sirvió la función con un bootstrap mínimo en Node (mismo handler PURE, stores
PostgREST reales contra el stack local `127.0.0.1:54341` y geocoder Nominatim
real). El bootstrap es solo para la evidencia local y no se versiona en la rama.
