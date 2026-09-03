import React, { useState, useRef, useEffect } from 'react';
import { HeartHandshake, Map, Menu, X, ExternalLink } from 'lucide-react';

interface LandingHeaderProps {
  onOpenChat: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onOpenChat }) => {
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú de escritorio al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
    };
    if (isDesktopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktopMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between">
        {/* Logo raDAR oficial a la izquierda */}
        <a href="/landing" className="flex items-center gap-3 group shrink-0">
          <img
            src="/logo-radar.svg"
            alt="raDAR de Ayuda"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </a>

        {/* Acciones principales de escritorio */}
        <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
          {/* Botón secundario: Ir a la app */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer font-sans"
          >
            <Map className="w-3.5 h-3.5 text-brand-blue" />
            <span>Ir a la app</span>
          </a>

          {/* Botón primario: Pedir ayuda */}
          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-brand-red hover:bg-[#B83232] active:scale-98 shadow-xs hover:shadow-md transition-all cursor-pointer font-sans"
          >
            <HeartHandshake className="w-4 h-4 text-white" />
            <span>Pedir ayuda</span>
          </button>

          {/* Menú Hamburguesa en Computador: A LA DERECHA de Pedir ayuda */}
          <div className="relative" ref={desktopMenuRef}>
            <button
              type="button"
              onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-normal transition-all cursor-pointer font-sans border ${
                isDesktopMenuOpen
                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-white/90 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200/80 shadow-xs'
              }`}
              aria-label="Menú de navegación"
              aria-expanded={isDesktopMenuOpen}
            >
              {isDesktopMenuOpen ? (
                <X className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <Menu className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span className="text-xs tracking-tight">Menú</span>
            </button>

            {/* Menú Flotante Horizontal: No apilado, ligero, diáfano y alineado a la derecha */}
            {isDesktopMenuOpen && (
              <div className="absolute right-0 top-full mt-2 p-1.5 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 flex flex-row items-center gap-1 whitespace-nowrap z-50 animate-fade-in font-sans">
                <a
                  href="/guia"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                >
                  Cómo funciona
                </a>
                <span className="w-px h-3.5 bg-slate-200/80 shrink-0" />
                <a
                  href="#organizaciones"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                >
                  Para organizaciones
                </a>
                <span className="w-px h-3.5 bg-slate-200/80 shrink-0" />
                <a
                  href="/?ofrecer=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Ofrecer ayuda</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <span className="w-px h-3.5 bg-slate-200/80 shrink-0" />
                <a
                  href="#contacto"
                  onClick={() => setIsDesktopMenuOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                >
                  Contacto
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Botón Hamburguesa en Celular y Móvil */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden transition-colors"
            aria-label="Abrir menú de navegación móvil"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Menú Desplegable en Móvil */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 shadow-xl animate-fade-in">
          {/* Opciones en celular: formato horizontal 2x2 ligero, no pesado */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/70 rounded-xl border border-slate-200/60 text-center font-sans">
            <a
              href="/guia"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2 rounded-lg text-xs font-normal text-slate-700 hover:bg-white hover:shadow-xs transition-all flex items-center justify-center"
            >
              Cómo funciona
            </a>
            <a
              href="#organizaciones"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2 rounded-lg text-xs font-normal text-slate-700 hover:bg-white hover:shadow-xs transition-all flex items-center justify-center"
            >
              Organizaciones
            </a>
            <a
              href="/?ofrecer=true"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2 rounded-lg text-xs font-normal text-slate-700 hover:bg-white hover:shadow-xs transition-all flex items-center justify-center gap-1"
            >
              <span>Ofrecer ayuda</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </a>
            <a
              href="#contacto"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-2 rounded-lg text-xs font-normal text-slate-700 hover:bg-white hover:shadow-xs transition-all flex items-center justify-center"
            >
              Contacto
            </a>
          </div>

          <div className="pt-1 flex flex-col gap-2.5 font-sans">
            {/* Ir a la app en móvil */}
            <a
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all font-sans"
            >
              <Map className="w-4 h-4 text-brand-blue" />
              <span>Ir a la app</span>
            </a>

            {/* Pedir ayuda en móvil */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenChat();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-red hover:bg-[#B83232] active:scale-98 shadow-sm transition-all font-sans"
            >
              <HeartHandshake className="w-4 h-4 text-white" />
              <span>Pedir ayuda</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
