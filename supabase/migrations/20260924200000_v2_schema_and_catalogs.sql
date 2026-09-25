-- ==============================================================================
-- MIGRACIÓN DE CONSOLIDACIÓN Y ACTUALIZACIÓN DEL ESQUEMA SUPABASE (REGISTRO V2 & CATÁLOGOS)
-- ==============================================================================

-- 1. Asegurar columnas adicionales en public.profiles para el Registro v2
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50) DEFAULT 'persona';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS community_type VARCHAR(100);

-- 2. Asegurar columnas de contacto en public.organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- 3. Tabla de Eventos de Emergencia (emergency_events)
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'emergency_events' AND policyname = 'Permitir lectura pública de emergency_events'
  ) THEN
    CREATE POLICY "Permitir lectura pública de emergency_events"
      ON public.emergency_events
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Datos Semilla de Eventos de Emergencia
INSERT INTO public.emergency_events (id, name, display_order, is_active)
VALUES
  ('inundacion', 'Inundación / Creciente', 1, true),
  ('terremoto', 'Terremoto / Sismo', 2, true),
  ('vendaval', 'Vendaval / Tormenta', 3, true),
  ('incendio', 'Incendio Forestal o Estructural', 4, true),
  ('derrumbe', 'Derrumbe / Deslizamiento', 5, true),
  ('epidemia', 'Epidemia / Emergencia Sanitaria', 6, true),
  ('otra', 'Otra Emergencia', 7, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. Actualizar la función trigger para el registro de nuevos usuarios en auth.users
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
