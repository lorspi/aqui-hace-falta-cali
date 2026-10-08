import React from 'react';
import { AjustesLanding } from './AjustesLanding';
import type { TemaLanding } from '../useTemaLanding';

/**
 * La barra superior de la landing: el logo y, a la derecha, la configuración (`AjustesLanding`),
 * que desde el 6 de octubre de 2026 lleva el idioma y el modo claro u oscuro. Nada más.
 *
 * El 29 de septiembre de 2026 perdió el marco inferior, los dos botones de acción, los tres
 * enlaces de navegación y, con ellos, el botón de hamburguesa y el cajón de mano completo. No fue
 * una limpieza estética: las dos acciones ya están en el hero, a un pantallazo de distancia y en
 * un tamaño que no se puede perder. Repetirlas arriba duplicaba la decisión y le quitaba peso a la
 * frase, que es lo que la portada quiere que se lea primero.
 *
 * Y sin enlaces ni botones el cajón de mano se quedó sin contenido: lo único que habría guardado
 * es el selector de idioma, que ya se ve en todos los anchos. Un menú que abre para mostrar lo que
 * ya estaba a la vista es peor que no tenerlo. El 6 de octubre de 2026 el idioma pasó, con el
 * modo, a la configuración: Alejandro la pidió como un botón con un menú flotante.
 */
export const LandingHeader: React.FC<{ tema: TemaLanding; alCambiarTema: (tema: TemaLanding) => void }> = ({ tema, alCambiarTema }) => (
  /* Sin marco inferior y con fondo opaco, el mismo negro de la landing (tema oscuro, 6 de
     octubre de 2026). El marco partía la página justo donde el hero quiere leerse continuo. Antes
     el fondo era translúcido con desenfoque, y al pasar el panel de color de la sección 2 por
     debajo se transparentaba como una franja degradada (Alejandro: «header sin degradado»). */
  <header className="rd-grano sticky top-0 z-40 bg-rd-noche">
    <div className="mx-auto flex h-16 w-full max-w-360 items-center px-5 sm:px-8 lg:px-12">
      {/* El logo original de RaDAR: en modo claro (por defecto) con sus colores y tintas
          originales; en modo oscuro, con filtro blanco para alto contraste. */}
      <a
        href="/"
        aria-label="RaDAR de ayuda, inicio"
        className="flex shrink-0 items-center focus-visible:rounded-rd-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rd-ayuda claro:focus-visible:outline-rd-navy"
      >
        <img
          src="/logo-radar.svg"
          alt=""
          className="block h-9.5 w-auto brightness-0 invert opacity-90 claro:filter-none claro:opacity-100"
        />
      </a>

      <div className="ml-auto shrink-0">
        <AjustesLanding tema={tema} alCambiarTema={alCambiarTema} />
      </div>
    </div>
  </header>
);
