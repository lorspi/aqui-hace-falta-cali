import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, ChevronRight, Radar, X } from 'lucide-react';
import type { Publicacion } from '../../types/publicacion';
import type { CoincidenciaPublicacion } from '../../utils/cruce';
import { cifra, distanciaTexto, iniciales, unidad } from '../../utils/publicaciones';
import { Avatar } from './Etiqueta';
import { Button } from './Button';

/**
 * Las sugerencias de RaDAR: la experiencia «Radar Match» de la app real
 * (`components/RadarMatchModal.tsx`) con nuestro cruce por recurso y distancia
 * (`utils/cruce.ts`). En la interfaz se llaman sugerencias (manual § vocabulario) y el icono es
 * el radar de la marca, el que busca ayuda cerca en la cortinilla (76). Piezas:
 *   `Puntaje`             el porcentaje en píldora verde.
 *   `ListaCoincidencias`  una fila por publicación que coincide: quién, porcentaje, distancia,
 *                         qué tiene en común, y las dos acciones (comprometerse · ver en el mapa).
 *   `DialogoCoincidencias` la lista en un `<dialog>`, para abrirla desde una tarjeta.
 *   `ResumenCoincidencias` lo que va dentro de la tarjeta: la mejor coincidencia dicha en una
 *                         línea y cuántas más hay, con el botón que abre el diálogo.
 */
export const Puntaje: React.FC<{ n: number; compacto?: boolean; className?: string }> = ({ n, compacto = false, className = '' }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full border border-rd-green-line bg-rd-green-soft px-2 py-0.5 text-rd-11-5 font-semibold text-rd-green tabular-nums ${className}`}>
    {n} %{compacto ? <span className="sr-only"> de coincidencia</span> : ' de coincidencia'}
  </span>
);

/** «Ofrece 800 L de agua potable · 20 kits de alimentos». */
export function loQueTiene(c: CoincidenciaPublicacion): string {
  return c.recursos.map((r) => `${cifra(r.cantidad)} ${unidad(r.cantidad, r.unidad)} de ${r.item.toLowerCase()}`).join(' · ');
}

export interface ListaCoincidenciasProps {
  /** La publicación desde la que se mira: decide el verbo y la acción primaria. */
  publicacion: Publicacion;
  coincidencias: CoincidenciaPublicacion[];
  /** Las que ya se solicitaron o comprometieron en esta sesión. */
  hechas?: string[];
  onPrimaria: (id: string) => void;
  onVerEnMapa: (id: string) => void;
}

export const ListaCoincidencias: React.FC<ListaCoincidenciasProps> = ({ publicacion, coincidencias, hechas = [], onPrimaria, onVerEnMapa }) => {
  const pide = publicacion.tipo === 'necesidad';
  if (coincidencias.length === 0) return <p className="rounded-rd-lg border border-rd-line bg-rd-fondo px-4 py-5 text-rd-13 text-rd-ink-2">Todavía no hay coincidencias cerca. La publicación ya está en el mapa y te avisamos apenas aparezca una.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {coincidencias.map((c) => {
        const hecha = hechas.includes(c.id);
        return (
          <li key={c.id} className="rounded-rd-lg border border-rd-line bg-rd-surface p-3">
            <div className="flex items-center gap-2">
              <Avatar iniciales={iniciales(c.org)} />
              <span className="min-w-0 truncate text-rd-13-5 font-semibold text-rd-ink">{c.org}</span>
              {c.verificada && <BadgeCheck role="img" aria-label="Organización verificada" className="h-4 w-4 shrink-0 text-rd-navy" />}
            </div>
            <p className="mt-2 mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-rd-12-5 text-rd-ink-meta tabular-nums">
              <Puntaje n={c.puntaje} />
              {distanciaTexto(c.km)}
            </p>
            <p className="m-0 text-rd-13 text-rd-ink">
              <span className="font-medium text-rd-ink-2">{pide ? 'Ofrece' : 'Necesita'}</span> {loQueTiene(c)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Pie de tarjeta: `md` (RaDAR 223 C1); el primario nunca va en `sm`. */}
              <Button nivel="primario" tamano="md" disabled={hecha} onClick={() => onPrimaria(c.id)}>
                {hecha ? (pide ? 'Solicitado' : 'Comprometido') : pide ? 'Solicitar' : 'Ayudar'}
              </Button>
              <Button nivel="terciario" tamano="md" onClick={() => onVerEnMapa(c.id)}>
                Ver en el mapa
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/** La lista en un diálogo: «Coincidencias para {quién}». */
export const DialogoCoincidencias: React.FC<{ abierto: boolean; onCerrar: () => void } & ListaCoincidenciasProps> = ({ abierto, onCerrar, ...lista }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);
  const pide = lista.publicacion.tipo === 'necesidad';
  return (
    <dialog ref={ref} onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()} aria-labelledby="rd-coincidencias-t" className="font-rd m-auto max-h-dvh w-full max-w-130 rounded-rd-xl bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto max-sm:max-w-full">
      {abierto && (
        <div className="flex max-h-dvh flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-none items-start gap-3 border-b border-rd-line p-5 pb-4">
            <div className="min-w-0 flex-1">
              <h2 id="rd-coincidencias-t" className="font-rd m-0 flex items-center gap-2 text-rd-18 leading-snug font-semibold tracking-rd-titulo text-rd-ink">
                <Radar aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
                Sugerencias para {lista.publicacion.org}
              </h2>
              <p className="mt-1 mb-0 text-rd-13 text-rd-ink-2">{pide ? 'Ofertas a menos de 20 km que tienen algo de lo que le falta.' : 'Necesidades a menos de 20 km que piden algo de lo que ofrece.'}</p>
            </div>
            <Button nivel="terciario" tamano="md" soloIcono aria-label="Cerrar" onClick={onCerrar}>
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <ListaCoincidencias {...lista} />
          </div>
        </div>
      )}
    </dialog>
  );
};

/** «3 sugerencias cerca». El manual no admite «match»: en la interfaz es «sugerencia». */
export function textoSugerencias(n: number): string {
  return `${n} ${n === 1 ? 'sugerencia' : 'sugerencias'} cerca`;
}

/**
 * Dentro de la tarjeta: la fila que dice que el cruce encontró sugerencias y abre la lista
 * (Alejandro, 21 de septiembre de 2026). No es un chip (los chips de la tarjeta dicen tipo y
 * estado): es una fila a lo ancho con el radar de la marca, el texto y el chevron de «esto
 * abre algo». Va en un degradado coral → navy, el único sitio de la herramienta donde los dos
 * colores tienen razón para tocarse: una necesidad (coral) y una oferta (navy) que se
 * encuentran (gramática de color, 139). El brillo la recorre una sola vez al aparecer.
 */
export const ResumenCoincidencias: React.FC<{ publicacion: Publicacion; coincidencias?: CoincidenciaPublicacion[]; onVer: () => void; className?: string }> = ({ publicacion: _p, coincidencias, onVer, className = '' }) => {
  if (!coincidencias || !coincidencias.length) return null;
  return <FilaSugerencias n={coincidencias.length} onVer={onVer} className={className} />;
};

/**
 * La fila de sugerencias, sola: la usa la tarjeta y la pantalla de éxito al publicar. Dos
 * variantes (Alejandro, 21 de septiembre de 2026): `suave` (la de la tarjeta: el degradado
 * coral → navy pleno en el contorno y al 85 % por dentro, texto en blanco, y el degradado se
 * desplaza despacio una vez) y `relleno` (solo la sugerencia fuerte al publicar: el degradado
 * pleno llena la fila, texto en blanco, y una luz la recorre). Interpolan en sRGB para que el
 * medio no se lave. `brillo` (por defecto sí) es ese movimiento, una sola vez.
 */
export const FilaSugerencias: React.FC<{ n: number; onVer: () => void; variante?: 'suave' | 'relleno'; brillo?: boolean; className?: string }> = ({ n, onVer, variante = 'suave', brillo = true, className = '' }) => {
  const relleno = variante === 'relleno';
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onVer();
      }}
      className={`font-rd relative flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-rd-lg px-3.5 py-2.5 text-left text-rd-13 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy pointer-coarse:min-h-rd-tactil ${
        relleno ? 'bg-linear-to-r/srgb from-rd-coral to-rd-navy hover:brightness-95' : `borde-rd-sugerencia hover:shadow-xs ${brillo ? 'animate-rd-borde motion-reduce:animate-none' : ''}`
      } text-white ${className}`}
    >
      {relleno && brillo && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/30 to-transparent animate-rd-brillo motion-reduce:animate-none" />}
      <Radar aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
      <span className="min-w-0 flex-1">{textoSugerencias(n)}</span>
      <ChevronRight aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
    </button>
  );
};
