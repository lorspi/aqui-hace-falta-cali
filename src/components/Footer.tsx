import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[#1F1C1A] text-slate-300 py-2.5 px-3 sm:px-6 border-t border-slate-800 text-[11px]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        
        {/* Identificación de la Plataforma */}
        <div className="flex items-center shrink-0">
          <img
            src="/logo-radar.svg"
            alt="RaDAR de Ayuda"
            className="h-5 w-auto brightness-0 invert opacity-90"
          />
        </div>

        {/* Canales Oficiales de Contacto */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-300">
          <a
            href="mailto:Info@radardeayuda.co"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-medium"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Info@radardeayuda.co</span>
          </a>
          <a
            href="https://wa.me/573112323588"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-medium"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>WhatsApp: +57 311 232 3588</span>
          </a>
        </div>

        {/* Navegación y Accesos Rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400 font-medium">
          <a href="/" className="hover:text-white transition-colors">
            Mapa
          </a>
          <span>•</span>
          <a href="/guia" className="hover:text-white transition-colors">
            ¿Cómo Funciona?
          </a>
          <span>•</span>
          <a href="/moderador" className="hover:text-white transition-colors">
            Moderación
          </a>
          <span>•</span>
          <a href="/terminos" className="hover:text-white transition-colors">
            Términos
          </a>
        </div>

      </div>
    </footer>
  );
};
