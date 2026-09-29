import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { MaquetaDirectorio, MaquetaPanel, MaquetaRadar } from './Maquetas';
import { retraso, Seccion } from './base';

/**
 * Las tres puertas del producto, bajo el titular.
 *
 * Rehechas el 29 de septiembre de 2026 con el patrón de «How it works» de Superpower, que
 * Alejandro pasó como referencia. Lo que se tomó de ahí, y que es lo que las hacía verse planas:
 *
 * - **El título y la descripción van fuera de la tarjeta, debajo.** Dentro solo la pieza visual.
 *   Así la tarjeta es una ventana al producto y no una caja con texto encima.
 * - **El fondo tiene textura**: un degradado suave, no un gris plano. Cada puerta toma el tinte
 *   de marca que le corresponde: coral lo que hace falta, navy quien responde, ámbar la
 *   constancia de que llegó.
 * - **La pieza flota con sombra** y sale recortada por el borde inferior, en vez de estar pegada
 *   al fondo. Es lo que da profundidad.
 */
const TARJETAS = [
  {
    id: 'radar',
    titulo: 'Radar',
    texto: 'Lo que hace falta y lo que hay para dar, sobre el mapa de tu ciudad.',
    href: '/mapa-ayudas-necesidades',
    fondo: 'from-rd-coral-soft via-rd-fondo to-rd-fondo',
    Pieza: MaquetaRadar,
  },
  {
    id: 'directorio',
    titulo: 'Directorio',
    texto: 'Quién está respondiendo, en qué zona y desde cuándo.',
    href: '/directorio',
    fondo: 'from-rd-navy-soft via-rd-fondo to-rd-fondo',
    Pieza: MaquetaDirectorio,
  },
  {
    id: 'panel',
    titulo: 'Mi organización',
    texto: 'Tus publicaciones, tu equipo y la constancia de cada entrega.',
    href: '/panel',
    fondo: 'from-rd-amber-soft via-rd-fondo to-rd-fondo',
    Pieza: MaquetaPanel,
  },
] as const;

export const LandingAccesos: React.FC = () => (
  <Seccion separacion="apretada">
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {TARJETAS.map(({ id, titulo, texto, href, fondo, Pieza }, i) => (
        <a
          key={id}
          href={href}
          style={retraso(i)}
          className="rd-revela es-visible group block no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rd-navy"
        >
          {/* La ventana: degradado de fondo y la pieza flotando, recortada abajo. */}
          <div
            className={`relative flex h-84 items-end overflow-hidden rounded-rd-xl bg-gradient-to-br ${fondo} px-6 pt-10 transition-shadow duration-300 ease-out group-hover:shadow-rd-2`}
          >
            {/* La flecha en recuadro, arriba a la derecha: el acabado de Ramp en sus tarjetas de
                función. Dice que la tarjeta lleva a algún lado sin gastar una línea de texto. */}
            <span
              aria-hidden="true"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-rd-sm bg-rd-surface/80 text-rd-ink-2 shadow-2xs transition-colors duration-300 group-hover:bg-rd-surface group-hover:text-rd-ink"
            >
              <ArrowUpRight className="h-4.5 w-4.5" />
            </span>

            {/* La maqueta va grande y se recorta contra el borde de abajo, como en Ramp y
                Superpower. Centrada con `flex` y sin `overflow` propio: las fichas que se salen
                del objeto tienen que poder asomarse. */}
            <div className="flex w-full justify-center transition-transform duration-500 ease-out group-hover:-translate-y-2 motion-reduce:group-hover:translate-y-0">
              <Pieza />
            </div>
          </div>

          {/* El texto, fuera de la tarjeta. */}
          <h3 className="font-rd m-0 mt-5 text-rd-22 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{titulo}</h3>
          <p className="font-rd m-0 mt-2 max-w-xs text-rd-15 leading-relaxed text-rd-ink-2">{texto}</p>
        </a>
      ))}
    </div>
  </Seccion>
);
