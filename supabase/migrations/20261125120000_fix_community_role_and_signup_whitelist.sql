-- =====================================================================
-- MIGRACIÓN: Separar rol de Comunidad ('lider') y blindar handle_new_user()
-- =====================================================================
-- PASO PREVIO DE AUDITORÍA (ejecutar primero como SELECT solo-lectura en SQL Editor
-- para revisar qué cuentas tienen actualmente role admin o moderador en DEV y PROD):
--
--   SELECT id, email, full_name, role, profile_type, moderation_status, created_at
--   FROM public.profiles
--   WHERE LOWER(COALESCE(role, '')) IN ('admin', 'administrador', 'moderador', 'moderator')
--   ORDER BY created_at DESC;
-- =====================================================================

-- 1. Actualizar trigger handle_new_user() con whitelist estricta de roles públicos
-- Ningún cliente puede auto-asignarse 'ADMIN' ni 'moderador' desde auth.signUp().
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_requested_role TEXT;
  v_safe_role TEXT;
BEGIN
  v_requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario')));

  -- Lista blanca estricta de roles permitidos en autoregistro público
  IF v_requested_role IN ('voluntario', 'regular', 'entidad_profesional', 'lider') THEN
    v_safe_role := v_requested_role;
  ELSE
    v_safe_role := 'voluntario';
  END IF;

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
    v_safe_role,
    COALESCE(NEW.raw_user_meta_data->>'profile_type', 'persona'),
    COALESCE((NEW.raw_user_meta_data->>'accept_terms')::boolean, true),
    NOW(),
    NEW.raw_user_meta_data->>'moderator_community_collective',
    NEW.raw_user_meta_data->>'moderator_motivation',
    'APPROVED'
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

-- 2. Sanear cuentas existentes de Comunidad que quedaron con role = 'moderador'
UPDATE public.profiles
SET
  role = 'lider',
  moderation_status = 'APPROVED',
  updated_at = NOW()
WHERE profile_type = 'liderazgo'
  AND LOWER(COALESCE(role, '')) = 'moderador';

NOTIFY pgrst, 'reload schema';
