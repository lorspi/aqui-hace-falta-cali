import React from 'react';
import { Heart, Mail, MessageCircle } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer id="contacto" className="bg-slate-900 text-slate-300 pt-12 pb-10 border-t border-slate-800 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Enlaces, Contacto y Atribución */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-slate-400">
          {/* Columna 1: raDAR */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/simbolo-radar.svg"
                alt="Símbolo raDAR"
                className="w-7 h-7 object-contain"
              />
              <span className="text-base font-extrabold text-white font-sans tracking-tight">
                raDAR DE AYUDA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-body">
              Un solo punto de encuentro digital para articular la ayuda. Para que los tuyos, los míos y los nuestros estemos bien y en el radar.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Hecho con <Heart className="w-3 h-3 inline text-brand-red" /> por voluntarios en Colombia.
            </p>
          </div>

          {/* Columna 2: Plataforma & Legal */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-sans">
              Plataforma
            </h5>
            <ul className="space-y-2 text-xs font-body">
              <li>
                <a href="/?pedir=true" className="hover:text-white transition-colors">
                  Pedir ayuda
                </a>
              </li>
              <li>
                <a href="/?ofrecer=true" className="hover:text-white transition-colors">
                  Ofrecer ayuda
                </a>
              </li>
              <li>
                <a href="/terminos" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="/privacidad" className="hover:text-white transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Canales de Contacto Directo */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-sans">
              Contacto
            </h5>
            <ul className="space-y-2.5 text-xs font-body">
              <li>
                <a
                  href="mailto:info@radardeayuda.co"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>info@radardeayuda.co</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/573112323588?text=Hola%20raDAR,%20quisiera%20ponerme%20en%20contacto%20con%20el%20equipo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WhatsApp: +57 311 232 3588</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Atribución de Medios (Obligatorio CC BY 4.0) */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-sans">
              Atribución de Medios
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-body">
              Fotografías de respuesta comunitaria:{' '}
              <span className="text-slate-200 font-medium">World Central Kitchen</span>, bajo licencia{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                CC BY 4.0
              </a>{' '}
              vía Wikimedia Commons.
            </p>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-body">
          <p>© 2026 raDAR de Ayuda. Iniciativa abierta y comunitaria.</p>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/radardeayuda" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              @radardeayuda
            </a>
            <span>·</span>
            <span>www.radardeayuda.co</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
