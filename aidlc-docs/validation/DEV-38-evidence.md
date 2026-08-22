# Evidencia de validación — DEV-38 (S8: Documentación del contrato de integración)

Fecha: 2026-08-22
Rama: `agent/DEV-38`
Base: `feature/whatsappbot`

## Resumen

La historia S8 documenta el contrato de integración para alinear a ambos
equipos (conversación → receptor). El entregable principal es el documento
`documentacion/Contrato-de-Integracion.md`, ubicado en el **lugar compartido del
proyecto** (wiki versionada en git) y enlazado en el sidebar
(`documentacion/_Sidebar.md`).

El documento cubre, para cada escenario Gherkin de S8:

- **Esquema de los eventos crudos** con todos los campos (`event.id`, `type`,
  `data.conversation_id`, `data.from`, `data.body`, `data.message_type`,
  `data.workflow.step`) e indicación de que el transporte es un **POST HTTP con
  JSON** al endpoint del receptor.
- **Evento de completado** (otro `type` distinto de `message.received`) y la
  explicación de que dispara la creación del incidente en `needs`.
- **Ejemplos de payloads**: al menos un ejemplo válido por cada tipo de evento
  soportado (`message.received` y completado).
- **Tabla de códigos de error** (400/409/500) con significado, cuándo aplica y
  la acción esperada del remitente.
- **Validación de campos faltantes** → `400` con el error estructurado
  indicando el campo (`event.id` / `type` / `data.conversation_id` /
  `data.body`).
- **Comportamiento ante reenvíos** → idempotencia por `event.id`, sin
  duplicados, con `409` `duplicate_event` como respuesta esperada.
- **Enriquecimiento de ubicación** → geocoding + detección de ciudad cuando
  faltan coordenadas; la falta de coordenadas **no bloquea el ACK** (200).
- **Autenticación abierta** declarada como **deuda de seguridad** pendiente de
  resolver con API key/HMAC.
- **Disponibilidad y versionado** del documento en el lugar compartido.

## Cambios

- `documentacion/Contrato-de-Integracion.md` (nuevo): documento canónico del
  contrato (S8).
- `documentacion/_Sidebar.md`: enlaza el nuevo documento en la sección Backend.
- `supabase/functions/_shared/webhook-event.ts`: el receptor ahora acepta
  `data.conversation_id` (shape documentado) además de `conversation_id` plano,
  con la misma convención que ya usaba para `body` (plano preferido, fallback a
  `data.*`). Se exporta `resolveConversationId`.
- `supabase/functions/_shared/ingest-persistence.ts`,
  `supabase/functions/_shared/incident-builder.ts`,
  `supabase/functions/_shared/completion-service.ts`,
  `supabase/functions/webhook/handler.ts`: usan `resolveConversationId` para
  persistir/agrupar/crear el incidente por el conversation_id resuelto.
- `supabase/functions/webhook/README.md`: documenta el shape
  `data.conversation_id`, alinea la tabla de códigos de error S5 con el contrato
  S7 (`code`, reenvío 409) y enlaza el contrato S8.
- `tests/unit/webhook-endpoint.test.ts`,
  `tests/unit/webhook-incident-endpoint.test.ts`: cubren el shape
  `data.conversation_id` (validación, persistencia y flujo de completado).
- `aidlc-docs/validation/dev38-contract-doc.sh` + `DEV-38-evidence.md`:
  batería reproducible + volcado de la evidencia en ejecución.

## Validaciones

### Unitarias (vitest)

- `npm run test` → **316 passed** (20 archivos). Se añadieron tests para el
  shape `data.conversation_id` (validación pura, persistencia HTTP y flujo de
  completado con incidente).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `feature/whatsappbot` (componentes de la migración Convex→Supabase fuera del
  alcance, mismo conteo que DEV-33/34/35/36/37). Ninguno de los archivos de
  DEV-38 está en el `include` de `tsc` (`tsconfig.json` → `src/`). Verificado
  con `tsc` standalone sobre `supabase/functions/**` (excl. `index.ts` que
  requiere tipos Deno) y los tests de esta historia: **0 errores**.

### En ejecución (bootstrap Node + PostgREST local + Postgres 17)

Se sirvió la Edge Function `webhook` con un bootstrap mínimo NO versionado
(Node + `--experimental-strip-types`, mismo handler PURE, stores PostgREST
reales contra el stack local `127.0.0.1:54341`) en `http://127.0.0.1:8081`,
replicando el enfoque de DEV-34/35/36/37. Se ejecutó la batería de
`aidlc-docs/validation/dev38-contract-doc.sh` (volcado en `DEV-38-evidence.txt`):

| # | Escenario S8 | Resultado |
|---|--------------|-----------|
| 1 | Evento crudo `message.received` con `data.conversation_id` (shape documentado) | ✅ `200` — ACK `ok=true`, `event_id=evt_s8_001`, `persisted=true`; fila en `ingest_responses` con `conversation_id=conv_s8_001` |
| 2a | Sin `event.id` → 400 indicando el campo | ✅ `400` — `code=validation_failed`, `issues[["id"]]` |
| 2b | Sin `type` → 400 indicando el campo | ✅ `400` — `issues[["type"]]` |
| 2c | Sin `data.conversation_id` → 400 indicando el campo | ✅ `400` — `issues[["conversation_id"]]` |
| 2d | Sin `data.body` → 400 indicando el campo | ✅ `400` — `issues[["body"]]` |
| 3a/3b | Reenvío del mismo `event.id` | ✅ primero `200`; reenvío `409` `code=duplicate_event` con `details.record` = fila existente; `count(ingest WHERE evt_s8_dup)=1` (sin duplicado) |
| 4a/4b | Completado sin coordenadas | ✅ `200` ACK con `incident.outcome=created`; incidente creado con `latitude/longitude=null`, `location_enrichment_status=PENDING` (el geocoding no bloquea el ACK) |
| 5 | Documento del contrato en el lugar compartido | ✅ `documentacion/Contrato-de-Integracion.md` existe con versión y nota de autenticación |

## Decisiones técnicas

- **Shape documentado `data.conversation_id`**: el escenario Gherkin S8 pide el
  esquema con `data.conversation_id`. El receptor ya aceptaba `conversation_id`
  plano (igual que acepta `body` plano). Para que el documento sea fiel al
  comportamiento, se extendió el receptor de forma **aditiva** y con la misma
  convención de `body`: se prefiere el plano y se cae a `data.conversation_id`.
  Esto es retrocompatible (los eventos planos existentes siguen funcionando) y
  alinea el código con el contrato documentado.
- **Ruta `["conversation_id"]` en los issues**: aunque el campo ahora pueda
  venir en `data.conversation_id`, el `path` del error se mantiene como
  `["conversation_id"]` (consistente con el contrato y con los tests S7).
- **El documento como fuente de verdad**: el contrato canónico vive en
  `documentacion/` (wiki versionada); el README del endpoint queda como
  referencia operativa y enlaza al contrato. Se corrigieron en el README dos
  referencias desactualizadas del contrato de errores S5 (`error` → `code` y
  reenvío `200` → `409`).
- **Autenticación**: se documenta la **deuda de seguridad** de forma explícita
  (endpoint abierto hoy; migración planificada a API key/HMAC como cambio
  aditivo, sin romper el formato de eventos del contrato).
- **Fuera del alcance**: no se tocan migraciones (el soporte de
  `data.conversation_id` no requiere DDL nuevo; la agrupación usa el valor
  resuelto por el código).

## Nota de infraestructura

Como en DEV-34/35/36/37, el CLI `supabase functions serve webhook` de esta
máquina falla al arrancar el edge-runtime (`failed to determine entrypoint`).
Para la evidencia se sirvió la función con un bootstrap mínimo en Node (mismo
handler PURE, stores PostgREST reales contra el stack local `127.0.0.1:54341`).
El bootstrap (`/tmp/dev38-bootstrap.ts`) es solo para la evidencia local y no se
versiona en la rama.
