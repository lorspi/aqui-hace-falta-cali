import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Lock, ChevronDown, MapPin, Heart, HeartHandshake, User, LogOut, LayoutDashboard, UserPlus, ShieldCheck } from 'lucide-react';
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
  // Auth
  isLoggedIn?: boolean;
  userName?: string;
  onLogout?: () => void;
}

interface UserMenuProps {
  isLoggedIn?: boolean;
  userName?: string;
  onOpenRegisterModal?: () => void;
  onLogout?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isLoggedIn = false,
  userName,
  onOpenRegisterModal,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold px-2.5 py-2 rounded-xl transition-all h-[38px] cursor-pointer"
        id="btn-user-menu"
      >
        <User className="w-4 h-4 text-slate-600 shrink-0" />
        <span className="truncate max-w-[85px] sm:max-w-[120px]">
          {isLoggedIn ? (userName || 'Usuario') : 'Ingresar'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 sm:w-56 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => { setIsOpen(false); window.location.href = '/panel'; }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">Panel</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); window.location.href = '/moderador'; }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">{t('moderatorView')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); if (onLogout) onLogout(); }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">Cerrar sesión</span>
              </button>
            </>
          ) : (
            <>
              {onOpenRegisterModal && (
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); onOpenRegisterModal(); }}
                  className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Registrarme</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => { setIsOpen(false); window.location.href = '/panel'; }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">Iniciar sesión</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); window.location.href = '/moderador'; }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">{t('moderatorView')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenCreateOfferModal,
  onOpenAdminModal: _onOpenAdminModal,
  onOpenRegisterModal,
  onScrollToMap,
  lastUpdated: _lastUpdated,
  isOffline: _isOffline,
  activeCount: _activeCount,
  criticalCount: _criticalCount,
  isLoggedIn = false,
  userName,
  onLogout,
}) => {
  const { t } = useTranslation();
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex items-center justify-between w-full md:w-auto">
          <img src="/logo-radar.svg" alt="Aquí Hace Falta — Valle del Cauca" className="h-10 md:h-10 w-auto" />

          {/* Language selector & User auth for mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <UserMenu
              isLoggedIn={isLoggedIn}
              userName={userName}
              onOpenRegisterModal={onOpenRegisterModal}
              onLogout={onLogout}
            />
          </div>
        </div>

        {/* Quick action controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Action buttons — hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Switcher Dropdown with Flags */}
            <LanguageSelector />

            <button
              onClick={onOpenCreateModal}
              className="btn-secondary text-xs"
              id="btn-create-need"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>{t('publishNeed')}</span>
            </button>

            {/* Quiero Ayudar — Dropdown */}
            <div className="relative w-full sm:w-auto" ref={helpMenuRef}>
              <button
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className="btn-primary-blue text-xs"
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
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">{t('viewNeeds')}</span>
                      <span className="text-[11px] text-slate-500">{t('mapView')}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowHelpMenu(false); onOpenCreateOfferModal(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">{t('offerHelp')}</span>
                      <span className="text-[11px] text-slate-500">{t('createOfferSubtitle')}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* User / Auth Dropdown */}
            <UserMenu
              isLoggedIn={isLoggedIn}
              userName={userName}
              onOpenRegisterModal={onOpenRegisterModal}
              onLogout={onLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
