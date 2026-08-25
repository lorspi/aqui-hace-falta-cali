import React, { useEffect } from 'react';
import { X, MapPin, HelpCircle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome?: () => void;
  onOpenCreateNeed?: () => void;
  onOpenCreateOffer?: () => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateHome,
  onOpenCreateNeed,
  onOpenCreateOffer,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markSeen = () => {
    try {
      localStorage.setItem('radar_has_seen_onboarding', 'true');
    } catch (e) {
      console.warn('LocalStorage not available', e);
    }
  };

  const handleGoToMap = () => {
    markSeen();
    onClose();
  };

  const handleGoToFullGuide = () => {
    markSeen();
    onClose();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/guia';
    }
  };

  const handleOpenNeedAction = () => {
    markSeen();
    onClose();
    if (onOpenCreateNeed) {
      onOpenCreateNeed();
    }
  };

  const handleOpenOfferAction = () => {
    markSeen();
    onClose();
    if (onOpenCreateOffer) {
      onOpenCreateOffer();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleGoToMap();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92dvh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 relative text-left animate-in zoom-in-95 duration-200 my-auto">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1B3A93]/05 rounded-full blur-2xl pointer-events-none" />

        {/* Header & Logo */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo-radar.svg"
              alt="RaDAR de Ayuda"
              className="h-8 w-auto object-contain"
            />
          </div>
          <button
            onClick={handleGoToMap}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crisis Copy Headline */}
        <div className="mt-5 space-y-2 relative z-10 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#1F1C1A] tracking-tight leading-snug">
            {t('welcomeTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            <strong className="font-bold text-[#1F1C1A]">RaDAR de Ayuda</strong> {t('welcomeDescription')}
          </p>
        </div>

        {/* Action Cards (Red & Blue) - Interactive Clickable Cards */}
        <div className="mt-5 space-y-3 relative z-10">
          {/* Action 1: Pedir Ayuda (Red) */}
          <button
            type="button"
            onClick={handleOpenNeedAction}
            className="w-full text-left bg-[#F5F6F9] hover:bg-[#CE3B3B]/05 border-l-4 border-l-[#CE3B3B] border border-slate-200/90 hover:border-[#CE3B3B]/50 p-4 rounded-2xl space-y-1 transition-all cursor-pointer group shadow-2xs hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CE3B3B] shrink-0" />
                <h3 className="text-xs sm:text-sm font-extrabold text-[#1F1C1A]">
                  {t('welcomeNeedTitle')}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-4.5 group-hover:text-slate-900 transition-colors">
              {t('welcomeNeedDesc')}
            </p>
          </button>

          {/* Action 2: Ofrecer Ayuda (Blue) */}
          <button
            type="button"
            onClick={handleOpenOfferAction}
            className="w-full text-left bg-[#F5F6F9] hover:bg-[#1B3A93]/05 border-l-4 border-l-[#1B3A93] border border-slate-200/90 hover:border-[#1B3A93]/50 p-4 rounded-2xl space-y-1 transition-all cursor-pointer group shadow-2xs hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B3A93] shrink-0" />
                <h3 className="text-xs sm:text-sm font-extrabold text-[#1F1C1A]">
                  {t('welcomeOfferTitle')}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-4.5 group-hover:text-slate-900 transition-colors">
              {t('welcomeOfferDesc')}
            </p>
          </button>
        </div>

        {/* Centered Footer Actions */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={handleGoToFullGuide}
            className="w-full sm:w-1/2 px-4 py-3 rounded-2xl bg-[#F5F6F9] hover:bg-slate-200/80 border border-slate-200/90 text-[#1F1C1A] hover:text-[#1B3A93] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{t('welcomeFullGuide')}</span>
          </button>

          <button
            type="button"
            onClick={handleGoToMap}
            className="w-full sm:w-1/2 px-4 py-3 rounded-2xl bg-[#1B3A93] hover:bg-[#1B3A93]/90 text-white font-black text-xs sm:text-sm shadow-md shadow-[#1B3A93]/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <MapPin className="w-4 h-4 text-[#F2C33D] shrink-0" />
            <span>{t('welcomeGoToMap')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
