import type { Language } from './translations';
export type { Language };
import type { Recurso, TipoPublicacion } from '../types/publicacion';
import { movido, restante, cifra } from '../utils/publicaciones';

/**
 * Diccionario de traducción para categorías de la taxonomía de ayuda.
 */
export const CATEGORIA_TRADUCCIONES: Record<Language, Record<string, string>> = {
  es: {
    'Víveres y bienestar básico': 'Víveres y bienestar básico',
    'Salud y asistencia': 'Salud y asistencia',
    'Rescate y maquinaria': 'Rescate y maquinaria',
    'Materiales y reconstrucción': 'Materiales y reconstrucción',
    'Transporte e instalaciones': 'Transporte e instalaciones',
    'Donación económica': 'Donación económica',
    'Capacidades y servicios técnicos': 'Capacidades y servicios técnicos',
    'Voluntariado y apoyo comunitario': 'Voluntariado y apoyo comunitario',
  },
  en: {
    'Víveres y bienestar básico': 'Food & Basic Welfare',
    'Salud y asistencia': 'Health & Medical',
    'Rescate y maquinaria': 'Rescue & Machinery',
    'Materiales y reconstrucción': 'Materials & Reconstruction',
    'Transporte e instalaciones': 'Transport & Facilities',
    'Donación económica': 'Financial Donation',
    'Capacidades y servicios técnicos': 'Technical Services',
    'Voluntariado y apoyo comunitario': 'Community Volunteering',
  },
  pt: {
    'Víveres y bienestar básico': 'Mantimentos e bem-estar básico',
    'Salud y asistencia': 'Saúde e assistência',
    'Rescate y maquinaria': 'Resgate e maquinário',
    'Materiales y reconstrucción': 'Materiais e reconstrução',
    'Transporte e instalaciones': 'Transporte e instalações',
    'Donación económica': 'Doação financeira',
    'Capacidades y servicios técnicos': 'Capacidades e serviços técnicos',
    'Voluntariado y apoyo comunitario': 'Voluntariado e apoio comunitário',
  },
  fr: {
    'Víveres y bienestar básico': 'Vivres et bien-être de base',
    'Salud y asistencia': 'Santé et soins médicaux',
    'Rescate y maquinaria': 'Sauvetage et machines',
    'Materiales y reconstrucción': 'Matériaux et reconstruction',
    'Transporte e instalaciones': 'Transport et logistique',
    'Donación económica': 'Don financier',
    'Capacidades y servicios técnicos': 'Services techniques',
    'Voluntariado y apoyo comunitario': 'Bénévolat et soutien communautaire',
  },
};

/**
 * Diccionario de ítems y tipos de recursos individuales.
 */
export const ITEM_TRADUCCIONES: Record<Language, Record<string, string>> = {
  es: {
    'Agua potable': 'Agua potable',
    'Alimentos': 'Alimentos',
    'Ropa y calzado': 'Ropa y calzado',
    'Implementos de aseo e higiene': 'Implementos de aseo e higiene',
    'Cobijas y colchonetas': 'Cobijas y colchonetas',
    'Cuidado y alimento de animales': 'Cuidado y alimento de animales',
    'Atención médica': 'Atención médica',
    'Medicamentos / Botiquín': 'Medicamentos / Botiquín',
    'Donar sangre / Banco de sangre': 'Donar sangre / Banco de sangre',
    'Protección respiratoria': 'Protección respiratoria',
    'Equipo búsqueda y rescate': 'Equipo búsqueda y rescate',
    'Herramientas de mano': 'Herramientas de mano',
    'Remoción de escombros y barro': 'Remoción de escombros y barro',
    'Maquinaria pesada y operarios': 'Maquinaria pesada y operarios',
    'Plantas eléctricas / Generadores': 'Plantas eléctricas / Generadores',
    'Equipos de bombeo': 'Equipos de bombeo',
    'Evaluación estructural y técnica': 'Evaluación estructural y técnica',
    'Materiales de obra básica': 'Materiales de obra básica',
    'Ferretería e instalaciones básicas': 'Ferretería e instalaciones básicas',
    'Cubiertas y cerramientos': 'Cubiertas y cerramientos',
    'Herramientas de construcción': 'Herramientas de construcción',
    'Mano de obra técnica y oficios': 'Mano de obra técnica y oficios',
    'Alojamiento temporal': 'Alojamiento temporal',
    'Transporte terrestre': 'Transporte terrestre',
    'Transporte aéreo': 'Transporte aéreo',
    'Transporte fluvial': 'Transporte fluvial',
    'Saneamiento y baños portátiles': 'Saneamiento y baños portátiles',
    'Almacenamiento y bodegaje': 'Almacenamiento y bodegaje',
    'Aulas y espacios educativos temporales': 'Aulas y espacios educativos temporales',
    'Cocinas comunitarias': 'Cocinas comunitarias',
    'Aporte económico / Donación en dinero': 'Aporte económico / Donación en dinero',
    'Ingeniería, arquitectura y peritaje': 'Ingeniería, arquitectura y peritaje',
    'Geología, geotecnia y gestión del riesgo': 'Geología, geotecnia y gestión del riesgo',
    'Asesoría legal y jurídica': 'Asesoría legal y jurídica',
    'Auditoría, contabilidad y finanzas': 'Auditoría, contabilidad y finanzas',
    'Veterinaria y manejo zootécnico': 'Veterinaria y manejo zootécnico',
    'Salud mental y apoyo psicosocial': 'Salud mental y apoyo psicosocial',
    'Voluntariado en acopio y empaque': 'Voluntariado en acopio y empaque',
    'Voluntariado en terreno': 'Voluntariado en terreno',
    'Voluntariado social y comunitario': 'Voluntariado social y comunitario',
    'Censo, registro y apoyo operativo': 'Censo, registro y apoyo operativo',
  },
  en: {
    'Agua potable': 'Drinking water',
    'Alimentos': 'Food',
    'Ropa y calzado': 'Clothing & Footwear',
    'Implementos de aseo e higiene': 'Hygiene & Cleaning items',
    'Cobijas y colchonetas': 'Blankets & Mattresses',
    'Cuidado y alimento de animales': 'Pet care & Animal food',
    'Atención médica': 'Medical care',
    'Medicamentos / Botiquín': 'Medicines / First Aid Kit',
    'Donar sangre / Banco de sangre': 'Blood donation / Blood bank',
    'Protección respiratoria': 'Respiratory protection',
    'Equipo búsqueda y rescate': 'Search & Rescue equipment',
    'Herramientas de mano': 'Hand tools',
    'Remoción de escombros y barro': 'Debris & Mud removal',
    'Maquinaria pesada y operarios': 'Heavy machinery & Operators',
    'Plantas eléctricas / Generadores': 'Power generators',
    'Equipos de bombeo': 'Pumping equipment',
    'Evaluación estructural y técnica': 'Structural & Technical evaluation',
    'Materiales de obra básica': 'Basic construction materials',
    'Ferretería e instalaciones básicas': 'Hardware & Basic fixtures',
    'Cubiertas y cerramientos': 'Roofing & Enclosures',
    'Herramientas de construcción': 'Construction tools',
    'Mano de obra técnica y oficios': 'Skilled labor & Trades',
    'Alojamiento temporal': 'Temporary shelter',
    'Transporte terrestre': 'Ground transport',
    'Transporte aéreo': 'Air transport',
    'Transporte fluvial': 'River transport',
    'Saneamiento y baños portátiles': 'Sanitation & Portable toilets',
    'Almacenamiento y bodegaje': 'Storage & Warehousing',
    'Aulas y espacios educativos temporales': 'Temporary classrooms',
    'Cocinas comunitarias': 'Community kitchens',
    'Aporte económico / Donación en dinero': 'Financial contribution',
    'Ingeniería, arquitectura y peritaje': 'Engineering & Architecture',
    'Geología, geotecnia y gestión del riesgo': 'Geology & Risk management',
    'Asesoría legal y jurídica': 'Legal advice',
    'Auditoría, contabilidad y finanzas': 'Accounting & Finance',
    'Veterinaria y manejo zootécnico': 'Veterinary services',
    'Salud mental y apoyo psicosocial': 'Mental health & Psychosocial support',
    'Voluntariado en acopio y empaque': 'Collection & Packing volunteering',
    'Voluntariado en terreno': 'Field volunteering',
    'Voluntariado social y comunitario': 'Social & Community volunteering',
    'Censo, registro y apoyo operativo': 'Census & Operational support',
  },
  pt: {
    'Agua potable': 'Água potável',
    'Alimentos': 'Alimentos',
    'Ropa y calzado': 'Roupas e calçados',
    'Implementos de aseo e higiene': 'Itens de higiene e limpeza',
    'Cobijas y colchonetas': 'Cobertores e colchões',
    'Cuidado y alimento de animales': 'Cuidado e ração animal',
    'Atención médica': 'Atendimento médico',
    'Medicamentos / Botiquín': 'Medicamentos / Primeiros socorros',
    'Donar sangre / Banco de sangre': 'Doação de sangue / Banco de sangue',
    'Protección respiratoria': 'Proteção respiratória',
    'Equipo búsqueda y rescate': 'Equipamento de busca e resgate',
    'Herramientas de mano': 'Ferramentas manuais',
    'Remoción de escombros y barro': 'Remoção de entulhos e lama',
    'Maquinaria pesada y operarios': 'Maquinário pesado e operadores',
    'Plantas eléctricas / Generadores': 'Geradores de energia',
    'Equipos de bombeo': 'Equipamentos de bombeamento',
    'Evaluación estructural y técnica': 'Avaliação estrutural e técnica',
    'Materiales de obra básica': 'Materiais de construção básicos',
    'Ferretería e instalaciones básicas': 'Ferragens e instalações básicas',
    'Cubiertas y cerramientos': 'Telhados e fechamentos',
    'Herramientas de construcción': 'Ferramentas de construção',
    'Mano de obra técnica y oficios': 'Mão de obra técnica',
    'Alojamiento temporal': 'Alojamento temporário',
    'Transporte terrestre': 'Transporte terrestre',
    'Transporte aéreo': 'Transporte aéreo',
    'Transporte fluvial': 'Transporte fluvial',
    'Saneamiento y baños portátiles': 'Saneamento e banheiros portáteis',
    'Almacenamiento y bodegaje': 'Armazenamento e depósito',
    'Aulas y espacios educativos temporales': 'Salas de aula temporárias',
    'Cocinas comunitarias': 'Cozinhas comunitárias',
    'Aporte económico / Donación en dinero': 'Aporte financeiro / Doação em dinheiro',
    'Ingeniería, arquitectura y peritaje': 'Engenharia e arquitetura',
    'Geología, geotecnia y gestión del riesgo': 'Geologia e gestão de risco',
    'Asesoría legal y jurídica': 'Assessoria jurídica',
    'Auditoría, contabilidad y finanzas': 'Contabilidade e finanças',
    'Veterinaria y manejo zootécnico': 'Veterinária',
    'Salud mental y apoyo psicosocial': 'Saúde mental e apoio psicossocial',
    'Voluntariado en acopio y empaque': 'Voluntariado em triagem e embalagem',
    'Voluntariado en terreno': 'Voluntariado em campo',
    'Voluntariado social y comunitario': 'Voluntariado social e comunitário',
    'Censo, registro y apoyo operacional': 'Censo e apoio operacional',
  },
  fr: {
    'Agua potable': 'Eau potable',
    'Alimentos': 'Nourriture',
    'Ropa y calzado': 'Vêtements et chaussures',
    'Implementos de aseo e higiene': 'Articles d\'hygiène et d\'entretien',
    'Cobijas y colchonetas': 'Couvertures et matelas',
    'Cuidado y alimento de animales': 'Soins et nourriture pour animaux',
    'Atención médica': 'Soins médicaux',
    'Medicamentos / Botiquín': 'Médicaments / Trousse de secours',
    'Donar sangre / Banco de sangre': 'Don de sang / Banque de sang',
    'Protección respiratoria': 'Protection respiratoire',
    'Equipo búsqueda y rescate': 'Équipement de recherche et sauvetage',
    'Herramientas de mano': 'Outils à main',
    'Remoción de escombros y barro': 'Déblaiement de débris et boue',
    'Maquinaria pesada y operarios': 'Engins lourds et opérateurs',
    'Plantas eléctricas / Generadores': 'Générateurs électriques',
    'Equipos de bombeo': 'Équipements de pompage',
    'Evaluación estructural y técnica': 'Évaluation structurelle et technique',
    'Materiales de obra básica': 'Matériaux de construction de base',
    'Ferretería e instalaciones básicas': 'Quincaillerie et installations de base',
    'Cubiertas y cerramientos': 'Toitures et clôtures',
    'Herramientas de construcción': 'Outils de construction',
    'Mano de obra técnica y oficios': 'Main-d\'œuvre qualifiée et métiers',
    'Alojamiento temporal': 'Hébergement temporaire',
    'Transporte terrestre': 'Transport terrestre',
    'Transporte aéreo': 'Transport aérien',
    'Transporte fluvial': 'Transport fluvial',
    'Saneamiento y baños portátiles': 'Assainissement et toilettes portables',
    'Almacenamiento y bodegaje': 'Stockage et entreposage',
    'Aulas y espacios educativos temporales': 'Salles de classe temporaires',
    'Cocinas comunitarias': 'Cuisines communautaires',
    'Aporte económico / Donación en dinero': 'Contribution financière',
    'Ingeniería, arquitectura y peritaje': 'Ingénierie et architecture',
    'Geología, geotecnia y gestión del riesgo': 'Géologie et gestion des risques',
    'Asesoría legal y jurídica': 'Conseil juridique',
    'Auditoría, contabilidad y finanzas': 'Comptabilité et finances',
    'Veterinaria y manejo zootécnico': 'Services vétérinaires',
    'Salud mental y apoyo psicosocial': 'Santé mentale et soutien psychosocial',
    'Voluntariado en acopio y empaque': 'Bénévolat en tri et emballage',
    'Voluntariado en terreno': 'Bénévolat sur le terrain',
    'Voluntariado social y comunitario': 'Bénévolat social et communautaire',
    'Censo, registro y apoyo operacional': 'Recensement et soutien opérationnel',
  },
};

/**
 * Diccionario de unidades de medida con formas singular y plural por idioma.
 */
export const UNIDAD_TRADUCCIONES: Record<Language, Record<string, { singular: string; plural: string }>> = {
  es: {
    kits: { singular: 'kit', plural: 'kits' },
    unidades: { singular: 'unidad', plural: 'unidades' },
    profesionales: { singular: 'profesional', plural: 'profesionales' },
    plantas: { singular: 'planta', plural: 'plantas' },
    botiquines: { singular: 'botiquín', plural: 'botiquines' },
    viajes: { singular: 'viaje', plural: 'viajes' },
    cuadrillas: { singular: 'cuadrilla', plural: 'cuadrillas' },
    personas: { singular: 'persona', plural: 'personas' },
    juegos: { singular: 'juego', plural: 'juegos' },
    evaluaciones: { singular: 'evaluación', plural: 'evaluaciones' },
    donantes: { singular: 'donante', plural: 'donantes' },
    máquinas: { singular: 'máquina', plural: 'máquinas' },
    motobombas: { singular: 'motobomba', plural: 'motobombas' },
    tejas: { singular: 'teja', plural: 'tejas' },
    bultos: { singular: 'bulto', plural: 'bultos' },
    viviendas: { singular: 'vivienda', plural: 'viviendas' },
    familias: { singular: 'familia', plural: 'familias' },
    animales: { singular: 'animal', plural: 'animales' },
    días: { singular: 'día', plural: 'días' },
    noches: { singular: 'noche', plural: 'noches' },
    raciones: { singular: 'ración', plural: 'raciones' },
    estudiantes: { singular: 'estudiante', plural: 'estudiantes' },
    mudas: { singular: 'muda', plural: 'mudas' },
    litros: { singular: 'litro', plural: 'litros' },
    L: { singular: 'L', plural: 'L' },
    kg: { singular: 'kg', plural: 'kg' },
    toneladas: { singular: 'tonelada', plural: 'toneladas' },
    horas: { singular: 'hora', plural: 'horas' },
  },
  en: {
    kits: { singular: 'kit', plural: 'kits' },
    unidades: { singular: 'unit', plural: 'units' },
    profesionales: { singular: 'professional', plural: 'professionals' },
    plantas: { singular: 'plant', plural: 'plants' },
    botiquines: { singular: 'first-aid kit', plural: 'first-aid kits' },
    viajes: { singular: 'trip', plural: 'trips' },
    cuadrillas: { singular: 'crew', plural: 'crews' },
    personas: { singular: 'person', plural: 'people' },
    juegos: { singular: 'set', plural: 'sets' },
    evaluaciones: { singular: 'assessment', plural: 'assessments' },
    donantes: { singular: 'donor', plural: 'donors' },
    máquinas: { singular: 'machine', plural: 'machines' },
    motobombas: { singular: 'water pump', plural: 'water pumps' },
    tejas: { singular: 'roof tile', plural: 'roof tiles' },
    bultos: { singular: 'sack', plural: 'sacks' },
    viviendas: { singular: 'home', plural: 'homes' },
    familias: { singular: 'family', plural: 'families' },
    animales: { singular: 'animal', plural: 'animals' },
    días: { singular: 'day', plural: 'days' },
    noches: { singular: 'night', plural: 'nights' },
    raciones: { singular: 'meal', plural: 'meals' },
    estudiantes: { singular: 'student', plural: 'students' },
    mudas: { singular: 'clothing set', plural: 'clothing sets' },
    litros: { singular: 'liter', plural: 'liters' },
    L: { singular: 'L', plural: 'L' },
    kg: { singular: 'kg', plural: 'kg' },
    toneladas: { singular: 'ton', plural: 'tons' },
    horas: { singular: 'hour', plural: 'hours' },
  },
  pt: {
    kits: { singular: 'kit', plural: 'kits' },
    unidades: { singular: 'unidade', plural: 'unidades' },
    profesionales: { singular: 'profissional', plural: 'profissionais' },
    plantas: { singular: 'usina/gerador', plural: 'usinas/geradores' },
    botiquines: { singular: 'kit de primeiros socorros', plural: 'kits de primeiros socorros' },
    viajes: { singular: 'viagem', plural: 'viagens' },
    cuadrillas: { singular: 'equipe', plural: 'equipes' },
    personas: { singular: 'pessoa', plural: 'pessoas' },
    juegos: { singular: 'conjunto', plural: 'conjuntos' },
    evaluaciones: { singular: 'avaliação', plural: 'avaliações' },
    donantes: { singular: 'doador', plural: 'doadores' },
    máquinas: { singular: 'máquina', plural: 'máquinas' },
    motobombas: { singular: 'motobomba', plural: 'motobombas' },
    tejas: { singular: 'telha', plural: 'telhas' },
    bultos: { singular: 'saco', plural: 'sacos' },
    viviendas: { singular: 'moradia', plural: 'moradias' },
    familias: { singular: 'família', plural: 'famílias' },
    animales: { singular: 'animal', plural: 'animais' },
    días: { singular: 'dia', plural: 'dias' },
    noches: { singular: 'noite', plural: 'noites' },
    raciones: { singular: 'refeição', plural: 'refeições' },
    estudiantes: { singular: 'estudante', plural: 'estudantes' },
    mudas: { singular: 'muda de roupa', plural: 'mudas de roupa' },
    litros: { singular: 'litro', plural: 'litros' },
    L: { singular: 'L', plural: 'L' },
    kg: { singular: 'kg', plural: 'kg' },
    toneladas: { singular: 'tonelada', plural: 'toneladas' },
    horas: { singular: 'hora', plural: 'horas' },
  },
  fr: {
    kits: { singular: 'kit', plural: 'kits' },
    unidades: { singular: 'unité', plural: 'unités' },
    profesionales: { singular: 'professionnel', plural: 'professionnels' },
    plantas: { singular: 'centrale/générateur', plural: 'centrales/générateurs' },
    botiquines: { singular: 'trousse de secours', plural: 'trousses de secours' },
    viajes: { singular: 'trajet', plural: 'trajets' },
    cuadrillas: { singular: 'équipe', plural: 'équipes' },
    personas: { singular: 'personne', plural: 'personnes' },
    juegos: { singular: 'ensemble', plural: 'ensembles' },
    evaluaciones: { singular: 'évaluation', plural: 'évaluations' },
    donantes: { singular: 'donateur', plural: 'donateurs' },
    máquinas: { singular: 'machine', plural: 'machines' },
    motobombas: { singular: 'motopompe', plural: 'motopompes' },
    tejas: { singular: 'tuile', plural: 'tuiles' },
    bultos: { singular: 'sac', plural: 'sacs' },
    viviendas: { singular: 'logement', plural: 'logements' },
    familias: { singular: 'famille', plural: 'familles' },
    animales: { singular: 'animal', plural: 'animaux' },
    días: { singular: 'jour', plural: 'jours' },
    noches: { singular: 'nuit', plural: 'nuits' },
    raciones: { singular: 'repas', plural: 'repas' },
    estudiantes: { singular: 'étudiant', plural: 'étudiants' },
    mudas: { singular: 'tenue de rechange', plural: 'tenues de rechange' },
    litros: { singular: 'litre', plural: 'litres' },
    L: { singular: 'L', plural: 'L' },
    kg: { singular: 'kg', plural: 'kg' },
    toneladas: { singular: 'tonne', plural: 'tonnes' },
    horas: { singular: 'heure', plural: 'heures' },
  },
};

/**
 * Traduce el nombre de una categoría al idioma activo.
 */
export function translateCategory(cat: string, lang: Language): string {
  if (!cat) return '';
  return CATEGORIA_TRADUCCIONES[lang]?.[cat] || CATEGORIA_TRADUCCIONES['es']?.[cat] || cat;
}

/**
 * Traduce el nombre de un recurso individual al idioma activo.
 */
export function translateItem(item: string, lang: Language): string {
  if (!item) return '';
  return ITEM_TRADUCCIONES[lang]?.[item] || ITEM_TRADUCCIONES['es']?.[item] || item;
}

/**
 * Traduce y pluraliza una unidad de medida según la cantidad y el idioma.
 */
export function translateUnit(cant: number, u: string, lang: Language): string {
  if (!u) return '';
  const map = UNIDAD_TRADUCCIONES[lang] || UNIDAD_TRADUCCIONES['es'];
  const baseKey = Object.keys(UNIDAD_TRADUCCIONES.es).find(
    (k) => k.toLowerCase() === u.toLowerCase() || UNIDAD_TRADUCCIONES.es[k].singular.toLowerCase() === u.toLowerCase()
  );

  if (baseKey && map[baseKey]) {
    return cant === 1 ? map[baseKey].singular : map[baseKey].plural;
  }
  return u;
}

/**
 * Genera la frase de estado de un recurso («falta 1 kit», «1 kit needed», etc.).
 */
export function translateResourceStatus(r: Recurso, tipo: TipoPublicacion, lang: Language): string {
  const queda = restante(r);
  const uTraducida = translateUnit(queda || r.total, r.unidad, lang);

  if (queda === 0) {
    if (lang === 'en') return `${cifra(r.total)} of ${cifra(r.total)} ${uTraducida}`;
    if (lang === 'fr') return `${cifra(r.total)} sur ${cifra(r.total)} ${uTraducida}`;
    return `${cifra(r.total)} de ${cifra(r.total)} ${uTraducida}`;
  }

  if (lang === 'en') {
    if (tipo === 'oferta') {
      return `${cifra(queda)} ${uTraducida} left`;
    }
    return `${cifra(queda)} ${uTraducida} needed`;
  }

  if (lang === 'pt') {
    if (tipo === 'oferta') {
      const v = queda === 1 ? 'resta' : 'restam';
      return `${v} ${cifra(queda)} ${uTraducida}`;
    }
    const v = queda === 1 ? 'falta' : 'faltam';
    return `${v} ${cifra(queda)} ${uTraducida}`;
  }

  if (lang === 'fr') {
    if (tipo === 'oferta') {
      const adj = queda === 1 ? 'restant' : 'restants';
      return `${cifra(queda)} ${uTraducida} ${adj}`;
    }
    return `${cifra(queda)} ${uTraducida} requis`;
  }

  // Español por defecto
  const verbo = tipo === 'oferta' ? (queda === 1 ? 'queda' : 'quedan') : queda === 1 ? 'falta' : 'faltan';
  return `${verbo} ${cifra(queda)} ${uTraducida}`;
}

/**
 * Traduce el texto de distancia hacia el usuario.
 */
export function translateDistance(km: number | null | undefined, lang: Language): string {
  if (km === null || km === undefined || !isFinite(km)) return '';
  const metros = Math.round(km * 1000);

  if (metros < 1000) {
    if (lang === 'en') return `${metros} m from your location`;
    if (lang === 'pt') return `a ${metros} m da sua localização`;
    if (lang === 'fr') return `à ${metros} m de votre position`;
    return `a ${metros} m de tu ubicación`;
  }

  const redondeada = Math.round(km * 10) / 10;
  const numStr = lang === 'en' ? String(redondeada) : String(redondeada).replace('.', ',');

  if (lang === 'en') return `${numStr} km from your location`;
  if (lang === 'pt') return `a ${numStr} km da sua localização`;
  if (lang === 'fr') return `à ${numStr} km de votre position`;
  return `a ${numStr} km de tu ubicación`;
}

/**
 * Traduce el título de la publicación respetando los nombres propios y traduciendo los recursos.
 */
export function translateResourcesTitle(recursos: Recurso[], tipo: TipoPublicacion, lang: Language): string {
  if (!recursos || recursos.length === 0) {
    if (lang === 'en') return tipo === 'oferta' ? 'Available help' : 'Help requested';
    if (lang === 'pt') return tipo === 'oferta' ? 'Ajuda disponível' : 'Ajuda solicitada';
    if (lang === 'fr') return tipo === 'oferta' ? 'Aide disponible' : 'Aide demandée';
    return tipo === 'oferta' ? 'Ayuda disponible' : 'Ayuda requerida';
  }

  const r0 = translateItem(recursos[0].item, lang);
  if (recursos.length === 1) return r0;

  const conjuncion = lang === 'en' ? 'and' : lang === 'fr' ? 'et' : lang === 'pt' ? 'e' : 'y';
  if (recursos.length === 2) {
    const r1 = translateItem(recursos[1].item, lang);
    return `${r0} ${conjuncion} ${r1}`;
  }

  const masStr = lang === 'en' ? 'more' : lang === 'fr' ? 'de plus' : 'más';
  return `${r0} ${conjuncion} ${recursos.length - 1} ${masStr}`;
}

/**
 * Diccionario de tipos de eventos y emergencias de la taxonomía.
 */
export const EMERGENCIA_TRADUCCIONES: Record<Language, Record<string, string>> = {
  es: {
    'Inundación': 'Inundación',
    'Terremoto': 'Terremoto',
    'Vendaval / Tormenta': 'Vendaval / Tormenta',
    'Incendio forestal / Erupción': 'Incendio forestal / Erupción',
    'Derrumbe / Deslizamiento': 'Derrumbe / Deslizamiento',
    'Epidemia / Emergencia sanitaria': 'Epidemia / Emergencia sanitaria',
    'Otra emergencia comunitaria': 'Otra emergencia comunitaria',
  },
  en: {
    'Inundación': 'Flood',
    'Terremoto': 'Earthquake',
    'Vendaval / Tormenta': 'Windstorm / Severe storm',
    'Incendio forestal / Erupción': 'Wildfire / Volcanic eruption',
    'Derrumbe / Deslizamiento': 'Landslide / Mudslide',
    'Epidemia / Emergencia sanitaria': 'Epidemic / Health emergency',
    'Otra emergencia comunitaria': 'Other community emergency',
  },
  pt: {
    'Inundación': 'Inundação',
    'Terremoto': 'Terremoto',
    'Vendaval / Tormenta': 'Vendaval / Tempestade',
    'Incendio forestal / Erupción': 'Incêndio florestal / Erupção',
    'Derrumbe / Deslizamiento': 'Deslizamento de terra',
    'Epidemia / Emergencia sanitaria': 'Epidemia / Emergência sanitária',
    'Otra emergencia comunitaria': 'Outra emergência comunitária',
  },
  fr: {
    'Inundación': 'Inondation',
    'Terremoto': 'Séisme / Tremblement de terre',
    'Vendaval / Tormenta': 'Tempête de vent / Orage',
    'Incendio forestal / Erupción': 'Feu de forêt / Éruption',
    'Derrumbe / Deslizamiento': 'Glissement de terrain',
    'Epidemia / Emergencia sanitaria': 'Épidémie / Urgence sanitaire',
    'Otra emergencia comunitaria': 'Autre urgence communautaire',
  },
};

export function translateEmergency(evento: string, lang: Language): string {
  if (!evento) return '';
  return EMERGENCIA_TRADUCCIONES[lang]?.[evento] || evento;
}
export const tEvento = translateEmergency;
export const tRecurso = translateItem;
export const tUnidad = (u: string, lang: Language, cant: number = 1): string => translateUnit(cant, u, lang);
