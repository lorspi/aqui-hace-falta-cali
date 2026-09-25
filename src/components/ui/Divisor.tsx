import React from 'react';

/**
 * El divisor vertical sutil que separa dos datos en un mismo renglón: quién y cuándo, persona
 * y rol, lugar y distancia. Reemplaza al punto medio, que Alejandro prohibió en toda la
 * herramienta (16 de septiembre de 2026) y barrimos el 24.
 *
 * Es el mismo trazo que `Donde` ya dibujaba en línea (`h-3.5 w-px bg-rd-line`); aquí vive una
 * vez para que no se copie en cada sitio. `align-middle` lo centra con el texto sin depender
 * del alto de la línea, y `aria-hidden` lo deja fuera del lector de pantalla: es puntuación
 * visual, y leído en voz alta no dice nada.
 */
export const Divisor: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span aria-hidden="true" className={`mx-1.5 inline-block h-3 w-px shrink-0 bg-rd-line align-middle ${className}`} />
);
