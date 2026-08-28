# Evidencia de validación — DEV-44 (US-5: Listado de reportes pendientes de revisión — Frontend)

Fecha: 2026-08-24
Rama: `agent/DEV-44`
Base: `feature/whatsappbot`

## Contexto

US-5 agrega al panel de moderación una pantalla para que el operador de RaDAR
de Ayuda **vea una lista de los reportes generados por el chatbot** (registros
en `needs` con `source = 'WhatsApp'`) y priorice cuáles revisar primero:

- El listado muestra `contact_whatsapp`, el tipo/título de la necesidad, la
  fecha y `verification_status`.
- Filtro por estado (`PENDING_VERIFICATION` / `VERIFIED` / `REJECTED`).
- Filtro y orden por `priority` y por tipo de necesidad (`place_type`).
- Orden por defecto: **pendientes primero** + cronológico (`created_at` desc).
- Estados vacío y error claros (no rompe la pantalla).
- Manejo tolerante de campos opcionales ausentes (`contact_whatsapp`, título
  legible, `location_enrichment_status` PENDING/RESOLVED).
- La UI **no interpreta `raw_event` crudos**: solo lee los datos ya persistidos
  por el receptor (S1/S5) — `source`, `source_event_id`, `conversation_id`,
  `location_enrichment_status`.

## Cambios en esta rama

| Archivo | Cambio |
|---------|--------|
| `src/components/ChatbotReportsList.tsx` | **Nuevo.** Pantalla de listado de reportes del chatbot (tab "Reportes del Chatbot" del panel de moderación): filtros por estado/prioridad/tipo, orden (reciente/prioridad), tarjetas con badge de estado/prioridad, contacto, ubicación y trazabilidad (`conversation_id`, `source_event_id`), estados vacío/error/loading y refetch. |
| `src/utils/chatbotReportUtils.ts` | **Nuevo.** Lógica PURE (NFR-4) de filtrado y orden: `filterChatbotReports`, `countPendingChatbotReports`, `isChatbotReport`. Solo conserva `source = 'WhatsApp'`; orden por defecto pendientes primero + cronológico; orden `PRIORITY` CRITICAL>HIGH>MEDIUM>LOW. |
| `src/lib/supabaseService.ts` | `useChatbotReports` (lee `needs` vía `useNeeds` con `includeArchived=true` y delega en la lógica pura) + re-export de tipos `ChatbotVerificationFilter` / `ChatbotSortOption`. |
| `src/types.ts` | `VerificationStatus` gana `'REJECTED'` (US-4/DEV-43). `Need` gana `sourceEventId`, `conversationId`, `locationEnrichmentStatus` (columnas S5). |
| `src/lib/supabaseClient.ts` | `dbNeedToNeed` / `needToDbNeed` mapean los nuevos campos S5 (`source_event_id`, `conversation_id`, `location_enrichment_status`). |
| `src/utils/formatters.ts` | `VERIFICATION_CONFIG` gana `REJECTED` ("Rechazada", ✕). |
| `src/i18n/translations.ts` | Nuevas claves `chatbotReports*` en los 4 idiomas (es/en/pt/fr). |
| `src/components/AdminPanelPage.tsx` | Nuevo tab **"Reportes del Chatbot"** con badge de pendientes; `chatbotPendingCount` derivado de `needs` (source WhatsApp + PENDING_VERIFICATION). |
| `tests/unit/chatbot-reports.test.ts` | **Nuevo.** 24 tests de la lógica PURE cubriendo los escenarios Gherkin US-5 (solo WhatsApp, filtros por estado/prioridad/tipo, orden pendientes+cronológico, tolerancia a campos ausentes, vacío, conteo). |
| `aidlc-docs/validation/dev44-seed.sql` | **Nuevo.** Seed temporal de reportes del chatbot (prefijo `dev44%`) para la evidencia en ejecución. |
| `aidlc-docs/validation/dev44-ui-render.mjs` | **Nuevo.** Captura del DOM renderizado del listado con Chrome headless vía CDP (acceso rápido `moderador123`, click en el tab y volcado). |

## Nota de dominio (REJECTED)

Se confirmó la opción señalada en la card: **`REJECTED` se agrega al enum del
frontend** (`VerificationStatus`) y a los filtros del listado, tal como lo
define US-4 (DEV-43). No se mapea a `ARCHIVED`: el listado de reportes del
chatbot puede mostrar ambos estados por separado, y `REJECTED` queda visible
para el operador como "descartado por moderador". Las vistas públicas siguen
excluyendo `ARCHIVED` (comportamiento pre-existente no modificado).

## Validaciones

### Unitarias (vitest)

- `npm run test` → **439 passed** (25 archivos; +24 tests nuevos de DEV-44 en
  `chatbot-reports.test.ts`).
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `src/components/*` (migración Convex→Supabase, fuera de alcance; idénticos a
  los documentados en DEV-35/DEV-41/DEV-42/DEV-43). **0 errores** en los
  archivos nuevos ni en los modificados por esta historia (verificado: los
  únicos errores en `AdminPanelPage.tsx` son los 3 pre-existentes
  `addNeedUpdateNote`/`NeedDetailModal`/`OfferDetailModal`, ya presentes en
  `feature/whatsappbot`).

### En ejecución (Vite dev + Supabase local real)

Se arrancó `npm run dev` (vite `--mode development`) apuntando al Supabase
local de RADAR (`.env.local` → API `127.0.0.1:54341`):

```
VITE v6.4.3  ready in 878 ms
➜  Local:   http://localhost:8081/
```

Se sembraron 6 reportes de prueba (prefijo `dev44%`) con estados, prioridades y
tipos variados + 1 reporte de la app (`source = 'Reporte ciudadano en línea`):
`dev44_agua_critical` (WhatsApp, CRITICAL, PENDING, RESOLVED),
`dev44_medicamentos_high` (WhatsApp, HIGH, PENDING, PENDING),
`dev44_refugio_verified` (WhatsApp, VERIFIED, RESOLVED),
`dev44_escombros_rejected` (WhatsApp, REJECTED, PENDING),
`dev44_otro_sincontacto` (WhatsApp, PENDING, **sin `contact_whatsapp`**),
`dev44_app_agua` (app, HIGH, PENDING).

Se navegó a `/panel` con Chrome headless (CDP), se autenticó con el acceso
rápido `moderador123` y se abrió el tab **Reportes del Chatbot**.

**1. El listado muestra solo reportes del chatbot (source = WhatsApp)**

El DOM renderizado lista **10 reportes** (5 de prueba + 5 reales del receptor)
todos con `source = WhatsApp`; **`dev44_app_agua` (fuente distinta) NO
aparece**. Cada tarjeta muestra badge de estado, badge de prioridad, título,
`contact_whatsapp`, dirección/barrio, estado de enriquecimiento de ubicación,
`conversation_id` y `source_event_id`. El reporte sin contacto muestra
**"Sin contacto"** (tolerante).

```
Reportes del chatbot
5 pendientes por revisar
◷ PENDIENTE · URGENTE · 24 DE AGO DE 2026, 04:21 P. M.
dev44_agua_critical
573101111111 · Calle 1 #2-3 · Ubicación resuelta
Conversación: conv_dev44_01 · evt: evt_dev44_01
◷ PENDIENTE · PRIORIDAD ALTA ...
dev44_medicamentos_high
573102222222 · Ubicación pendiente · conv_dev44_02
◷ PENDIENTE · PRIORIDAD MEDIA ...
dev44_otro_sincontacto · Sin contacto · Ubicación pendiente
...
✓ VERIFICADO ...  Necesito medicamentos para mi mamá en el barrio El Peñón
✕ RECHAZADA ...  Reporte duplicado sin datos
✕ RECHAZADA · PRIORIDAD BAJA ... dev44_escombros_rejected
10 reportes · Reportes del chatbot
```

**2. Orden por defecto: pendientes primero + cronológico**

Los 5 `PENDING_VERIFICATION` aparecen al inicio (por `created_at` desc:
04:21, 04:01, 01:31, 22/08 12:55, 22/08 12:31), seguidos de `VERIFIED` y
`REJECTED`. El badge del header muestra **"5 pendientes por revisar"**.

**3. Filtro por estado REJECTED**

Al seleccionar el filtro ESTADO = `REJECTED`:

```
Mostrando 2 reportes con los filtros seleccionados
✕ RECHAZADA · PRIORIDAD MEDIA · Reporte duplicado sin datos
✕ RECHAZADA · PRIORIDAD BAJA · dev44_escombros_rejected
2 reportes · Reportes del chatbot
```

**4. Estado vacío**

Al seleccionar un estado sin reportes (REPORTED) se muestra el estado vacío
sin romper la pantalla:

```
Mostrando 0 reportes con los filtros seleccionados
No hay reportes del chatbot por revisar todavía.
Los reportes que genere el bot de WhatsApp aparecerán aquí.
```

**5. Orden por prioridad**

Al cambiar ORDENAR = "Por prioridad", el listado ordena CRITICAL > HIGH >
MEDIUM > LOW (verificado en la lógica PURE por tests; en ejecución con los
datos reales los 5 reportes comparten prioridad MEDIA y conservan el orden
cronológico dentro de la misma prioridad).

### Verificación en BD (SQL directo vía docker exec)

- Antes: `count(*) FROM needs` = 5 (datos reales del receptor).
- Seed: `INSERT 0 6` (reportes `dev44%`).
- El listado de la UI leyó los datos vía PostgREST con la anon key
  (`GET /rest/v1/needs`) — el frontend no interpreta `raw_event`.
- Limpieza final: `DELETE FROM needs WHERE title LIKE 'dev44%'` →
  `remaining_dev44 = 0`. Stack local intacto.

## Decisiones técnicas

- **`REJECTED` se agrega al enum/filtros** del frontend (no se mapea a
  `ARCHIVED`). Justificación: la card US-5 exige filtrar por
  `PENDING_VERIFICATION`/`VERIFIED`/`REJECTED` y US-4 define `REJECTED` como
  estado canónico; mapearlo a `ARCHIVED` mezclaría la semántica de
  "descartado por moderador" con la de "resuelto/inactivo". Las vistas públicas
  conservan su exclusión de `ARCHIVED` (sin cambios).
- **Reutiliza `useNeeds`** (la lectura de `needs` del frontend) con
  `includeArchived=true` para leer todos los estados, y aplica el filtro
  `source = 'WhatsApp'` en cliente. El total de reportes del chatbot es acotado;
  esta vía evita introducir un endpoint de listado nuevo (que la card marca
  como dependencia pendiente de las historias del receptor).
- **Lógica PURE extraída** (`chatbotReportUtils.ts`, NFR-4): el filtrado y
  orden son funciones sin dependencias de React/Supabase, testeables con
  vitest. `useChatbotReports` solo orquesta la lectura y el estado.
- **La UI no interpreta `raw_event`**: solo usa los campos persistidos
  (`contact_whatsapp`, `title`, `categories`/`place_type`, `verification_status`,
  `priority`, `created_at`, `source_event_id`, `conversation_id`,
  `location_enrichment_status`).
- **Tolerancia a datos incompletos**: un reporte sin `contact_whatsapp` ni
  título legible se muestra con "Sin contacto" / "Sin título legible"; un
  `location_enrichment_status` PENDING se muestra como "Ubicación pendiente"
  sin romper la tarjeta.
- **Orden por defecto** respeta dos escenarios Gherkin: "prioriza pendientes"
  (PENDING_VERIFICATION primero) y "orden cronológico" (dentro del mismo estado,
  `created_at` desc).
