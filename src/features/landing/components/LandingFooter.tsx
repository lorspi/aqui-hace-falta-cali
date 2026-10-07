import React from 'react';
import { Heart, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * El footer de la landing, del equipo, llevado al tema oscuro el 6 de octubre de 2026 (Alejandro:
 * «fondo negro 1E1E1E, letra blanca» en toda la landing, y esa noche #000000). Cambió solo la piel: los colores slate y
 * los tamaños con corchetes pasaron a los tokens del tema oscuro, las fuentes propias (sans, body,
 * mono) a la de la landing, para que salga en Noto Sans como lo demás, el símbolo y el nombre
 * escrito a mano al logo blanco nuevo, y el contenedor al ancho y los márgenes de las secciones
 * de arriba. El contenido, los textos y los enlaces son los mismos. Los enlaces ganan un foco
 * visible en el ámbar del logo, que no tenían.
 */
const ENLACE =
  'rounded-rd-sm text-rd-noche-tinta-2 no-underline transition-colors hover:text-rd-noche-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-ayuda';

export const LandingFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer
      id="contacto"
      className="font-rd rd-grano scroll-mt-12 border-t border-rd-noche-linea bg-rd-noche pt-12 pb-10 text-rd-noche-tinta-2"
      style={{
        paddingBottom: 'max(2.5rem, calc(2.5rem + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div className="mx-auto w-full max-w-360 space-y-10 px-5 sm:px-8 lg:px-12">
        {/* Enlaces y contacto */}
        <div className="grid grid-cols-1 gap-8 text-rd-13-5 md:grid-cols-12 lg:gap-12">
          {/* Columna 1: identidad */}
          <div className="space-y-3 md:col-span-6 lg:col-span-5">
            {/* El logo blanco en oscuro y el de tinta en claro (`claro:`), el mismo dibujo. */}
            <img src="/logo-radar-de-ayuda-blanco.png" alt="Radar de ayuda" width={361} height={100} className="block h-10 w-auto claro:hidden" />
            <img src="/logo-radar-de-ayuda.png" alt="Radar de ayuda" width={361} height={100} className="hidden h-10 w-auto claro:block" />
            <p className="m-0 max-w-sm text-rd-13-5 leading-relaxed text-rd-noche-tinta-2">{t('landingFooterTagline')}</p>
            <p className="m-0 pt-1 text-rd-11-5 text-rd-noche-meta">
              {t('landingFooterMadeWith')} <Heart aria-hidden="true" className="inline h-3 w-3 text-rd-coral" /> {t('landingFooterByVolunteers')}
            </p>
          </div>

          {/* Columna 2: plataforma y legal */}
          <div className="md:col-span-3 md:col-start-7 lg:col-span-3 lg:col-start-7">
            <h5 className="m-0 mb-3 text-rd-12 font-semibold tracking-wider text-rd-noche-tinta uppercase">{t('landingFooterPlatform')}</h5>
            <ul className="m-0 list-none space-y-2 p-0">
              <li>
                <a href="/mapa-ayudas-necesidades?pedir=true" className={ENLACE}>
                  {t('landingHeroCtaNeed')}
                </a>
              </li>
              <li>
                <a href="/mapa-ayudas-necesidades?ofrecer=true" className={ENLACE}>
                  {t('landingHeroCtaOffer')}
                </a>
              </li>
              <li>
                <a href="/terminos" className={ENLACE}>
                  {t('footerTerms')}
                </a>
              </li>
              <li>
                <a href="/privacidad" className={ENLACE}>
                  {t('footerPrivacy')}
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: canales de contacto directo */}
          <div className="md:col-span-3 lg:col-span-3">
            <h5 className="m-0 mb-3 text-rd-12 font-semibold tracking-wider text-rd-noche-tinta uppercase">{t('landingFooterContact')}</h5>
            <ul className="m-0 list-none space-y-2.5 p-0">
              <li>
                <a href="mailto:info@radardeayuda.co" className={`inline-flex items-center gap-2 ${ENLACE}`}>
                  <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-navy-claro claro:text-rd-navy" />
                  <span>info@radardeayuda.co</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/573112323588?text=Hola%20raDAR,%20quisiera%20ponerme%20en%20contacto%20con%20el%20equipo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 ${ENLACE}`}
                >
                  <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-green-claro claro:text-rd-green" />
                  <span>WhatsApp: +57 311 232 3588</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-rd-noche-linea pt-6 text-rd-11-5 text-rd-noche-meta sm:flex-row">
          <p className="m-0">{t('landingFooterCopyright')}</p>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/radardeayuda" target="_blank" rel="noopener noreferrer" className={ENLACE}>
              @radardeayuda
            </a>
            {/* Divisor, no punto medio: el punto medio está prohibido en RaDAR. */}
            <span aria-hidden="true" className="inline-block h-3 w-px bg-rd-noche-linea" />
            <span>www.radardeayuda.co</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
