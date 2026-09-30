import React, { useEffect, useCallback } from 'react';
import { X, MapPin, HelpCircle, Mail } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { getOfficialWhatsappLink, OFFICIAL_WHATSAPP_DISPLAY } from '../constants/contact';
import { Button } from './ui/Button';
import { IconoWhatsApp } from './ui/IconoMarca';

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

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem('radar_has_seen_onboarding', 'true');
    } catch (e) {
      console.warn('LocalStorage not available', e);
    }
  }, []);

  const handleGoToMap = useCallback(() => {
    markSeen();
    onClose();
  }, [markSeen, onClose]);

  const handleGoToFullGuide = useCallback(() => {
    markSeen();
    onClose();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/guia';
    }
  }, [markSeen, onClose, onNavigateHome]);

  const handleOpenNeedAction = useCallback(() => {
    markSeen();
    onClose();
    if (onOpenCreateNeed) {
      onOpenCreateNeed();
    }
  }, [markSeen, onClose, onOpenCreateNeed]);

  const handleOpenOfferAction = useCallback(() => {
    markSeen();
    onClose();
    if (onOpenCreateOffer) {
      onOpenCreateOffer();
    }
  }, [markSeen, onClose, onOpenCreateOffer]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleGoToMap();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('modal-open');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleGoToMap]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rd-ink/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleGoToMap();
      }}
    >
      <div className="font-rd relative my-auto w-full max-w-lg rounded-rd-xl border border-rd-line bg-rd-surface p-6 sm:p-7 text-left text-rd-ink shadow-rd-2 animate-in zoom-in-95 duration-150 max-h-[92dvh] overflow-y-auto sin-barra">
        {/* Header & Logo */}
        <div className="flex items-center justify-between gap-4 border-b border-rd-line pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-radar.svg"
              alt="RaDAR de Ayuda"
              className="h-8 w-auto object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleGoToMap}
            aria-label="Cerrar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-rd-md text-rd-ink-3 hover:bg-rd-sunken hover:text-rd-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy transition-colors"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Crisis Copy Headline */}
        <div className="mt-5 space-y-2 text-center">
          <h2
            id="welcome-modal-title"
            className="text-rd-22 sm:text-rd-24 font-bold text-rd-ink tracking-rd-titular leading-snug"
          >
            {t('welcomeTitle')}
          </h2>
          <p className="text-rd-13 sm:text-rd-14 text-rd-ink-2 leading-relaxed font-normal">
            <strong className="font-semibold text-rd-ink">RaDAR de Ayuda</strong> {t('welcomeDescription')}
          </p>
        </div>

        {/* Action Cards (Pedir / Ofrecer) */}
        <div className="mt-5 space-y-3">
          {/* Action 1: Pedir Ayuda (Red / Coral) */}
          <button
            type="button"
            onClick={handleOpenNeedAction}
            className="w-full text-left bg-rd-fondo hover:bg-rd-coral-soft/50 border border-rd-line hover:border-rd-coral-line border-l-4 border-l-rd-coral p-4 rounded-rd-lg space-y-1 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rd-coral shrink-0" />
                <h3 className="text-rd-13-5 sm:text-rd-14 font-bold text-rd-ink group-hover:text-rd-coral-ink transition-colors">
                  {t('welcomeNeedTitle')}
                </h3>
              </div>
            </div>
            <p className="text-rd-12 sm:text-rd-12-5 text-rd-ink-2 leading-relaxed pl-4.5 group-hover:text-rd-ink transition-colors">
              {t('welcomeNeedDesc')}
            </p>
          </button>

          {/* Action 2: Ofrecer Ayuda (Blue / Navy) */}
          <button
            type="button"
            onClick={handleOpenOfferAction}
            className="w-full text-left bg-rd-fondo hover:bg-rd-navy-soft/50 border border-rd-line hover:border-rd-navy-line border-l-4 border-l-rd-navy p-4 rounded-rd-lg space-y-1 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rd-navy shrink-0" />
                <h3 className="text-rd-13-5 sm:text-rd-14 font-bold text-rd-ink group-hover:text-rd-navy transition-colors">
                  {t('welcomeOfferTitle')}
                </h3>
              </div>
            </div>
            <p className="text-rd-12 sm:text-rd-12-5 text-rd-ink-2 leading-relaxed pl-4.5 group-hover:text-rd-ink transition-colors">
              {t('welcomeOfferDesc')}
            </p>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-rd-line flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            nivel="secundario"
            tamano="lg"
            icono={<HelpCircle className="h-4 w-4 text-rd-ink-2" />}
            onClick={handleGoToFullGuide}
            className="w-full sm:flex-1"
          >
            {t('welcomeFullGuide')}
          </Button>

          <Button
            type="button"
            nivel="primario"
            tamano="lg"
            icono={<MapPin className="h-4 w-4 text-rd-amber" />}
            onClick={handleGoToMap}
            className="w-full sm:flex-1"
          >
            {t('welcomeGoToMap')}
          </Button>
        </div>

        {/* Contacto Directo para Voluntarios o Aliados */}
        <div className="mt-4 pt-3 border-t border-rd-line flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-rd-11-5 text-rd-ink-meta">
          <span className="font-semibold text-rd-ink-2">Contacto Aliados / Voluntarios:</span>
          <a
            href="mailto:info@radardeayuda.org"
            className="inline-flex items-center gap-1.5 font-semibold text-rd-navy hover:underline"
          >
            <Mail className="h-3.5 w-3.5 text-rd-navy shrink-0" />
            <span>info@radardeayuda.org</span>
          </a>
          <span className="text-rd-line select-none">•</span>
          <a
            href={getOfficialWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-rd-green hover:underline"
          >
            <IconoWhatsApp className="h-3.5 w-3.5 text-rd-green shrink-0" />
            <span>WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
