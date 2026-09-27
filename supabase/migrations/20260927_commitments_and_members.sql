-- =====================================================================
-- MIGRACIÓN SUPABASE: Tabla de Compromisos (Entregas) y Miembros de Organización
-- Fecha: 27 de Septiembre, 2026
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLA: commitments (Compromisos, seguimiento de entregas y cruces)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referencias opcionales a Necesidad y/o Oferta (Al menos uno debe existir)
  need_id UUID REFERENCES public.needs(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  
  -- Participantes (Usuario solicitante y Usuario/Organización prestadora de ayuda)
  requester_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Origen del compromiso: 'DIRECT_NEED_RESPONSE', 'DIRECT_OFFER_REQUEST', 'OFFER_NEED_MATCH'
  origin_type VARCHAR(50) DEFAULT 'DIRECT_NEED_RESPONSE',
  
  -- Detalle del recurso comprometido
  resource_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
  unit VARCHAR(50) NOT NULL DEFAULT 'unidades',
  
  -- Ciclo de vida / Estado de entrega
  -- Valores: 'nueva', 'aceptada', 'camino', 'entregada', 'confirmada', 'rechazada', 'archivada'
  status VARCHAR(50) DEFAULT 'nueva',
  
  -- Logística y voluntariado asignado
  assigned_volunteer_name TEXT,
  assigned_volunteer_phone TEXT,
  delivery_date TIMESTAMPTZ,
  
  -- Cierre de entrega, evidencias fotográficas e historias de impacto
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
  role_in_org VARCHAR(50) DEFAULT 'operativo', -- 'admin', 'coordinador', 'operativo'
  member_title TEXT, -- Ej: 'Coordinador de Voluntarios', 'Enlace operativo'
  status VARCHAR(50) DEFAULT 'ACTIVO', -- 'INVITADO', 'ACTIVO', 'INACTIVO'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_member UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- ---------------------------------------------------------------------
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- ---------------------------------------------------------------------
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Políticas para commitments
DROP POLICY IF EXISTS "Permitir lectura publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir lectura publica de compromisos" ON public.commitments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir insercion publica de compromisos" ON public.commitments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir edicion publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir edicion publica de compromisos" ON public.commitments FOR UPDATE USING (true);

-- Políticas para organization_members
DROP POLICY IF EXISTS "Permitir lectura publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir lectura publica de miembros" ON public.organization_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir insercion publica de miembros" ON public.organization_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir edicion publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir edicion publica de miembros" ON public.organization_members FOR UPDATE USING (true);

-- Permisos Service Role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.commitments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organization_members TO service_role;
