-- =====================================================================
-- S1 — Esquema de datos del receptor (bot de WhatsApp) en Supabase
-- Ticket: DEV-31
--
-- Crea/asegura:
--   * `needs`             — espeja el modelo `Need` del proyecto
--   * `ingest_responses`  — auditoría de eventos crudos del webhook
--
-- RLS:
--   * `ingest_responses`: SOLO service role. No se crea NINGUNA política,
--     por lo que el rol `anon` no puede leer ni escribir (ni SELECT, ni
--     INSERT, ni UPDATE, ni DELETE). `service_role` (server / Edge
--     Functions) tiene BYPASSRLS y opera sin restricción.
--   * `needs`: RLS habilitado. El receptor escribe con `service_role`
--     (BYPASSRLS). Las políticas públicas pre-existentes de la app
--     frontend NO se modifican (fuera del alcance de esta historia).
--
-- Idempotente: puede ejecutarse sobre el esquema existente de la app.
-- =====================================================================

-- Habilitar extensión UUID (necesaria para PK uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. TABLA: needs (Solicitudes / Necesidades de ayuda)
--    Espeja el modelo `Need` de src/types.ts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id VARCHAR(100) NOT NULL DEFAULT 'cali',
  emergency_id VARCHAR(100) DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  place_type VARCHAR(100) DEFAULT 'EDIFICIO_AFECTADO',
  categories JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  -- Coordenadas OPCIONALES: un incidente del receptor puede llegar sin
  -- lat/lng y enriquecerse después con geocoding (ver ALTER abajo).
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'NEED_HELP_NOW',
  verification_status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  verified_by TEXT,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  source TEXT DEFAULT 'Reporte ciudadano en línea',
  source_url TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  organization_name TEXT,
  requester_type VARCHAR(50) DEFAULT 'PERSONA',
  operating_hours TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_by TEXT,
  expires_at TIMESTAMPTZ,
  is_demo_data BOOLEAN DEFAULT FALSE
);

-- Índices para filtrar needs por status, priority, verification_status y created_at
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_priority ON needs(priority);
CREATE INDEX IF NOT EXISTS idx_needs_verification ON needs(verification_status);
CREATE INDEX IF NOT EXISTS idx_needs_created_at ON needs(created_at DESC);

-- Permitir incidentes SIN coordenadas resueltas (lat/lng NULL) para que el
-- flujo de geocoding las enriquezca después. No fabricar coordenadas por defecto.
ALTER TABLE needs ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE needs ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE needs ALTER COLUMN latitude DROP DEFAULT;
ALTER TABLE needs ALTER COLUMN longitude DROP DEFAULT;

-- ---------------------------------------------------------------------
-- 2. TABLA: ingest_responses (Eventos crudos del webhook para auditoría)
--    Guarda el evento tal cual llega + metadatos + estado de procesamiento.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingest_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Clave de idempotencia: event.id del webhook (obligatoria y única).
  event_id TEXT NOT NULL,
  -- Metadatos del evento (normalizados para trazabilidad).
  type TEXT,
  conversation_id TEXT,
  "from" TEXT, -- número del ciudadano remitente (from es palabra reservada en SQL)
  message_type TEXT,
  workflow_step TEXT,
  -- Cuerpo del evento tal cual llega (auditoría). body = data.body del
  -- webhook; raw_payload = evento completo crudo (envelope).
  body JSONB,
  raw_payload JSONB,
  -- Estado de procesamiento del receptor.
  processing_status VARCHAR(50) DEFAULT 'PENDING',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ingest_responses_event_id_key UNIQUE (event_id)
);

-- Índices de procesamiento / agrupación para el receptor.
CREATE INDEX IF NOT EXISTS idx_ingest_responses_conversation_id ON ingest_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ingest_responses_processing_status ON ingest_responses(processing_status);
CREATE INDEX IF NOT EXISTS idx_ingest_responses_received_at ON ingest_responses(received_at DESC);

-- ---------------------------------------------------------------------
-- 3. RLS (Row Level Security)
-- ---------------------------------------------------------------------
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_responses ENABLE ROW LEVEL SECURITY;

-- NOTA de seguridad (ingest_responses):
-- No se crea NINGUNA política sobre `ingest_responses`. Con RLS habilitado
-- y sin políticas, el rol `anon` es rechazado en SELECT/INSERT/UPDATE/DELETE.
-- El rol `service_role` (server / Edge Functions) tiene BYPASSRLS y opera
-- sin restricción. En un proyecto Supabase los GRANT por defecto otorgan
-- acceso a nivel de tabla a `anon`, pero RLS es la barrera real a nivel de
-- fila: sin políticas, anon no ve ni escribe nada.

-- NOTA (needs):
-- La app frontend existente lee/escribe `needs` con la anon key a través de
-- políticas públicas pre-existentes (creadas por supabase/schema.sql). Esta
-- migración las conserva intactas. El receptor escribe `needs` con
-- `service_role` (BYPASSRLS).
