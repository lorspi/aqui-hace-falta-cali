-- ==============================================================================
-- SCRIPT: Tablas y Semillas para help_categories y help_resources
-- ==============================================================================

-- 1. Tabla de Categorías de Ayuda
CREATE TABLE IF NOT EXISTS public.help_categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'help_categories' AND policyname = 'Permitir lectura pública de help_categories'
  ) THEN
    CREATE POLICY "Permitir lectura pública de help_categories"
      ON public.help_categories
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- 2. Tabla de Recursos de Ayuda
CREATE TABLE IF NOT EXISTS public.help_resources (
  id VARCHAR(100) PRIMARY KEY,
  category_id VARCHAR(100) NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(100) NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.help_resources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'help_resources' AND policyname = 'Permitir lectura pública de help_resources'
  ) THEN
    CREATE POLICY "Permitir lectura pública de help_resources"
      ON public.help_resources
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- 3. Inserción de Categorías
INSERT INTO public.help_categories (id, name, display_order, is_active)
VALUES
  ('cat_agua_alimentacion', 'Agua y Alimentación', 1, true),
  ('cat_alojamiento_abrigos', 'Alojamiento y Abrigos', 2, true),
  ('cat_salud_medicina', 'Salud y Medicina', 3, true),
  ('cat_rescate_herramientas', 'Búsqueda, Rescate y Herramientas', 4, true),
  ('cat_maquinaria_transporte', 'Maquinaria y Transporte', 5, true),
  ('cat_aseo_higiene', 'Aseo e Higiene', 6, true),
  ('cat_apoyo_psicosocial', 'Apoyo Psicosocial y Bienestar', 7, true),
  ('cat_animales', 'Protección Animal', 8, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- 4. Inserción de Recursos
INSERT INTO public.help_resources (id, category_id, name, unit, display_order, is_active)
VALUES
  ('agua_potable', 'cat_agua_alimentacion', 'Agua Potable', 'Litros / Garrafones', 1, true),
  ('alimentos', 'cat_agua_alimentacion', 'Alimentos No Perecederos', 'Kilos / Mercados', 2, true),
  ('cobijas_colchonetas', 'cat_alojamiento_abrigos', 'Cobijas y Colchonetas', 'Unidades', 3, true),
  ('cubiertas_cerramientos', 'cat_alojamiento_abrigos', 'Tejas, Plásticos y Cerramientos', 'Metros / Láminas', 4, true),
  ('medicamentos_botiquin', 'cat_salud_medicina', 'Medicamentos y Botiquines de Emergencia', 'Kits / Unidades', 5, true),
  ('atencion_medica', 'cat_salud_medicina', 'Atención Médica / Primeros Auxilios', 'Jornadas / Personal', 6, true),
  ('proteccion_respiratoria', 'cat_salud_medicina', 'Mascarillas / Protección Respiratoria', 'Cajas / Unidades', 7, true),
  ('equipo_rescate', 'cat_rescate_herramientas', 'Equipo de Búsqueda y Rescate', 'Kits / Equipos', 8, true),
  ('equipos_bombeo', 'cat_rescate_herramientas', 'Equipos de Bombeo / Motobombas', 'Unidades', 9, true),
  ('remocion_escombros', 'cat_rescate_herramientas', 'Remoción de Escombros', 'Jornadas / Cuadrillas', 10, true),
  ('herramientas_mano', 'cat_rescate_herramientas', 'Herramientas de Mano (Palas, Machetes, Picos)', 'Unidades', 11, true),
  ('plantas_electricas', 'cat_rescate_herramientas', 'Plantas Eléctricas / Generadores', 'Unidades', 12, true),
  ('evaluacion_estructural', 'cat_rescate_herramientas', 'Evaluación Estructural', 'Visitas / Ingenieros', 13, true),
  ('maquinaria_pesada', 'cat_maquinaria_transporte', 'Maquinaria Pesada (Retroexcavadoras, Volquetas)', 'Horas / Máquinas', 14, true),
  ('transporte_terrestre', 'cat_maquinaria_transporte', 'Transporte Terrestre / Fletes', 'Vehículos / Viajes', 15, true),
  ('implementos_aseo', 'cat_aseo_higiene', 'Kits de Aseo e Higiene Personal', 'Kits / Unidades', 16, true),
  ('salud_mental_psicosocial', 'cat_apoyo_psicosocial', 'Atención Psicológica y Psicosocial', 'Sesiones / Profesionales', 17, true),
  ('alimento_animales', 'cat_animales', 'Alimento para Mascotas y Animales', 'Kilos / Bultos', 18, true)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  display_order = EXCLUDED.display_order;
