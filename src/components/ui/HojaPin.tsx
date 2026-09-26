import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Publicacion } from '../../types/publicacion';
import type { CoincidenciaPublicacion } from '../../utils/cruce';
import { Tarjeta, type TarjetaProps } from './Tarjeta';

/**
 * La hoja del pin (`rd-hoja-pin` del prototipo, T4), solo bajo 1024. Al tocar un pin sube
 * desde abajo, a la vez que el mapa vuela para dejar el pin centrado en la franja libre, y se
 * queda **a media pantalla** (`h-rd-hoja-1`). Es una sola pieza en sus dos alturas: el mismo
 * carrusel, el mismo fondo, la misma tarjeta; expandirla (flecha, arrastre hacia arriba o un
 * toque en la tarjeta) solo cambia la altura, con transición, hasta `100dvh − 96` (177). La ×
 * y Escape la cierran, deslizándola hacia abajo.
 *
 * Carrusel (T4-F): con dos o más publicaciones visibles, el cuerpo es una pista de tres
 * ranuras —vecina, actual, vecina— que asoman a los lados; un arrastre lateral, o los
 * puntos, pasan a la siguiente y **el mapa vuela a ese pin**. Las vecinas son solo para
 * asomar: `aria-hidden` e `inert`.
 */
export interface HojaPinProps extends Omit<TarjetaProps, 'onVerEnMapa' | 'publicacion' | 'distanciaKm' | 'coincidencias'> {
  publicacion: Publicacion;
  /** Las publicaciones visibles, en el orden de la lista: por ellas recorre el carrusel. */
  vecinas: Publicacion[];
  distancias: Map<string, number>;
  coincidencias: Map<string, CoincidenciaPublicacion[]>;
  expandida: boolean;
  /** Mientras se desliza hacia abajo antes de desmontarse. */
  cerrando?: boolean;
  onExpandir: (expandida: boolean) => void;
  onCerrar: () => void;
  /** Pasar a otra publicación desde el carrusel. */
  onIr: (id: string) => void;
}

const UMBRAL_EJE = 8;
const UMBRAL_CAMBIO = 48;
const DURACION = 200;
/* Hasta aquí caben los puntos en 360; con más, la píldora dice «5 de 15». */
const MAX_PUNTOS = 10;

export const HojaPin: React.FC<HojaPinProps> = ({ publicacion, vecinas, distancias, coincidencias, expandida, cerrando = false, onExpandir, onCerrar, onIr, ...tarjeta }) => {
  const hoja = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const ranura = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ y0: number } | null>(null);
  const lateral = useRef<{ x0: number; y0: number; eje: 'x' | 'y' | null; id: number } | null>(null);
  const [deslizando, setDeslizando] = useState(false);
  const [dentro, setDentro] = useState(false);

  /* Entra deslizándose: se monta abajo y al siguiente cuadro sube. */
  useEffect(() => {
    const marco = requestAnimationFrame(() => setDentro(true));
    return () => cancelAnimationFrame(marco);
  }, []);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclear);
    hoja.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  /* Al cambiar de publicación la ranura vuelve arriba y la pista a su sitio **sin transición**:
     la vecina a la que se llegó ya es la actual y está centrada; si el `--dx` volviera a 0
     animando, se vería retroceder. Antes de pintar, y con un reflow en medio. */
  useLayoutEffect(() => {
    if (ranura.current) ranura.current.scrollTop = 0;
    const p = pista.current;
    if (!p) return;
    p.style.transition = 'none';
    p.style.setProperty('--dx', '0px');
    void p.offsetWidth;
    p.style.transition = '';
  }, [publicacion.id]);

  const i = vecinas.findIndex((p) => p.id === publicacion.id);
  const carrusel = vecinas.length > 1 && i !== -1;
  const anterior = carrusel ? vecinas[(i - 1 + vecinas.length) % vecinas.length] : null;
  const siguiente = carrusel ? vecinas[(i + 1) % vecinas.length] : null;
  const ir = (delta: number) => {
    if (!carrusel) return;
    onIr(vecinas[(i + delta + vecinas.length) % vecinas.length].id);
  };

  /* Arrastre del asa: hacia arriba expande, hacia abajo colapsa o cierra. */
  const alEmpezar = (e: React.PointerEvent) => {
    arrastre.current = { y0: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const alSoltar = (e: React.PointerEvent) => {
    if (!arrastre.current) return;
    const dy = e.clientY - arrastre.current.y0;
    arrastre.current = null;
    if (dy < -40) onExpandir(true);
    else if (dy > 40) (expandida ? onExpandir(false) : onCerrar());
  };

  /* Gesto lateral sobre la pista: decide el eje a los 8 px; en X arrastra la pista con `--dx`
     y al soltar, si pasó de 48, termina el viaje hasta la vecina y la vuelve actual. */
  const alBajarLateral = (e: React.PointerEvent) => {
    if (!carrusel || !e.isPrimary) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return;
    lateral.current = { x0: e.clientX, y0: e.clientY, eje: null, id: e.pointerId };
  };
  const alMoverLateral = (e: React.PointerEvent) => {
    const d = lateral.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.eje) {
      if (Math.abs(dx) < UMBRAL_EJE && Math.abs(dy) < UMBRAL_EJE) return;
      d.eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.eje === 'x') {
        setDeslizando(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* sin captura */
        }
      }
    }
    if (d.eje === 'x') pista.current?.style.setProperty('--dx', `${dx}px`);
  };
  const alSoltarLateral = (e: React.PointerEvent) => {
    const d = lateral.current;
    if (!d || e.pointerId !== d.id) return;
    lateral.current = null;
    if (d.eje !== 'x') return;
    setDeslizando(false);
    const dx = e.clientX - d.x0;
    const p = pista.current;
    if (e.type === 'pointercancel' || Math.abs(dx) < UMBRAL_CAMBIO || !p || !ranura.current) {
      p?.style.setProperty('--dx', '0px');
      return;
    }
    const paso = ranura.current.getBoundingClientRect().width + parseFloat(getComputedStyle(p).columnGap || '8');
    p.style.setProperty('--dx', `${dx < 0 ? -paso : paso}px`);
    window.setTimeout(() => ir(dx < 0 ? 1 : -1), DURACION);
  };

  const Flecha = expandida ? ChevronDown : ChevronUp;
  const desplazable = expandida ? 'overflow-y-auto' : 'overflow-y-hidden';
  const ranuraClase = carrusel ? `ranura-rd-hoja h-full min-w-0 overflow-x-clip rounded-rd-xl border border-rd-line bg-rd-surface px-4 pt-4 ${desplazable}` : `h-full min-w-0 basis-full overflow-x-clip px-4 pt-2 ${desplazable}`;
  const fuera = !dentro || cerrando;

  return (
    <div
      ref={hoja}
      tabIndex={-1}
      role="dialog"
      aria-label={`${publicacion.tipo === 'necesidad' ? 'Necesidad' : 'Oferta'}: ${publicacion.titulo}`}
      className={`fixed right-0 bottom-0 left-0 z-805 mx-auto flex max-w-130 flex-col transition-all duration-300 ease-out outline-none lg:hidden ${expandida ? 'h-rd-hoja-2' : 'h-rd-hoja-1'} ${fuera ? 'translate-y-full' : 'translate-y-0'}`}
    >
      {/* La flecha vive fuera de la hoja, como un botón que flota sobre su borde: dice hacia
          dónde va (arriba = se expande, abajo = se colapsa). */}
      <button
        type="button"
        aria-label={expandida ? 'Colapsar' : 'Expandir'}
        aria-expanded={expandida}
        onClick={() => onExpandir(!expandida)}
        className="absolute -top-9 left-1/2 z-1 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink-2 shadow-xs transition-colors hover:bg-rd-sunken hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
      >
        <Flecha aria-hidden="true" className="h-4 w-4" />
      </button>
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-rd-xl border border-b-0 border-rd-line shadow-rd-2 ${carrusel ? 'bg-rd-fondo' : 'bg-rd-surface'}`}>
      <div className="flex flex-none items-center pl-12">
        <button
          type="button"
          aria-label={expandida ? 'Colapsar la hoja' : 'Expandir la hoja'}
          onClick={() => onExpandir(!expandida)}
          onPointerDown={alEmpezar}
          onPointerUp={alSoltar}
          className="flex h-11 flex-1 cursor-grab items-center justify-center touch-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy"
        >
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-rd-ink-3" />
        </button>
        <button type="button" aria-label="Cerrar" onClick={onCerrar} className="mr-1 flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-rd-md text-rd-ink-2 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={pista}
        className={`flex min-h-0 flex-1 ${carrusel ? `pista-rd-hoja gap-2 overflow-visible touch-pan-y ${deslizando ? 'transition-none' : 'transition-transform duration-200 ease-out'}` : ''}`}
        onPointerDown={alBajarLateral}
        onPointerMove={alMoverLateral}
        onPointerUp={alSoltarLateral}
        onPointerCancel={alSoltarLateral}
        onClick={(e) => {
          if (!expandida && !(e.target as HTMLElement).closest('button, a, input, select, summary')) onExpandir(true);
        }}
      >
        {anterior && (
          <div aria-hidden="true" inert className={`${ranuraClase} opacity-70`}>
            <Tarjeta publicacion={anterior} distanciaKm={distancias.get(anterior.id)} coincidencias={coincidencias.get(anterior.id)} enHoja />
          </div>
        )}
        <div ref={ranura} className={ranuraClase}>
          <Tarjeta key={publicacion.id} publicacion={publicacion} distanciaKm={distancias.get(publicacion.id)} coincidencias={coincidencias.get(publicacion.id)} {...tarjeta} enHoja />
        </div>
        {siguiente && (
          <div aria-hidden="true" inert className={`${ranuraClase} opacity-70`}>
            <Tarjeta publicacion={siguiente} distanciaKm={distancias.get(siguiente.id)} coincidencias={coincidencias.get(siguiente.id)} enHoja />
          </div>
        )}
      </div>

      {carrusel && vecinas.length <= MAX_PUNTOS && (
        <div role="group" aria-label="Publicaciones" className="mx-auto mt-2 mb-3 flex w-max flex-none rounded-full bg-rd-ink px-2">
          {vecinas.map((p, k) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Publicación ${k + 1} de ${vecinas.length}`}
              aria-current={k === i ? 'true' : undefined}
              onClick={() => k !== i && ir(k - i)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
            >
              <span aria-hidden="true" className={`h-1.5 rounded-full bg-white transition-all duration-150 ${k === i ? 'w-4.5 opacity-100' : 'w-1.5 opacity-45'}`} />
            </button>
          ))}
        </div>
      )}
      {carrusel && vecinas.length > MAX_PUNTOS && (
        <p aria-live="polite" className="font-rd mx-auto mt-2 mb-3 flex h-6 w-max flex-none items-center rounded-full bg-rd-ink px-3 text-rd-11-5 font-semibold text-white tabular-nums">
          {i + 1} de {vecinas.length}
        </p>
      )}
      </div>
    </div>
  );
};
