import React, { useState } from 'react';
import { MessageSquarePlus, GitMerge, CheckCircle2, ShieldAlert, ArrowRight, Clock, MapPin, Users } from 'lucide-react';

interface StepData {
  id: string;
  pillNumber: string;
  pillTitle: string;
  title: string;
  description: string;
  features: { icon: React.ReactNode; label: string; detail: string }[];
  imageSrc: string;
  imageAlt: string;
  cardBadge: {
    status: string;
    text: string;
    subtext: string;
  };
}

const STEPS: StepData[] = [
  {
    id: 'reporta',
    pillNumber: '01',
    pillTitle: 'Reporta',
    title: 'Comparte qué hace falta o qué puedes dar en 1 minuto',
    description: 'Cualquier persona, líder barrial o brigadista puede levantar la mano a través de nuestro módulo de chat rápido. Preguntas concretas para capturar la ubicación exacta y la necesidad real.',
    features: [
      {
        icon: <MessageSquarePlus className="w-4 h-4 text-brand-blue" />,
        label: 'Chat guiado y conversacional',
        detail: 'Qué se necesita, dónde y a quién contactar.',
      },
      {
        icon: <MapPin className="w-4 h-4 text-brand-red" />,
        label: 'Ubicación georreferenciada',
        detail: 'Puntos claros en el mapa para evitar pérdidas de tiempo.',
      },
      {
        icon: <Clock className="w-4 h-4 text-brand-yellow" />,
        label: 'Ticket prioritario instantáneo',
        detail: 'Entra directo al radar de validación del equipo.',
      },
    ],
    imageSrc: '/images/landing/baldes-escombros.jpg',
    imageAlt: 'Equipo de personas removiendo escombros y cooperando en terreno',
    cardBadge: {
      status: 'bg-brand-red',
      text: 'Ticket #084 Generado',
      subtext: 'Herramientas y baldes para retiro · Prioridad Alta',
    },
  },
  {
    id: 'conecta',
    pillNumber: '02',
    pillTitle: 'Conecta',
    title: 'Cruzamos la necesidad real con quien puede resolverla',
    description: 'En emergencias, las cadenas de WhatsApp confunden y saturan. raDAR centraliza los reportes y permite que fundaciones, brigadas y voluntarios sepan exactamente a dónde dirigirse sin chocar entre sí.',
    features: [
      {
        icon: <ShieldAlert className="w-4 h-4 text-brand-blue" />,
        label: 'Verificación comunitaria',
        detail: 'Filtro humano antifraude para confirmar veracidad.',
      },
      {
        icon: <GitMerge className="w-4 h-4 text-brand-blue" />,
        label: 'Articulación directa',
        detail: 'Conexión entre el vecino afectado y el donante u ONG capacitada.',
      },
      {
        icon: <Users className="w-4 h-4 text-brand-blue" />,
        label: 'Sin intermediarios de dinero',
        detail: 'raDAR no almacena ni retiene fondos: conecta manos.',
      },
    ],
    imageSrc: '/images/landing/brigadistas-camion.jpg',
    imageAlt: 'Brigadistas y policía coordinando en la zona de emergencia',
    cardBadge: {
      status: 'bg-brand-blue',
      text: 'Asignación Coordinada',
      subtext: 'Brigada de voluntarios en camino · Siloé',
    },
  },
  {
    id: 'rastrea',
    pillNumber: '03',
    pillTitle: 'Rastrea',
    title: 'Confirmamos que la ayuda llegó a quien la necesita',
    description: 'Cada necesidad tiene trazabilidad en el mapa. Una vez que la entrega se concreta o el problema se atiende en terreno, el reporte se actualiza para no enviar más recursos innecesarios al mismo punto.',
    features: [
      {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        label: 'Cierre de reporte confirmado',
        detail: 'Evita desperdicio de insumos en zonas ya abastecidas.',
      },
      {
        icon: <Clock className="w-4 h-4 text-slate-600" />,
        label: 'Hora y fecha de última actualización',
        detail: 'Cualquier persona puede saber cuándo fue atendido.',
      },
      {
        icon: <MapPin className="w-4 h-4 text-brand-blue" />,
        label: 'Historial de impacto comunitario',
        detail: 'Datos abiertos para la toma de decisiones ciudadanas.',
      },
    ],
    imageSrc: '/images/landing/colapso-rescate.jpg',
    imageAlt: 'Operación de rescate y maquinaria en zona afectada',
    cardBadge: {
      status: 'bg-emerald-500',
      text: 'Reporte Completado',
      subtext: 'Ayuda entregada a 14 familias · Actualizado hace 20m',
    },
  },
];

interface HowItWorksPillsProps {
  onOpenChat: () => void;
}

export const HowItWorksPills: React.FC<HowItWorksPillsProps> = ({ onOpenChat }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const step = STEPS[activeStepIndex];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tarjeta contenedora única de alta gama */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10 lg:p-12 transition-all">
        {/* Encabezado integrado dentro de la tarjeta: Título a la izquierda, Selector de pastillas a la derecha */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-8 mb-8 border-b border-slate-100">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-text font-sans tracking-tight">
              Cómo funciona
            </h3>
          </div>

          {/* Segmented control integrado con alta precisión */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-inner">
            {STEPS.map((s, index) => {
              const isSelected = activeStepIndex === index;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStepIndex(index)}
                  className={`relative px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer font-sans ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs scale-101'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s.pillNumber}
                  </span>
                  <span>{s.pillTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido dinámico del paso activo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna Izquierda: Texto y Puntos Clave */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight font-sans leading-tight">
                {step.title}
              </h4>
              <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed font-body">
                {step.description}
              </p>
            </div>

            {/* Puntos clave elegantes y ligeros */}
            <div className="space-y-3 pt-2">
              {step.features.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                      {item.label}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 font-body">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón contextual */}
            <div className="pt-3">
              {activeStepIndex === 0 ? (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-blue hover:bg-blue-900 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all font-sans"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Abrir chat y reportar
                </button>
              ) : (
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all font-sans"
                >
                  Ver mapa en vivo
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Columna Derecha: Fotografía real con ficha de estado */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-4/3 sm:aspect-16/10 shadow-lg border border-slate-200 group">
              <img
                src={step.imageSrc}
                alt={step.imageAlt}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

              {/* Ficha flotante de estado en terreno */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${step.cardBadge.status} shrink-0 animate-pulse`} />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 font-sans leading-tight">
                      {step.cardBadge.text}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-body">
                      {step.cardBadge.subtext}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  raDAR en vivo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
