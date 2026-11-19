-- ==============================================================================
-- MIGRACIÓN: Control de visibilidad en el Directorio público (show_in_directory)
-- ==============================================================================
-- Permite a los Super Admins ocultar organizaciones y comunidades de prueba
-- (tanto en public.organizations como perfiles comunitarios prof-* en public.profiles)
-- sin eliminar sus cuentas ni bloquear su acceso al sistema.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN NOT NULL DEFAULT true;
