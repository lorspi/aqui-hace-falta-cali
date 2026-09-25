import React from 'react';

/**
 * La barra de avance de RaDAR, una sola para toda la maqueta (Alejandro, 16 de septiembre de
 * 2026: «no se está usando un design system consolidado sino creando de manera independiente»).
 * La usan el bloque de recursos de una publicación, Mis necesidades y los bloques del Resumen.
 *
 * Gramática única:
 *   - 8 px de alto, esquinas redondas, pista `rd-track` detrás de lo que falta.
 *   - Tramos contiguos, sin separación, en el orden del ciclo.
 *   - Un color por estado, el mismo que en las columnas del tablero y en las leyendas
 *     (`CLASE_TONO`): lo confirmado en verde, lo que va en camino en ámbar y RAYADO (todavía
 *     no llegó), lo nuevo en coral, lo comprometido en gris, lo entregado por confirmar en navy.
 */
export type TonoTramo = 'nueva' | 'comprometida' | 'camino' | 'porConfirmar' | 'confirmada' | 'distribuida' | 'archivada';

export interface Tramo {
  tono: TonoTramo;
  /** Del 0 al 100. */
  porcentaje: number;
}

export const CLASE_TONO: Record<TonoTramo, string> = {
  nueva: 'bg-rd-coral',
  comprometida: 'bg-rd-ink-3',
  camino: 'bg-rd-amber bg-rd-rayado',
  porConfirmar: 'bg-rd-navy',
  confirmada: 'bg-rd-green',
  distribuida: 'bg-rd-green',
  archivada: 'bg-rd-line',
};

export const Barra: React.FC<{ tramos: Tramo[]; etiqueta: string; className?: string }> = ({ tramos, etiqueta, className = '' }) => (
  <div role="img" aria-label={etiqueta} className={`flex h-2 w-full overflow-hidden rounded-full bg-rd-track ${className}`}>
    {tramos
      .filter((t) => t.porcentaje > 0)
      .map((t, i) => (
        <span key={`${t.tono}-${i}`} className={`block h-full ${CLASE_TONO[t.tono]}`} style={{ width: `${t.porcentaje}%` }} />
      ))}
  </div>
);

/** El punto de la leyenda, con el mismo color (y rayado) que su tramo. */
export const PuntoTono: React.FC<{ tono: TonoTramo }> = ({ tono }) => <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${CLASE_TONO[tono]}`} />;
