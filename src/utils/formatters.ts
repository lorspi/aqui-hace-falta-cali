import { HelpCategory, NeedStatus, PlaceType, Priority, VerificationStatus } from '../types';
import { Language } from '../i18n/translations';

export const CATEGORY_LABELS_EN: Record<HelpCategory, { label: string; icon: string }> = {
  ESCOMBROS: { label: 'Debris removal', icon: '⛏️' },
  MANO_OBRA: { label: 'Labor / Volunteers', icon: '👷' },
  TRANSPORTE: { label: 'Transport / Freight', icon: '🚚' },
  ALIMENTOS: { label: 'Donate food', icon: '🍞' },
  AGUA: { label: 'Donate drinking water', icon: '💧' },
  ROPA: { label: 'Clothing & blankets', icon: '👕' },
  MEDICAMENTOS: { label: 'Medicines / First aid', icon: '💊' },
  SANGRE: { label: 'Blood donation', icon: '🩸' },
  DINERO: { label: 'Financial contribution', icon: '💳' },
  HERRAMIENTAS: { label: 'Hand tools', icon: '🛠️' },
  MAQUINARIA: { label: 'Heavy machinery', icon: '🚜' },
  OPERARIOS_MAQUINARIA: { label: 'Machinery operators', icon: '🏗️' },
  ATENCION_MEDICA: { label: 'Medical care', icon: '🩺' },
  APOYO_PSICOLOGICO: { label: 'Psychological support', icon: '🧠' },
  ALOJAMIENTO: { label: 'Shelter / Tents', icon: '⛺' },
  ANIMALES: { label: 'Animal care', icon: '🐾' },
  LOGISTICA: { label: 'Logistics support', icon: '📋' },
  CLASIFICACION_DONACIONES: { label: 'Donation sorting', icon: '📦' },
  VOLUNTARIADO_GENERAL: { label: 'General volunteering', icon: '🤝' },
  OTRO: { label: 'Other type of help', icon: '🔹' },
};

export const CATEGORY_LABELS_PT: Record<HelpCategory, { label: string; icon: string }> = {
  ESCOMBROS: { label: 'Remover entulhos', icon: '⛏️' },
  MANO_OBRA: { label: 'Mão de obra / Voluntários', icon: '👷' },
  TRANSPORTE: { label: 'Transporte / Frete', icon: '🚚' },
  ALIMENTOS: { label: 'Doar alimentos', icon: '🍞' },
  AGUA: { label: 'Doar água potável', icon: '💧' },
  ROPA: { label: 'Roupas e cobertores', icon: '👕' },
  MEDICAMENTOS: { label: 'Medicamentos / Primeiros socorros', icon: '💊' },
  SANGRE: { label: 'Doar sangue', icon: '🩸' },
  DINERO: { label: 'Contribuição financeira', icon: '💳' },
  HERRAMIENTAS: { label: 'Ferramentas manuais', icon: '🛠️' },
  MAQUINARIA: { label: 'Maquinário pesado', icon: '🚜' },
  OPERARIOS_MAQUINARIA: { label: 'Operadores de máquinas', icon: '🏗️' },
  ATENCION_MEDICA: { label: 'Atendimento médico', icon: '🩺' },
  APOYO_PSICOLOGICO: { label: 'Apoio psicológico', icon: '🧠' },
  ALOJAMIENTO: { label: 'Alojamento / Tendas', icon: '⛺' },
  ANIMALES: { label: 'Cuidado de animais', icon: '🐾' },
  LOGISTICA: { label: 'Apoio logístico', icon: '📋' },
  CLASIFICACION_DONACIONES: { label: 'Triagem de doações', icon: '📦' },
  VOLUNTARIADO_GENERAL: { label: 'Voluntariado geral', icon: '🤝' },
  OTRO: { label: 'Outro tipo de ajuda', icon: '🔹' },
};

export const CATEGORY_LABELS_FR: Record<HelpCategory, { label: string; icon: string }> = {
  ESCOMBROS: { label: 'Déblaiement de débris', icon: '⛏️' },
  MANO_OBRA: { label: 'Main d\'œuvre / Bénévoles', icon: '👷' },
  TRANSPORTE: { label: 'Transport / Fret', icon: '🚚' },
  ALIMENTOS: { label: 'Faire don de nourriture', icon: '🍞' },
  AGUA: { label: 'Faire don d\'eau potable', icon: '💧' },
  ROPA: { label: 'Vêtements & couvertures', icon: '👕' },
  MEDICAMENTOS: { label: 'Médicaments / Premiers secours', icon: '💊' },
  SANGRE: { label: 'Don de sang', icon: '🩸' },
  DINERO: { label: 'Contribution financière', icon: '💳' },
  HERRAMIENTAS: { label: 'Outils manuels', icon: '🛠️' },
  MAQUINARIA: { label: 'Engins lourds', icon: '🚜' },
  OPERARIOS_MAQUINARIA: { label: 'Conducteurs d\'engins', icon: '🏗️' },
  ATENCION_MEDICA: { label: 'Soins médicaux', icon: '🩺' },
  APOYO_PSICOLOGICO: { label: 'Soutien psychologique', icon: '🧠' },
  ALOJAMIENTO: { label: 'Hébergement / Tentes', icon: '⛺' },
  ANIMALES: { label: 'Soins aux animaux', icon: '🐾' },
  LOGISTICA: { label: 'Soutien logistique', icon: '📋' },
  CLASIFICACION_DONACIONES: { label: 'Tri des dons', icon: '📦' },
  VOLUNTARIADO_GENERAL: { label: 'Bénévolat général', icon: '🤝' },
  OTRO: { label: 'Autre type d\'aide', icon: '🔹' },
};

export const CATEGORY_LABELS: Record<HelpCategory, { label: string; icon: string }> = {
  ESCOMBROS: { label: 'Remover escombros', icon: '⛏️' },
  MANO_OBRA: { label: 'Mano de obra', icon: '👷' },
  TRANSPORTE: { label: 'Transporte / Flete', icon: '🚚' },
  ALIMENTOS: { label: 'Donar alimentos', icon: '🍞' },
  AGUA: { label: 'Donar agua potable', icon: '💧' },
  ROPA: { label: 'Ropa y cobijas', icon: '👕' },
  MEDICAMENTOS: { label: 'Medicamentos / Botiquín', icon: '💊' },
  SANGRE: { label: 'Donar sangre', icon: '🩸' },
  DINERO: { label: 'Aporte económico', icon: '💳' },
  HERRAMIENTAS: { label: 'Herramientas de mano', icon: '🛠️' },
  MAQUINARIA: { label: 'Maquinaria pesada', icon: '🚜' },
  OPERARIOS_MAQUINARIA: { label: 'Operarios de maquinaria pesada', icon: '🏗️' },
  ATENCION_MEDICA: { label: 'Atención médica', icon: '🩺' },
  APOYO_PSICOLOGICO: { label: 'Apoyo psicológico', icon: '🧠' },
  ALOJAMIENTO: { label: 'Alojamiento / Carpas', icon: '⛺' },
  ANIMALES: { label: 'Cuidado de animales', icon: '🐾' },
  LOGISTICA: { label: 'Apoyo logístico', icon: '📋' },
  CLASIFICACION_DONACIONES: { label: 'Clasificar donaciones', icon: '📦' },
  VOLUNTARIADO_GENERAL: { label: 'Voluntariado general', icon: '🤝' },
  OTRO: { label: 'Otro tipo de ayuda', icon: '🔹' },
};

export function getCategoryLabel(cat: HelpCategory, lang: Language = 'es') {
  if (lang === 'en') return CATEGORY_LABELS_EN[cat] || CATEGORY_LABELS[cat];
  if (lang === 'pt') return CATEGORY_LABELS_PT[cat] || CATEGORY_LABELS[cat];
  if (lang === 'fr') return CATEGORY_LABELS_FR[cat] || CATEGORY_LABELS[cat];
  return CATEGORY_LABELS[cat];
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badgeClass: string; borderClass: string; textClass: string; bgClass: string; explanation: string; dot: string }
> = {
  CRITICAL: {
    label: 'Urgente',
    dot: '🔴',
    badgeClass: 'bg-brand-red/10 text-brand-red px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider italic border border-brand-red/20',
    borderClass: 'border-l-4 border-l-brand-red border-slate-200',
    textClass: 'text-brand-red font-bold',
    bgClass: 'bg-brand-red/10 text-brand-red border-brand-red/20',
    explanation: 'Situación grave con riesgo directo. Necesidad urgente e inmediata.',
  },
  HIGH: {
    label: 'Prioridad Alta',
    dot: '🟠',
    badgeClass: 'bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-orange-200',
    borderClass: 'border-l-4 border-l-orange-500 border-slate-200',
    textClass: 'text-orange-700 font-bold',
    bgClass: 'bg-orange-50 text-orange-900 border-orange-200',
    explanation: 'Necesidad importante que requiere atención en las próximas horas.',
  },
  MEDIUM: {
    label: 'Prioridad Media',
    dot: '🟡',
    badgeClass: 'bg-brand-yellow/15 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-brand-yellow/30',
    borderClass: 'border-l-4 border-l-brand-yellow border-slate-200',
    textClass: 'text-amber-800 font-bold',
    bgClass: 'bg-amber-900 font-bold',
    explanation: 'Necesidad relevante pero no de respuesta inmediata.',
  },
  LOW: {
    label: 'Prioridad Baja',
    dot: '🟢',
    badgeClass: 'bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-slate-200',
    borderClass: 'border-l-4 border-l-slate-400 border-slate-200',
    textClass: 'text-slate-700 font-medium',
    bgClass: 'bg-slate-50 text-slate-900 border-slate-200',
    explanation: 'Necesidad complementaria para etapas de estabilización.',
  },
};

export const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { label: string; badgeClass: string; icon: string; description: string }
> = {
  VERIFIED: {
    label: 'Verificado',
    badgeClass: 'text-indigo-600 bg-indigo-50/80 border-indigo-200 font-bold uppercase text-[10px] tracking-wider',
    icon: '✓',
    description: 'Confirmada por una fuente oficial, organización responsable o moderación.',
  },
  PENDING_VERIFICATION: {
    label: 'Pendiente',
    badgeClass: 'text-slate-500 bg-slate-50 border-slate-200 font-medium uppercase text-[10px]',
    icon: '◷',
    description: 'Enviada por la ciudadanía. En proceso de confirmación en terreno.',
  },
  REPORTED: {
    label: 'Reportada',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 font-bold uppercase text-[10px]',
    icon: '⚠️',
    description: 'Reportada por usuarios como posiblemente desactualizada o incorrecta.',
  },
  ARCHIVED: {
    label: 'Archivada',
    badgeClass: 'text-slate-400 bg-slate-100 border-slate-200 font-medium uppercase text-[10px]',
    icon: '📁',
    description: 'Esta solicitud ha sido archivada por resolución o inactividad.',
  },
};

export const STATUS_CONFIG: Record<NeedStatus, { label: string; badgeClass: string }> = {
  NEED_HELP_NOW: { label: 'Necesita ayuda ahora', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
  RECEIVING_HELP: { label: 'Recibiendo ayuda', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  PARTIALLY_COVERED: { label: 'Ayuda parcialmente cubierta', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
  COVERED: { label: 'Ayuda cubierta', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CLOSED: { label: 'Cerrado / Finalizado', badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' },
};

export const PLACE_TYPE_LABELS_EN: Record<PlaceType, string> = {
  EDIFICIO_AFECTADO: 'Affected building',
  CENTRO_ACOPIO: 'Collection center',
  CENTRO_DISTRIBUCION: 'Distribution center',
  HOSPITAL: 'Hospital / Medical center',
  BANCO_SANGRE: 'Blood bank',
  REFUGIO: 'Shelter / Refuge',
  COMUNIDAD_AFECTADA: 'Affected community',
  PUNTO_LOGISTICO: 'Logistics hub',
  ORGANIZACION: 'Organization',
  OTRO: 'Other location type',
};

export const PLACE_TYPE_LABELS_PT: Record<PlaceType, string> = {
  EDIFICIO_AFECTADO: 'Edifício afetado',
  CENTRO_ACOPIO: 'Centro de coleta',
  CENTRO_DISTRIBUCION: 'Centro de distribuição',
  HOSPITAL: 'Hospital / Centro médico',
  BANCO_SANGRE: 'Banco de sangue',
  REFUGIO: 'Abrigo / Albergue',
  COMUNIDAD_AFECTADA: 'Comunidade afetada',
  PUNTO_LOGISTICO: 'Ponto logístico',
  ORGANIZACION: 'Organização',
  OTRO: 'Outro tipo de local',
};

export const PLACE_TYPE_LABELS_FR: Record<PlaceType, string> = {
  EDIFICIO_AFECTADO: 'Bâtiment touché',
  CENTRO_ACOPIO: 'Centre de collecte',
  CENTRO_DISTRIBUCION: 'Centre de distribution',
  HOSPITAL: 'Hôpital / Centre médical',
  BANCO_SANGRE: 'Banque de sang',
  REFUGIO: 'Refuge / Abri',
  COMUNIDAD_AFECTADA: 'Communauté touchée',
  PUNTO_LOGISTICO: 'Point logistique',
  ORGANIZACION: 'Organisation',
  OTRO: 'Autre type de lieu',
};

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  EDIFICIO_AFECTADO: 'Edificio afectado',
  CENTRO_ACOPIO: 'Centro de acopio',
  CENTRO_DISTRIBUCION: 'Centro de distribución',
  HOSPITAL: 'Hospital / Centro médico',
  BANCO_SANGRE: 'Banco de sangre',
  REFUGIO: 'Refugio / Albergue',
  COMUNIDAD_AFECTADA: 'Comunidad afectada',
  PUNTO_LOGISTICO: 'Punto logístico',
  ORGANIZACION: 'Organización',
  OTRO: 'Otro tipo de lugar',
};

export function getPlaceTypeLabel(type: PlaceType, lang: Language = 'es') {
  if (lang === 'en') return PLACE_TYPE_LABELS_EN[type] || PLACE_TYPE_LABELS[type];
  if (lang === 'pt') return PLACE_TYPE_LABELS_PT[type] || PLACE_TYPE_LABELS[type];
  if (lang === 'fr') return PLACE_TYPE_LABELS_FR[type] || PLACE_TYPE_LABELS[type];
  return PLACE_TYPE_LABELS[type];
}

export function formatTimeAgo(isoString: string, lang: Language = 'es'): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (lang === 'en') {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} h ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    if (lang === 'pt') {
      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHours < 24) return `Há ${diffHours} h`;
      return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }

    if (lang === 'fr') {
      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }

    if (diffMins < 1) return 'Hace un instante';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } catch (e) {
    if (lang === 'en') return 'Recently';
    if (lang === 'pt') return 'Recentemente';
    if (lang === 'fr') return 'Récemment';
    return 'Recientemente';
  }
}

export function buildWhatsappLink(phone: string, title: string, categories: HelpCategory[], lang: Language = 'es'): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
    cleanPhone = '57' + cleanPhone;
  }
  const catNames = categories.map((c) => getCategoryLabel(c, lang)?.label || c).join(', ');

  let message = `Hola, vi en la plataforma 'Aquí Hace Falta' la necesidad: "${title}" (${catNames}). Me gustaría ofrecer mi ayuda.`;
  if (lang === 'en') {
    message = `Hello, I saw on the 'Aquí Hace Falta' platform the need: "${title}" (${catNames}). I would like to offer my help.`;
  } else if (lang === 'pt') {
    message = `Olá, vi na plataforma 'Aquí Hace Falta' a necessidade: "${title}" (${catNames}). Gostaria de oferecer minha ajuda.`;
  } else if (lang === 'fr') {
    message = `Bonjour, j'ai vu sur la plateforme 'Aquí Hace Falta' le besoin: "${title}" (${catNames}). Je souhaite proposer mon aide.`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
