import { HelpCategory, NeedStatus, PlaceType, Priority, VerificationStatus } from '../types';

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
    bgClass: 'bg-brand-yellow/15 text-amber-900 border-brand-yellow/30',
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
    label: '✓ Verificado',
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

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Hace un instante';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } catch (e) {
    return 'Recientemente';
  }
}

export function buildWhatsappLink(phone: string, title: string, categories: HelpCategory[]): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  // Add Colombia country code if not already present
  if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
    cleanPhone = '57' + cleanPhone;
  }
  const catNames = categories.map((c) => CATEGORY_LABELS[c]?.label || c).join(', ');
  const message = `Hola, vi en la plataforma 'Aquí Hace Falta' la necesidad: "${title}" (${catNames}). Me gustaría ofrecer mi ayuda.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
