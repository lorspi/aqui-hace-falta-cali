import React, { useEffect, useState } from 'react';
import { Hand, HeartHandshake, Menu, X } from 'lucide-react';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { BotonLanding } from './base';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * La barra superior de la landing, rehecha el 28 de septiembre de 2026 porque «no se parece en
 * nada al de la app que hemos iterado» (Alejandro). Era cierto: usaba `slate-200`, `rounded-xl`,
 * `text-xs font-bold` y dos botones sólidos rojo y azul, nada del sistema.
 *
 * Ahora comparte con el cascarón de la app (`components/ui/Shell`) el logo a 38, el marco
 * `rd-line`, el fondo `rd-surface` y el tratamiento de los enlaces de navegación: `rd-13-5`
 * en `rd-ink-2`, que pasan a `rd-ink` al apuntarlos. Y toma de la referencia que **los enlaces
 * se vean**, en vez de esconderse tras una hamburguesa en escritorio, y que las dos acciones
 * vayan a la derecha en píldora.
 *
 * Las dos van llenas, navy y coral, como el menú «+» de la app: coral pide, navy ofrece. No es
 * una pareja de primaria y secundaria (29 de septiembre de 2026).
 */
interface LandingHeaderProps {
  onOpenChat: () => void;
}

const ENLACE =
  'font-rd rounded-rd-sm px-2 py-1 text-rd-13-5 font-medium text-rd-ink-2 no-underline transition-colors hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy';

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onOpenChat }) => {
  const { t } = useTranslation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  /* El menú de mano bloquea el desplazamiento del fondo mientras está abierto, y Escape cierra. */
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAbierto(false);
    document.addEventListener('keydown', alTeclear);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  const enlaces = [
    { href: '/mapa-ayudas-necesidades', texto: t('landingNavGoToApp') },
    { href: '#organizaciones', texto: t('landingNavForOrgs') },
    { href: '#contacto', texto: t('landingNavContact') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-rd-line bg-rd-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-360 items-center gap-6 px-5 sm:px-8 lg:px-12">
        <a
          href="/"
          aria-label="RaDAR de ayuda, inicio"
          className="flex shrink-0 items-center focus-visible:rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rd-navy"
        >
          <img src="/logo-radar.svg" alt="" className="block h-9.5 w-auto" />
        </a>

        {/* Navegación a la vista desde 1024, como en la referencia. */}
        <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} className={ENLACE}>
              {e.texto}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          <div className="hidden items-center gap-2.5 sm:flex">
            <BotonLanding
              nivel="primario"
              tamano="md"
              como="enlace"
              href="/mapa-ayudas-necesidades?ofrecer=true"
              icono={<HeartHandshake aria-hidden="true" className="h-4 w-4 shrink-0" />}
            >
              {t('landingHeroCtaOffer')}
            </BotonLanding>
            <BotonLanding nivel="pedir" tamano="md" onClick={onOpenChat} icono={<Hand aria-hidden="true" className="h-4 w-4 shrink-0" />}>
              {t('landingHeroCtaNeed')}
            </BotonLanding>
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir el menú"
            aria-expanded={menuAbierto}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink hover:bg-rd-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* El cajón de mano: el mismo dibujo que el de la app (velo en tinta, panel a la derecha). */}
      {menuAbierto && (
        <div className="fixed inset-0 z-900 lg:hidden">
          <button type="button" aria-label="Cerrar el menú" onClick={() => setMenuAbierto(false)} className="absolute inset-0 cursor-default bg-rd-ink/40" />
          <div role="dialog" aria-modal="true" aria-label={t('landingNavMenu')} className="absolute top-0 right-0 bottom-0 flex w-4/5 max-w-90 flex-col overflow-auto rounded-l-rd-md bg-rd-surface shadow-rd-2">
            <div className="flex min-h-16 items-center justify-between border-b border-rd-line px-5">
              <img src="/logo-radar.svg" alt="" className="block h-7.5 w-auto" />
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-rd-md text-rd-ink-2 hover:bg-rd-sunken hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Secciones" className="flex flex-col gap-1 p-4">
              {enlaces.map((e) => (
                <a
                  key={e.href}
                  href={e.href}
                  onClick={() => setMenuAbierto(false)}
                  className="font-rd flex h-11 items-center rounded-rd-lg px-3 text-rd-15 font-medium text-rd-ink no-underline hover:bg-rd-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
                >
                  {e.texto}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 border-t border-rd-line p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-rd text-rd-13-5 text-rd-ink-meta">{t('landingNavLanguage')}</span>
                <LanguageSelector />
              </div>
              <BotonLanding
                nivel="primario"
                como="enlace"
                href="/mapa-ayudas-necesidades?ofrecer=true"
                ancho
                icono={<HeartHandshake aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />}
              >
                {t('landingHeroCtaOffer')}
              </BotonLanding>
              <BotonLanding
                nivel="pedir"
                ancho
                icono={<Hand aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />}
                onClick={() => {
                  setMenuAbierto(false);
                  onOpenChat();
                }}
              >
                {t('landingHeroCtaNeed')}
              </BotonLanding>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
