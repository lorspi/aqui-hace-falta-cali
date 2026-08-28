# Evidencia de validación — DEV-41 (S5: Creación del incidente al completar la conversación)

Fecha: 2026-08-24
Rama: `agent/DEV-41`
Base: `feature/whatsappbot`

## Contexto

La historia S5 fue **groomed** en `groom/DEV-41` (texto actualizado en
`aidlc-docs/inception/user-stories/stories.md`). El ticket DEV-41 cubre la
**implementación** de esos criterios actualizados sobre el código ya existente
de DEV-35/DEV-40.

La lógica central de S5 ya existía en `feature/whatsappbot` (módulos `_shared/`
de DEV-35: `incident-builder`, `completion-service`, `needs-store`, `geocoding`;
orquestación en `webhook/handler.ts`; migración S5 de columnas). Este ticket
**ajusta** el comportamiento a los criterios groomed:

- **`400 missing_conversation_id`** específico para el evento de completado sin
  `conversation_id` (antes devolvía `validation_failed` genérico).
- **Un solo registro de `needs` por conversación completada** aunque acumule
  varias necesidades (consolidación en `title`/`description`; sin registro por
  tipo de necesidad). Ya soportado por el diseño (UNIQUE parcial por
  `conversation_id` + `mergeDescriptions`), ahora **cubierto explícitamente por
  tests** (escenario groomed DEV-41).
- Confirmación de los demás errores groomed: `409 no_messages`, `400
  invalid_from`, `409 duplicate_event` (con `details.record` = fila existente de
  `ingest_responses`).
- Confirmación de que **el ACK 200 no depende del geocoding**: sin coordenadas o
  geocoding no disponible, el incidente se crea igual con lat/lng NULL y
  `location_enrichment_status=PENDING`.

## Cambios en esta rama

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/webhook/handler.ts` | Check temprano: evento de completado sin `conversation_id` (o vacío) → `400 missing_conversation_id` antes de la validación general S2. Se eliminó el bloque redundante aguas abajo. |
| `tests/unit/webhook-incident-endpoint.test.ts` | Test del escenario "una conversación → un solo registro de needs" y test reforzado de `missing_conversation_id` (vacío y faltante). |
| `tests/unit/completion-service.test.ts` | Test de servicio del escenario "varias necesidades → un solo registro consolidado". |
| `aidlc-docs/validation/DEV-41-evidence.md/.txt` y `dev41-webhook-incident.sh` | Evidencia en ejecución contra el stack real. |

## Validaciones

### Unitarias (vitest)

- `npm run test` → **347 passed** (21 archivos). Los tests nuevos de DEV-41
  aportan 3 tests (2 endpoint + 1 servicio).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `src/components/*` (migración Convex→Supabase, fuera de alcance; idénticos a
  los documentados en DEV-35). **0 errores** en `supabase/functions/**` ni
  `tests/**` (verificado con tsc standalone).

### En ejecución (Edge Function con Deno + Supabase local real)

Se sirvió la Edge Function `webhook` con Deno (`deno run --allow-net
--allow-env --allow-read --env-file=… supabase/functions/webhook/index.ts`) en
`http://127.0.0.1:8000`, contra el Supabase local de RADAR (API 54341 / DB
54342) con las 4 migraciones del receptor aplicadas. Se ejecutó la batería de
`aidlc-docs/validation/dev41-webhook-incident.sh` (volcado completo en
`DEV-41-evidence.txt`):

| # | Escenario S5 groomed | Resultado |
|---|----------------------|-----------|
| 1 | Conversación acumula mensajes + completado (`conversation_id` en `data`) | ✅ `200` — `incident.outcome=created`, `source=WhatsApp`, `contact_whatsapp=573001234567`, `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `source_event_id=dev41_comp1`, descripción = mensajes acumulados |
| 2 | Conversación con varias necesidades | ✅ `200` — **un solo registro** en `needs`; `title`/`description` consolidan (`"Necesito agua potable \| También necesito medicinas…"`); count por `conversation_id` = 1 |
| 3 | Completado con coordenadas | ✅ `200` — `latitude=3.4516`, `longitude=-76.532`, `city_id=cali`, `location_enrichment_status=RESOLVED`; sin geocoding |
| 4 | Sin coordenadas + `address/neighborhood` | ✅ `200` — geocoding real (Nominatim) resolvió `3.4265532/-76.5458181`; `city_id=cali`, `RESOLVED` |
| 5 | Sin coordenadas ni dirección | ✅ `200` — incidente creado igual con lat/lng NULL, `location_enrichment_status=PENDING`; el ACK no depende del geocoding |
| 6 | Reenvío del mismo completado (`evt dev41_comp1`) | ✅ `409` — `code=duplicate_event`, `details.record` = fila existente de `ingest_responses`; `count(ingest WHERE evt)=1`; sin incidente duplicado |
| 7 | Completado sin `conversation_id` | ✅ `400` — `code=missing_conversation_id`; sin fila en `needs` ni en `ingest_responses` |
| 8 | Completado sin mensajes acumulados (`dev41_conv_empty`) | ✅ `409` — `code=no_messages`; sin incidente |
| 9 | Completado con `from` inválido (`no-es-un-numero`) | ✅ `400` — `code=invalid_from`; sin incidente; el evento crudo quedó en `ingest_responses` (auditoría) con `RECEIVED` |
| 10 | Conversaciones distintas (`dev41_conv_A` / `dev41_conv_B`) | ✅ — el incidente de A solo tiene "Mensaje de A"; B permanece sin incidente |

Verificación en BD (SQL directo vía `docker exec`):

- 6 conversaciones `dev41%` → 6 filas en `needs`, **1 incidente por
  conversación** (GROUP BY count = 1).
- Filas con coordenadas: `RESOLVED`; sin coordenadas: `PENDING`, lat/lng NULL.
- `dev41_badfrom_comp` persiste en `ingest_responses` (auditoría) con
  `processing_status=RECEIVED`.
- `dev41_comp1` tiene **1 sola fila** en `ingest_responses` (reenvío no duplicó).

Datos de prueba con prefijo `dev41%` eliminados al final (stack limpio y
reproducible).

## Decisiones técnicas

- **`missing_conversation_id` específico**: se detecta al inicio del handler,
  ANTES de la validación general S2. Un evento de completado sin
  `conversation_id` no cumple los campos mínimos del contrato (es obligatorio),
  por lo que tampoco se persiste en `ingest_responses` — el `400` específico
  permite al remitente identificar el error del flujo de completado.
- **Un solo registro por conversación**: el diseño ya lo garantiza
  (`needs.conversation_id` con índice único parcial + consolidación de la
  descripción). Se añadieron tests explícitos del escenario groomed para
  fijar el comportamiento (separar necesidades múltiples en registros distintos
  es un ajuste a definir aparte, fuera de este ticket).
- **`duplicate_event` en reenvíos del completado**: la idempotencia por
  `event.id` en la capa de ingestión (S4/S6) corta el reenvío ANTES de llegar al
  servicio de incidentes: responde `409` con `details.record` = fila existente
  de `ingest_responses`, sin re-ejecutar la creación del incidente.
- **Geocoding no bloqueante**: si faltan coordenadas y hay dirección, se invoca
  el geocoder (Nominatim); si no resuelve o no hay geocoder, el incidente se
  crea igual con lat/lng NULL y `location_enrichment_status=PENDING`. El ACK
  `200` confirma la recepción sin depender del geocoding (S7).

## Nota de infraestructura

Como en DEV-34/DEV-35/DEV-40, el CLI `supabase functions serve webhook` de esta
máquina falla al arrancar el edge-runtime (`failed to determine entrypoint`).
Para la evidencia se sirvió la función con Deno directamente (mismo runtime que
usa Supabase Edge, según S9) contra el stack local. El bootstrap es el
`index.ts` versionado de la función.
