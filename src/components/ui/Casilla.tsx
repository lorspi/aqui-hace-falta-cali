import React from 'react';
import { Check, Minus } from 'lucide-react';

/**
 * La casilla dibujada del sistema: relleno tinta (`rd-sel`) con la marca en blanco cuando está
 * marcada, contorno cuando no, y una raya cuando un grupo está a medias. Es solo la pieza
 * visual: quien la use pone el `<input type="checkbox">` real —nativo o `sr-only`— para que el
 * teclado y el lector de pantalla sigan funcionando.
 *
 * Nació dentro de `SelectorCiudad` (16 de septiembre de 2026) y salió aquí al necesitarla
 * también el diálogo de comprometerse: una casilla, no dos. La nativa con `accent-rd-sel` que
 * queda en `HojaFiltros` y en `comunes.tsx` es la excepción a alinear cuando se barra.
 */
export type Marca = 'si' | 'no' | 'parte';

export const Casilla: React.FC<{ marca: Marca; className?: string }> = ({ marca, className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-rd-sm border transition-colors ${marca === 'no' ? 'border-rd-line bg-rd-surface' : 'border-rd-sel bg-rd-sel text-white'} ${className}`}
  >
    {marca === 'si' && <Check className="h-3 w-3" strokeWidth={3} />}
    {marca === 'parte' && <Minus className="h-3 w-3" strokeWidth={3} />}
  </span>
);
