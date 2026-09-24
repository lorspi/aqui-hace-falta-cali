import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, X, Zap } from 'lucide-react';
import type { Publicacion } from '../../types/publicacion';
import type { CoincidenciaPublicacion } from '../../utils/cruce';
import { cifra, distanciaTexto, iniciales, unidad } from '../../utils/publicaciones';
import { Avatar } from './Etiqueta';
import { Button } from './Button';

/**
 * Las coincidencias de RaDAR: la experiencia «Radar Match» de la app real
 * (`components/RadarMatchModal.tsx`) con nuestro cruce por recurso y distancia
 * (`utils/cruce.ts`). El icono es el rayo, el mismo que usa la app real para el Match. Cuatro piezas:
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
              <Button nivel="primario" tamano="sm" disabled={hecha} onClick={() => onPrimaria(c.id)}>
                {hecha ? (pide ? 'Solicitado' : 'Comprometido') : pide ? 'Solicitar' : 'Quiero ayudar'}
              </Button>
              <Button nivel="terciario" tamano="sm" onClick={() => onVerEnMapa(c.id)}>
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
                <Zap aria-hidden="true" className="h-4.5 w-4.5 shrink-0 text-rd-navy" />
                Coincidencias para {lista.publicacion.org}
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

/** Dentro de la tarjeta: el aviso de que el cruce encontró algo —«¡RaDAR Match activado!»,
 *  cuántas organizaciones y el botón que abre la lista— (texto de Alejandro, 16 de septiembre
 *  de 2026). Sin cifras ni nombres aquí: eso va en el diálogo. */
export const ResumenCoincidencias: React.FC<{ publicacion: Publicacion; coincidencias: CoincidenciaPublicacion[]; onVer: () => void; className?: string }> = ({ publicacion, coincidencias, onVer, className = '' }) => {
  if (!coincidencias.length) return null;
  const pide = publicacion.tipo === 'necesidad';
  const n = coincidencias.length;
  const quien = n === 1 ? '1 organización' : `${n} organizaciones`;
  const verbo = pide ? (n === 1 ? 'ofrece' : 'ofrecen') : n === 1 ? 'necesita' : 'necesitan';
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-rd-lg border border-rd-navy-line bg-rd-navy-soft p-3 ${className}`}>
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rd-surface text-rd-navy">
        <Zap className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 basis-40">
        <b className="block text-rd-13 font-semibold text-rd-navy">¡RaDAR Match activado!</b>
        <span className="text-rd-12-5 leading-snug text-rd-ink">
          {quien} {verbo} alguno de estos recursos.
        </span>
      </div>
      <Button
        nivel="secundario"
        tamano="sm"
        className="ml-auto"
        onClick={(ev) => {
          ev.stopPropagation();
          onVer();
        }}
      >
        Consultar
      </Button>
    </div>
  );
};
