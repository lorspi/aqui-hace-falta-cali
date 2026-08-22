-- =====================================================================
-- S5 — Creación del incidente al completar la conversación (columnas)
-- Ticket: DEV-35
--
-- La historia S5 crea el registro en `needs` cuando llega el evento de
-- completado de una conversación de WhatsApp. Para soportar:
--
--   1. **Idempotencia por `event.id` del completado**: el incidente guarda el
--      `source_event_id` (event.id del webhook que lo originó). Con un índice
--      único parcial, un reenvío del mismo evento de completado NO crea un
--      segundo incidente (S5/S6).
--   2. **Un incidente por conversación**: `conversation_id` del webhook se
--      persiste en la fila y queda único (parcial). Dos eventos de completado
--      distintos para la misma conversación no generan incidentes duplicados.
--   3. **Estado de enriquecimiento de ubicación**: `location_enrichment_status`
--      distingue un incidente con coordenadas resueltas (`RESOLVED`) de uno
--      que quedó pendiente de geocoding (`PENDING`). El geocoding es S5; si no
--      hay coordenadas ni geocoding disponible, el incidente se crea igual con
--      lat/lng NULL y `PENDING` (el flujo no rechaza el evento de completado).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS + CREATE UNIQUE INDEX IF NOT EXISTS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Columnas de trazabilidad / idempotencia en needs
-- ---------------------------------------------------------------------

-- event.id del evento de completado que originó el incidente.
ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS source_event_id TEXT;

-- conversation_id del webhook (agrupación de la conversación de WhatsApp).
ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Estado del enriquecimiento de ubicación:
--   RESOLVED → el incidente tiene coordenadas (del evento o por geocoding).
--   PENDING  → sin coordenadas; pendiente de enriquecimiento con geocoding.
ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS location_enrichment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';

-- ---------------------------------------------------------------------
-- 2. Idempotencia por source_event_id y unicidad por conversation_id
-- ---------------------------------------------------------------------

-- Un mismo event.id de completado no puede originar dos incidentes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_needs_source_event_id
  ON needs(source_event_id)
  WHERE source_event_id IS NOT NULL;

-- Una conversación genera un solo incidente (no se mezclan conversaciones).
CREATE UNIQUE INDEX IF NOT EXISTS idx_needs_conversation_id
  ON needs(conversation_id)
  WHERE conversation_id IS NOT NULL;

-- Índice para localizar incidentes pendientes de enriquecimiento (geocoding).
CREATE INDEX IF NOT EXISTS idx_needs_location_enrichment_status
  ON needs(location_enrichment_status);

-- ---------------------------------------------------------------------
-- 3. Documentación de columnas en el esquema
-- ---------------------------------------------------------------------

COMMENT ON COLUMN needs.source_event_id IS
  'event.id del evento de completado que originó el incidente (idempotencia S5/S6).';

COMMENT ON COLUMN needs.conversation_id IS
  'conversation_id del webhook de WhatsApp. Un incidente por conversación.';

COMMENT ON COLUMN needs.location_enrichment_status IS
  'Estado del enriquecimiento de ubicación: RESOLVED (coordenadas conocidas) o PENDING (pendiente de geocoding).';

-- ---------------------------------------------------------------------
-- 4. Grants para el receptor (idempotente)
--    La Edge Function escribe `needs` con `service_role` (BYPASSRLS). Los
--    default privileges de un proyecto Supabase otorgan estos permisos al
--    crear tablas; se replican aquí por si la tabla pre-existía (creada vía
--    schema.sql) y para que el rol `service_role` pueda SELECT/INSERT.
--    RLS de `needs` (S1 + schema.sql) sigue bloqueando/limitando a anon.
-- ---------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE needs TO service_role;
