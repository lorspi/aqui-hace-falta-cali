import React from 'react';

/**
 * El interruptor (`rd-switch` del prototipo): un ajuste que está encendido o apagado. Pista de
 * 40 × 24 en `rd-track`, en tinta (`rd-sel`) cuando está encendido —elegir no es actuar—, con
 * el disco blanco que se desplaza. Es un `input[type=checkbox]` con `role="switch"` (invisible
 * sobre la pista), así que teclado y lector lo entienden sin más. Se usa para configuración
 * (aparecer en el Directorio, canales de aviso, solo verificadas), nunca para marcar filas de
 * una lista: eso es la casilla.
 */
export interface SwitchProps {
  id?: string;
  encendido: boolean;
  onCambiar: (encendido: boolean) => void;
  /** Nombre para tecnologías de apoyo cuando el rótulo visible no lo envuelve. */
  etiqueta?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ id, encendido, onCambiar, etiqueta, disabled = false, className = '' }) => (
  <span className={`relative inline-flex h-6 w-10 shrink-0 ${className}`}>
    <input id={id} type="checkbox" role="switch" checked={encendido} aria-checked={encendido} aria-label={etiqueta} disabled={disabled} onChange={(e) => onCambiar(e.target.checked)} className="peer absolute inset-0 z-1 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-rd-track transition-colors peer-checked:bg-rd-sel peer-hover:bg-rd-ink-3 peer-checked:peer-hover:bg-rd-ink peer-disabled:opacity-45 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rd-navy" />
    <span aria-hidden="true" className="absolute top-0.75 left-0.75 h-4.5 w-4.5 rounded-full bg-rd-surface shadow-xs transition-transform peer-checked:translate-x-4" />
  </span>
);

/** Una fila de ajuste: rótulo y nota a la izquierda, el interruptor a la derecha; toda la fila
 *  es el `label`. */
export const FilaSwitch: React.FC<{ id: string; rotulo: string; nota?: string; encendido: boolean; onCambiar: (v: boolean) => void; disabled?: boolean; className?: string }> = ({ id, rotulo, nota, encendido, onCambiar, disabled, className = '' }) => (
  <label htmlFor={id} className={`flex cursor-pointer items-center justify-between gap-3 ${className}`}>
    <span className="min-w-0">
      <span className="block text-rd-13-5 font-medium text-rd-ink">{rotulo}</span>
      {nota && <span className="block text-rd-12 text-rd-ink-meta">{nota}</span>}
    </span>
    <Switch id={id} encendido={encendido} onCambiar={onCambiar} disabled={disabled} />
  </label>
);
