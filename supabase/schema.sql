-- =====================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE - AQUÍ HACE FALTA
-- Ejecutar este script en el SQL Editor de tu nuevo proyecto de Supabase
-- =====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: needs (Solicitudes / Necesidades de ayuda)
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
  latitude DOUBLE PRECISION NOT NULL DEFAULT 3.4516,
  longitude DOUBLE PRECISION NOT NULL DEFAULT -76.5320,
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

-- Índices para búsquedas y filtros rápidos en necesidades
CREATE INDEX IF NOT EXISTS idx_needs_city_id ON needs(city_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_priority ON needs(priority);
CREATE INDEX IF NOT EXISTS idx_needs_verification ON needs(verification_status);
CREATE INDEX IF NOT EXISTS idx_needs_created_at ON needs(created_at DESC);

-- 2. TABLA: offers (Ofertas de ayuda)
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id VARCHAR(100) NOT NULL DEFAULT 'cali',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  categories JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 3.4516,
  longitude DOUBLE PRECISION NOT NULL DEFAULT -76.5320,
  offer_status VARCHAR(50) DEFAULT 'AVAILABLE',
  verification_status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  organization_name TEXT,
  operating_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para ofertas
CREATE INDEX IF NOT EXISTS idx_offers_city_id ON offers(city_id);
CREATE INDEX IF NOT EXISTS idx_offers_verification ON offers(verification_status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);

-- 3. TABLA: reports (Reportes ciudadanos sobre necesidades)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID REFERENCES needs(id) ON DELETE CASCADE,
  need_title TEXT,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  reporter_contact TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 4. TABLA: offer_reports (Reportes ciudadanos sobre ofertas)
CREATE TABLE IF NOT EXISTS offer_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  offer_title TEXT,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  reporter_contact TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_offer_reports_status ON offer_reports(status);

-- 5. TABLA: update_logs (Historial de cambios en necesidades)
CREATE TABLE IF NOT EXISTS update_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID REFERENCES needs(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: audit_logs (Historial de auditoría para moderadores y administradores)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  need_id UUID,
  offer_id UUID,
  admin_email TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 7. TABLA: users (Moderadores y Administradores de la plataforma)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'MODERATOR',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insertar usuario Administrador por defecto
INSERT INTO users (email, name, password_hash, role, active)
VALUES ('admin@aquihacefalta.com', 'Administrador Principal', 'admin123', 'ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 8. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura y Escritura Públicas (Anon Key para la emergencia)
CREATE POLICY "Permitir lectura publica de necesidades" ON needs FOR SELECT USING (true);
CREATE POLICY "Permitir creacion publica de necesidades" ON needs FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion publica de necesidades" ON needs FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de ofertas" ON offers FOR SELECT USING (true);
CREATE POLICY "Permitir creacion publica de ofertas" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion publica de ofertas" ON offers FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de reportes" ON reports FOR SELECT USING (true);
CREATE POLICY "Permitir creacion publica de reportes" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion publica de reportes" ON reports FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de reportes ofertas" ON offer_reports FOR SELECT USING (true);
CREATE POLICY "Permitir creacion publica de reportes ofertas" ON offer_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion publica de reportes ofertas" ON offer_reports FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de logs" ON update_logs FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de logs" ON update_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de auditoria" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de auditoria" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de usuarios" ON users FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de usuarios" ON users FOR ALL USING (true);
