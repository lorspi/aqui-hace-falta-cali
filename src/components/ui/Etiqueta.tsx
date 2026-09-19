import React from 'react';
import { Check, CircleDashed, CircleDot, Clock, Hand, HeartHandshake } from 'lucide-react';
import type { TipoPublicacion } from '../../types/publicacion';
import type { EstadoPublicacion } from '../../utils/publicaciones';

/**
 * Las dos etiquetas de una publicación (`rd-tag` y `rd-estado` del prototipo), con
 * utilidades sobre los tokens `rd-*`. La de tipo lleva el mismo icono que el pin del mapa:
 * se aprende una vez. La de estado sigue la gramática de color: verde solo para lo
 * confirmado, neutro para lo que está en proceso o sin iniciar.
 */
export const EtiquetaTipo: React.FC<{ tipo: TipoPublicacion }> = ({ tipo }) => (
  <span
    className={`font-rd inline-flex items-center gap-1.25 rounded-rd-sm border py-1 pr-2.25 pl-1.75 text-rd-12 font-semibold whitespace-nowrap ${
      tipo === 'necesidad' ? 'border-rd-coral-line bg-rd-coral-soft text-rd-coral-ink' : 'border-rd-navy-line bg-rd-navy-soft text-rd-navy'
    }`}
  >
    {tipo === 'necesidad' ? <Hand aria-hidden="true" className="h-3.5 w-3.5" /> : <HeartHandshake aria-hidden="true" className="h-3.5 w-3.5" />}
    {tipo === 'necesidad' ? 'Se necesita' : 'Se ofrece'}
  </span>
);

const ESTADO: Record<EstadoPublicacion, { texto: string; clase: string; icono: React.ReactNode }> = {
  cubierta: { texto: 'Cubierta', clase: 'border-rd-green-line bg-rd-green-soft text-rd-green', icono: <Check className="h-3.5 w-3.5" /> },
  proceso: { texto: 'En proceso', clase: 'border-rd-line bg-rd-surface text-rd-ink-2', icono: <CircleDot className="h-3.5 w-3.5" /> },
  inicial: { texto: 'Sin iniciar', clase: 'border-rd-line bg-rd-sunken text-rd-ink-2', icono: <CircleDashed className="h-3.5 w-3.5" /> },
};

export const EtiquetaEstado: React.FC<{ estado: EstadoPublicacion }> = ({ estado }) => {
  const e = ESTADO[estado];
  return (
    <span className={`inline-flex items-center gap-1.25 rounded-full border py-1 pr-2.25 pl-1.75 text-rd-11-5 font-semibold whitespace-nowrap ${e.clase}`}>
      <span aria-hidden="true" className="inline-flex">
        {e.icono}
      </span>
      {e.texto}
    </span>
  );
};

/** La etiqueta de un paso del ciclo de una entrega (nueva · aceptada · en camino · por
 *  confirmar · confirmada), con el texto que le dé quien la usa y el tono de la gramática:
 *  `inicial` neutro hundido, `proceso` neutro blanco (en camino lleva reloj), `completo` verde. */
export const EtiquetaCiclo: React.FC<{ texto: string; tono: 'inicial' | 'proceso' | 'completo'; enCamino?: boolean }> = ({ texto, tono, enCamino = false }) => {
  const clase = tono === 'completo' ? ESTADO.cubierta.clase : tono === 'proceso' ? ESTADO.proceso.clase : ESTADO.inicial.clase;
  const icono = tono === 'completo' ? ESTADO.cubierta.icono : enCamino ? <Clock className="h-3.5 w-3.5" /> : tono === 'proceso' ? ESTADO.proceso.icono : ESTADO.inicial.icono;
  return (
    <span className={`inline-flex items-center gap-1.25 rounded-full border py-1 pr-2.25 pl-1.75 text-rd-11-5 font-semibold whitespace-nowrap ${clase}`}>
      <span aria-hidden="true" className="inline-flex">
        {icono}
      </span>
      {texto}
    </span>
  );
};

/** Iniciales de la organización en círculo (`rd-avatar`). Decorativo. */
export const Avatar: React.FC<{ iniciales: string; tamano?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ iniciales, tamano = 'sm' }) => {
  const t = tamano === 'lg' ? 'h-11 w-11 text-rd-15' : tamano === 'md' ? 'h-8 w-8 text-rd-11-5' : tamano === 'xs' ? 'h-5 w-5 text-rd-10' : 'h-6.5 w-6.5 text-rd-10';
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full border border-rd-line bg-rd-sunken font-semibold text-rd-ink-2 ${t}`}>
      {iniciales}
    </span>
  );
};

/** Cifra en píldora coral (`rd-nav__n`): avisos o pendientes. */
export const Contador: React.FC<{ n: number; titulo?: string; className?: string }> = ({ n, titulo, className = '' }) => (
  <b title={titulo} className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-coral px-1.5 text-rd-11 font-semibold text-white ${className}`}>
    {n}
  </b>
);
