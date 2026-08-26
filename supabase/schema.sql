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
  department_id VARCHAR(100),
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
  department_id VARCHAR(100),
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

-- 5b. TABLA: offer_update_logs (Historial de actualizaciones en ofertas)
CREATE TABLE IF NOT EXISTS offer_update_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
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

-- 7. TABLA: profiles (Perfiles completos de usuarios vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  phone_country_code VARCHAR(10) DEFAULT '+57',
  phone_number VARCHAR(50),
  phone VARCHAR(50),
  document_type VARCHAR(50) DEFAULT 'cedula',
  document_number VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Colombia',
  department VARCHAR(100) DEFAULT 'Quindío',
  city VARCHAR(100) DEFAULT 'Armenia',
  is_auto_detected_location BOOLEAN DEFAULT TRUE,
  role VARCHAR(50) DEFAULT 'regular',
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Auditoría de Términos y Condiciones
  accept_terms BOOLEAN DEFAULT TRUE NOT NULL,
  terms_accepted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Postulación como Moderador
  moderator_community_collective TEXT,
  moderator_motivation TEXT,
  moderation_status VARCHAR(50) DEFAULT 'PENDING',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- 8. TABLA: organizations (Organizaciones / Entidades gubernamentales y ONGs)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  org_name TEXT NOT NULL,
  organization_type VARCHAR(100) NOT NULL,
  description TEXT,
  website_or_social TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  document_type VARCHAR(50) DEFAULT 'nit',
  document_number VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_user_id ON public.organizations(user_id);

-- 9. TRIGGER: Creación automática de perfiles desde auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone_country_code,
    phone_number,
    phone,
    document_type,
    document_number,
    country,
    department,
    city,
    is_auto_detected_location,
    role,
    accept_terms,
    terms_accepted_at,
    moderator_community_collective,
    moderator_motivation,
    moderation_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'phone_country_code', '+57'),
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'document_type', 'cedula'),
    NEW.raw_user_meta_data->>'document_number',
    COALESCE(NEW.raw_user_meta_data->>'country', 'Colombia'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Quindío'),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Armenia'),
    COALESCE((NEW.raw_user_meta_data->>'is_auto_detected_location')::boolean, true),
    COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario'),
    COALESCE((NEW.raw_user_meta_data->>'accept_terms')::boolean, true),
    NOW(),
    NEW.raw_user_meta_data->>'moderator_community_collective',
    NEW.raw_user_meta_data->>'moderator_motivation',
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'moderador' THEN 'PENDING'
      ELSE 'APPROVED'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    document_type = EXCLUDED.document_type,
    document_number = EXCLUDED.document_number,
    country = EXCLUDED.country,
    department = EXCLUDED.department,
    city = EXCLUDED.city,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas de Emergencia
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

CREATE POLICY "Permitir lectura publica de logs ofertas" ON offer_update_logs FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de logs ofertas" ON offer_update_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de auditoria" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de auditoria" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de perfiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de perfiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura de organizaciones" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de organizaciones" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de organizaciones" ON public.organizations FOR UPDATE USING (true);
