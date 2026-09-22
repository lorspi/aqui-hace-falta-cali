import React from 'react';

/** Una opción de filtro como chip con `input` real (checkbox o radio). La usan las hojas de
 *  filtros y el selector de ciudad. */
export const Opcion: React.FC<{ tipo: 'checkbox' | 'radio'; nombre: string; marcada: boolean; onChange: () => void; children: React.ReactNode }> = ({ tipo, nombre, marcada, onChange, children }) => (
  <label className="relative inline-flex">
    <input type={tipo} name={nombre} checked={marcada} onChange={onChange} className="peer absolute inset-0 m-0 cursor-pointer opacity-0" />
    <span className="font-rd inline-flex h-8 items-center rounded-full border border-rd-line bg-rd-surface px-3 text-rd-13 font-medium text-rd-ink peer-checked:border-rd-sel peer-checked:bg-rd-sel peer-checked:text-white peer-hover:border-rd-ink-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rd-navy pointer-coarse:h-rd-tactil">
      {children}
    </span>
  </label>
);
