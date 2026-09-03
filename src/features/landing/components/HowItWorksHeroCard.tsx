import React, { useState } from 'react';
import { HeartHandshake, ArrowRight, Check } from 'lucide-react';

interface StepData {
  id: string;
  pillNumber: string;
  pillTitle: string;
  title: string;
  description: string;
  highlights: string[];
  imageSrc: string;
  imageAlt: string;
}

const STEPS: StepData[] = [
  {
    id: 'reporta',
    pillNumber: '01',
    pillTitle: 'Reporta',
    title: 'Comparte qué hace falta o qué puedes dar en 1 minuto',
    description:
      'A través de preguntas cortas y humanas, el chat captura la ubicación exacta y lo que se necesita en terreno para que la ayuda llegue sin burocracia.',
    highlights: [
      'Georreferenciación en segundos',
      'Clasificación automática de urgencia',
      'Seguimiento transparente con ticket',
    ],
    imageSrc: '/images/landing/baldes-escombros.jpg',
    imageAlt: 'Equipo de personas removiendo escombros y cooperando en terreno',
  },
  {
    id: 'conecta',
    pillNumber: '02',
    pillTitle: 'Conecta',
    title: 'Cruzamos la necesidad real con quien puede resolverla',
    description:
      'raDAR centraliza los reportes verificados para que brigadas, fundaciones y vecinos sepan exactamente a dónde dirigirse sin duplicar esfuerzos ni chocar entre sí.',
    highlights: [
      'Filtros por zona y necesidad',
      'Asignación directa sin sobreoferta',
      'Centros de acopio en mapa vivo',
    ],
    imageSrc: '/images/landing/brigadistas-camion.jpg',
    imageAlt: 'Brigadistas y policía coordinando en la zona de emergencia',
  },
  {
    id: 'rastrea',
    pillNumber: '03',
    pillTitle: 'Rastrea',
    title: 'Confirmamos que la ayuda llegó a quien la necesita',
    description:
      'Cada necesidad tiene trazabilidad abierta en el mapa. Al entregarse los insumos, el reporte se actualiza para liberar recursos hacia donde todavía hacen falta.',
    highlights: [
      'Verificación comunitaria en terreno',
      'Actualizaciones en tiempo real',
      'Métricas abiertas de impacto',
    ],
    imageSrc: '/images/landing/colapso-rescate.jpg',
    imageAlt: 'Operación de rescate y maquinaria en zona afectada',
  },
];

interface HowItWorksHeroCardProps {
  onOpenChat: () => void;
}

export const HowItWorksHeroCard: React.FC<HowItWorksHeroCardProps> = ({ onOpenChat }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const step = STEPS[activeStepIndex];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tarjeta de Cómo Funciona: ancho contenido (max-w-4xl) y altura estandarizada para evitar saltos */}
      <div className="relative max-w-3xl lg:max-w-4xl mx-auto rounded-3xl sm:rounded-4xl overflow-hidden shadow-sm border border-slate-200/90 bg-white min-h-[440px] sm:min-h-[460px] flex flex-col justify-between p-6 sm:p-9 transition-all">
        {/* Píldoras selectoras superiores con colores temáticos dinámicos (Amarillo, Azul, Rojo) */}
        <div className="relative z-10 flex justify-center w-full">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-xs">
            {STEPS.map((s, index) => {
              const isSelected = activeStepIndex === index;
              // Tríada cromática acuarelada / pastel suave con texto negro en todas
              const activeColorClass =
                index === 0
                  ? 'bg-amber-100/90 text-slate-900 border border-amber-300/80 shadow-xs scale-102 font-bold'
                  : index === 1
                  ? 'bg-blue-100/90 text-slate-900 border border-blue-300/80 shadow-xs scale-102 font-bold'
                  : 'bg-rose-100/90 text-slate-900 border border-rose-300/80 shadow-xs scale-102 font-bold';

              const activeBadgeClass =
                index === 0
                  ? 'bg-amber-300/70 text-slate-950'
                  : index === 1
                  ? 'bg-blue-300/70 text-slate-950'
                  : 'bg-rose-300/70 text-slate-950';

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStepIndex(index)}
                  className={`relative px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer font-sans ${
                    isSelected
                      ? activeColorClass
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 font-medium'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black ${
                      isSelected ? activeBadgeClass : 'bg-slate-200 text-slate-700'
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

        {/* Contenido centrado con altura fija estandarizada para evitar cualquier salto de pantalla */}
        <div className="relative z-10 max-w-2xl mx-auto w-full text-center my-auto py-4 flex flex-col items-center justify-center">
          {/* Ranura fija para el título: siempre toma el mismo espacio */}
          <div className="min-h-[58px] sm:min-h-[72px] flex items-center justify-center w-full">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-sans tracking-tight leading-snug">
              {step.title}
            </h3>
          </div>

          {/* Ranura fija para la descripción */}
          <div className="min-h-[64px] sm:min-h-[56px] flex items-center justify-center w-full mt-2 sm:mt-3">
            <p className="text-slate-600 text-xs sm:text-sm md:text-base font-body leading-relaxed max-w-xl mx-auto">
              {step.description}
            </p>
          </div>

          {/* Ranura fija para los highlights */}
          <div className="min-h-[36px] sm:min-h-[32px] flex items-center justify-center w-full mt-3 sm:mt-4">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-700 font-semibold">
              {step.highlights.map((highlight) => (
                <span key={highlight} className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{highlight}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Ranura fija para el botón de acción */}
          <div className="mt-5 sm:mt-6 flex items-center justify-center h-[46px]">
            {activeStepIndex === 0 ? (
              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-brand-red hover:bg-[#B83232] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-brand-red/25 active:scale-98 transition-all cursor-pointer font-sans"
              >
                <HeartHandshake className="w-4 h-4 text-white" />
                <span>Pedir ayuda</span>
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-blue/20 active:scale-98 transition-all cursor-pointer font-sans"
              >
                <span>Ver mapa en vivo</span>
                <ArrowRight className="w-4 h-4 text-white/90" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
