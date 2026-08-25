import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Lock, ChevronDown, HeartHandshake, User, LogOut, LayoutDashboard, UserPlus, ShieldCheck, Info } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenCreateOfferModal: () => void;
  onOpenAdminModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenLoginModal?: () => void;
  onOpenWelcomeModal?: () => void;
  onScrollToMap: () => void;
  lastUpdated: string;
  isOffline: boolean;
  activeCount: number;
  criticalCount: number;
  // Auth
  isLoggedIn?: boolean;
  isModerator?: boolean;
  isModeratorApproved?: boolean;
  userName?: string;
  onLogout?: () => void;
}

interface UserMenuProps {
  isLoggedIn?: boolean;
  isModerator?: boolean;
  isModeratorApproved?: boolean;
  userName?: string;
  onOpenAdminModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenWelcomeModal?: () => void;
  iconOnly?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isLoggedIn = false,
  isModerator = false,
  isModeratorApproved = false,
  userName,
  onOpenAdminModal,
  onOpenProfileModal,
  onOpenRegisterModal,
  onOpenLoginModal,
  onLogout,
  onOpenWelcomeModal,
  iconOnly = false,
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
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl transition-all h-[34px] cursor-pointer ${
          iconOnly ? 'w-[34px] p-0' : 'gap-1 px-2.5 py-1.5'
        }`}
        id="btn-user-menu"
        title={isLoggedIn ? (userName || 'Usuario') : t('userMenuLogin')}
      >
        <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        {!iconOnly && (
          <>
            <span className="truncate max-w-[85px] sm:max-w-[120px]">
              {isLoggedIn ? (userName || 'Usuario') : t('userMenuLogin')}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 sm:w-56 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {isLoggedIn ? (
            <>
              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100 font-semibold"
                >
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Mi Perfil</span>
                </button>
              )}
              {isModerator && (
                isModeratorApproved ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (onOpenAdminModal) {
                        onOpenAdminModal();
                      } else {
                        window.location.href = '/panel';
                      }
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100 font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{t('userMenuModPanel')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-400 bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-100 font-semibold cursor-not-allowed opacity-80"
                    title="Tu solicitud de moderador se encuentra pendiente de aprobación"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{t('userMenuModPanel')}</span>
                        <span className="text-[10px] text-amber-600 font-bold">Pendiente de aprobación</span>
                      </div>
                    </div>
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => { setIsOpen(false); if (onLogout) onLogout(); }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{t('userMenuLogout')}</span>
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
                  <span className="font-semibold">{t('userMenuRegister')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenLoginModal) {
                    onOpenLoginModal();
                  }
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">{t('userMenuSignIn')}</span>
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
  onOpenProfileModal,
  onOpenRegisterModal,
  onOpenLoginModal,
  onOpenWelcomeModal,
  onScrollToMap: _onScrollToMap,
  lastUpdated: _lastUpdated,
  isOffline: _isOffline,
  activeCount: _activeCount,
  criticalCount: _criticalCount,
  isLoggedIn = false,
  isModerator = false,
  isModeratorApproved = false,
  userName,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) {
        setVisible(true);
        return;
      }
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
        visible ? "translate-y-0" : "-translate-y-full md:translate-y-0"
      }`}
    >
      {/* Main Header navigation bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <img src="/logo-radar.svg" alt="Aquí Hace Falta — Valle del Cauca" className="h-8 sm:h-9 md:h-10 w-auto shrink-0" />

          {/* Language selector, guide & User auth for mobile — 3 compact icon pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden shrink-0">
            {/* 1. Info / Guide Icon Pill */}
            <button
              type="button"
              onClick={() => {
                if (onOpenWelcomeModal) onOpenWelcomeModal();
                else window.location.href = '/guia';
              }}
              className="flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl transition-all w-[34px] h-[34px] cursor-pointer shrink-0"
              title="¿Cómo funciona?"
            >
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            </button>

            {/* 2. Language Flag Icon Pill */}
            <LanguageSelector className="shrink-0" iconOnly />

            {/* 3. User / Auth Icon Pill */}
            <UserMenu
              isLoggedIn={isLoggedIn}
              isModerator={isModerator}
              isModeratorApproved={isModeratorApproved}
              userName={userName}
              onOpenAdminModal={_onOpenAdminModal}
              onOpenProfileModal={onOpenProfileModal}
              onOpenRegisterModal={onOpenRegisterModal}
              onLogout={onLogout}
              onOpenWelcomeModal={onOpenWelcomeModal}
              iconOnly
            />
          </div>
        </div>

        {/* Quick action controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Action buttons — hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* 1. CTA Pedir Ayuda */}
            <button
              onClick={onOpenCreateModal}
              className="btn-secondary text-[13px] font-bold px-4 py-2 h-[40px] shrink-0"
              id="btn-create-need"
            >
              <PlusCircle className="w-4.5 h-4.5 text-slate-600" />
              <span>{t('publishNeed')}</span>
            </button>

            {/* 2. CTA Ofrecer Ayuda */}
            <button
              onClick={onOpenCreateOfferModal}
              className="btn-primary-blue text-[13px] font-extrabold px-4 py-2 h-[40px] shadow-xs shrink-0"
              id="btn-quiero-ayudar"
            >
              <HeartHandshake className="w-4.5 h-4.5" />
              <span>{t('offerHelp')}</span>
            </button>

            {/* 3. Píldora ¿Cómo funciona? */}
            <button
              type="button"
              onClick={() => {
                if (onOpenWelcomeModal) {
                  onOpenWelcomeModal();
                } else {
                  window.location.href = '/guia';
                }
              }}
              className="flex items-center gap-1 bg-slate-50/90 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all h-[34px] cursor-pointer shrink-0"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{t('helpMenu')}</span>
            </button>

            {/* 4. Selector de Lenguaje */}
            <LanguageSelector />

            {/* 5. Menú de Usuario / Ingresar */}
            <UserMenu
              isLoggedIn={isLoggedIn}
              isModerator={isModerator}
              isModeratorApproved={isModeratorApproved}
              userName={userName}
              onOpenAdminModal={_onOpenAdminModal}
              onOpenProfileModal={onOpenProfileModal}
              onOpenRegisterModal={onOpenRegisterModal}
              onOpenLoginModal={onOpenLoginModal}
              onLogout={onLogout}
              onOpenWelcomeModal={onOpenWelcomeModal}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
