-- =====================================================================
-- MIGRACIÓN SUPABASE: Ajustes en organization_members para soporte de miembros en terreno y vinculación automática
-- Fecha: 6 de Octubre, 2026
-- =====================================================================

-- 1. Permitir miembros en terreno sin cuenta de usuario vinculada
ALTER TABLE public.organization_members ALTER COLUMN user_id DROP NOT NULL;

-- 2. Agregar columnas de contacto y logística
ALTER TABLE public.organization_members 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS veh TEXT,
  ADD COLUMN IF NOT EXISTS disp TEXT,
  ADD COLUMN IF NOT EXISTS ubicacion TEXT;

-- 3. Habilitar política de eliminación (para desvincular miembros)
DROP POLICY IF EXISTS "Permitir eliminacion de miembros" ON public.organization_members;
CREATE POLICY "Permitir eliminacion de miembros" 
  ON public.organization_members FOR DELETE USING (true);

-- 4. Actualizar trigger handle_new_user() para vinculación automática por correo al registrarse
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
