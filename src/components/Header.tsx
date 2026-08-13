import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldCheck, PlusCircle, Lock, RefreshCw, Radio, HandHeart, ChevronDown, MapPin, Heart, HeartHandshake } from 'lucide-react';
import { CityCombobox } from './CityCombobox';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenCreateOfferModal: () => void;
  onOpenAdminModal: () => void;
  onScrollToMap: () => void;
  lastUpdated: string;
  isOffline: boolean;
  activeCount: number;
  criticalCount: number;
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  needCounts?: Record<string, number>;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenCreateOfferModal,
  onOpenAdminModal,
  onScrollToMap,
  lastUpdated,
  isOffline,
  activeCount,
  criticalCount,
  selectedCityId,
  onCityChange,
  needCounts,
}) => {
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
      // Show header when scrolling up (even a little), hide when scrolling down
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4">
          <img src="/favicon.svg" alt="Aquí Hace Falta" className="w-8 h-8 rounded-lg shrink-0 md:hidden" />
          <img src="/logo.svg" alt="Aquí Hace Falta" className="w-10 h-10 rounded-xl shrink-0 hidden md:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 leading-none">
                AQUÍ HACE FALTA
              </h1>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Valle del Cauca
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 mt-1">
              <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-widest">
                Plataforma Ciudadana de Coordinación de Ayuda
              </p>
            </div>
          </div>
        </div>

        {/* City selector + Quick action controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* City combobox */}
          <CityCombobox
            value={selectedCityId}
            onChange={onCityChange}
            showAllOption
            needCounts={needCounts}
            className="w-full sm:w-52"
          />

          {/* Action buttons — hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onOpenCreateModal}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              id="btn-create-need"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>Necesito Ayuda</span>
            </button>

            {/* Quiero Ayudar — Dropdown */}
            <div className="relative w-full sm:w-auto" ref={helpMenuRef}>
              <button
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                id="btn-quiero-ayudar"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Quiero Ayudar</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHelpMenu ? 'rotate-180' : ''}`} />
              </button>

              {showHelpMenu && (
                <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 w-56 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => { setShowHelpMenu(false); onScrollToMap(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">Ver necesidades</span>
                      <span className="text-[11px] text-slate-500">Explora el mapa de necesidades</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowHelpMenu(false); onOpenCreateOfferModal(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">Publicar ayuda</span>
                      <span className="text-[11px] text-slate-500">Registra recursos disponibles</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowHelpMenu(false); window.location.href = '/moderador'; }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">Ser moderador</span>
                      <span className="text-[11px] text-slate-500">Verifica información</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onOpenAdminModal}
              className="w-full sm:w-auto px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs md:text-sm font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              title="Panel de moderación y verificación"
              id="btn-admin-panel"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Moderación</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
