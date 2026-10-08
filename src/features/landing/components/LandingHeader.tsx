import React, { useState, useEffect, useRef } from 'react';
import { MapPin, User, Menu, X } from 'lucide-react';
import { AjustesLanding } from './AjustesLanding';
import { BotonLanding } from './base';
import type { TemaLanding } from '../useTemaLanding';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * La barra superior de la landing: el logo, accesos rápidos a la app y autenticación,
 * y la configuración (`AjustesLanding`) con idioma y modo claro u oscuro.
 */
export const LandingHeader: React.FC<{ tema: TemaLanding; alCambiarTema: (tema: TemaLanding) => void }> = ({ tema, alCambiarTema }) => {
  const { t } = useTranslation();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuMovilAbierto) return;
    const alTocarAfuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuMovilAbierto(false);
      }
    };
    const alPresionarEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuMovilAbierto(false);
    };
    document.addEventListener('mousedown', alTocarAfuera);
    document.addEventListener('keydown', alPresionarEsc);
    return () => {
      document.removeEventListener('mousedown', alTocarAfuera);
      document.removeEventListener('keydown', alPresionarEsc);
    };
  }, [menuMovilAbierto]);

  return (
    <header ref={menuRef} className="rd-grano sticky top-0 z-40 bg-rd-noche">
      <div className="mx-auto flex h-16 w-full max-w-360 items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* El logo de RaDAR, el de siempre y el mismo de la herramienta (Shell, a 38). */}
        <a
          href="/"
          aria-label="Radar de ayuda, inicio"
          className="flex shrink-0 items-center focus-visible:rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rd-ayuda"
        >
          {/* El de letras blancas en oscuro y el original en claro (`claro:`). */}
          <img src="/logo-radar-blanco.svg" alt="" width={2902} height={600} className="block h-9.5 w-auto claro:hidden" />
          <img src="/logo-radar.svg" alt="" width={2902} height={600} className="hidden h-9.5 w-auto claro:block" />
        </a>

        {/* Acciones principales en escritorio (>= md) */}
        <div className="hidden md:flex items-center gap-3">
          <BotonLanding
            nivel="secundario"
            tamano="md"
            como="enlace"
            href="/mapa-ayudas-necesidades"
            icono={<MapPin className="h-4 w-4 text-rd-ayuda" />}
          >
            {t('landingNavGoToApp')}
          </BotonLanding>

          <BotonLanding
            nivel="secundario"
            tamano="md"
            como="enlace"
            href="/registro"
            icono={<User className="h-4 w-4" />}
          >
            {t('landingNavAuth')}
          </BotonLanding>

          <AjustesLanding tema={tema} alCambiarTema={alCambiarTema} />
        </div>

        {/* Móvil: Ajustes + Hamburguesa (< md) */}
        <div className="flex md:hidden items-center gap-2">
          <AjustesLanding tema={tema} alCambiarTema={alCambiarTema} />

          <BotonLanding
            soloIcono
            tamano="md"
            etiqueta={t('landingNavMenu')}
            expandido={menuMovilAbierto}
            onClick={() => setMenuMovilAbierto((v) => !v)}
            icono={menuMovilAbierto ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          />
        </div>
      </div>

      {/* Menú desplegable en móvil */}
      {menuMovilAbierto && (
        <div className="md:hidden border-t border-b border-rd-noche-linea bg-rd-noche-2/95 backdrop-blur-md px-5 pt-4 pb-6 space-y-4 shadow-rd-2 animate-fade-in">
          {/* Enlaces de acceso rápido */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/mapa-ayudas-necesidades"
              onClick={() => setMenuMovilAbierto(false)}
              className="flex items-center justify-center gap-2 rounded-rd-xl border border-rd-noche-linea bg-rd-noche p-3 text-rd-13-5 font-medium text-rd-noche-tinta hover:bg-rd-noche-3 transition-colors no-underline"
            >
              <MapPin className="h-4 w-4 text-rd-ayuda shrink-0" />
              <span>{t('landingNavGoToApp')}</span>
            </a>
            <a
              href="#organizaciones"
              onClick={() => setMenuMovilAbierto(false)}
              className="flex items-center justify-center gap-2 rounded-rd-xl border border-rd-noche-linea bg-rd-noche p-3 text-rd-13-5 font-medium text-rd-noche-tinta hover:bg-rd-noche-3 transition-colors no-underline"
            >
              <span>{t('landingNavForOrgs')}</span>
            </a>
          </div>

          <div className="pt-1">
            <BotonLanding
              nivel="primario"
              tamano="md"
              como="enlace"
              href="/registro"
              ancho
              icono={<User className="h-4 w-4" />}
            >
              {t('landingNavAuth')}
            </BotonLanding>
          </div>
        </div>
      )}
    </header>
  );
};
