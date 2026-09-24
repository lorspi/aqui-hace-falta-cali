import React from 'react';

/**
 * La caja de una sección (`rd-caja` del prototipo): borde `rd-line`, radio 12, 16 de relleno;
 * cabecera con el `h2` de 16/600 y la acción a la derecha. La usan el panel y el Perfil.
 */
export interface CajaProps {
  titulo?: React.ReactNode;
  accion?: React.ReactNode;
  className?: string;
  /** En móvil (`< sm`), elimina el borde y fondo exterior si contiene tarjetas hijas (ej. `Tabla`), evitando el efecto «tarjeta dentro de tarjeta». */
  planaMovil?: boolean;
  children: React.ReactNode;
}

export const Caja: React.FC<CajaProps> = ({ titulo, accion, className = 'col-span-full', planaMovil = false, children }) => (
  <section
    className={`min-w-0 rounded-rd-lg border border-rd-line bg-rd-surface p-4 max-sm:p-3.5 ${
      planaMovil ? 'max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none' : ''
    } ${className}`}
  >
    {/* La acción nunca baja sola a otra línea: el título envuelve por dentro (el chip cae bajo
        el texto) y el botón se queda a la derecha (Alejandro, 16 de septiembre de 2026). */}
    {(titulo || accion) && (
      <div className={`mb-3 flex items-start justify-between gap-3 ${planaMovil ? 'max-sm:mb-2.5 max-sm:px-0.5' : ''}`}>
        {titulo && <h2 className="font-rd m-0 min-w-0 flex-1 text-rd-16 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{titulo}</h2>}
        {accion && <div className="ml-auto flex shrink-0 gap-2">{accion}</div>}
      </div>
    )}
    {children}
  </section>
);

/** El chip de conteo junto a un título («Mi equipo 4», «Solicitudes 2 nuevas»): cuenta cosas
 *  de una lista; nunca dice un estado (Alejandro, 16 de septiembre de 2026). */
export const Conteo: React.FC<{ n: number | string }> = ({ n }) => <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-sunken px-1.5 text-rd-11-5 font-semibold text-rd-ink-2 tabular-nums">{n}</span>;

/** Una fila de dato (`rd-dato`): rótulo a la izquierda, valor (con una línea menor) y, si la
 *  hay, la acción a la derecha. Bajo 640 el rótulo va encima del valor. */
export const FilaDato: React.FC<{ rotulo: string; children: React.ReactNode; nota?: string; accion?: React.ReactNode }> = ({ rotulo, children, nota, accion }) => (
  <div className="flex gap-3 border-t border-rd-line-soft py-3 first:border-t-0 first:pt-0 last:pb-0 max-sm:flex-col max-sm:gap-1 sm:items-start">
    <span className="text-rd-12-5 text-rd-ink-2 sm:w-44 sm:shrink-0 sm:pt-0.5">{rotulo}</span>
    <span className="min-w-0 flex-1 text-rd-13-5 font-medium text-rd-ink">
      {children}
      {nota && <small className="block text-rd-12 font-normal text-rd-ink-meta">{nota}</small>}
    </span>
    {accion && <span className="flex shrink-0 gap-2 max-sm:mt-1">{accion}</span>}
  </div>
);
