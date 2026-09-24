import React from 'react';
import { Check } from 'lucide-react';

/**
 * Pantalla de éxito al cerrar un flujo (`rd-exito` del prototipo): icono en círculo verde
 * suave, `h1` enfocable, texto y las acciones que siguen. Un solo primario.
 */
export interface SuccessProps {
  titulo: string;
  texto?: string;
  /** Aviso opcional entre el texto y las acciones (por ejemplo, verificación en revisión). */
  children?: React.ReactNode;
  acciones: React.ReactNode;
  /** Enlace secundario debajo de las acciones. */
  pie?: React.ReactNode;
  tituloRef?: React.Ref<HTMLHeadingElement>;
}

export const Success: React.FC<SuccessProps> = ({ titulo, texto, children, acciones, pie, tituloRef }) => (
  <div className="text-center">
    <span aria-hidden="true" className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rd-green-soft text-rd-green">
      <Check className="h-7.5 w-7.5" />
    </span>
    <h1 ref={tituloRef} tabIndex={-1} className="font-rd mb-2 text-rd-24 leading-tight font-semibold tracking-rd-titulo text-rd-ink text-balance focus:outline-none sm:text-rd-28">
      {titulo}
    </h1>
    {texto && <p className="mb-6 text-rd-14 text-rd-ink-2">{texto}</p>}
    {children && <div className="mt-4 mb-2">{children}</div>}
    <div className="mt-6 flex flex-col-reverse gap-2">{acciones}</div>
    {pie && <p className="mt-4 text-rd-14 text-rd-ink-2">{pie}</p>}
  </div>
);
