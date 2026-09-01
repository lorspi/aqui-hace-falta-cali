-- =================================================================
-- MIGRACIÓN SUPABASE: Tabla quick_tickets (Chatbot / Ticket Rápido)
-- Copia y ejecuta este script en el Editor SQL de tu proyecto Supabase.
-- =================================================================

-- 1. Crear la tabla independiente para los tickets rápidos del Chatbot
CREATE TABLE IF NOT EXISTS public.quick_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  need_summary VARCHAR(280) NOT NULL,    -- Paso 1: Necesidad escrita (límite 280 caracteres)
  location_text TEXT NOT NULL,          -- Paso 2: Ubicación (texto abierto)
  contact_phone TEXT NOT NULL,          -- Paso 3: Teléfono principal (Obligatorio)
  contact_name TEXT,                    -- Paso 3: Nombre de contacto (Opcional)
  additional_details TEXT,             -- Paso 4: Campo abierto para detalles adicionales
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'CONVERTED', 'ARCHIVED')),
  notes TEXT,                           -- Notas internas del equipo de moderación
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_quick_tickets_status ON public.quick_tickets(status);
CREATE INDEX IF NOT EXISTS idx_quick_tickets_created_at ON public.quick_tickets(created_at DESC);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.quick_tickets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Permitir la creación pública de tickets desde la app/web (Insert)
DROP POLICY IF EXISTS "Permitir crear tickets públicos" ON public.quick_tickets;
CREATE POLICY "Permitir crear tickets públicos" 
  ON public.quick_tickets FOR INSERT WITH CHECK (true);

-- Policy 2: Permitir la lectura de tickets para la administración y moderación (Select)
DROP POLICY IF EXISTS "Lectura de tickets para usuarios" ON public.quick_tickets;
CREATE POLICY "Lectura de tickets para usuarios" 
  ON public.quick_tickets FOR SELECT USING (true);

-- Policy 3: Permitir la actualización de estados de tickets (Update)
DROP POLICY IF EXISTS "Actualización de tickets" ON public.quick_tickets;
CREATE POLICY "Actualización de tickets" 
  ON public.quick_tickets FOR UPDATE USING (true);
