-- =====================================================================
-- MIGRACIÓN CONSOLIDADA E IDEMPOTENTE:
-- 1. Columnas faltantes en profiles / organizations (DEV y PROD)
-- 2. handle_new_user(): postulación a moderador (PENDING), voluntarios (PENDING)
--    y creación server-side de public.organizations (funciona con confirmación de email)
-- 3. RLS + trigger de public.profiles: permite a staff aprobado (ADMIN y MODERADOR)
--    gestionar visibilidad en directorio, verificación y aprobación/rechazo de voluntarios,
--    protegiendo role y moderation_status de moderadores/admins.
-- =====================================================================

-- 1. Asegurar columnas e índices requeridos (idempotente para DEV y PROD)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS volunteer_connection_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS volunteer_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_user_id ON public.organizations(user_id);

-- 2. Permisos de ejecución para helpers SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_staff() TO authenticated, anon;

-- 3. Trigger handle_new_user() consolidado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_requested_role TEXT;
  v_profile_type TEXT;
  v_safe_role TEXT;
  v_safe_mod_status TEXT;
  v_org_name TEXT;
  v_org_type TEXT;
  v_org_desc TEXT;
  v_org_web TEXT;
  v_org_addr TEXT;
  v_lat_raw TEXT;
  v_lng_raw TEXT;
  v_org_lat DOUBLE PRECISION;
  v_org_lng DOUBLE PRECISION;
  v_org_doc_type TEXT;
  v_org_doc_num TEXT;
  v_org_phone TEXT;
  v_org_wa TEXT;
  v_org_email TEXT;
BEGIN
  v_requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario')));
  v_profile_type := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'profile_type', 'persona')));

  IF v_requested_role IN ('voluntario', 'regular', 'entidad_profesional', 'lider') THEN
    v_safe_role := v_requested_role;
    IF v_safe_role = 'voluntario' AND (
      UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'moderation_status', ''))) = 'PENDING'
      OR NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'volunteer_connection_type', '')), '') IS NOT NULL
    ) THEN
      v_safe_mod_status := 'PENDING';
    ELSE
      v_safe_mod_status := 'APPROVED';
    END IF;
  ELSIF v_requested_role IN ('moderador', 'moderator') THEN
    v_safe_role := 'moderador';
    -- Postulación pública a moderador: SIEMPRE PENDING hasta aprobación explícita de un ADMIN
    v_safe_mod_status := 'PENDING';
  ELSE
    -- Bloquea cualquier intento de auto-asignarse ADMIN / ADMINISTRADOR u otro rol
    v_safe_role := 'voluntario';
    v_safe_mod_status := 'APPROVED';
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
    moderation_status,
    volunteer_connection_type,
    volunteer_notes,
    preferred_contact_method,
    is_verified,
    show_in_directory
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), 'Usuario'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone_country_code'), ''), '+57'),
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phone_number'),
    NEW.raw_user_meta_data->>'whatsapp',
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'document_type'), ''), 'cedula'),
    NEW.raw_user_meta_data->>'document_number',
    NEW.raw_user_meta_data->>'cargo',
    NEW.raw_user_meta_data->>'community_type',
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''), 'Colombia'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'department'), ''), 'Valle del Cauca'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''), 'Cali'),
    COALESCE((NEW.raw_user_meta_data->>'is_auto_detected_location')::boolean, true),
    v_safe_role,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'profile_type'), ''), 'persona'),
    COALESCE((NEW.raw_user_meta_data->>'accept_terms')::boolean, true),
    NOW(),
    NEW.raw_user_meta_data->>'moderator_community_collective',
    NEW.raw_user_meta_data->>'moderator_motivation',
    v_safe_mod_status,
    NEW.raw_user_meta_data->>'volunteer_connection_type',
    NEW.raw_user_meta_data->>'volunteer_notes',
    NEW.raw_user_meta_data->>'preferred_contact_method',
    FALSE,
    TRUE
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
    volunteer_connection_type = COALESCE(EXCLUDED.volunteer_connection_type, public.profiles.volunteer_connection_type),
    volunteer_notes = COALESCE(EXCLUDED.volunteer_notes, public.profiles.volunteer_notes),
    preferred_contact_method = COALESCE(EXCLUDED.preferred_contact_method, public.profiles.preferred_contact_method),
    updated_at = NOW();

  -- Crear fila inicial en public.organizations desde servidor (no depende de sesión activa post-signUp)
  IF v_profile_type IN ('organizacion', 'liderazgo')
     OR v_safe_role = 'entidad_profesional'
     OR NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'org_name', '')), '') IS NOT NULL THEN

    v_org_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'org_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'moderator_community_collective'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      'Organización sin nombre'
    );
    v_org_type := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'organization_type'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'community_type'), ''),
      CASE WHEN v_profile_type = 'liderazgo' THEN 'Junta de acción comunal' ELSE 'ONG' END
    );
    v_org_desc := NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'org_description',
      NEW.raw_user_meta_data->>'moderator_motivation',
      ''
    )), '');
    v_org_web := NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'org_website',
      NEW.raw_user_meta_data->>'website_or_social',
      ''
    )), '');
    v_org_addr := NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'search_address',
      NEW.raw_user_meta_data->>'address',
      ''
    )), '');

    v_lat_raw := TRIM(COALESCE(NEW.raw_user_meta_data->>'latitude', ''));
    IF v_lat_raw ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
      v_org_lat := v_lat_raw::DOUBLE PRECISION;
    END IF;

    v_lng_raw := TRIM(COALESCE(NEW.raw_user_meta_data->>'longitude', ''));
    IF v_lng_raw ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
      v_org_lng := v_lng_raw::DOUBLE PRECISION;
    END IF;

    v_org_doc_type := CASE
      WHEN v_profile_type = 'liderazgo' THEN 'soporte'
      ELSE COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'document_type'), ''), 'nit')
    END;
    v_org_doc_num := CASE
      WHEN v_profile_type = 'liderazgo' THEN COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'document_number'), ''), 'Comunidad')
      ELSE NULLIF(TRIM(NEW.raw_user_meta_data->>'document_number'), '')
    END;
    v_org_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phone_number', '')), '');
    v_org_wa := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'whatsapp', v_org_phone, '')), '');
    v_org_email := COALESCE(NULLIF(TRIM(NEW.email), ''), NULLIF(TRIM(NEW.raw_user_meta_data->>'email'), ''));

    INSERT INTO public.organizations (
      user_id,
      org_name,
      organization_type,
      description,
      website_or_social,
      address,
      latitude,
      longitude,
      document_type,
      document_number,
      contact_phone,
      contact_whatsapp,
      contact_email,
      is_verified,
      show_in_directory
    )
    VALUES (
      NEW.id,
      v_org_name,
      v_org_type,
      v_org_desc,
      v_org_web,
      v_org_addr,
      v_org_lat,
      v_org_lng,
      v_org_doc_type,
      v_org_doc_num,
      v_org_phone,
      v_org_wa,
      v_org_email,
      FALSE,
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Vincular automáticamente miembros agregados previamente por su correo
  UPDATE public.organization_members
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Actualizar trigger de protección de columnas privilegiadas en public.profiles
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Solo un administrador puede modificar role'
      USING ERRCODE = '42501';
  END IF;

  IF public.is_platform_staff() THEN
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
      IF auth.uid() IS NOT DISTINCT FROM OLD.id
         OR LOWER(TRIM(COALESCE(OLD.role, ''))) <> 'voluntario' THEN
        RAISE EXCEPTION 'Solo un administrador puede modificar moderation_status de moderadores o administradores'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF auth.uid() IS DISTINCT FROM OLD.id THEN
      IF (to_jsonb(NEW) - ARRAY['is_verified', 'show_in_directory', 'moderation_status', 'updated_at'])
         IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['is_verified', 'show_in_directory', 'moderation_status', 'updated_at']) THEN
        RAISE EXCEPTION 'Un moderador solo puede actualizar verificación, visibilidad en directorio o aprobación de voluntarios'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.show_in_directory IS DISTINCT FROM OLD.show_in_directory THEN
    RAISE EXCEPTION 'Solo el equipo de moderación o administración puede modificar moderation_status, is_verified o show_in_directory'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 5. Permitir UPDATE en public.profiles al propio usuario o al staff aprobado
DROP POLICY IF EXISTS "Permitir edicion de perfiles" ON public.profiles;
CREATE POLICY "Permitir edicion de perfiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_staff())
  WITH CHECK (auth.uid() = id OR public.is_platform_staff());

NOTIFY pgrst, 'reload schema';
