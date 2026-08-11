import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldCheck, PlusCircle, Lock, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenAdminModal: () => void;
  lastUpdated: string;
  isOffline: boolean;
  activeCount: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenAdminModal,
  lastUpdated,
  isOffline,
  activeCount,
  criticalCount,
}) => {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

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
      {/* Top emergency status strip */}
      <div className="bg-slate-50 px-4 md:px-8 py-1.5 text-xs border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 font-black px-2 py-0.5 rounded text-[10px] tracking-widest uppercase italic border border-red-200">
            <Radio className="w-3 h-3 text-red-600 animate-pulse" />
            Cali · Emergencia Activa
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 font-medium text-[11px] uppercase tracking-wider hidden sm:inline">
            Terremoto Colombia 2026
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          {isOffline && (
            <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Modo sin conexión
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium uppercase">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Actualizado: <strong className="text-slate-800 font-bold">{lastUpdated}</strong>
          </span>
        </div>
      </div>

      {/* Main Header navigation bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Aquí Hace Falta" className="w-10 h-10 rounded-xl shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 leading-none">
                AQUÍ HACE FALTA
              </h1>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Cali
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              Plataforma Ciudadana de Coordinación de Ayuda
            </p>
          </div>
        </div>

        {/* Quick action controls */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs mr-2">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Activos</span>
              <strong className="text-indigo-600 text-sm font-black">{activeCount}</strong>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Críticos</span>
              <strong className="text-red-600 text-sm font-black">{criticalCount}</strong>
            </div>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5"
            id="btn-create-need"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            <span>Registrar Necesidad</span>
          </button>

          <button
            onClick={onOpenAdminModal}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs md:text-sm font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Panel de moderación y verificación"
            id="btn-admin-panel"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Moderación</span>
          </button>
        </div>
      </div>
    </header>
  );
};
