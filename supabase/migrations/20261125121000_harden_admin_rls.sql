-- =====================================================================
-- MIGRACIÓN: Endurecimiento de RLS y protección de columnas privilegiadas
-- =====================================================================
-- Garantiza en servidor (Supabase/PostgreSQL) que:
-- 1. Ningún usuario regular pueda escalar su `role`, `moderation_status` o `is_verified` en `profiles`.
-- 2. Ningún usuario fuera del staff pueda verificar organizaciones ni cambiar `show_in_directory`.
-- 3. Solo ADMIN o MODERATOR aprobado (`is_platform_staff()`) puedan ver/resolver/eliminar reportes o leer/escribir `audit_logs`.
-- 4. Se eliminan dinámicamente TODAS las políticas RLS previas de estas 5 tablas antes de crear las nuevas.
-- 5. Operaciones desde SQL Editor / service_role (`auth.uid() IS NULL`) siguen funcionando sin bloqueo.
-- =====================================================================

-- 0. Asegurar columnas requeridas por triggers de visibilidad (idempotente)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT TRUE;

-- 1. Funciones auxiliares SECURITY DEFINER (evitan recursión RLS sobre profiles)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND UPPER(TRIM(COALESCE(role, ''))) IN ('ADMIN', 'ADMINISTRADOR')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND UPPER(TRIM(COALESCE(role, ''))) IN ('MODERADOR', 'MODERATOR')
      AND UPPER(TRIM(COALESCE(moderation_status, ''))) = 'APPROVED'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Trigger de protección de columnas privilegiadas en public.profiles
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'No tienes permiso para modificar role, moderation_status o is_verified'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 3. Trigger de protección de columnas privilegiadas en public.organizations
-- Nota: no tocar updated_at por compatibilidad con esquemas sin esa columna en organizations.
CREATE OR REPLACE FUNCTION public.protect_organization_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_staff() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := FALSE;
      NEW.show_in_directory := TRUE;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
         OR NEW.show_in_directory IS DISTINCT FROM OLD.show_in_directory THEN
        RAISE EXCEPTION 'Solo el equipo de moderación o administración puede verificar organizaciones o cambiar su visibilidad'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_organization_privileged_columns ON public.organizations;
CREATE TRIGGER trg_protect_organization_privileged_columns
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_organization_privileged_columns();

-- 4. Habilitar RLS y limpiar dinámicamente TODAS las políticas previas (evita políticas legacy con otros nombres)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'organizations', 'reports', 'offer_reports', 'audit_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 5. Políticas RLS limpias para public.profiles
CREATE POLICY "Permitir lectura de perfiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Permitir insercion de perfiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_platform_admin());

CREATE POLICY "Permitir edicion de perfiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = id OR public.is_platform_admin());

CREATE POLICY "Permitir eliminacion de perfiles solo admin"
  ON public.profiles FOR DELETE
  USING (public.is_platform_admin());

-- 6. Políticas RLS limpias para public.organizations
CREATE POLICY "Permitir lectura de organizaciones"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Permitir insercion de organizaciones"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_platform_staff());

CREATE POLICY "Permitir edicion de organizaciones"
  ON public.organizations FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
    )
    OR public.is_platform_staff()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
    )
    OR public.is_platform_staff()
  );

CREATE POLICY "Permitir eliminacion de organizaciones solo admin"
  ON public.organizations FOR DELETE
  USING (public.is_platform_admin());

-- 7. Políticas RLS limpias para reports y offer_reports (creación pública ciudadana, lectura/gestión solo staff)
CREATE POLICY "Permitir lectura de reportes solo staff"
  ON public.reports FOR SELECT
  USING (public.is_platform_staff());

CREATE POLICY "Permitir creacion publica de reportes"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de reportes solo staff"
  ON public.reports FOR UPDATE
  USING (public.is_platform_staff())
  WITH CHECK (public.is_platform_staff());

CREATE POLICY "Permitir eliminacion de reportes solo staff"
  ON public.reports FOR DELETE
  USING (public.is_platform_staff());

CREATE POLICY "Permitir lectura de reportes ofertas solo staff"
  ON public.offer_reports FOR SELECT
  USING (public.is_platform_staff());

CREATE POLICY "Permitir creacion publica de reportes ofertas"
  ON public.offer_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de reportes ofertas solo staff"
  ON public.offer_reports FOR UPDATE
  USING (public.is_platform_staff())
  WITH CHECK (public.is_platform_staff());

CREATE POLICY "Permitir eliminacion de reportes ofertas solo staff"
  ON public.offer_reports FOR DELETE
  USING (public.is_platform_staff());

-- 8. Políticas RLS limpias para audit_logs (lectura e inserción solo staff)
CREATE POLICY "Permitir lectura de auditoria solo staff"
  ON public.audit_logs FOR SELECT
  USING (public.is_platform_staff());

CREATE POLICY "Permitir insercion de auditoria solo staff"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_platform_staff());

NOTIFY pgrst, 'reload schema';
