import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Aviso en línea dentro de un formulario o una pantalla: icono, título en negrita, texto y,
 * si hace falta, una acción a la derecha. Son `rd-doc` y `rd-espera` del prototipo, con
 * utilidades sobre los tokens `rd-*`: `neutro` (borde a rayas: algo por hacer), `info`
 * (azul suave), `pendiente` (ámbar: en revisión), `hecho` (verde: confirmado), `error` (coral).
 */
export type VarianteAviso = 'neutro' | 'info' | 'pendiente' | 'hecho' | 'error';

const CLASE: Record<VarianteAviso, { caja: string; icono: string; titulo: string }> = {
  neutro: { caja: 'border-dashed border-rd-line bg-rd-surface text-rd-ink-2', icono: 'text-rd-ink-3', titulo: 'text-rd-ink' },
  info: { caja: 'border-rd-navy-line bg-rd-navy-soft text-rd-navy', icono: 'bg-rd-surface text-rd-navy', titulo: 'text-rd-navy' },
  pendiente: { caja: 'border-rd-amber-line bg-rd-amber-soft text-rd-amber-ink', icono: 'bg-rd-surface text-rd-amber-ink', titulo: 'text-rd-amber-ink' },
  hecho: { caja: 'border-rd-green-line bg-rd-green-soft text-rd-green', icono: 'bg-rd-surface text-rd-green', titulo: 'text-rd-green' },
  error: { caja: 'border-rd-coral-line bg-rd-coral-soft text-rd-coral', icono: 'bg-rd-surface text-rd-coral', titulo: 'text-rd-coral' },
};

export interface InlineNoticeProps {
  icono?: React.ReactNode;
  titulo: React.ReactNode;
  texto?: string;
  children?: React.ReactNode;
  variante?: VarianteAviso;
  accion?: React.ReactNode;
  className?: string;
}

export const InlineNotice: React.FC<InlineNoticeProps> = ({ icono, titulo, texto, children, variante = 'neutro', accion, className = '' }) => {
  const c = CLASE[variante];
  const enCirculo = variante !== 'neutro';
  const contenido = children || texto;
  const ic = icono ?? (variante === 'error' ? <AlertCircle className="h-4 w-4" /> : null);
  return (
    <div className={`flex ${contenido ? 'items-start' : 'items-center'} gap-3 rounded-rd-lg border px-4 py-3 text-left ${c.caja} ${className}`}>
      {ic && (
        <span aria-hidden="true" className={`flex shrink-0 items-center justify-center ${enCirculo ? `h-8 w-8 rounded-full ${c.icono}` : `h-6.5 w-6.5 ${c.icono}`}`}>
          {ic}
        </span>
      )}
      <span className="min-w-0 flex-1 text-rd-13 leading-snug">
        <span className={`block font-semibold ${c.titulo}`}>{titulo}</span>
        {contenido && <span className="block">{contenido}</span>}
      </span>
      {accion && <span className="shrink-0 self-center">{accion}</span>}
    </div>
  );
};
