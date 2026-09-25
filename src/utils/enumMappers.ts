import { HelpCategory, PlaceType } from '../types';

/**
 * Mapeo de nombres de ítems y categorías del prototipo/UI hacia los IDs de Supabase:
 * - help_categories: viveres_bienestar, salud_asistencia, rescate_maquinaria, materiales_reconstruccion, transporte_instalaciones, donacion_economica, servicios_tecnicos, voluntariado_comunitario
 * - help_resources: agua_potable, alimentos, cobijas_colchonetas, atencion_medica, etc.
 */

const ITEM_TO_CATALOG_MAP: Record<string, { resourceId: string; categoryId: string; canonicalCategory: HelpCategory; defaultUnit: string }> = {
  // Víveres y bienestar básico
  'Agua potable': { resourceId: 'agua_potable', categoryId: 'viveres_bienestar', canonicalCategory: 'AGUA', defaultUnit: 'L' },
  'Alimentos': { resourceId: 'alimentos', categoryId: 'viveres_bienestar', canonicalCategory: 'ALIMENTOS', defaultUnit: 'kits' },
  'Ropa y calzado': { resourceId: 'ropa_calzado', categoryId: 'viveres_bienestar', canonicalCategory: 'ROPA', defaultUnit: 'prendas' },
  'Implementos de aseo e higiene': { resourceId: 'implementos_aseo', categoryId: 'viveres_bienestar', canonicalCategory: 'IMPLEMENTOS_ASEO', defaultUnit: 'kits' },
  'Cobijas y colchonetas': { resourceId: 'cobijas_colchonetas', categoryId: 'viveres_bienestar', canonicalCategory: 'ALOJAMIENTO', defaultUnit: 'juegos' },
  'Cuidado y alimento de animales': { resourceId: 'alimento_animales', categoryId: 'viveres_bienestar', canonicalCategory: 'ANIMALES', defaultUnit: 'kg' },

  // Salud y asistencia
  'Atención médica': { resourceId: 'atencion_medica', categoryId: 'salud_asistencia', canonicalCategory: 'ATENCION_MEDICA', defaultUnit: 'profesionales' },
  'Medicamentos / Botiquín': { resourceId: 'medicamentos_botiquin', categoryId: 'salud_asistencia', canonicalCategory: 'MEDICAMENTOS', defaultUnit: 'kits' },
  'Donar sangre / Banco de sangre': { resourceId: 'donar_sangre', categoryId: 'salud_asistencia', canonicalCategory: 'SANGRE', defaultUnit: 'unidades' },
  'Protección respiratoria': { resourceId: 'proteccion_respiratoria', categoryId: 'salud_asistencia', canonicalCategory: 'MEDICAMENTOS', defaultUnit: 'cajas' },

  // Rescate y maquinaria
  'Equipo búsqueda y rescate': { resourceId: 'equipo_rescate', categoryId: 'rescate_maquinaria', canonicalCategory: 'HERRAMIENTAS', defaultUnit: 'equipos' },
  'Herramientas de mano': { resourceId: 'herramientas_mano', categoryId: 'rescate_maquinaria', canonicalCategory: 'HERRAMIENTAS', defaultUnit: 'unidades' },
  'Remoción de escombros y barro': { resourceId: 'remocion_escombros', categoryId: 'rescate_maquinaria', canonicalCategory: 'ESCOMBROS', defaultUnit: 'jornadas' },
  'Maquinaria pesada y operarios': { resourceId: 'maquinaria_pesada', categoryId: 'rescate_maquinaria', canonicalCategory: 'MAQUINARIA', defaultUnit: 'máquinas' },
  'Plantas eléctricas / Generadores': { resourceId: 'plantas_electricas', categoryId: 'rescate_maquinaria', canonicalCategory: 'HERRAMIENTAS', defaultUnit: 'unidades' },
  'Equipos de bombeo': { resourceId: 'equipos_bombeo', categoryId: 'rescate_maquinaria', canonicalCategory: 'MAQUINARIA', defaultUnit: 'unidades' },

  // Materiales y reconstrucción
  'Evaluación estructural y técnica': { resourceId: 'evaluacion_estructural', categoryId: 'materiales_reconstruccion', canonicalCategory: 'MANO_OBRA', defaultUnit: 'visitas' },
  'Materiales de obra básica': { resourceId: 'materiales_obra', categoryId: 'materiales_reconstruccion', canonicalCategory: 'HERRAMIENTAS', defaultUnit: 'unidades' },
  'Ferretería e instalaciones básicas': { resourceId: 'ferreteria_instalaciones', categoryId: 'materiales_reconstruccion', canonicalCategory: 'HERRAMIENTAS', defaultUnit: 'unidades' },
  'Cubiertas y cerramientos': { resourceId: 'cubiertas_cerramientos', categoryId: 'materiales_reconstruccion', canonicalCategory: 'ALOJAMIENTO', defaultUnit: 'láminas' },
  'Herramientas de construcción': { resourceId: 'herramientas_construccion', categoryId: 'materiales_reconstruccion', canonicalCategory: 'HERRAMIENTAS', defaultUnit: 'unidades' },
  'Mano de obra técnica y oficios': { resourceId: 'mano_obra_tecnica', categoryId: 'materiales_reconstruccion', canonicalCategory: 'MANO_OBRA', defaultUnit: 'personas' },

  // Transporte e instalaciones
  'Alojamiento temporal': { resourceId: 'alojamiento_temporal', categoryId: 'transporte_instalaciones', canonicalCategory: 'ALOJAMIENTO', defaultUnit: 'cupos' },
  'Transporte terrestre': { resourceId: 'transporte_terrestre', categoryId: 'transporte_instalaciones', canonicalCategory: 'TRANSPORTE', defaultUnit: 'vehículos' },
  'Transporte aéreo': { resourceId: 'transporte_aereo', categoryId: 'transporte_instalaciones', canonicalCategory: 'TRANSPORTE', defaultUnit: 'vuelos' },
  'Transporte fluvial': { resourceId: 'transporte_fluvial', categoryId: 'transporte_instalaciones', canonicalCategory: 'TRANSPORTE', defaultUnit: 'lanchas' },
  'Saneamiento y baños portátiles': { resourceId: 'saneamiento_banos', categoryId: 'transporte_instalaciones', canonicalCategory: 'IMPLEMENTOS_ASEO', defaultUnit: 'unidades' },
  'Almacenamiento y bodegaje': { resourceId: 'almacenamiento_bodegaje', categoryId: 'transporte_instalaciones', canonicalCategory: 'LOGISTICA', defaultUnit: 'm²' },
  'Aulas y espacios educativos temporales': { resourceId: 'aulas_temporales', categoryId: 'transporte_instalaciones', canonicalCategory: 'ALOJAMIENTO', defaultUnit: 'aulas' },
  'Cocinas comunitarias': { resourceId: 'cocinas_comunitarias', categoryId: 'transporte_instalaciones', canonicalCategory: 'ALIMENTOS', defaultUnit: 'raciones' },

  // Donación económica
  'Aporte económico / Donación en dinero': { resourceId: 'aporte_economico', categoryId: 'donacion_economica', canonicalCategory: 'DINERO', defaultUnit: 'pesos' },

  // Capacidades y servicios técnicos
  'Ingeniería, arquitectura y peritaje': { resourceId: 'ingenieria_peritaje', categoryId: 'servicios_tecnicos', canonicalCategory: 'MANO_OBRA', defaultUnit: 'profesionales' },
  'Geología, geotecnia y gestión del riesgo': { resourceId: 'geologia_gestion_riesgo', categoryId: 'servicios_tecnicos', canonicalCategory: 'MANO_OBRA', defaultUnit: 'profesionales' },
  'Asesoría legal y jurídica': { resourceId: 'asesoria_legal', categoryId: 'servicios_tecnicos', canonicalCategory: 'LOGISTICA', defaultUnit: 'profesionales' },
  'Auditoría, contabilidad y finanzas': { resourceId: 'auditoria_contabilidad', categoryId: 'servicios_tecnicos', canonicalCategory: 'LOGISTICA', defaultUnit: 'profesionales' },
  'Veterinaria y manejo zootécnico': { resourceId: 'veterinaria_zootecnia', categoryId: 'servicios_tecnicos', canonicalCategory: 'ANIMALES', defaultUnit: 'profesionales' },
  'Salud mental y apoyo psicosocial': { resourceId: 'salud_mental_psicosocial', categoryId: 'servicios_tecnicos', canonicalCategory: 'APOYO_PSICOLOGICO', defaultUnit: 'sesiones' },

  // Voluntariado y apoyo comunitario
  'Voluntariado en acopio y empaque': { resourceId: 'voluntariado_acopio', categoryId: 'voluntariado_comunitario', canonicalCategory: 'VOLUNTARIADO_GENERAL', defaultUnit: 'voluntarios' },
  'Voluntariado en terreno': { resourceId: 'voluntariado_terreno', categoryId: 'voluntariado_comunitario', canonicalCategory: 'VOLUNTARIADO_GENERAL', defaultUnit: 'voluntarios' },
  'Voluntariado social y comunitario': { resourceId: 'voluntariado_social', categoryId: 'voluntariado_comunitario', canonicalCategory: 'VOLUNTARIADO_GENERAL', defaultUnit: 'voluntarios' },
  'Censo, registro y apoyo operativo': { resourceId: 'censo_apoyo_operativo', categoryId: 'voluntariado_comunitario', canonicalCategory: 'VOLUNTARIADO_GENERAL', defaultUnit: 'voluntarios' },
};

/**
 * Obtiene el recurso, categoría e ID de Supabase correspondiente a un ítem del mockup.
 */
export function mapItemToCatalog(itemName: string) {
  const found = ITEM_TO_CATALOG_MAP[itemName];
  if (found) return found;

  // Fallback si no está mapeado exactamente
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return {
    resourceId: slug || 'otro',
    categoryId: 'viveres_bienestar',
    canonicalCategory: 'OTRO' as HelpCategory,
    defaultUnit: 'unidades',
  };
}

/**
 * Mapea la lista de ítems a las categorías canónicas (HelpCategory[]) para filtros del mapa.
 */
export function mapItemsToHelpCategories(items: string[]): HelpCategory[] {
  const cats = items.map((it) => mapItemToCatalog(it).canonicalCategory);
  return Array.from(new Set(cats));
}

/**
 * Mapea los textos legibles del selector de tipo de lugar a los valores canónicos del enum PlaceType de la BD.
 */
const PLACE_TYPE_MAP: Record<string, PlaceType> = {
  'Comunidad afectada': 'COMUNIDAD_AFECTADA',
  'Edificio o vivienda afectada': 'EDIFICIO_AFECTADO',
  'Albergue temporal': 'REFUGIO',
  'Centro de acopio barrial': 'CENTRO_ACOPIO',
  'Salón comunal o refugio': 'REFUGIO',
  'Punto aislado o vía bloqueada': 'PUNTO_LOGISTICO',
  'Hospital o centro médico': 'HOSPITAL',
  'Otro tipo de lugar': 'OTRO',
};

export function mapTipoLugarToPlaceType(tipoLugarStr: string): PlaceType {
  if (PLACE_TYPE_MAP[tipoLugarStr]) return PLACE_TYPE_MAP[tipoLugarStr];
  if (Object.values(PLACE_TYPE_MAP).includes(tipoLugarStr as PlaceType)) return tipoLugarStr as PlaceType;
  return 'EDIFICIO_AFECTADO';
}

/**
 * Mapea los nombres de emergencia a los IDs de Supabase emergency_events.
 */
const EMERGENCY_EVENT_MAP: Record<string, string> = {
  'Inundación': 'inundacion',
  'Terremoto': 'terremoto',
  'Vendaval / Tormenta': 'vendaval',
  'Incendio forestal / Erupción': 'incendio',
  'Derrumbe / Deslizamiento': 'derrumbe',
  'Epidemia / Emergencia sanitaria': 'epidemia',
  'Otra emergencia comunitaria': 'otra',
};

export function mapEmergencyEventToId(eventoStr: string): string {
  return EMERGENCY_EVENT_MAP[eventoStr] || 'inundacion';
}
