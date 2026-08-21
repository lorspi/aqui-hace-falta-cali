# Evidencia de validación — DEV-31 (S1: Esquema de datos en Supabase)

Fecha: 2026-08-21
Rama: `agent/DEV-31`
Base: `feature/whatsappbot`

## Resumen

Se implementó la migración del esquema del receptor en
`supabase/migrations/20260821160000_s1_receptor_schema.sql` y se validó de dos formas:

1. **Tests unitarios (vitest)** — `tests/unit/receptor-schema.test.ts` verifica el DDL
   declarado contra los escenarios Gherkin de la historia S1.
2. **Validación real en Postgres 17 (Docker)** — la migración se aplicó sobre un
   esquema que simula el brownfield (se aplicó primero el `supabase/schema.sql`
   existente y luego la migración S1) y se ejecutó una batería de aserciones.

El volcado completo de la batería está en `aidlc-docs/validation/s1-pg-asserts.txt`.

## Validaciones

| # | Escenario S1 | Resultado |
|---|--------------|-----------|
| 1 | Migración crea `needs` con PK uuid | ✅ `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()` |
| 2 | Columnas del modelo `Need` presentes | ✅ categories, place_type, priority, status, verification_status, requester_type |
| 3 | Columnas de contacto y ubicación presentes | ✅ contact_name/phone/whatsapp/email, address, neighborhood, lat, long, city_id |
| 4 | Defaults del modelo | ✅ priority=MEDIUM, status=NEED_HELP_NOW, verification_status=PENDING_VERIFICATION |
| 5 | Índices para filtrar | ✅ idx_needs_status, idx_needs_priority, idx_needs_verification, idx_needs_created_at |
| 6 | `ingest_responses` con metadatos del evento | ✅ event_id, type, conversation_id, "from", message_type, workflow_step |
| 7 | Body crudo en JSONB | ✅ body JSONB + raw_payload JSONB |
| 8 | Timestamps + estado de procesamiento | ✅ received_at, processed_at, created_at, processing_status |
| 9 | Unicidad sobre event_id (idempotencia) | ✅ constraint `ingest_responses_event_id_key UNIQUE(event_id)`; reenvío → `duplicate key value violates unique constraint` |
| 10 | RLS habilitado en needs e ingest_responses | ✅ rowsecurity = t en ambas |
| 11 | Sin políticas sobre ingest_responses (anon bloqueado) | ✅ 0 políticas; INSERT anon → `new row violates row-level security policy`; SELECT anon → 0 filas |
| 12 | Evento con campos faltantes se persiste | ✅ fila creada con body intacto; type/conversation_id/from = NULL |
| 13 | Incidente sin coordenadas | ✅ lat/long NULL permitido; UPDATE posterior con lat/lng/ciudad OK |
| 14 | Inserts inválidos rechazados | ✅ `needs` sin title y `ingest_responses` sin event_id → `violates not-null constraint` |

## Validaciones del flujo obligatorio del ticket

- `npm run test` → **150 passed** (8 archivos). El archivo
  `tests/unit/receptor-schema.test.ts` aporta 22 aserciones del esquema S1.
- `npm run lint` (tsc --noEmit) → **41 errores PRE-EXISTENTES en
  `feature/whatsappbot`** (componentes de la migración Convex→Supabase fuera del
  alcance de S1: `AdminDashboardModal.tsx`, `CreateNeedModal.tsx`,
  `AdminPanelPage.tsx`, `PublicEditOfferModal.tsx`, `PublicEditModal.tsx`,
  `CreateOfferModal.tsx`). Se confirmó ejecutando `npm run lint` con la base limpia
  (stash): el mismo conteo de 41 errores. **Ninguno de los archivos de DEV-31
  introduce errores** (no están en el include de `tsc`). Este es el estado base del
  frontend, ajeno a esta historia.
- App: `npm run build` OK y `npm run preview` → `HTTP 200` en `/` con título
  `raDAR de Ayuda — Articulación para emergencias`.

## Decisiones técnicas

- **`needs` lat/long opcionales (NULL)**: el `schema.sql` de la app define
  lat/long NOT NULL con default (3.4516, -76.532). El receptor necesita persistir
  incidentes sin coordenadas (los eventos crudos no las traen) y enriquecerlos con
  geocoding después. La migración relaja el esquema con
  `ALTER TABLE needs ALTER COLUMN latitude/longitude DROP NOT NULL/DEFAULT`.
  El flujo de geocoding (S5) actualizará la fila posteriormente.
- **`from` entre comillas** (`"from"`): es palabra reservada en SQL.
- **`ingest_responses` sin políticas**: con RLS habilitado y cero políticas, el rol
  `anon` no puede SELECT/INSERT/UPDATE/DELETE. El `service_role` (server / Edge
  Functions) tiene BYPASSRLS y opera sin restricción. Es la implementación más
  estricta y está alineada con NFR-1 del plan.
- **`needs` conserva sus políticas públicas existentes**: la app frontend lee/escribe
  `needs` con la anon key vía políticas de `supabase/schema.sql`; no se tocan. El
  receptor escribe con `service_role`.
