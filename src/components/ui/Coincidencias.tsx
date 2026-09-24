import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, ChevronRight, Map as MapIcon, Monitor, Package, Radar, X } from 'lucide-react';
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
 *   `Puntaje`             el porcentaje de compatibilidad, en píldora con color según nivel.
 *   `ListaCoincidencias`  una fila por publicación sugerida: quién, compatibilidad, distancia o modalidad,
 *                         qué tiene en común, y las dos acciones (comprometerse, ver en el mapa).
 *   `DialogoCoincidencias` la lista en un `<dialog>`, para abrirla desde una tarjeta.
 *   `FilaSugerencias`     la fila que anuncia cuántas hay y abre la lista.
 *   `ResumenCoincidencias` esa fila dentro de la tarjeta, cuando hay sugerencias.
 */
export const Puntaje: React.FC<{ n: number; compacto?: boolean; className?: string }> = ({ n, compacto = false, className = '' }) => {
  const color =
    n >= 80
      ? 'border-rd-green-line bg-rd-green-soft text-rd-green'
      : n >= 65
      ? 'border-rd-navy-line bg-rd-navy-soft text-rd-navy'
      : 'border-rd-amber-line bg-rd-amber-soft text-rd-amber-ink';

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-rd-11-5 font-semibold tabular-nums ${color} ${className}`}>
      {n} %{compacto ? <span className="sr-only"> de compatibilidad</span> : ' de compatibilidad'}
    </span>
  );
};

/** «Ofrece 800 L de agua potable, 20 kits de alimentos». Con coma y no con punto medio: el
 *  manual de estilo lo admite para separar datos de una línea, pero Alejandro lo prohibió en
 *  toda la herramienta (16 de septiembre de 2026). Los dos se contradicen y manda él; queda
 *  reportado para que el manual se corrija. */
export function loQueTiene(c: CoincidenciaPublicacion): string {
  return c.recursos.map((r) => `${cifra(r.cantidad)} ${unidad(r.cantidad, r.unidad)} de ${r.item.toLowerCase()}`).join(', ');
}

export interface ListaCoincidenciasProps {
  /** La publicación desde la que se mira: decide el verbo y la acción primaria. */
  publicacion: Publicacion;
  coincidencias: CoincidenciaPublicacion[];
  /** Las que ya se solicitaron o comprometieron en esta sesión. */
  hechas?: string[];
  onPrimaria: (id: string) => void;
  onVerEnMapa: (id: string) => void;
  /** Recurso específico filtrado al abrir desde la tabla del panel */
  recursoFoco?: string;
}

export const ListaCoincidencias: React.FC<ListaCoincidenciasProps> = ({ publicacion, coincidencias, hechas = [], onPrimaria, onVerEnMapa }) => {
  const pide = publicacion.tipo === 'necesidad';
  if (coincidencias.length === 0) return <p className="rounded-rd-lg border border-rd-line bg-rd-fondo px-4 py-5 text-rd-13 text-rd-ink-2">Todavía no hay matches disponibles. La publicación ya está en el mapa y te avisamos apenas aparezca uno.</p>;
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
              <span className="inline-flex items-center gap-1">
                {c.alcance === 'remoto' && <Monitor aria-hidden="true" className="h-3.5 w-3.5 text-rd-navy" />}
                {c.alcance === 'nacional' && <Package aria-hidden="true" className="h-3.5 w-3.5 text-rd-amber-ink" />}
                <span>{c.etiquetaAlcance || distanciaTexto(c.km)}</span>
              </span>
            </p>
            <p className="m-0 text-rd-13 text-rd-ink">
              <span className="font-medium text-rd-ink-2">{pide ? 'Ofrece' : 'Necesita'}</span> {loQueTiene(c)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Pie de tarjeta: `md` (RaDAR 223 C1); el primario nunca va en `sm`. */}
              <Button nivel="primario" tamano="md" disabled={hecha} onClick={() => onPrimaria(c.id)}>
                {hecha ? (pide ? 'Solicitado' : 'Comprometido') : pide ? 'Solicitar' : 'Ayudar'}
              </Button>
              {/* El mismo botón de mapa de toda la maqueta: terciario `md`, solo icono de 18. Con
                  texto competía con «Ver en el mapa» del pie, que ahí sí cierra el flujo. */}
              <Button nivel="terciario" tamano="md" soloIcono aria-label={`Ver ${c.org} en el mapa`} onClick={() => onVerEnMapa(c.id)}>
                <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/** La lista en un diálogo: «Matches para {quién}». */
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
                Matches {lista.recursoFoco ? `para ${lista.recursoFoco} · ` : 'para '}{lista.publicacion.org}
              </h2>
              <p className="mt-1 mb-0 text-rd-13 text-rd-ink-2">{pide ? 'Ofertas compatibles que tienen lo que hace falta en tu zona o a nivel nacional.' : 'Necesidades compatibles que piden lo que ofreces en tu zona o a nivel nacional.'}</p>
            </div>
            <Button nivel="terciario" tamano="md" soloIcono aria-label="Cerrar" onClick={onCerrar}>
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          </div>
          <div className="sin-barra min-h-0 flex-1 overflow-y-auto p-5">
            <ListaCoincidencias {...lista} />
          </div>
        </div>
      )}
    </dialog>
  );
};

export const TOPE_MATCHES_DEFECTO = 5;

/** «1 match», «5 matches» o «5+ matches». Texto unificado para todas las vistas de Radar Match. */
export function textoMatches(n: number, total?: number, maximo: number = TOPE_MATCHES_DEFECTO): string {
  const conteo = total ?? n;
  if (conteo > maximo) {
    return `${maximo}+ matches`;
  }
  return `${conteo} ${conteo === 1 ? 'match' : 'matches'}`;
}

/** Alias para compatibilidad con código existente */
export const textoSugerencias = (n: number, _corto?: boolean) => textoMatches(n);

/**
 * Dentro de la tarjeta: la fila que dice que el cruce encontró sugerencias y abre la lista.
 * Muestra el número unificado de matches (ej. '1 match', '5 matches', '5+ matches').
 */
export const ResumenCoincidencias: React.FC<{ publicacion: Publicacion; coincidencias?: CoincidenciaPublicacion[]; onVer: () => void; compacta?: boolean; className?: string }> = ({ publicacion: _p, coincidencias, onVer, compacta = false, className = '' }) => {
  if (!coincidencias || !coincidencias.length) return null;
  const total = (coincidencias as any).total ?? coincidencias.length;
  return <FilaSugerencias n={coincidencias.length} total={total} onVer={onVer} compacta={compacta} className={className} />;
};

/**
 * La fila de sugerencias/matches: la usa la tarjeta y la pantalla de éxito al publicar.
 * Unificada con la etiqueta «1 match» o «N matches» (o «5+ matches» si supera el tope).
 */
export const FilaSugerencias: React.FC<{
  n: number;
  total?: number;
  onVer: () => void;
  variante?: 'suave' | 'relleno';
  brillo?: boolean;
  compacta?: boolean;
  tamano?: 'sm' | 'md';
  className?: string;
  maximo?: number;
}> = ({
  n,
  total,
  onVer,
  variante = 'suave',
  brillo = true,
  compacta = false,
  tamano = 'md',
  className = '',
  maximo = TOPE_MATCHES_DEFECTO,
}) => {
  const relleno = variante === 'relleno';
  const esSm = tamano === 'sm';
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onVer();
      }}
      className={`font-rd relative flex cursor-pointer items-center overflow-hidden text-left font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${
        esSm
          ? 'h-7 w-auto gap-1 px-2 text-rd-11-5 rounded-rd-md leading-none'
          : compacta
            ? 'w-auto gap-1.5 px-2.5 py-1.5 text-rd-12-5 rounded-rd-lg'
            : 'w-full gap-2.5 px-3.5 py-2.5 text-rd-13 rounded-rd-lg pointer-coarse:min-h-rd-tactil'
      } ${
        relleno
          ? 'bg-linear-to-r/srgb from-rd-coral to-rd-navy text-white hover:brightness-95'
          : `borde-rd-sugerencia text-rd-ink hover:text-rd-navy hover:shadow-xs ${brillo ? 'animate-rd-borde motion-reduce:animate-none' : ''}`
      } ${className}`}
    >
      {relleno && brillo && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/30 to-transparent animate-rd-brillo motion-reduce:animate-none" />}
      <Radar aria-hidden="true" className={`${esSm ? 'h-3.5 w-3.5' : compacta ? 'h-4 w-4' : 'h-4.5 w-4.5'} shrink-0 ${relleno ? 'text-white' : 'text-rd-navy'}`} />
      <span className={esSm || compacta ? 'whitespace-nowrap' : 'min-w-0 flex-1'}>{textoMatches(n, total, maximo)}</span>
      <ChevronRight aria-hidden="true" className={`${esSm ? 'h-3.5 w-3.5' : compacta ? 'h-4 w-4' : 'h-4.5 w-4.5'} shrink-0 ${relleno ? 'text-white/80' : 'text-rd-ink-meta'}`} />
    </button>
  );
};
