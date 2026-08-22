-- =====================================================================
-- S6 — Idempotencia / deduplicación por event.id
-- Ticket: DEV-36
--
-- La historia S6 exige que reenvíos del mismo evento no generen duplicados,
-- con `event.id` como clave de idempotencia. La migración S1 (DEV-31) ya creó
-- la constraint `ingest_responses_event_id_key UNIQUE (event_id)`. Esta
-- migración:
--
--   1. Asegura de forma IDEMPOTENTE que la constraint UNIQUE(event_id) exista
--      (cubre esquemas recreados o tablas creadas sin la constraint).
--   2. Documenta `event_id` como clave de idempotencia del contrato.
--
-- La unicidad de event_id es lo que resuelve la condición de carrera de
-- reenvíos concurrentes (escenario Gherkin S6): dos INSERT simultáneos con el
-- mismo event_id → solo uno gana; el otro es bloqueado por la constraint y el
-- store real hace `INSERT ... ON CONFLICT DO NOTHING` (S4) devolviendo la fila
-- existente sin modificarla.
--
-- Idempotente: DO block + COMMENT ON COLUMN (se puede ejecutar sobre el
-- esquema actual sin romper nada).
-- =====================================================================

-- Asegura la constraint UNIQUE(event_id) si no existe (idempotente). La
-- constraint S1 (ingest_responses_event_id_key) es la clave de idempotencia;
-- este bloque garantiza que siga presente aunque el esquema se haya recreado.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ingest_responses_event_id_key'
      AND conrelid = 'ingest_responses'::regclass
  ) THEN
    ALTER TABLE ingest_responses
      ADD CONSTRAINT ingest_responses_event_id_key UNIQUE (event_id);
  END IF;
END $$;

-- Documentación de la clave de idempotencia en el esquema.
COMMENT ON COLUMN ingest_responses.event_id IS
  'Clave de idempotencia (S6): event.id del webhook. UNIQUE, obligatoria y no nula. Reenvíos con el mismo event.id no crean duplicados ni sobrescriben la fila original.';
