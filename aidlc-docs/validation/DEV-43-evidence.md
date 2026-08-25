# Evidencia de validación — DEV-43 (US-4: Transición de estado de revisión — aprobar / rechazar)

Fecha: 2026-08-24
Rama: `agent/DEV-43`
Base: `feature/whatsappbot`

## Contexto

US-4 agrega al receptor de eventos un **endpoint de revisión** para que el
operador de RaDAR de Ayuda apruebe o rechace un reporte **ya revisado** (un need
con `verification_status = PENDING_VERIFICATION`):

- `POST /review` con `{ need_id, decision, verified_by, notes? }`.
- **"Aprobar"** (`aprobar`/`approve`) → `verification_status = VERIFIED`
  (el need cuenta como necesidad real para el resto del sistema).
- **"Rechazar"** (`rechazar`/`reject`) → `verification_status = REJECTED`
  (el registro permanece en `needs` para trazabilidad pero se excluye de las
  vistas/consultas "oficiales").
- En ambos casos se guarda `verified_by` (quién), `verified_at` (cuándo) y,
  opcionalmente, `verification_notes` (motivo). **Rechazar sin motivo es
  válido** (`verification_notes` queda NULL).
- Un need con `verification_status` distinto de `PENDING_VERIFICATION` → `409`
  `invalid_verification_status` informando el estado actual; el registro **no
  se modifica**.
- Need inexistente o id inválido → `404` `need_not_found`.
- Decisión que no es aprobar/rechazar → `400` `invalid_decision`; sin operador
  (`verified_by`) → `400` `missing_operator`.

## Cambios en esta rama

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/_shared/review-service.ts` | **Nuevo.** Módulo PURE (NFR-4): `normalizeDecision` (aprob/`aprobar`/reject/`rechazar`), `applyReview` (transición + guarda quién/cuándo/motivo, estados `not_found`/`invalid_state`). |
| `supabase/functions/review/handler.ts` | **Nuevo.** Handler HTTP PURE (Web Standards): `POST /review`. 400 (`invalid_decision`/`missing_operator`/`validation_failed`/`invalid_json`), 404 (`need_not_found`), 409 (`invalid_verification_status`), 405, 415, 500 genérico con `logError`. |
| `supabase/functions/review/index.ts` | **Nuevo.** Bootstrap Deno de la Edge Function `review` con store PostgREST real (`needs`). |
| `supabase/functions/review/README.md` | **Nuevo.** Documentación operativa del endpoint (rutas, body, respuestas, errores, nota de dominio REJECTED). |
| `supabase/functions/_shared/needs-store.ts` | `VerificationUpdate` + `NeedsStore.updateVerification(id, patch)` en la interfaz e implementaciones in-memory y PostgREST (PATCH con `Prefer: return=representation`). |
| `tests/unit/review-service.test.ts` | **Nuevo.** Tests de la lógica PURE (decisiones, transiciones, invalid_state, not_found). |
| `tests/unit/review-handler.test.ts` | **Nuevo.** Tests HTTP de los 9 escenarios Gherkin US-4 + comportamiento HTTP (405/415/400/500/CORS). |
| `documentacion/Contrato-de-Integracion.md` | Sección 8.1 **Revisión de necesidades (US-4)**: endpoint, body, transiciones, errores y nota de dominio `REJECTED`. |
| `aidlc-docs/validation/dev43-review.sh` | **Nuevo.** Batería de evidencia en ejecución contra el stack real. |
| `aidlc-docs/validation/DEV-43-evidence.txt` | **Nuevo.** Volcado completo de la batería en ejecución. |

## Validaciones

### Unitarias (vitest)

- `npm run test` → **415 passed** (24 archivos; +45 tests nuevos de DEV-43:
  23 de `review-service` + 22 de `review-handler`).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `src/components/*` (migración Convex→Supabase, fuera de alcance; idénticos a
  los documentados en DEV-35/DEV-41/DEV-42). **0 errores** en
  `supabase/functions/**` ni `tests/**` (verificado con tsc standalone sobre
  los archivos nuevos y sus dependencias).

### En ejecución (Edge Functions con Deno + Supabase local real)

Se sirvieron las Edge Functions con Deno (mismo runtime que Supabase Edge, según
S9) contra el Supabase local de RADAR (API 54341 / DB 54342):

- `webhook` (siembra de necesidades) en `http://127.0.0.1:8000/functions/v1/webhook`.
- `review` (endpoint US-4) en `http://127.0.0.1:8002/functions/v1/review`.

Batería completa en `aidlc-docs/validation/DEV-43-evidence.txt`:

| # | Escenario US-4 | Resultado |
|---|----------------|-----------|
| 1 | Aprobar un need pendiente lo convierte en necesidad real | ✅ `200` — `verification_status=VERIFIED`, `verified_by=operador@radar.local`, `verified_at` presente, `verification_notes` guardada |
| 2 | Aprobar con nota opcional | ✅ — `verification_notes="Verificado en terreno por la Cruz Roja"` |
| 3 | Rechazar un need pendiente lo excluye de las vistas oficiales sin borrarlo | ✅ `200` — `REJECTED`, `verified_by`/`verified_at`/`verification_notes`; verificación en BD: `count=1` (NO borrado) |
| 4 | Rechazar sin motivo es válido | ✅ `200` — `REJECTED`, `verification_notes=NULL`, operación completada |
| 5 | Reintentar aprobar un need ya VERIFIED | ✅ `409` — `code=invalid_verification_status`, `details.current_status=VERIFIED`; BD intacto |
| 6 | Reintentar rechazar un need ya REJECTED | ✅ `409` — `code=invalid_verification_status`, `details.current_status=REJECTED`; BD intacto |
| 7 | Need inexistente | ✅ `404` — `code=need_not_found` (id no-UUID `need_999` y UUID bien formado inexistente) |
| 8 | Decisión inválida | ✅ `400` — `code=invalid_decision`; BD intacto (`PENDING_VERIFICATION`) |
| 9 | Decisión sin operador | ✅ `400` — `code=missing_operator`; BD intacto (`PENDING_VERIFICATION`) |

Verificación en BD (SQL directo vía `docker exec`):

- Aprobar: `VERIFIED | operador@radar.local | Verificado en terreno por la Cruz Roja | t (verified_at)`.
- Rechazar: `REJECTED | operador@radar.local | Información falsa`; `count(*)=1`
  agrupado por `verification_status=REJECTED` (el registro **permanece**).
- Rechazo sin motivo: `REJECTED | (null) | operador@radar.local`.
- Reintentos 409: los campos `verification_status`, `verified_by` y
  `verification_notes` quedan **sin cambios**.
- Datos de prueba con prefijo `dev43%` eliminados al final (stack limpio y
  reproducible): `needs=0`, `ingest_responses=0`.

### Frontend

- `npm run dev` (vite `--mode development`) arranca correctamente
  (`http://localhost:8090/`, `✓ ready in 953 ms`, sirve el HTML con título
  "raDAR de Ayuda — Articulación para emergencias"). El frontend actual no
  consume todavía el endpoint `review` (es backend); se dejó documentada la
  nota de dominio sobre `REJECTED` en el contrato.

## Decisiones técnicas

- **Opción A (alineada al código ya construido)**: no se modifica US-2 ni el
  modelo. El registro en `needs` siempre existe; "aprobar"/"rechazar" solo
  transicionan `verification_status` (S1 ya contempla `verified_by`,
  `verified_at` y `verification_notes`). **No se requiere migración**.
- **Nueva Edge Function `review`** (no se reutiliza `webhook`): POST de
  escritura para el operador, separada del POST del webhook. Bootstrap con el
  store PostgREST real de `needs` usando `service_role` (BYPASSRLS).
- **`updateVerification` en `NeedsStore`**: se agregó a la interfaz y a los
  stores in-memory y PostgREST. El store real hace `PATCH /rest/v1/needs?id=eq.`
  con `Prefer: return=representation`; representación vacía → `null` (no
  existe).
- **409 para estado no pendiente**: se usa `409 Conflict` (como `duplicate_event`
  y `no_messages` del webhook) con `code=invalid_verification_status` y el
  estado actual en `details.current_status`. El registro NO se modifica.
- **404 para `need.id` no-UUID**: `needs.id` es columna UUID; un id no-UUID no
  puede existir, por lo que se responde `404 need_not_found` ANTES de consultar
  PostgREST (que rechazaría el valor con 400 "invalid input syntax for type
  uuid"). Misma convención que DEV-42.
- **Alias de decisión en español**: `normalizeDecision` acepta `approve`/
  `reject` (canónico) y `aprobar`/`rechazar` (literales de los escenarios
  Gherkin), además de `needId`/`verifiedBy` (camelCase) como alias de
  `need_id`/`verified_by`.
- **`verified_at` se genera server-side** (ISO-8601) al aplicar la transición;
  el operador no puede fabricar la fecha.

## Nota de dominio (REJECTED)

El frontend actual tipa `VerificationStatus = VERIFIED | PENDING_VERIFICATION |
REPORTED | ARCHIVED` (sin `REJECTED`) y las vistas públicas ya excluyen
`ARCHIVED`. US-4 asume `REJECTED` tal como pide la card. Esta historia
implementa el endpoint de backend con `REJECTED`; al consumir el endpoint, el
frontend deberá agregar `REJECTED` al enum/filtros (o mapearlo a `ARCHIVED`).
La nota quedó documentada en `review/README.md` y en el contrato (§8.1).

## Nota de infraestructura

Como en DEV-34/35/40/41/42, el CLI `supabase functions serve` falla al arrancar
el edge-runtime en esta máquina. Para la evidencia se sirvieron las funciones
con Deno directamente (mismo runtime que usa Supabase Edge, según S9) contra el
stack local. La función `review` se sirvió en el puerto 8002 (la `webhook`
ocupa el 8000) usando un bootstrap local equivalente (mismo handler y mismos
stores, solo cambia el puerto).
