import React from 'react';

/**
 * Tarjeta de opción única: el `rd-evento` en fila del prototipo (`rd-perfiles`), con
 * utilidades sobre los tokens `rd-*`. Un `<label>` con su `input[type=radio]` real dentro
 * (solo para tecnologías de apoyo), icono en caja de 44, título y descripción. Seleccionada
 * = borde y anillo de 1 px en tinta, icono relleno en tinta; nunca azul de acción («elegir no
 * es actuar»). El teclado la opera como grupo de radios nativo.
 */
export interface OptionCardProps {
  name: string;
  id: string;
  valor: string;
  titulo: string;
  descripcion?: string;
  /** Icono Lucide (22). */
  icono?: React.ReactNode;
  seleccionada: boolean;
  onSelect: (valor: string) => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({ name, id, valor, titulo, descripcion, icono, seleccionada, onSelect }) => (
  <label
    htmlFor={id}
    className={`relative flex cursor-pointer ${descripcion ? 'items-start' : 'items-center'} gap-3 rounded-rd-lg border bg-rd-surface px-4 py-3 text-left transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rd-navy ${
      seleccionada ? 'border-rd-sel ring-1 ring-rd-sel' : 'border-rd-line hover:border-rd-ink-3'
    }`}
  >
    <input id={id} type="radio" name={name} value={valor} checked={seleccionada} onChange={() => onSelect(valor)} className="sr-only" />
    {icono && (
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-rd-md border ${
          seleccionada ? 'border-rd-sel bg-rd-sel text-white' : 'border-rd-line bg-rd-sunken text-rd-ink-2'
        }`}
      >
        {icono}
      </span>
    )}
    <span className="min-w-0 flex-1">
      <span className="block text-rd-14 font-semibold text-rd-ink">{titulo}</span>
      {descripcion && <span className="block text-rd-12 leading-snug text-rd-ink-2">{descripcion}</span>}
    </span>
  </label>
);
