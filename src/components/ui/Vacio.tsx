import React from 'react';

/** El vacío del sistema (`rd-vacio`, manual §3): qué no hay y qué sí se puede hacer. Icono en
 *  un círculo hundido, título 15/600, texto corto y, si aplica, la acción. */
export const Vacio: React.FC<{ icono: React.ReactNode; titulo: string; texto?: string; accion?: React.ReactNode; className?: string }> = ({ icono, titulo, texto, accion, className = '' }) => (
  <div className={`flex flex-col items-center gap-2 px-4 py-8 text-center text-rd-ink-2 ${className}`}>
    <span aria-hidden="true" className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-rd-sunken text-rd-ink-3">
      {icono}
    </span>
    <h3 className="font-rd m-0 text-rd-15 font-semibold text-rd-ink">{titulo}</h3>
    {texto && <p className="m-0 max-w-90 text-rd-13-5 leading-normal">{texto}</p>}
    {accion && <div className="mt-3 flex gap-2">{accion}</div>}
  </div>
);
