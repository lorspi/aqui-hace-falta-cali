import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Lock, ChevronDown, HeartHandshake, User, LogOut, LayoutDashboard, UserPlus, ShieldCheck, Info } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { signInWithGoogle } from '../lib/supabaseService';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenCreateOfferModal: () => void;
  onOpenAdminModal: () => void;
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
  userName?: string;
  onLogout?: () => void;
}

interface UserMenuProps {
  isLoggedIn?: boolean;
  userName?: string;
  onOpenRegisterModal?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenWelcomeModal?: () => void;
  iconOnly?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isLoggedIn = false,
  userName,
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
        title={isLoggedIn ? (userName || 'Usuario') : 'Ingresar'}
      >
        <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        {!iconOnly && (
          <>
            <span className="truncate max-w-[85px] sm:max-w-[120px]">
              {isLoggedIn ? (userName || 'Usuario') : 'Ingresar'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
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
              <button
                type="button"
                onClick={async () => {
                  setIsOpen(false);
                  try {
                    await signInWithGoogle();
                  } catch (err: any) {
                    alert('Error al conectar con Google: ' + (err?.message || err));
                  }
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100 font-semibold"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
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
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenLoginModal) {
                    onOpenLoginModal();
                  }
                }}
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
  onOpenWelcomeModal,
  onScrollToMap: _onScrollToMap,
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
              userName={userName}
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
              <span>¿Cómo funciona?</span>
            </button>

            {/* 4. Selector de Lenguaje */}
            <LanguageSelector />

            {/* 5. Menú de Usuario / Ingresar */}
            <UserMenu
              isLoggedIn={isLoggedIn}
              userName={userName}
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
