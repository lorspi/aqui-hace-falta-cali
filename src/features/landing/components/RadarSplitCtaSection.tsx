import React from 'react';
import { HeartHandshake, Map, ArrowRight } from 'lucide-react';
import { RadarAnimatedLogo } from './RadarAnimatedLogo';

interface RadarSplitCtaSectionProps {
  onOpenChat: () => void;
}

export const RadarSplitCtaSection: React.FC<RadarSplitCtaSectionProps> = ({ onOpenChat }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tarjeta con imagen de fondo fotográfica real y gradientes cinematográficos balanceados */}
      <div className="relative rounded-3xl sm:rounded-4xl overflow-hidden shadow-2xl border border-slate-800/60 p-6 sm:p-12 lg:p-16 transition-all min-h-[540px] flex items-center">
        {/* Foto de fondo real */}
        <img
          src="/images/landing/voluntarios-accion.jpg"
          alt="Voluntarios cooperando y levantando escombros juntos"
          className="absolute inset-0 w-full h-full object-cover object-center scale-102 brightness-105 contrast-95"
        />

        {/* Capas de gradientes más luminosas y diáfanas */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/15" />
        <div className="absolute inset-0 bg-brand-blue/10 mix-blend-multiply pointer-events-none" />

        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna Izquierda: Título imponente en 3 filas exactas y botones normales */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-extrabold text-white font-sans tracking-tight leading-[1.04]">
              <span className="block lg:whitespace-nowrap">Conectamos la ayuda</span>
              <span className="block mt-1 sm:mt-2 lg:whitespace-nowrap">donde realmente</span>
              <span className="block mt-1 sm:mt-2 lg:whitespace-nowrap">hace falta.</span>
            </h2>

            {/* Botones de Acción: Tamaño normal estándar equilibrado */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {/* Botón Primario: Pedir ayuda */}
              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-brand-red hover:bg-[#B83232] active:scale-98 shadow-md shadow-brand-red/30 transition-all cursor-pointer font-sans"
              >
                <HeartHandshake className="w-5 h-5 text-white shrink-0" />
                <span>Pedir ayuda</span>
              </button>

              {/* Botón Secundario: Ver mapa en vivo */}
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 active:scale-98 transition-all cursor-pointer font-sans"
              >
                <Map className="w-4 h-4 text-white" />
                <span>Ver mapa en vivo</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/60" />
              </a>
            </div>
          </div>

          {/* Columna Derecha: El logo monumental perfectamente centrado en cualquier pantalla */}
          <div className="lg:col-span-5 flex items-center justify-center relative w-full">
            {/* Aura sutil para realzar los arcos sobre la foto */}
            <div className="absolute w-64 h-64 sm:w-88 sm:h-88 rounded-full bg-brand-blue/20 blur-3xl pointer-events-none" />
            <RadarAnimatedLogo
              onOpenChat={onOpenChat}
              className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] lg:max-w-[460px] xl:max-w-[490px] mx-auto relative z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
