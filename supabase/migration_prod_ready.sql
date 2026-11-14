-- =====================================================================
-- MIGRACIÓN MAESTRA DE DEV A PRODUCCIÓN - RADAR DE AYUDA
-- Generada automáticamente tras comparar esquemas DEV vs PROD
-- =====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. ACTUALIZAR COLUMNAS EN TABLAS EXISTENTES EN PRODUCCIÓN
-- ---------------------------------------------------------------------

-- A. public.profiles (Actualización y homologación de usuarios existentes)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cargo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS community_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50) DEFAULT 'persona',
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notification_channels JSONB DEFAULT '[]'::jsonb;

-- Homologar perfiles existentes en producción según su rol histórico
UPDATE public.profiles
SET profile_type = CASE 
  WHEN role = 'entidad_profesional' THEN 'organizacion'
  WHEN role IN ('lider', 'comunidad') THEN 'liderazgo'
  ELSE 'persona'
END
WHERE profile_type IS NULL OR profile_type = 'persona';

-- Asegurar que los dueños de organizaciones queden con profile_type = 'organizacion'
UPDATE public.profiles
SET profile_type = 'organizacion'
WHERE id IN (SELECT user_id FROM public.organizations WHERE user_id IS NOT NULL);

-- Inicializar whatsapp con phone si está vacío
UPDATE public.profiles
SET whatsapp = phone
WHERE (whatsapp IS NULL OR whatsapp = '') AND phone IS NOT NULL;

-- B. public.organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'nit',
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- C. public.needs
ALTER TABLE public.needs 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS emergency_event TEXT,
  ADD COLUMN IF NOT EXISTS access_instructions TEXT,
  ADD COLUMN IF NOT EXISTS is_whatsapp BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_notes TEXT,
  ADD COLUMN IF NOT EXISTS days_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS affected_properties INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS affected_people INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS affected_animals INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS como_llegar TEXT,
  ADD COLUMN IF NOT EXISTS para_quien TEXT;

CREATE INDEX IF NOT EXISTS idx_needs_user_id ON public.needs(user_id);

-- D. public.offers
ALTER TABLE public.offers 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(50),
  ADD COLUMN IF NOT EXISTS delivery_radius VARCHAR(100),
  ADD COLUMN IF NOT EXISTS coverage_radius VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shipping_cost VARCHAR(50),
  ADD COLUMN IF NOT EXISTS remote_channels TEXT,
  ADD COLUMN IF NOT EXISTS remote_schedule TEXT,
  ADD COLUMN IF NOT EXISTS is_whatsapp BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_organization_name BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS contact_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);

-- E. public.ingest_responses
ALTER TABLE public.ingest_responses 
  ADD COLUMN IF NOT EXISTS raw_event JSONB;

-- ---------------------------------------------------------------------
-- 2. CREAR TABLAS NUEVAS QUE FALTAN EN PRODUCCIÓN
-- ---------------------------------------------------------------------

-- A. public.need_items (Desglose de insumos en necesidades)
CREATE TABLE IF NOT EXISTS public.need_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID REFERENCES public.needs(id) ON DELETE CASCADE NOT NULL,
  resource_id VARCHAR(100),
  category_id VARCHAR(100),
  resource_name TEXT NOT NULL,
  unit VARCHAR(50) DEFAULT 'unidades',
  target_quantity DOUBLE PRECISION DEFAULT 1,
  fulfilled_quantity DOUBLE PRECISION DEFAULT 0,
  calculation_type VARCHAR(50),
  formula_breakdown TEXT,
  qualitative_details TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_need_items_need_id ON public.need_items(need_id);

-- B. public.offer_items (Desglose de insumos en ofertas)
CREATE TABLE IF NOT EXISTS public.offer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
  resource_id VARCHAR(100),
  category_id VARCHAR(100),
  resource_name TEXT NOT NULL,
  unit VARCHAR(50) DEFAULT 'unidades',
  available_quantity DOUBLE PRECISION DEFAULT 1,
  fulfilled_quantity DOUBLE PRECISION DEFAULT 0,
  status VARCHAR(50) DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON public.offer_items(offer_id);

-- C. public.organization_members (Miembros del equipo de cada organización)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  veh TEXT,
  disp TEXT,
  ubicacion TEXT,
  role_in_org VARCHAR(50) DEFAULT 'operativo',
  member_title TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- D. public.commitments (Transacciones, cruces y seguimiento de entregas)
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
  medio_envio TEXT,
  empresa_transporte TEXT,
  numero_guia TEXT,
  notas_camino TEXT,
  notes_camino TEXT,
  notas_entrega TEXT,
  notes_entrega TEXT,
  personas_beneficiadas INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commitments_need ON public.commitments(need_id);
CREATE INDEX IF NOT EXISTS idx_commitments_offer ON public.commitments(offer_id);
CREATE INDEX IF NOT EXISTS idx_commitments_provider_org ON public.commitments(provider_organization_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON public.commitments(status);

-- E. public.notifications (Avisos en vivo en la campanita)
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

-- F. Catálogos Maestros (emergency_events, help_categories, help_resources, emergency_suggested_resources)
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.help_categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.help_resources (
  id VARCHAR(100) PRIMARY KEY,
  category_id VARCHAR(100) NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(100) NOT NULL,
  unit_type TEXT,
  calculation_type TEXT,
  ration_per_unit NUMERIC,
  formula_divisor NUMERIC,
  population_base TEXT,
  multiplies_days BOOLEAN,
  detail_prompt TEXT,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_suggested_resources (
  emergency_event_id VARCHAR(100) NOT NULL REFERENCES public.emergency_events(id) ON DELETE CASCADE,
  resource_id VARCHAR(100) NOT NULL REFERENCES public.help_resources(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (emergency_event_id, resource_id)
);

-- ---------------------------------------------------------------------
-- 3. POLÍTICAS DE SEGURIDAD RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.need_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_suggested_resources ENABLE ROW LEVEL SECURITY;

-- need_items
DROP POLICY IF EXISTS "Permitir lectura publica de need_items" ON public.need_items;
CREATE POLICY "Permitir lectura publica de need_items" ON public.need_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de need_items" ON public.need_items;
CREATE POLICY "Permitir insercion publica de need_items" ON public.need_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de need_items" ON public.need_items;
CREATE POLICY "Permitir edicion publica de need_items" ON public.need_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir eliminacion publica de need_items" ON public.need_items;
CREATE POLICY "Permitir eliminacion publica de need_items" ON public.need_items FOR DELETE USING (true);

-- offer_items
DROP POLICY IF EXISTS "Permitir lectura publica de offer_items" ON public.offer_items;
CREATE POLICY "Permitir lectura publica de offer_items" ON public.offer_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de offer_items" ON public.offer_items;
CREATE POLICY "Permitir insercion publica de offer_items" ON public.offer_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de offer_items" ON public.offer_items;
CREATE POLICY "Permitir edicion publica de offer_items" ON public.offer_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir eliminacion publica de offer_items" ON public.offer_items;
CREATE POLICY "Permitir eliminacion publica de offer_items" ON public.offer_items FOR DELETE USING (true);

-- organization_members
DROP POLICY IF EXISTS "Permitir lectura publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir lectura publica de miembros" ON public.organization_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir insercion publica de miembros" ON public.organization_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de miembros" ON public.organization_members;
CREATE POLICY "Permitir edicion publica de miembros" ON public.organization_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir eliminacion de miembros" ON public.organization_members;
CREATE POLICY "Permitir eliminacion de miembros" ON public.organization_members FOR DELETE USING (true);

-- commitments
DROP POLICY IF EXISTS "Permitir lectura publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir lectura publica de compromisos" ON public.commitments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir insercion publica de compromisos" ON public.commitments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de compromisos" ON public.commitments;
CREATE POLICY "Permitir edicion publica de compromisos" ON public.commitments FOR UPDATE USING (true);

-- notifications
DROP POLICY IF EXISTS "Permitir lectura publica de notificaciones" ON public.notifications;
CREATE POLICY "Permitir lectura publica de notificaciones" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercion publica de notificaciones" ON public.notifications;
CREATE POLICY "Permitir insercion publica de notificaciones" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir edicion publica de notificaciones" ON public.notifications;
CREATE POLICY "Permitir edicion publica de notificaciones" ON public.notifications FOR UPDATE USING (true);

-- Catalogos
DROP POLICY IF EXISTS "Permitir lectura publica de emergency_events" ON public.emergency_events;
CREATE POLICY "Permitir lectura publica de emergency_events" ON public.emergency_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir lectura publica de help_categories" ON public.help_categories;
CREATE POLICY "Permitir lectura publica de help_categories" ON public.help_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir lectura publica de help_resources" ON public.help_resources;
CREATE POLICY "Permitir lectura publica de help_resources" ON public.help_resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir lectura publica de recursos sugeridos" ON public.emergency_suggested_resources;
CREATE POLICY "Permitir lectura publica de recursos sugeridos" ON public.emergency_suggested_resources FOR SELECT USING (true);

-- Permisos Service Role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.need_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.offer_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organization_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.commitments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO service_role;

-- ---------------------------------------------------------------------
-- 4. TRIGGER HANDLE_NEW_USER ACTUALIZADO
-- ---------------------------------------------------------------------
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
    whatsapp,
    document_type,
    document_number,
    cargo,
    community_type,
    country,
    department,
    city,
    is_auto_detected_location,
    role,
    profile_type,
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'phone_country_code', '+57'),
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phone_number'),
    NEW.raw_user_meta_data->>'whatsapp',
    COALESCE(NEW.raw_user_meta_data->>'document_type', 'cedula'),
    NEW.raw_user_meta_data->>'document_number',
    NEW.raw_user_meta_data->>'cargo',
    NEW.raw_user_meta_data->>'community_type',
    COALESCE(NEW.raw_user_meta_data->>'country', 'Colombia'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Valle del Cauca'),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Cali'),
    COALESCE((NEW.raw_user_meta_data->>'is_auto_detected_location')::boolean, true),
    COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario'),
    COALESCE(NEW.raw_user_meta_data->>'profile_type', 'persona'),
    COALESCE((NEW.raw_user_meta_data->>'accept_terms')::boolean, true),
    NOW(),
    NEW.raw_user_meta_data->>'moderator_community_collective',
    NEW.raw_user_meta_data->>'moderator_motivation',
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IN ('moderador', 'lider') THEN 'PENDING'
      ELSE 'APPROVED'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    document_type = EXCLUDED.document_type,
    document_number = EXCLUDED.document_number,
    cargo = EXCLUDED.cargo,
    community_type = EXCLUDED.community_type,
    country = EXCLUDED.country,
    department = EXCLUDED.department,
    city = EXCLUDED.city,
    updated_at = NOW();

  -- Vincular automáticamente miembros agregados previamente por su correo
  UPDATE public.organization_members 
  SET user_id = NEW.id 
  WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 5. SEMBRAR CATÁLOGOS BASE (MIGRACIÓN DESDE DEV A PROD)
-- ---------------------------------------------------------------------

-- A. emergency_events (7 filas)
INSERT INTO public.emergency_events (id, name, description, icon, is_active, display_order)
VALUES
  ('inundacion', 'Inundación', NULL, 'droplet', TRUE, 1),
  ('terremoto', 'Terremoto', NULL, 'activity', TRUE, 2),
  ('vendaval', 'Vendaval / Tormenta', NULL, 'wind', TRUE, 3),
  ('incendio', 'Incendio forestal / Erupción', NULL, 'flame', TRUE, 4),
  ('derrumbe', 'Derrumbe / Deslizamiento', NULL, 'mountain', TRUE, 5),
  ('epidemia', 'Epidemia / Emergencia sanitaria', NULL, 'shield-alert', TRUE, 6),
  ('otra', 'Otra emergencia comunitaria', NULL, 'alert-circle', TRUE, 7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- B. help_categories (9 filas)
INSERT INTO public.help_categories (id, name, description, icon, is_active, display_order)
VALUES
  ('viveres_bienestar', 'Víveres y bienestar básico', NULL, 'shopping-bag', TRUE, 1),
  ('salud_asistencia', 'Salud y asistencia', NULL, 'heart-pulse', TRUE, 2),
  ('rescate_maquinaria', 'Rescate y maquinaria', NULL, 'truck', TRUE, 3),
  ('materiales_reconstruccion', 'Materiales y reconstrucción', NULL, 'hammer', TRUE, 4),
  ('transporte_instalaciones', 'Transporte e instalaciones', NULL, 'bus', TRUE, 5),
  ('donacion_economica', 'Donación económica', NULL, 'dollar-sign', TRUE, 6),
  ('servicios_tecnicos', 'Capacidades y servicios técnicos', NULL, 'briefcase', TRUE, 7),
  ('voluntariado_comunitario', 'Voluntariado y apoyo comunitario', NULL, 'users', TRUE, 8),
  ('otro', 'Otro', NULL, 'package', TRUE, 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- C. help_resources (46 filas)
INSERT INTO public.help_resources (id, category_id, name, unit, unit_type, calculation_type, ration_per_unit, formula_divisor, population_base, multiplies_days, detail_prompt, is_active, display_order)
VALUES
  ('agua_potable', 'viveres_bienestar', 'Agua potable', 'L', 'continuous', 'AUTO_FORMULA', 3, 1, 'personas', TRUE, '¿Cómo puedes recibir el agua? (ej. carrotanque, bolsas, botellones)', TRUE, 1),
  ('alimentos', 'viveres_bienestar', 'Alimentos', 'kits', 'discrete', 'AUTO_FORMULA', 1, 75, 'personas', TRUE, '¿Qué tipo de alimentos? (ej. mercados no perecederos, comida preparada, alimento para bebés, sin gluten)', TRUE, 2),
  ('ropa_calzado', 'viveres_bienestar', 'Ropa y calzado', 'mudas', 'discrete', 'AUTO_FORMULA', 1, 1, 'personas', FALSE, '¿Qué ropa hace falta? (ej. tallas de niños, zapatos, ropa de frío)', TRUE, 3),
  ('implementos_aseo', 'viveres_bienestar', 'Implementos de aseo e higiene', 'kits', 'discrete', 'AUTO_FORMULA', 1, 150, 'personas', TRUE, '¿Qué implementos de aseo? (ej. pañales de bebé, toallas higiénicas, jabón)', TRUE, 4),
  ('cobijas_colchonetas', 'viveres_bienestar', 'Cobijas y colchonetas', 'juegos', 'discrete', 'AUTO_FORMULA', 1, 1, 'personas', FALSE, '¿Cobijas, colchonetas o ambas?', TRUE, 5),
  ('alimento_animales', 'viveres_bienestar', 'Cuidado y alimento de animales', 'kg', 'continuous', 'AUTO_FORMULA', 1, 1, 'animales', TRUE, '¿Qué animales son y qué necesitas? (ej. perros, gatos, ganado, atención veterinaria)', TRUE, 6),
  ('atencion_medica', 'salud_asistencia', 'Atención médica', 'profesionales', 'discrete', 'AUTO_FORMULA', 1, 100, 'personas', FALSE, '¿Qué perfil de salud necesitas? (ej. médico general, enfermería, pediatría)', TRUE, 7),
  ('medicamentos_botiquin', 'salud_asistencia', 'Medicamentos / Botiquín', 'botiquines', 'discrete', 'AUTO_FORMULA', 1, 50, 'personas', FALSE, '¿Qué medicamentos necesitas? (ej. sueros, insulina refrigerada, antibióticos)', TRUE, 8),
  ('donar_sangre', 'salud_asistencia', 'Donar sangre / Banco de sangre', 'donantes', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué tipo de sangre necesitas? (ej. O+, A-, hospital donde se dona)', TRUE, 9),
  ('proteccion_respiratoria', 'salud_asistencia', 'Protección respiratoria', 'unidades', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué protección respiratoria? (ej. N95 para humo/ceniza, tapabocas quirúrgicos)', TRUE, 10),
  ('equipo_rescate', 'rescate_maquinaria', 'Equipo búsqueda y rescate', 'personas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué tipo de rescate? (ej. estructuras colapsadas, rescate en el agua, perros de búsqueda, rescate en ladera)', TRUE, 11),
  ('herramientas_mano', 'rescate_maquinaria', 'Herramientas de mano', 'juegos', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué herramientas de mano? (ej. palas, picas, machetes)', TRUE, 12),
  ('remocion_escombros', 'rescate_maquinaria', 'Remoción de escombros y barro', 'cuadrillas', 'discrete', 'AUTO_FORMULA', 1, 4, 'inmuebles', FALSE, '¿Qué necesitas remover? (ej. barro y lodo, escombros de construcción, árboles caídos)', TRUE, 13),
  ('maquinaria_pesada', 'rescate_maquinaria', 'Maquinaria pesada y operarios', 'máquinas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué maquinaria necesitas? (ej. retroexcavadora, volqueta, cargador, grúa, minicargador)', TRUE, 14),
  ('plantas_electricas', 'rescate_maquinaria', 'Plantas eléctricas / Generadores', 'plantas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué planta eléctrica necesitas? (ej. potencia en kW requerida)', TRUE, 15),
  ('equipos_bombeo', 'rescate_maquinaria', 'Equipos de bombeo', 'motobombas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué necesitas bombear? (ej. agua de sótanos con lodo)', TRUE, 16),
  ('evaluacion_estructural', 'materiales_reconstruccion', 'Evaluación estructural y técnica', 'evaluaciones', 'discrete', 'AUTO_FORMULA', 1, 1, 'inmuebles', FALSE, '¿Qué necesitas evaluar? (ej. muros con grietas, riesgo de colapso)', TRUE, 17),
  ('materiales_obra', 'materiales_reconstruccion', 'Materiales de obra básica', 'bultos', 'discrete', 'AUTO_FORMULA', 40, 1, 'inmuebles', FALSE, '¿Qué materiales de obra? (ej. cemento, arena, gravilla)', TRUE, 18),
  ('ferreteria_instalaciones', 'materiales_reconstruccion', 'Ferretería e instalaciones básicas', 'viviendas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué instalaciones necesitas arreglar? (ej. tuberías rotas, cables)', TRUE, 19),
  ('cubiertas_cerramientos', 'materiales_reconstruccion', 'Cubiertas y cerramientos', 'tejas', 'discrete', 'AUTO_FORMULA', 12, 1, 'inmuebles', FALSE, '¿Qué tipo de cubierta? (ej. zinc, fibrocemento, plásticos)', TRUE, 20),
  ('herramientas_construccion', 'materiales_reconstruccion', 'Herramientas de construcción', 'juegos', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué herramientas de construcción? (ej. taladros, mezcladoras)', TRUE, 21),
  ('mano_obra_tecnica', 'materiales_reconstruccion', 'Mano de obra técnica y oficios', 'personas', 'discrete', 'AUTO_FORMULA', 2, 1, 'inmuebles', FALSE, '¿Qué oficios necesitas? (ej. albañil, plomero, electricista)', TRUE, 22),
  ('alojamiento_temporal', 'transporte_instalaciones', 'Alojamiento temporal', 'cupos', 'discrete', 'AUTO_FORMULA', 1, 1, 'personas', FALSE, '¿Para quién es el alojamiento? Por cuántas noches', TRUE, 23),
  ('transporte_terrestre', 'transporte_instalaciones', 'Transporte terrestre', 'viajes', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Para qué es el transporte? La vía nos dice qué carro puede llegar', TRUE, 24),
  ('transporte_aereo', 'transporte_instalaciones', 'Transporte aéreo', 'personas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Para qué es el transporte aéreo? (ej. evacuación médica urgente)', TRUE, 25),
  ('transporte_fluvial', 'transporte_instalaciones', 'Transporte fluvial', 'viajes', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Para qué es el transporte fluvial? (ej. lanchas para transportar víveres)', TRUE, 26),
  ('saneamiento_banos', 'transporte_instalaciones', 'Saneamiento y baños portátiles', 'unidades', 'discrete', 'AUTO_FORMULA', 1, 20, 'personas', FALSE, '¿Qué necesitas de saneamiento? (ej. baños portátiles, duchas)', TRUE, 27),
  ('almacenamiento_bodegaje', 'transporte_instalaciones', 'Almacenamiento y bodegaje', 'm²', 'continuous', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué necesitas guardar? (ej. alimentos bajo techo)', TRUE, 28),
  ('espacios_educativos', 'transporte_instalaciones', 'Aulas y espacios educativos temporales', 'cupos', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Cuántos niños y niñas y qué tipo de espacio?', TRUE, 29),
  ('cocinas_comunitarias', 'transporte_instalaciones', 'Cocinas comunitarias', 'raciones al día', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Cuántas raciones al día y qué equipo hace falta?', TRUE, 30),
  ('aporte_economico', 'donacion_economica', 'Aporte económico / Donación en dinero', 'pesos', 'continuous', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Cuánto y para qué? (ej. Nequi o cuenta bancaria institucional)', TRUE, 31),
  ('ing_arquitectura_peritaje', 'servicios_tecnicos', 'Ingeniería, arquitectura y peritaje', 'profesionales', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué necesitas que revisen o diseñen?', TRUE, 32),
  ('geologia_geotecnia', 'servicios_tecnicos', 'Geología, geotecnia y gestión del riesgo', 'profesionales', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué hay que evaluar del terreno?', TRUE, 33),
  ('asesoria_legal', 'servicios_tecnicos', 'Asesoría legal y jurídica', 'profesionales', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿En qué necesitas asesoría legal?', TRUE, 34),
  ('auditoria_contabilidad', 'servicios_tecnicos', 'Auditoría, contabilidad y finanzas', 'profesionales', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿En qué necesitas apoyo contable?', TRUE, 35),
  ('veterinaria_zootecnia', 'servicios_tecnicos', 'Veterinaria y manejo zootécnico', 'profesionales', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué necesitan los animales?', TRUE, 36),
  ('salud_mental_psicosocial', 'servicios_tecnicos', 'Salud mental y apoyo psicosocial', 'profesionales', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Para quién es el acompañamiento psicosocial?', TRUE, 37),
  ('voluntariado_acopio', 'voluntariado_comunitario', 'Voluntariado en acopio y empaque', 'personas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿En qué horario y cuántas personas?', TRUE, 38),
  ('voluntariado_terreno', 'voluntariado_comunitario', 'Voluntariado en terreno', 'personas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué perfil de voluntariado en terreno necesitas?', TRUE, 39),
  ('voluntariado_social', 'voluntariado_comunitario', 'Voluntariado social y comunitario', 'personas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Para qué actividad es el voluntariado social?', TRUE, 40),
  ('voluntariado_censo_registro', 'voluntariado_comunitario', 'Censo, registro y apoyo operativo', 'personas', 'discrete', 'MANUAL', NULL, NULL, NULL, FALSE, '¿Qué apoyo operativo o censo necesitas?', TRUE, 41),
  ('aulas_temporales', 'transporte_instalaciones', 'Aulas y espacios educativos temporales', 'aulas', 'discrete', 'MANUAL', NULL, 1, NULL, FALSE, NULL, TRUE, 29),
  ('ingenieria_peritaje', 'servicios_tecnicos', 'Ingeniería, arquitectura y peritaje', 'profesionales', 'discrete', 'MANUAL', NULL, 1, NULL, FALSE, NULL, TRUE, 32),
  ('geologia_gestion_riesgo', 'servicios_tecnicos', 'Geología, geotecnia y gestión del riesgo', 'profesionales', 'discrete', 'MANUAL', NULL, 1, NULL, FALSE, NULL, TRUE, 33),
  ('censo_apoyo_operativo', 'voluntariado_comunitario', 'Censo, registro y apoyo operativo', 'voluntarios', 'discrete', 'MANUAL', NULL, 1, NULL, FALSE, NULL, TRUE, 41),
  ('otro', 'otro', 'Otro recurso', 'unidades', 'discrete', 'MANUAL', NULL, 1, NULL, FALSE, NULL, TRUE, 99)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  unit_type = EXCLUDED.unit_type,
  calculation_type = EXCLUDED.calculation_type,
  ration_per_unit = EXCLUDED.ration_per_unit,
  formula_divisor = EXCLUDED.formula_divisor,
  population_base = EXCLUDED.population_base,
  multiplies_days = EXCLUDED.multiplies_days,
  detail_prompt = EXCLUDED.detail_prompt,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- D. emergency_suggested_resources (34 filas)
INSERT INTO public.emergency_suggested_resources (emergency_event_id, resource_id, display_order)
VALUES
  ('inundacion', 'agua_potable', 1),
  ('inundacion', 'equipos_bombeo', 2),
  ('inundacion', 'alimentos', 3),
  ('inundacion', 'cobijas_colchonetas', 4),
  ('inundacion', 'remocion_escombros', 5),
  ('terremoto', 'equipo_rescate', 1),
  ('terremoto', 'atencion_medica', 2),
  ('terremoto', 'evaluacion_estructural', 3),
  ('terremoto', 'maquinaria_pesada', 4),
  ('terremoto', 'cobijas_colchonetas', 5),
  ('vendaval', 'cubiertas_cerramientos', 1),
  ('vendaval', 'herramientas_mano', 2),
  ('vendaval', 'plantas_electricas', 3),
  ('vendaval', 'cobijas_colchonetas', 4),
  ('vendaval', 'remocion_escombros', 5),
  ('incendio', 'proteccion_respiratoria', 1),
  ('incendio', 'agua_potable', 2),
  ('incendio', 'medicamentos_botiquin', 3),
  ('incendio', 'herramientas_mano', 4),
  ('incendio', 'alimento_animales', 5),
  ('derrumbe', 'maquinaria_pesada', 1),
  ('derrumbe', 'equipo_rescate', 2),
  ('derrumbe', 'remocion_escombros', 3),
  ('derrumbe', 'transporte_terrestre', 4),
  ('derrumbe', 'alimentos', 5),
  ('epidemia', 'medicamentos_botiquin', 1),
  ('epidemia', 'proteccion_respiratoria', 2),
  ('epidemia', 'atencion_medica', 3),
  ('epidemia', 'implementos_aseo', 4),
  ('epidemia', 'agua_potable', 5),
  ('otra', 'agua_potable', 1),
  ('otra', 'alimentos', 2),
  ('otra', 'atencion_medica', 3),
  ('otra', 'salud_mental_psicosocial', 4)
ON CONFLICT (emergency_event_id, resource_id) DO UPDATE SET
  display_order = EXCLUDED.display_order;

-- ---------------------------------------------------------------------
-- 6. RECARGAR CACHÉ DE POSTGREST
-- ---------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
