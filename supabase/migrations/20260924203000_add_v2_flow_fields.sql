-- =====================================================================
-- MIGRACIÓN DE CAMPOS ADICIONALES PARA FLUJOS V2 (PEDIR Y OFRECER AYUDA)
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- 1. Agregar columnas a la tabla de necesidades (needs)
ALTER TABLE public.needs 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS como_llegar TEXT,
  ADD COLUMN IF NOT EXISTS para_quien TEXT;

-- 2. Agregar columnas a la tabla de ofertas (offers)
ALTER TABLE public.offers 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(50),
  ADD COLUMN IF NOT EXISTS delivery_radius VARCHAR(100);

-- 3. Crear índices de rendimiento por usuario
CREATE INDEX IF NOT EXISTS idx_needs_user_id ON public.needs(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
