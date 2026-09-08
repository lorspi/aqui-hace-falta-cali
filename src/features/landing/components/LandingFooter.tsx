import React from 'react';
import { Heart, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export const LandingFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer id="contacto" className="bg-slate-900 text-slate-300 pt-12 pb-10 border-t border-slate-800 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Enlaces y Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 text-xs text-slate-400">
          {/* Columna 1: raDAR Identidad */}
          <div className="space-y-3 md:col-span-6 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <img
                src="/simbolo-radar.svg"
                alt="Símbolo raDAR"
                className="w-7 h-7 object-contain"
              />
              <span className="text-base font-extrabold text-white font-sans tracking-tight">
                raDAR DE AYUDA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-body max-w-sm">
              {t('landingFooterTagline')}
            </p>
            <p className="text-[11px] text-slate-500 font-mono pt-1">
              {t('landingFooterMadeWith')} <Heart className="w-3 h-3 inline text-brand-red" /> {t('landingFooterByVolunteers')}
            </p>
          </div>

          {/* Columna 2: Plataforma & Legal */}
          <div className="md:col-span-3 lg:col-span-3 md:col-start-7 lg:col-start-7">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-sans">
              {t('landingFooterPlatform')}
            </h5>
            <ul className="space-y-2 text-xs font-body">
              <li>
                <a href="/?pedir=true" className="hover:text-white transition-colors">
                  {t('landingHeroCtaNeed')}
                </a>
              </li>
              <li>
                <a href="/?ofrecer=true" className="hover:text-white transition-colors">
                  {t('landingHeroCtaOffer')}
                </a>
              </li>
              <li>
                <a href="/terminos" className="hover:text-white transition-colors">
                  {t('footerTerms')}
                </a>
              </li>
              <li>
                <a href="/privacidad" className="hover:text-white transition-colors">
                  {t('footerPrivacy')}
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Canales de Contacto Directo */}
          <div className="md:col-span-3 lg:col-span-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-sans">
              {t('landingFooterContact')}
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
        </div>

        {/* Barra inferior */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-body">
          <p>{t('landingFooterCopyright')}</p>
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
