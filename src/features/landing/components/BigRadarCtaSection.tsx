import React from 'react';
import { RadarAnimatedLogo } from './RadarAnimatedLogo';

interface BigRadarCtaSectionProps {
  onOpenChat: () => void;
}

export const BigRadarCtaSection: React.FC<BigRadarCtaSectionProps> = ({ onOpenChat }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tarjeta limpia en modo claro */}
      <div className="bg-white rounded-3xl sm:rounded-4xl border border-slate-200/90 shadow-sm p-8 sm:p-14 lg:p-20 text-center transition-all overflow-hidden">
        {/* Encabezado armónico */}
        <div className="max-w-2xl mx-auto mb-10 sm:mb-14">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-brand-text font-sans tracking-tight">
            El punto exacto de la ayuda
          </h3>
          <p className="text-slate-500 text-sm sm:text-base mt-2 font-body max-w-lg mx-auto">
            El centro rojo es la emergencia. Toca el corazón del radar para conectar con apoyo en tu comunidad.
          </p>
        </div>

        {/* Logo Monumental reutilizable 100% SVG puro */}
        <RadarAnimatedLogo
          onOpenChat={onOpenChat}
          className="max-w-95 sm:max-w-125 md:max-w-145 lg:max-w-155"
        />
      </div>
    </section>
  );
};
