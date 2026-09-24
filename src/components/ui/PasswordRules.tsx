import React from 'react';
import { Check, CircleDashed } from 'lucide-react';
import { REGLAS_CONTRASENA } from '../../features/auth/schemas/registerSchema';

/**
 * Las reglas de la contraseña (`rd-reglas` del prototipo), todas a la vista desde el
 * principio en dos columnas, marcándose a medida que se cumplen: la persona ve qué le falta.
 * Región viva cortés. Verde solo para lo cumplido (es el color de lo confirmado).
 */
export interface PasswordRulesProps {
  contrasena: string;
  correo: string;
  id?: string;
  className?: string;
}

export const PasswordRules: React.FC<PasswordRulesProps> = ({ contrasena, correo, id = 'reglas-contrasena', className = '' }) => (
  <ul id={id} aria-live="polite" className={`-mt-1 mb-3 grid grid-cols-2 gap-x-3 gap-y-1 px-2 text-left ${className}`}>
    {REGLAS_CONTRASENA.map((r, i) => {
      const ok = r.cumple(contrasena || '', correo || '');
      const falta = !ok && contrasena.length > 0;
      const color = ok ? 'text-rd-green' : falta ? 'text-rd-ink-2' : 'text-rd-ink-meta';
      return (
        <li key={r.id} className={`flex items-center gap-1.5 text-rd-12 transition-colors ${color} ${i === REGLAS_CONTRASENA.length - 1 ? 'col-span-2' : ''}`}>
          {ok ? <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : <CircleDashed aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
          <span>
            {r.texto}
            <span className="sr-only">{ok ? ': cumplida' : ''}</span>
          </span>
        </li>
      );
    })}
  </ul>
);
