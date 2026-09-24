import React from 'react';

/**
 * Conmutador de vistas o modos: el `rd-segmentado` del prototipo, con utilidades sobre los
 * tokens `rd-*`. Caja hundida con borde y radio 12; la opción activa en blanco con texto en
 * tinta, las demás en gris. Elegir no es actuar: nada aquí va en el azul de acción. Un
 * `role="group"` con nombre y `aria-pressed` en cada botón; 34 de alto, 44 con el dedo. Como
 * los botones no se destruyen al cambiar, el foco se queda donde estaba.
 */
export interface OpcionSegmentada<T extends string> {
  id: T;
  etiqueta: string;
  /** Conteo al lado, en `rd-ink-meta` y tabular. */
  n?: number;
  /** Punto de 7 antes del texto con el color del tipo (`rd-pip`): coral pide, navy ofrece. */
  pip?: 'necesidad' | 'oferta';
}

export interface SegmentedProps<T extends string> {
  etiquetaGrupo: string;
  opciones: OpcionSegmentada<T>[];
  valor: T;
  onChange: (valor: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ etiquetaGrupo, opciones, valor, onChange, className = '' }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={etiquetaGrupo} className={`inline-flex rounded-rd-lg border border-rd-line bg-rd-sunken p-0.75 ${className}`}>
      {opciones.map((o) => {
        const activa = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(o.id)}
            className={`font-rd inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-rd-md px-3.25 text-rd-13-5 font-semibold whitespace-nowrap transition-colors pointer-coarse:h-rd-tactil focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy ${
              activa ? 'bg-rd-surface text-rd-ink shadow-xs ring-1 ring-rd-ink/4' : 'text-rd-ink-2 hover:bg-rd-ink/4 hover:text-rd-ink'
            }`}
          >
            {o.pip && <span aria-hidden="true" className={`h-1.75 w-1.75 shrink-0 rounded-full ${o.pip === 'necesidad' ? 'bg-rd-coral' : 'bg-rd-navy'}`} />}
            {o.etiqueta}
            {o.n !== undefined && <span className="font-semibold text-rd-ink-meta tabular-nums">{o.n}</span>}
          </button>
        );
      })}
    </div>
  );
}
