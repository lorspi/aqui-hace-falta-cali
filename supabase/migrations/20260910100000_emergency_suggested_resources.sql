-- ==============================================================================
-- SCRIPT 4: Tabla de Recursos Sugeridos por Tipo de Emergencia
-- ==============================================================================
-- Descripción: Permite priorizar visualmente en el formulario de "Pedir Ayuda" 
-- las necesidades/recursos de primera respuesta según el evento de emergencia seleccionado.
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA PIVOTE (N:M entre emergency_events y help_resources)
CREATE TABLE IF NOT EXISTS public.emergency_suggested_resources (
  emergency_event_id VARCHAR(100) NOT NULL REFERENCES public.emergency_events(id) ON DELETE CASCADE,
  resource_id VARCHAR(100) NOT NULL REFERENCES public.help_resources(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (emergency_event_id, resource_id)
);

-- Indexación para consultas rápidas por evento de emergencia
CREATE INDEX IF NOT EXISTS idx_emergency_suggested_event 
  ON public.emergency_suggested_resources (emergency_event_id, display_order);

-- Comentarios explicativos en esquema Supabase
COMMENT ON TABLE public.emergency_suggested_resources IS 'Mapeo de recursos/necesidades sugeridas prioritariamente para cada tipo de emergencia.';
COMMENT ON COLUMN public.emergency_suggested_resources.display_order IS 'Orden relativo de prioridad visual en la interfaz (1 = primero).';

-- 2. SEGURIDAD Y POLÍTICAS (RLS)
ALTER TABLE public.emergency_suggested_resources ENABLE ROW LEVEL SECURITY;

-- Lectura pública para cualquier usuario que ingrese al formulario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'emergency_suggested_resources' AND policyname = 'Permitir lectura pública de recursos sugeridos'
  ) THEN
    CREATE POLICY "Permitir lectura pública de recursos sugeridos"
      ON public.emergency_suggested_resources
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;


-- 3. INSERCIÓN DE DATOS DE SEMILLA (Mapeo por Evento de Emergencia)

INSERT INTO public.emergency_suggested_resources (emergency_event_id, resource_id, display_order)
VALUES
  -- 1. INUNDACIÓN
  ('inundacion', 'agua_potable', 1),
  ('inundacion', 'equipos_bombeo', 2),
  ('inundacion', 'alimentos', 3),
  ('inundacion', 'cobijas_colchonetas', 4),
  ('inundacion', 'remocion_escombros', 5),

  -- 2. TERREMOTO / SISMO
  ('terremoto', 'equipo_rescate', 1),
  ('terremoto', 'atencion_medica', 2),
  ('terremoto', 'evaluacion_estructural', 3),
  ('terremoto', 'maquinaria_pesada', 4),
  ('terremoto', 'cobijas_colchonetas', 5),

  -- 3. VENDAVAL
  ('vendaval', 'cubiertas_cerramientos', 1),
  ('vendaval', 'herramientas_mano', 2),
  ('vendaval', 'plantas_electricas', 3),
  ('vendaval', 'cobijas_colchonetas', 4),
  ('vendaval', 'remocion_escombros', 5),

  -- 4. INCENDIO
  ('incendio', 'proteccion_respiratoria', 1),
  ('incendio', 'agua_potable', 2),
  ('incendio', 'medicamentos_botiquin', 3),
  ('incendio', 'herramientas_mano', 4),
  ('incendio', 'alimento_animales', 5),

  -- 5. DERRUMBE / DESLIZAMIENTO
  ('derrumbe', 'maquinaria_pesada', 1),
  ('derrumbe', 'equipo_rescate', 2),
  ('derrumbe', 'remocion_escombros', 3),
  ('derrumbe', 'transporte_terrestre', 4),
  ('derrumbe', 'alimentos', 5),

  -- 6. EPIDEMIA / EMERGENCIA SANITARIA
  ('epidemia', 'medicamentos_botiquin', 1),
  ('epidemia', 'proteccion_respiratoria', 2),
  ('epidemia', 'atencion_medica', 3),
  ('epidemia', 'implementos_aseo', 4),
  ('epidemia', 'agua_potable', 5),

  -- 7. OTRA EMERGENCIA
  ('otra', 'agua_potable', 1),
  ('otra', 'alimentos', 2),
  ('otra', 'atencion_medica', 3),
  ('otra', 'salud_mental_psicosocial', 4)

ON CONFLICT (emergency_event_id, resource_id) 
DO UPDATE SET display_order = EXCLUDED.display_order;
