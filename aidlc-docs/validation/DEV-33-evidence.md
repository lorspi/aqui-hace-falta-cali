# Evidencia de validación — DEV-33 (S3: Validación y mapeo de eventos)

Fecha: 2026-08-21
Rama: `agent/DEV-33`
Base: `feature/whatsappbot`

## Resumen

Se implementó la validación + mapeo de eventos crudos a un borrador de `Need`
en `supabase/functions/_shared/need-mapper.ts` (módulo PURE sin dependencias,
alineado a NFR-4) y se integró el resumen del mapeo en el ACK de la Edge
Function `webhook` (`supabase/functions/webhook/handler.ts`). Se validó de dos
formas:

1. **Tests unitarios (vitest)** — `tests/unit/need-mapper.test.ts` cubre los
   escenarios Gherkin de la historia S3; se agregaron 2 casos HTTP al test
   existente del endpoint (S2).
2. **Ejecución real de la Edge Function local** — `supabase functions serve
   webhook` (edge-runtime Deno v1.74.3) y batería de 9 `curl` contra
   `http://127.0.0.1:54341/functions/v1/webhook`.

El volcado completo de la batería está en `aidlc-docs/validation/DEV-33-evidence.txt`
y el script reproducible en `aidlc-docs/validation/dev33-webhook-events.sh`.

## Validaciones (escenarios Gherkin S3)

| # | Escenario S3 | Resultado |
|---|--------------|-----------|
| 1 | Evento válido (`message.received`) con campos mínimos y `data.from` → borrador de Need con defaults | ✅ `200` — `priority=MEDIUM`, `status=NEED_HELP_NOW`, `verification_status=PENDING_VERIFICATION`, `source=WhatsApp`, `contact_whatsapp="573001234567"` |
| 2 | `message_type` inconsistente (`'Text'`) se normaliza | ✅ `200` — `message_type=TEXT` |
| 3 | `message_type='image'` se normaliza a `IMAGE` | ✅ `200` — `message_type=IMAGE` |
| 4 | `workflow.step='completed'` se normaliza y señala incidente listo | ✅ `200` — `workflow_step=COMPLETED`, `contribution=COMPLETION`, `incident_ready=true` |
| 5 | Campos mínimos faltantes (sin `body` y sin `conversation_id`) | ✅ `400` — `issues` detallan `conversation_id` y `body`; sin borrador |
| 6 | Campos con formato inválido (`id` vacío y `body` numérico) | ✅ `400` — `issues` detallan `id` y `body`; sin borrador |
| 7 | Reenvío con el mismo `event.id` | ✅ `200` en el endpoint (stateless); la capa de mapeo devuelve `duplicate` sin borrador cuando se pasa el tracker/Set; confirmación durable en S4/S6 |
| 8 | Evento sin coordenadas con `address`/`neighborhood` en el body | ✅ `200` — `location_pending_geocoding=true`; `contact_whatsapp` desde `from` |
| 9 | Evento de `type=conversation_completed` | ✅ `200` — `builds_incident=false`, `incident_ready=true` (insumo del flujo de completado, S5) |

## Validaciones del flujo obligatorio del ticket

- `npm run test` → **198 passed** (10 archivos). El archivo
  `tests/unit/need-mapper.test.ts` aporta 25 aserciones del mapeo S3 y el test
  del endpoint suma 2 casos HTTP del ACK con `mapping`.
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES** en
  `feature/whatsappbot` (componentes de la migración Convex→Supabase fuera del
  alcance: `AdminDashboardModal.tsx`, `AdminPanelPage.tsx`, `CreateNeedModal.tsx`,
  `CreateOfferModal.tsx`, `PublicEditModal.tsx`, `PublicEditOfferModal.tsx`).
  Ninguno de los archivos de DEV-33 está en el `include` de `tsc`
  (`tsconfig.json` → `src/`). Se verificó con un `tsc` standalone sobre
  `supabase/functions/**` y `tests/**` que **0 errores** provienen de los
  archivos de esta historia.
- Edge Function real: `supabase functions serve webhook` levanta el edge-runtime
  y sirve en `http://127.0.0.1:54341/functions/v1/webhook`; la batería de 9
  escenarios responde 7×`200` y 2×`400` (los casos de validación), con el
  `mapping` completo en el ACK.

## Decisiones técnicas

- **`need-mapper.ts` como módulo PURE**: al igual que `webhook-event.ts` (S2),
  comparte la lógica entre la Edge Function (Deno) y los tests (vitest/Node) sin
  dependencias. Cumple NFR-4.
- **Defaults del contrato**: `priority=MEDIUM`, `status=NEED_HELP_NOW`,
  `verification_status=PENDING_VERIFICATION`, `source=WhatsApp` — alineados a la
  migración S1 y al modelo `Need` de `src/types.ts`.
- **Normalización**: `message_type` → `TEXT|IMAGE|AUDIO|VIDEO|DOCUMENT|LOCATION|UNKNOWN`
  (un formato desconocido no invalida el evento; se clasifica genérico).
  `workflow.step` → `AWAITING_LOCATION|AWAITING_DETAILS|COMPLETED|UNKNOWN`.
  `contribution` resume qué aporta el mensaje al incidente acumulado
  (`LOCATION|DETAILS|COMPLETION|UNKNOWN`); `COMPLETED` ⇒ `incident_ready=true`
  (delegado a S5).
- **Deduplicación en la capa de mapeo**: `mapEventToNeedDraft` acepta un
  `Set<string>`, un `ProcessedEventTracker` o un callback de lookup; si el
  `event.id` ya fue procesado devuelve `status: "duplicate"` **sin borrador**.
  La confirmación durable es S4/S6 (constraint `UNIQUE` en
  `ingest_responses.event_id`).
- **Eventos de type distinto a `message.received`**: pasan la validación de
  campos mínimos pero `buildsIncident=false` (no arman incidente); si el type es
  `conversation_completed` (o el paso es `COMPLETED`), `incidentReady=true`
  como insumo del flujo de completado (S5).
- **Ubicación**: cuando el body no incluye `lat`/`lng` válidos,
  `locationPendingGeocoding=true` (el geocoding es S5); `address` y
  `neighborhood` se conservan desde `body`/`data.body`/`data` cuando vienen
  incluidos. En el ACK del endpoint solo se expone el resumen del mapeo; el
  borrador completo (`NeedDraft`) queda disponible para S4/S5.
