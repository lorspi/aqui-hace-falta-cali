import React from 'react';

/**
 * Progreso de un flujo en dos niveles (`rd-progreso` del prototipo: `rd-tabs` + `rd-tramos`):
 * fases con nombre (las hechas son botón y vuelven atrás) y, debajo, los tramos de la fase
 * actual. El conjunto se nombra «Paso N de M». Registro no lo usa (el diseño final no muestra
 * progreso); queda para los flujos de pedir y ofrecer.
 */
export interface StepperProps {
  fases: string[];
  /** 1-based. */
  faseActual: number;
  tramos: { nombre: string; hecho: boolean; actual: boolean }[];
  onIrAFase?: (fase: number) => void;
  onIrATramo?: (indice: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ fases, faseActual, tramos, onIrAFase, onIrATramo, className = '' }) => (
  <div className={`mb-6 ${className}`} aria-label={`Paso ${faseActual} de ${fases.length}`} role="group">
    <ol className="mb-4 flex gap-6 border-b border-rd-line">
      {fases.map((nombre, i) => {
        const k = i + 1;
        const hecha = k < faseActual;
        const actual = k === faseActual;
        const base = 'font-rd -mb-px block border-b-2 pt-1.5 pb-2.5 text-rd-13-5';
        return (
          <li key={nombre}>
            {hecha && onIrAFase ? (
              <button
                type="button"
                onClick={() => onIrAFase(k)}
                className={`${base} cursor-pointer border-transparent font-medium text-rd-ink-2 hover:text-rd-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy`}
              >
                {nombre}
              </button>
            ) : (
              <span aria-current={actual ? 'step' : undefined} className={`${base} ${actual ? 'border-rd-sel font-semibold text-rd-ink' : 'border-transparent font-medium text-rd-ink-meta'}`}>
                {nombre}
              </span>
            )}
          </li>
        );
      })}
    </ol>
    {tramos.length > 1 && (
      <div className="flex gap-1.5">
        {tramos.map((t, j) =>
          t.hecho && onIrATramo ? (
            <button
              key={t.nombre}
              type="button"
              onClick={() => onIrATramo(j)}
              aria-label={`Volver a ${t.nombre}`}
              className="h-1 flex-1 cursor-pointer rounded-xs bg-rd-sel focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-rd-navy"
            />
          ) : (
            <span key={t.nombre} title={t.nombre} className={`h-1 flex-1 rounded-xs ${t.actual ? 'bg-rd-sel' : 'bg-rd-line'}`} />
          ),
        )}
      </div>
    )}
  </div>
);
