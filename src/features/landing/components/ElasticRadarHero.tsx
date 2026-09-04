import React from 'react';
import { RadarAnimatedLogo } from './RadarAnimatedLogo';

interface ElasticRadarHeroProps {
  onOpenChat: () => void;
}

export const ElasticRadarHero: React.FC<ElasticRadarHeroProps> = ({ onOpenChat }) => {
  const scrollToContent = () => {
    const target = document.getElementById('contenido-principal') || document.getElementById('como-funciona');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-[calc(100svh-4rem)] sm:min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-between px-4 pt-2 pb-4">
      {/* 1. RADAR MONUMENTAL: Centrado puro, sereno y diáfano */}
      <div className="flex-1 flex items-center justify-center w-full max-w-full z-10">
        <div className="relative flex items-center justify-center w-[min(68dvh,94vw,420px)] h-[min(68dvh,94vw,420px)] sm:w-[min(74vh,800px,90vw)] sm:h-[min(74vh,800px,90vw)] max-w-full">
          <RadarAnimatedLogo
            onOpenChat={onOpenChat}
            className="w-full h-full aspect-square mx-auto"
          />
        </div>
      </div>

      {/* 2. DIVISIÓN SUTIL E INTERACTIVA ENTRE EL RADAR Y LA PLATAFORMA */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center z-10 pt-1 pb-1">
        {/* Píldora interactiva con micro-indicadores y scroll suave */}
        <button
          type="button"
          onClick={scrollToContent}
          className="group relative flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs text-slate-600 hover:text-slate-900 transition-all duration-300 cursor-pointer text-xs font-medium backdrop-blur-xs"
          aria-label="Conoce raDAR"
        >
          {/* Micro-puntos tricolor representativos del radar */}
          <span className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
          </span>

          <span className="tracking-tight text-slate-700 font-sans font-medium">
            Conoce raDAR
          </span>

          {/* Flechita con micro-animación al hover */}
          <svg
            className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-transform duration-200 group-hover:translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Línea divisoria translúcida sutil */}
        <div className="w-36 h-px bg-linear-to-r from-transparent via-slate-300/70 to-transparent mt-2.5" />
      </div>
    </section>
  );
};
