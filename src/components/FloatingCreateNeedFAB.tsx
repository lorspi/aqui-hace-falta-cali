import React from 'react';
import { PlusCircle } from 'lucide-react';
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
      className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs py-3 px-4 rounded-full shadow-2xl shadow-blue-600/50 border border-white/20 flex items-center gap-2 transition-all active:scale-95 animate-in slide-in-from-bottom-5 duration-300"
      id="btn-floating-create-need-fab"
    >
      <PlusCircle className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
      <span className="tracking-wide uppercase font-black">{t('publishNeed') || 'Pedir Ayuda'}</span>
    </button>
  );
};
