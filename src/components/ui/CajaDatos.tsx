import React from 'react';

/**
 * Una caja de datos: rótulo arriba en una franja hundida y, dentro, una fila por dato con su
 * valor a la derecha. Es la caja «En RaDAR» de la tarjeta del Directorio, aquí como pieza
 * aparte para que el detalle use exactamente la misma (Alejandro, 22 de septiembre de 2026) y
 * no dos maquetaciones del mismo dato. Mismo dibujo que el bloque de recursos de una
 * publicación: borde, radio 12 y cabecera en versalitas de 10,5.
 */
export const CajaDatos: React.FC<{ titulo: string; filas: [string, string][]; className?: string }> = ({ titulo, filas, className = '' }) => (
  <div className={`rounded-rd-lg border border-rd-line max-sm:border-rd-line-soft max-sm:bg-rd-sunken/30 ${className}`}>
    <div className="font-rd rounded-t-rd-lg border-b border-rd-line max-sm:border-rd-line-soft bg-rd-sunken px-3 py-2 text-rd-10-5 font-semibold tracking-wider text-rd-ink-meta uppercase">{titulo}</div>
    <dl className="m-0 flex flex-col">
      {filas.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-2 text-rd-12-5 not-first:border-t not-first:border-rd-line-soft">
          <dt className="min-w-0 text-rd-ink-2">{k}</dt>
          <dd className="m-0 shrink-0 font-semibold text-rd-ink tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  </div>
);
