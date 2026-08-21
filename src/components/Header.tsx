import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldCheck, PlusCircle, Lock, RefreshCw, Radio, HandHeart, ChevronDown, MapPin, Heart, HeartHandshake, Globe } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenCreateOfferModal: () => void;
  onOpenAdminModal: () => void;
  onOpenRegisterModal?: () => void;
  onScrollToMap: () => void;
  lastUpdated: string;
  isOffline: boolean;
  activeCount: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenCreateOfferModal,
  onOpenAdminModal,
  onOpenRegisterModal,
  onScrollToMap,
  lastUpdated,
  isOffline,
  activeCount,
  criticalCount,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Close help menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setShowHelpMenu(false);
      }
    };
    if (showHelpMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHelpMenu]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current || currentY < 50) {
        setVisible(true);
      } else if (currentY > lastScrollY.current && currentY > 100) {
        setVisible(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-40 shadow-xs transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Main Header navigation bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex items-center justify-between w-full md:w-auto">
          <img src="/logo-radar.svg" alt="Aquí Hace Falta — Valle del Cauca" className="h-8 md:h-10 w-auto" />

          {/* Language toggle for mobile */}
          <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setLanguage('es')}
              className={`px-2 py-0.5 text-xs font-bold rounded ${language === 'es' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              ES
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded ${language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Quick action controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Action buttons — hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Switcher Dropdown with Flags */}
            <LanguageSelector />

            {/* Registrarse Button */}
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="w-full sm:w-auto px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs md:text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                id="btn-register"
              >
                <span>Registrarse</span>
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              id="btn-create-need"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>{t('publishNeed')}</span>
            </button>

            {/* Quiero Ayudar — Dropdown */}
            <div className="relative w-full sm:w-auto" ref={helpMenuRef}>
              <button
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className="w-full sm:w-auto px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                id="btn-quiero-ayudar"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{t('offerHelp')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHelpMenu ? 'rotate-180' : ''}`} />
              </button>

              {showHelpMenu && (
                <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 w-60 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => { setShowHelpMenu(false); onScrollToMap(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">{t('viewNeeds')}</span>
                      <span className="text-[11px] text-slate-500">{t('mapView')}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowHelpMenu(false); onOpenCreateOfferModal(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">{t('offerHelp')}</span>
                      <span className="text-[11px] text-slate-500">{t('createOfferSubtitle')}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowHelpMenu(false); window.location.href = '/moderador'; }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">{t('moderatorView')}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { window.location.href = '/panel'; }}
              className="w-full sm:w-auto px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs md:text-sm font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              title="Panel de moderación y verificación"
              id="btn-admin-panel"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{t('moderatorView')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
