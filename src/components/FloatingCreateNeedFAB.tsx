import React from 'react';
import { Hand, Clock } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface FloatingCreateNeedFABProps {
  onClick: () => void;
  isLegendExpanded?: boolean;
}

export const FloatingCreateNeedFAB: React.FC<FloatingCreateNeedFABProps> = ({ onClick, isLegendExpanded = false }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed right-4 bottom-24 md:right-auto md:left-3 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-900 text-white font-extrabold text-xs md:text-sm py-3 px-4 md:py-3 md:px-4 rounded-full shadow-2xl shadow-blue-700/40 border border-white/30 flex items-center gap-2.5 transition-all duration-300 active:scale-95 animate-in slide-in-from-bottom-5 cursor-pointer group ${
        isLegendExpanded ? 'md:bottom-72' : 'md:bottom-28'
      }`}
      id="btn-floating-chatbot-fab"
    >
      <div className="relative flex items-center justify-center">
        <Hand className="w-5 h-5 text-white group-hover:scale-110 transition-transform shrink-0" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
        </span>
      </div>
      
      <div className="flex flex-col items-start text-left leading-none">
        <span className="tracking-wide uppercase font-black text-xs md:text-xs">
          Pedir Ayuda Ya
        </span>
        <span className="text-[9px] md:text-[10px] text-blue-100 font-semibold mt-0.5 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-blue-200" /> En 1 minuto
        </span>
      </div>
    </button>
  );
};
