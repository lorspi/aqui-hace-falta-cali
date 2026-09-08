import React, { useEffect } from 'react';
import { X, HeartHandshake, MapPin, ArrowRight } from 'lucide-react';

interface LandingOfferActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterOffer: () => void;
  onViewNeeds: () => void;
}

export const LandingOfferActionModal: React.FC<LandingOfferActionModalProps> = ({
  isOpen,
  onClose,
  onRegisterOffer,
  onViewNeeds,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative text-left my-auto animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-brand-yellow/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header & Logo */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-radar.svg"
              alt="raDAR de Ayuda"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Headline */}
        <div className="mt-5 space-y-1.5 relative z-10 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-brand-text tracking-tight leading-snug font-sans">
            ¿Cómo deseas apoyar hoy?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body max-w-md mx-auto">
            Puedes registrar los recursos o tiempo que tienes para donar, o explorar en el mapa las solicitudes urgentes en territorio.
          </p>
        </div>

        {/* Action Modules */}
        <div className="mt-6 space-y-3.5 relative z-10">
          {/* Módulo 1: Registrar una oferta de ayuda */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRegisterOffer();
            }}
            className="w-full text-left bg-slate-50/80 hover:bg-blue-50/50 border-l-4 border-l-brand-blue border border-slate-200/90 hover:border-brand-blue/50 p-4 sm:p-5 rounded-2xl transition-all cursor-pointer group shadow-2xs hover:shadow-md active:scale-99"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0 group-hover:scale-108 transition-transform">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-brand-text font-sans group-hover:text-brand-blue transition-colors">
                    Registrar una oferta de ayuda
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-body leading-relaxed mt-1">
                    Publica insumos, víveres, transporte, alojamiento o tu disposición como voluntario para conectarte con quienes lo necesitan.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          </button>

          {/* Módulo 2: Ver las necesidades en el mapa */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewNeeds();
            }}
            className="w-full text-left bg-slate-50/80 hover:bg-rose-50/50 border-l-4 border-l-brand-red border border-slate-200/90 hover:border-brand-red/50 p-4 sm:p-5 rounded-2xl transition-all cursor-pointer group shadow-2xs hover:shadow-md active:scale-99"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0 group-hover:scale-108 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-brand-text font-sans group-hover:text-brand-red transition-colors">
                    Ver las necesidades en el mapa
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-body leading-relaxed mt-1">
                    Explora directamente los puntos y solicitudes verificadas en el mapa para llevar auxilio exacto a las comunidades afectadas.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-red group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
