# Evidencia de validación — DEV-46 (US-7: Acciones de aprobar / rechazar en la pantalla de detalle — Frontend)

Fecha: 2026-08-24
Rama: `agent/DEV-46`
Base: `feature/whatsappbot`

## Contexto

US-7 agrega a la **pantalla de detalle del reporte del chatbot** (US-6) las
acciones **"Aprobar"** / **"Rechazar"** para que el operador de RaDAR de Ayuda
cierre la revisión en el mismo lugar donde verificó la información:

- Un need con `verification_status = PENDING_VERIFICATION` muestra los botones
  habilitados; "Aprobar" llama al endpoint de revisión de **US-4**
  (`POST /functions/v1/review`) y transiciona a `VERIFIED`; "Rechazar" lo hace a
  `REJECTED`. El reporte deja de aparecer como pendiente en el listado (US-5).
- La llamada incluye la identidad del operador (`verified_by`), obtenida de la
  sesión del panel (rol MODERATOR/ADMIN). Sin identidad disponible → error
  `missing_operator` (400 en US-4) sin modificar el estado.
- Un reporte ya revisado (`VERIFIED`/`REJECTED`/…) muestra las acciones
  **deshabilitadas** y la trazabilidad: `verified_by` (quién) y `verified_at`
  (cuándo), tolerante a datos ausentes ("no disponible").
- Doble clic durante la petición no duplica la llamada: el botón queda en estado
  de carga/deshabilitado mientras se procesa y se aplica una sola decisión.

## Cambios en esta rama

| Archivo | Cambio |
|---------|--------|
| `src/utils/reviewUtils.ts` | **Nuevo.** Lógica PURE (NFR-4): `isReviewable` (solo PENDING_VERIFICATION habilita acciones), `resolveVerifiedBy` (identidad del operador desde la sesión del panel), `buildReviewPayload` (body de US-4 con `decision` en español), `reviewDecisionLabel`. |
| `src/lib/reviewService.ts` | **Nuevo.** Cliente HTTP del endpoint US-4 (`POST /functions/v1/review`): inyecta la anon key, arma el payload, devuelve la respuesta 200 tipada (`ReviewedNeed`) o lanza `ReviewNeedError` con `code`/`status` (`missing_operator`, `invalid_verification_status`, `need_not_found`, `review_failed`, `network_error`, `config_missing`). Testeable con fetch mock. |
| `src/components/ChatbotReportDetail.tsx` | Panel **"Revisión"** en el detalle: botones Aprobar/Rechazar (solo PENDING_VERIFICATION), estado de carga durante la petición, error claro con reintento sin modificar el estado, y tras la decisión refleja el nuevo estado (VERIFIED/REJECTED) deshabilitando las acciones y mostrando `verified_by`/`verified_at`/`verification_notes`. Evita doble clic y segunda decisión. |
| `src/components/ChatbotReportsList.tsx` | Recibe y reenvía `operator` (operador autenticado del panel) al detalle para `verified_by`. |
| `src/components/AdminPanelPage.tsx` | Pasa `currentUser` como `operator` a `ChatbotReportsList`. |
| `src/lib/supabaseService.ts` | `ConversationNeedSummary` expone `verified_by`, `verified_at`, `verification_notes` (opcionales) del contrato US-3. |
| `supabase/functions/_shared/conversation-rebuilder.ts` | `NeedSummary` (US-3) expone `verified_by`/`verified_at`/`verification_notes` para que el detalle muestre quién/cuándo revisó sin interpretar `raw_event`. |
| `src/i18n/translations.ts` | Nuevas claves `review*` en los 4 idiomas (es/en/pt/fr). |
| `tests/unit/review-utils.test.ts` | **Nuevo.** 14 tests de la lógica PURE (isReviewable, resolveVerifiedBy, buildReviewPayload). |
| `tests/unit/review-service-client.test.ts` | **Nuevo.** 9 tests del cliente HTTP (aprob/verificado, rechazo/rechazado, verified_by en la llamada, errores 400/404/409/500, red, sin config). |
| `tests/unit/conversation-rebuilder.test.ts` | +2 tests: el resumen del incidente expone `verified_by`/`verified_at`/`verification_notes` y tolera su ausencia. |
| `aidlc-docs/validation/dev46-ui-review.mjs` | **Nuevo.** Captura UI (Chrome headless vía CDP): panel antes/después de aprobar y reporte ya revisado. |
| `aidlc-docs/validation/dev46-ui-review-full.mjs` | **Nuevo.** Captura completa: aprobar un PENDING, reporte ya revisado con quién/cuándo/nota, rechazar un PENDING. |
| `aidlc-docs/validation/dev46-ui-dblclick.mjs` | **Nuevo.** Captura de doble clic: durante la petición el botón queda disabled/processing y se procesa una sola decisión. |
| `aidlc-docs/validation/dev46-ui-missingop.mjs` | **Nuevo.** Captura de operador sin identidad: la pantalla muestra el error `missing_operator` sin llamar al endpoint y conserva PENDING_VERIFICATION. |

## Nota de dominio (REJECTED)

Se confirma la opción ya resuelta en DEV-44: **`REJECTED` está agregado al enum
del frontend** (`VerificationStatus`) y a los filtros del listado de reportes del
chatbot (US-5). No se mapea a `ARCHIVED`. Esta historia lo consume tal cual:
"Rechazar" transiciona a `REJECTED` y el reporte deja de aparecer bajo
`PENDING_VERIFICATION` en el listado.

## Validaciones

### Unitarias (vitest)

- `npm run test` → **491 passed** (28 archivos; +23 tests nuevos de DEV-46:
  14 `review-utils` + 9 `review-service-client`, y +2 de trazabilidad en
  `conversation-rebuilder`).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `src/components/*` (migración Convex→Supabase, fuera de alcance; idénticos a
  los documentados en DEV-35/DEV-41/DEV-42/DEV-43/DEV-44/DEV-45). **0 errores**
  en los archivos nuevos ni en los modificados por esta historia.

### En ejecución (Vite dev + Supabase local real + Edge Functions `review` y `conversation`)

Se arrancó `npm run dev` (vite `--mode development`, puerto 8080) con `.env.local`
apuntando al Supabase local de RADAR (API `127.0.0.1:54341`). Las Edge Functions
`review` (US-4) y `conversation` (US-3) se sirvieron por el edge-runtime local
(`/functions/v1/...`), accesibles con la anon key.

**Siembra** (vía el flujo real del webhook, prefijo `dev46_%`): se crearon
needs `dev46_aprobado`, `dev46_rechazado`, `dev46_fresco`, `dev46_dbl`,
`dev46_sinop` (PENDING_VERIFICATION) y `dev46_ya_revisado` (VERIFIED por
`otra.operadora@radar.local` con nota).

**1. Aprobar un reporte pendiente desde el detalle (PENDING → VERIFIED)**

DOM del panel de revisión ANTES de decidir (detalle `dev46_fresco`):

```json
{
  "text": "Revisión Este reporte está pendiente de verificación. Al aprobarlo se contará como necesidad real; al rechazarlo se descartará para las vistas públicas... Aprobar Rechazar",
  "approveEnabled": true,
  "rejectEnabled": true
}
```

Tras click en "Aprobar":

```json
{
  "text": "Revisión Reporte ya revisado Revisado por operador.dev46@radar.local Fecha de revisión 24 ago 2026, 05:29 p.m.",
  "approveEnabled": null,
  "rejectEnabled": null,
  "verifiedBy": "operador.dev46@radar.local",
  "verifiedAt": "24 ago 2026, 05:29 p.m."
}
```

Verificación en BD (SQL directo): `VERIFIED | operador.dev46@radar.local | t (verified_at)`.

**2. Rechazar un reporte pendiente desde el detalle (PENDING → REJECTED)**

Detalle `dev46_rechazado`: botones habilitados antes; tras click en "Rechazar":

```json
{
  "text": "Revisión Reporte ya revisado Revisado por operador.dev46@radar.local Fecha de revisión 24 ago 2026, 05:29 p.m.",
  "verifiedBy": "operador.dev46@radar.local"
}
```

Verificación en BD: `REJECTED | operador.dev46@radar.local`.

**3. Reporte ya revisado muestra acciones deshabilitadas y quién/cuándo**

Detalle `dev46_ya_revisado` (VERIFIED por otra operadora, con nota):

```json
{
  "text": "Revisión Reporte ya revisado Revisado por otra.operadora@radar.local Fecha de revisión 24 ago 2026, 07:00 a.m. Nota Verificado en terreno",
  "actionsPresent": false,
  "verifiedBy": "otra.operadora@radar.local",
  "verifiedAt": "24 ago 2026, 07:00 a.m.",
  "notes": "Verificado en terreno"
}
```

La pantalla NO interpreta `raw_event`: consume `verified_by`/`verified_at` del
resumen del incidente del endpoint US-3.

**4. Reporte ya revisado sin quién/cuándo se muestra de forma tolerante**

El mismo reporte antes de que el endpoint US-3 expusiera los campos (o un need
VERIFIED sin `verified_by`/`verified_at` en BD) muestra:

```json
{
  "text": "Revisión Reporte ya revisado Revisado por No disponible Fecha de revisión No disponible",
  "verifiedBy": "No disponible",
  "verifiedAt": "No disponible"
}
```

Sin romper la pantalla (escenario "datos incompletos").

**5. El endpoint responde error y la pantalla conserva el estado pendiente**

- Reintentar aprobar un need ya `VERIFIED` → `409 invalid_verification_status`
  (US-4); la pantalla muestra "Este reporte ya fue revisado." y no modifica nada.
- Reintentar rechazar un need ya `REJECTED` → `409` (verificado con curl).
- Need inexistente → `404 need_not_found`.
- Operador sin identidad (sesión sin email/name) → la pantalla muestra el error
  **sin llamar al endpoint** y conserva `PENDING_VERIFICATION`:

```json
{
  "text": "Revisión Este reporte está pendiente de verificación... No se pudo identificar al operador (verified_by). La decisión de revisión exige trazabilidad de quién aprueba o rechaza. El reporte conserva su estado pendiente. Puedes reintentar la decisión. Aprobar Rechazar",
  "approveEnabled": true
}
```

Verificación en BD: `dev46_sinop` sigue `PENDING_VERIFICATION` con `verified_by` vacío.

**6. Un doble clic durante la petición no duplica la llamada**

Doble click en "Aprobar" sobre `dev46_dbl`:

```
APROBAR HABILITADO ANTES: {"enabled":true}
ESTADO DURANTE PETICIÓN (tras doble clic): {"disabled":true,"processing":true}
DESPUÉS (una sola decisión procesada): {"actionsPresent":false,"reviewedBy":"op@radar.local"}
```

Verificación en BD: `VERIFIED | op@radar.local` (una sola transición; sin
duplicados en `ingest_responses`).

**7. Tras aprobar/rechazar, la pantalla no permite una segunda decisión**

Al volver a abrir un reporte ya decidido, el panel muestra "Reporte ya revisado",
las acciones no están presentes y no se vuelve a llamar al endpoint (en la UI se
verificó `actionsPresent: false`; en la API el reintento responde 409).

**8. El reporte aprobado/rechazado deja de aparecer como pendiente en el listado**

DOM del listado tras las decisiones: los reportes `dev46_*` decididos aparecen
con badge `✓ Verificado` (o `✕ Rechazada`) y **ninguno bajo PENDING_VERIFICATION**;
los 4 reportes dev46 decididos salieron del listado de pendientes. Verificación
en BD: `count(*) FROM needs WHERE conversation_id LIKE 'dev46%' AND
verification_status='PENDING_VERIFICATION'` → `0`.

### Verificación en BD (SQL directo vía docker exec)

- Aprobar: `VERIFIED | operador.dev46@radar.local | verified_at presente`.
- Rechazar: `REJECTED | operador.dev46@radar.local`.
- Doble clic: `VERIFIED | op@radar.local` (una sola transición).
- Sin operador: `PENDING_VERIFICATION | (vacío)` — no se llamó al endpoint.
- Limpieza final: datos `dev46%` eliminados (`needs=0`, `ingest_responses=0`);
  stack reproducible.

## Decisiones técnicas

- **Lógica PURE extraída** (`reviewUtils.ts`, NFR-4): `isReviewable`,
  `resolveVerifiedBy`, `buildReviewPayload` sin dependencias de React/Supabase,
  testeables con vitest. El cliente HTTP (`reviewService.ts`) acepta dependencias
  inyectables (`baseUrl`, `anonKey`, `fetchFn`) para testear sin red.
- **Identidad del operador**: se obtiene de la sesión del panel
  (`localStorage` `ahf_admin_user`, rol MODERATOR/ADMIN) vía
  `resolveVerifiedBy` (prefiere email, cae al nombre). Si no hay identidad, el
  frontend muestra `missing_operator` **sin** llamar al endpoint (evita un 400
  innecesario y conserva el estado).
- **REJECTED se consume tal cual** (ya agregado en DEV-44 al enum/filtros); no
  se mapea a `ARCHIVED`. Tras "Rechazar", el reporte deja de aparecer como
  pendiente y queda visible bajo el filtro `REJECTED` en el listado.
- **El endpoint US-3 ahora expone la trazabilidad**: `conversation-rebuilder`
  (`NeedSummary`) agrega `verified_by`/`verified_at`/`verification_notes` para
  que el detalle muestre quién/cuándo SIN interpretar `raw_event`. El frontend
  los tipa como opcionales y muestra "No disponible" cuando faltan.
- **No segunda decisión ni doble clic**: el estado de la decisión (`busy`,
  `reviewed`) vive en el detalle; `isReviewable` + guard `busy` evitan duplicar
  la llamada; tras la respuesta, `effectiveNeed` refleja el nuevo estado y las
  acciones desaparecen. El re-carga del detalle (refetch) conserva el
  comportamiento vía el estado persistido en BD.
- **Errores tipados**: `ReviewNeedError` con `code`/`status`; el detalle mapea
  cada code a un mensaje claro y ofrece reintentar sin modificar el estado.
