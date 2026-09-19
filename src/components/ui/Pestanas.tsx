import React from 'react';

/**
 * Las pestañas de una pantalla (`rd-pestanas` del prototipo, decisión 161): una por vista, en
 * una fila que se desplaza sin barra; la activa en tinta con la línea abajo; el conteo de lo
 * pendiente en una píldora coral. `role="tablist"` con `aria-selected` y flechas.
 * La fila va en posición absoluta dentro de una caja de alto fijo: así su ancho no cuenta como
 * ancho mínimo de la página (Chrome en móvil agrandaba el viewport de diseño con él y la
 * píldora se iba de la pantalla).
 */
export interface Pestana {
  id: string;
  nombre: string;
  n?: number;
}

export const Pestanas: React.FC<{ etiqueta: string; pestanas: Pestana[]; actual: string; onCambiar: (id: string) => void; className?: string }> = ({ etiqueta, pestanas, actual, onCambiar, className = '' }) => {
  const alTeclear = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const k = (i + (e.key === 'ArrowRight' ? 1 : -1) + pestanas.length) % pestanas.length;
    onCambiar(pestanas[k].id);
    (e.currentTarget.parentElement?.children[k] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className={`relative h-11.5 w-full border-b border-rd-line ${className}`}>
    <div role="tablist" aria-label={etiqueta} className="zona-rd-scroll absolute inset-0 flex flex-nowrap gap-5 overflow-x-auto overflow-y-hidden">
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
            className={`font-rd inline-flex h-11.5 flex-none cursor-pointer items-center gap-2 border-b-2 whitespace-nowrap text-rd-13-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy ${sel ? 'border-rd-sel font-semibold text-rd-ink' : 'border-transparent font-medium text-rd-ink-meta hover:text-rd-ink'}`}
          >
            {p.nombre}
            {p.n ? (
              <>
                <span className="sr-only">, </span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-coral px-1.5 text-rd-11 font-semibold text-white tabular-nums">{p.n}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
    </div>
  );
};
