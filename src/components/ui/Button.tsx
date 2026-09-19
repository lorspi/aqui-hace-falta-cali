import React from 'react';

/**
 * Botón del sistema de Producto (el `rd-btn` del prototipo de RaDAR), escrito con utilidades
 * de Tailwind sobre los tokens `rd-*` de `src/index.css`.
 *
 * Nivel = consecuencia de tocarlo (RaDAR, decisión 223):
 *   primario   crea o cambia algo que otros ven y los compromete → navy
 *   pedir      «Pedir ayuda», la única acción en coral (139)
 *   secundario cambia datos propios, reversible → contorno
 *   terciario  no cambia datos: vista o cierre → solo texto
 * Tamaño = peso del momento (223 C1):
 *   lg  la acción que cierra un flujo, un diálogo o una hoja (48)
 *   md  dentro de tarjetas, filas, cabeceras y pies (40; 44 con el dedo)
 *   sm  en línea dentro del cuerpo (32; 44 con el dedo)
 * Cruces que no existen: primario en `sm`, terciario en `lg`. Un primario por unidad.
 */
export type NivelBoton = 'primario' | 'pedir' | 'secundario' | 'terciario';
export type TamanoBoton = 'lg' | 'md' | 'sm';

const BASE =
  'font-rd inline-flex cursor-pointer items-center justify-center gap-1.75 border leading-none font-semibold tracking-rd-btn transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45';

const CLASE_NIVEL: Record<NivelBoton, string> = {
  primario: 'border-rd-navy bg-rd-navy text-white hover:border-rd-navy-hover hover:bg-rd-navy-hover enabled:active:brightness-90',
  pedir: 'border-rd-coral bg-rd-coral text-white hover:brightness-95',
  secundario:
    'border-rd-line bg-rd-surface text-rd-ink hover:bg-rd-sunken enabled:active:bg-rd-line disabled:border-rd-line disabled:bg-rd-sunken disabled:text-rd-ink-meta disabled:opacity-100',
  terciario:
    'border-transparent bg-transparent text-rd-ink-2 hover:bg-rd-sunken hover:text-rd-ink enabled:active:bg-rd-line disabled:text-rd-ink-meta disabled:opacity-100',
};

const CLASE_TAMANO: Record<TamanoBoton, string> = {
  lg: 'h-rd-h-lg rounded-rd-md text-rd-15',
  md: 'h-rd-h-md rounded-rd-md text-rd-13-5 pointer-coarse:h-rd-tactil',
  sm: 'h-rd-h-sm rounded-rd-sm text-rd-12-5 pointer-coarse:h-rd-tactil',
};
const RELLENO: Record<TamanoBoton, string> = { lg: 'px-5', md: 'px-3.75', sm: 'px-2.75' };
/* Solo icono: cuadrado, sin relleno lateral (un `px-0` en className no le ganaría al del
 *  tamaño: Tailwind ordena las utilidades por valor, no por dónde se escriben). */
const CUADRADO: Record<TamanoBoton, string> = { lg: 'w-rd-h-lg px-0', md: 'w-rd-h-md px-0 pointer-coarse:w-rd-tactil', sm: 'w-rd-h-sm px-0 pointer-coarse:w-rd-tactil' };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  nivel?: NivelBoton;
  tamano?: TamanoBoton;
  /** Icono Lucide (16) antes del texto; decorativo, el texto ya lo nombra. */
  icono?: React.ReactNode;
  iconoDespues?: React.ReactNode;
  /** A todo el ancho del contenedor. */
  ancho?: boolean;
  /** Solo un icono dentro: cuadrado del alto del tamaño, con `aria-label` obligatorio. */
  soloIcono?: boolean;
  /** React 19: la referencia llega como propiedad. Para devolver el foco (menús, diálogos). */
  ref?: React.Ref<HTMLButtonElement>;
}

export const Button: React.FC<ButtonProps> = ({
  nivel = 'secundario',
  tamano = 'md',
  icono,
  iconoDespues,
  ancho = false,
  soloIcono = false,
  type = 'button',
  className = '',
  children,
  ...resto
}) => (
  <button
    type={type}
    className={[BASE, CLASE_TAMANO[tamano], soloIcono ? CUADRADO[tamano] : RELLENO[tamano], CLASE_NIVEL[nivel], ancho ? 'w-full' : '', className].filter(Boolean).join(' ')}
    {...resto}
  >
    {icono && <span aria-hidden="true" className="inline-flex shrink-0">{icono}</span>}
    {children}
    {iconoDespues && <span aria-hidden="true" className="inline-flex shrink-0">{iconoDespues}</span>}
  </button>
);
