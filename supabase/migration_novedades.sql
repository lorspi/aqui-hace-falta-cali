-- =====================================================================
-- MIGRACIÓN DE NUEVAS TABLAS PARA SUPABASE (AQUÍ HACE FALTA)
-- Copia y ejecuta este bloque en el SQL Editor de tu proyecto Supabase
-- =====================================================================

-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. TABLA: commitments (Compromisos, seguimiento de entregas y cruces)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID REFERENCES public.needs(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  requester_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  origin_type VARCHAR(50) DEFAULT 'DIRECT_NEED_RESPONSE',
  resource_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
  unit VARCHAR(50) NOT NULL DEFAULT 'unidades',
  status VARCHAR(50) DEFAULT 'nueva',
  assigned_volunteer_name TEXT,
  assigned_volunteer_phone TEXT,
  delivery_date TIMESTAMPTZ,
  confirmation_story TEXT,
  delivery_photos JSONB DEFAULT '[]'::jsonb,
  reception_photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_need_or_offer CHECK (need_id IS NOT NULL OR offer_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_commitments_need ON public.commitments(need_id);
CREATE INDEX IF NOT EXISTS idx_commitments_offer ON public.commitments(offer_id);
CREATE INDEX IF NOT EXISTS idx_commitments_provider_org ON public.commitments(provider_organization_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON public.commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_created_at ON public.commitments(created_at DESC);

-- ---------------------------------------------------------------------
-- 2. TABLA: organization_members (Miembros y colaboradores del equipo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_in_org VARCHAR(50) DEFAULT 'operativo',
  member_title TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_member UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- ---------------------------------------------------------------------
-- 3. TABLA: notifications (Notificaciones y avisos del usuario en vivo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) DEFAULT 'solicitud',
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  sender_name TEXT,
  action_text TEXT,
  action_level VARCHAR(20) DEFAULT 'terciario',
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ---------------------------------------------------------------------
-- POLÍTICAS RLS Y PERMISOS DE ACCESO
-- ---------------------------------------------------------------------
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de compromisos
DROP POLICY IF EXISTS "Permitir lectura publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir lectura publica de compromisos" ON public.commitments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir insercion publica de compromisos" ON public.commitments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir edicion publica de compromisos" ON public.commitments FOR UPDATE USING (true);

-- Políticas de miembros
DROP POLICY IF EXISTS "Permitir lectura publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir lectura publica de miembros" ON public.organization_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir insercion publica de miembros" ON public.organization_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir edicion publica de miembros" ON public.organization_members FOR UPDATE USING (true);

-- Políticas de notificaciones
DROP POLICY IF EXISTS "Permitir lectura publica de notificaciones" ON public.notifications;
CREATE POLICY "Permitir lectura publica de notificaciones" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de notificaciones" ON public.notifications;
CREATE POLICY "Permitir insercion publica de notificaciones" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de notificaciones" ON public.notifications;
CREATE POLICY "Permitir edicion publica de notificaciones" ON public.notifications FOR UPDATE USING (true);

-- Permisos para Service Role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.commitments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organization_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO service_role;
