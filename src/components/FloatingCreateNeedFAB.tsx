import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface FloatingCreateNeedFABProps {
  onClick: () => void;
}

export const FloatingCreateNeedFAB: React.FC<FloatingCreateNeedFABProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 md:bottom-20 right-4 md:right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs md:text-sm py-3 px-4 md:py-3.5 md:px-5 rounded-full shadow-2xl shadow-blue-600/40 border border-white/30 flex items-center gap-2.5 transition-all active:scale-95 animate-in slide-in-from-bottom-5 duration-300 cursor-pointer group"
      id="btn-floating-chatbot-fab"
    >
      <div className="relative flex items-center justify-center">
        <Bot className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
        </span>
      </div>
      
      <div className="flex flex-col items-start text-left leading-none">
        <span className="tracking-wide uppercase font-black text-xs md:text-xs">
          {t('publishNeed') || 'Pedir Ayuda'}
        </span>
        <span className="text-[9px] md:text-[10px] text-blue-200 font-semibold mt-0.5 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Ticket Rápido
        </span>
      </div>
    </button>
  );
};
