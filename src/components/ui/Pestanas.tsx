import React from 'react';

/**
 * Pestañas en píldoras (Pestanas):
 * Sigue el diseño unificado de la app: píldoras con esquinas cuadradas (rounded-rd-md),
 * activa en overlay claro (bg-rd-navy-soft, border-rd-navy-line, texto rd-navy) e
 * inactivas con fondo hundido (bg-rd-sunken, border-rd-line, texto rd-ink-2).
 * Fila horizontal que se desplaza sin barra (zona-rd-scroll).
 * Altura 36 (h-9) y 44 con el dedo (pointer-coarse:h-rd-tactil).
 */
export interface Pestana {
  id: string;
  nombre: string;
  n?: number;
}

export const Pestanas: React.FC<{
  etiqueta: string;
  pestanas: Pestana[];
  actual: string;
  onCambiar: (id: string) => void;
  className?: string;
}> = ({ etiqueta, pestanas, actual, onCambiar, className = '' }) => {
  const alTeclear = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const k = (i + (e.key === 'ArrowRight' ? 1 : -1) + pestanas.length) % pestanas.length;
    onCambiar(pestanas[k].id);
    (e.currentTarget.parentElement?.children[k] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className={`flex flex-none items-center border-b border-rd-line bg-rd-surface py-2 ${className}`}>
      <div
        role="tablist"
        aria-label={etiqueta}
        className="zona-rd-scroll flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden"
      >
        {pestanas.map((p, i) => {
          const sel = p.id === actual;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              id={`pestana-${p.id}`}
              aria-selected={sel}
              aria-controls={`panel-${p.id}`}
              tabIndex={sel ? 0 : -1}
              onClick={() => onCambiar(p.id)}
              onKeyDown={(e) => alTeclear(e, i)}
              className={`font-rd inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-rd-md border px-3 text-rd-13-5 whitespace-nowrap transition-colors pointer-coarse:h-rd-tactil focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy active:translate-y-px ${
                sel
                  ? 'border-rd-navy-line bg-rd-navy-soft font-semibold text-rd-navy shadow-xs'
                  : 'border-rd-line bg-rd-sunken font-medium text-rd-ink-2 hover:border-rd-navy-line hover:bg-rd-surface hover:text-rd-ink'
              }`}
            >
              <span>{p.nombre}</span>
              {p.n !== undefined && p.n > 0 ? (
                <>
                  <span className="sr-only">, </span>
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-rd-11 font-semibold tabular-nums ${
                      sel ? 'bg-rd-coral text-white' : 'bg-rd-coral text-white'
                    }`}
                  >
                    {p.n}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
