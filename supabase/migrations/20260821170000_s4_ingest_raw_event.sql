-- =====================================================================
-- S4 — Persistencia del evento crudo (columna raw_event + grants)
-- Ticket: DEV-34
--
-- La migración S1 (DEV-31) creó `ingest_responses` con `body` (data.body)
-- y `raw_payload` (evento completo crudo / envelope). El escenario Gherkin
-- de S4 exige una columna del evento crudo llamada `raw_event` que guarde
-- el JSON completo del evento SIN modificar. Esta migración la agrega de
-- forma idempotente (ADD COLUMN IF NOT EXISTS).
--
-- `raw_event` queda como la columna canónica del contrato S4. `raw_payload`
-- se mantiene por compatibilidad con la historia S1 y se sigue poblando con
-- el mismo evento completo.
--
-- Además se otorgan los GRANTs de tabla que los default privileges de un
-- proyecto Supabase aplican al crear tablas. Al aplicar la migración S1 vía
-- SQL directo (sin el CLI), `service_role` no tenía SELECT/INSERT sobre
-- `ingest_responses` y la persistencia S4 fallaba con 403. Estos GRANTs son
-- idempotentes y replican el comportamiento estándar del proyecto:
--   - `service_role` (Edge Function): SELECT/INSERT/UPDATE/DELETE (BYPASSRLS;
--     RLS no le aplica).
--   - `anon` / `authenticated`: SELECT/INSERT/UPDATE/DELETE (pero RLS SIN
--     políticas sobre `ingest_responses` los bloquea a nivel de fila — ver S1).
-- =====================================================================

-- Columna canónica del evento crudo completo (auditoría tal cual llegó).
ALTER TABLE ingest_responses
  ADD COLUMN IF NOT EXISTS raw_event JSONB;

-- Documentación de la columna en el esquema.
COMMENT ON COLUMN ingest_responses.raw_event IS
  'Evento crudo completo del webhook, sin modificar (JSONB). Contrato S4.';

COMMENT ON COLUMN ingest_responses.raw_payload IS
  'Alias de compatibilidad S1: evento completo crudo (envelope). Se puebla con el mismo valor que raw_event.';

-- Grants para la persistencia del receptor (idempotente; replican los default
-- privileges de Supabase). RLS sigue bloqueando a anon/authenticated.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ingest_responses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ingest_responses TO anon, authenticated;
