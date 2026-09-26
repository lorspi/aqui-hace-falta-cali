import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Bell, Check, Clock, Hand, HeartHandshake, RefreshCw, TriangleAlert, Truck } from 'lucide-react';
import { DIAS } from '../../mocks/avisosMock';
import type { Aviso, TipoAviso } from '../../types/aviso';
import { Button } from './Button';
import { ROTULO_GRUPO } from './tipografia';
import { Contador } from './Etiqueta';
import { Segmented } from './Segmented';

/**
 * Los avisos (`avisos.js` del prototipo): la misma fila en el panel colgado de la campana y
 * en la página de Avisos. Icono con el color del contexto (coral pide, navy compromete o
 * verifica, ámbar en camino o vence, verde llegó, gris revalidar), título, detalle, cuándo y
 * la única acción que toca. Sin leer: fondo azul suave y un punto a la izquierda.
 */
const ICONO: Record<TipoAviso, { icono: React.ElementType; clase: string }> = {
  solicitud: { icono: Hand, clase: 'bg-rd-coral-soft text-rd-coral' },
  compromiso: { icono: HeartHandshake, clase: 'bg-rd-navy-soft text-rd-navy' },
  camino: { icono: Truck, clase: 'bg-rd-amber-soft text-rd-amber-ink' },
  recibir: { icono: Check, clase: 'bg-rd-green-soft text-rd-green' },
  confirmada: { icono: Check, clase: 'bg-rd-green-soft text-rd-green' },
  devuelta: { icono: TriangleAlert, clase: 'bg-rd-coral-soft text-rd-coral' },
  vence: { icono: Clock, clase: 'bg-rd-amber-soft text-rd-amber-ink' },
  revalidar: { icono: RefreshCw, clase: 'bg-rd-sunken text-rd-ink-3' },
  cuenta: { icono: BadgeCheck, clase: 'bg-rd-navy-soft text-rd-navy' },
};

export interface FilaAvisoProps {
  aviso: Aviso;
  /** En el panel: sin detalle y la acción abajo. */
  compacta?: boolean;
  onAccion?: (aviso: Aviso) => void;
}

export const FilaAviso: React.FC<FilaAvisoProps> = ({ aviso: a, compacta = false, onAccion }) => {
  const ic = ICONO[a.tipo];
  const Icono = ic.icono;
  /* Bajo 640 la acción baja a su propia línea también en la fila completa: al lado del texto
     no cabía y el título quedaba en una columna estrecha. */
  return (
    <article className={`relative flex items-start gap-3 rounded-rd-lg py-3 pr-3 pl-4 mb-1 last:mb-0 hover:bg-rd-fondo ${a.leido ? '' : 'bg-rd-navy-soft hover:bg-rd-navy-line/60'} ${compacta ? 'flex-wrap' : 'max-sm:flex-wrap'}`}>
      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ic.clase}`}>
        <Icono className="h-4.5 w-4.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <b className={`leading-snug font-semibold text-rd-ink ${compacta ? 'text-rd-13' : 'text-rd-13-5'}`}>{a.titulo}</b>
        {!compacta && <span className="text-rd-12-5 leading-normal text-rd-ink-2">{a.detalle}</span>}
        <time className="mt-0.5 text-rd-11-5 text-rd-ink-meta">{a.cuando}</time>
      </div>
      {a.accion && (
        <div className={`flex shrink-0 items-center self-center ${compacta ? 'mt-2 w-full justify-end pl-12' : 'max-sm:mt-2 max-sm:w-full max-sm:justify-start max-sm:pl-12'}`}>
          <Button nivel={a.accion.nivel} tamano="md" onClick={() => onAccion?.(a)}>
            {a.accion.texto}
          </Button>
        </div>
      )}
      {!a.leido && <span role="img" aria-label="Sin leer" className="absolute top-7.5 left-1.5 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-rd-navy" />}
    </article>
  );
};

/** Los avisos agrupados por día (Hoy · Ayer · Antes). */
export const ListaAvisos: React.FC<{ avisos: Aviso[]; compacta?: boolean; onAccion?: (aviso: Aviso) => void }> = ({ avisos, compacta = false, onAccion }) => {
  if (avisos.length === 0)
    return (
      <p className="flex flex-col items-center gap-2 px-4 py-6 text-center text-rd-13 text-rd-ink-meta">
        <Bell aria-hidden="true" className="h-7 w-7 text-rd-line" />
        Nada nuevo. Cuando pase algo con lo tuyo, aparece aquí.
      </p>
    );
  return (
    <>
      {DIAS.map((d) => {
        const del = avisos.filter((a) => a.dia === d.id);
        if (!del.length) return null;
        return (
          <React.Fragment key={d.id}>
            {/* Sin `uppercase`: ningún rótulo de la herramienta va en altas (decisión 242). */}
            <h3 className={`${ROTULO_GRUPO} mx-3 mt-3 mb-1 first:mt-0`}>{d.nombre}</h3>
            {del.map((a) => (
              <FilaAviso key={a.id} aviso={a} compacta={compacta} onAccion={onAccion} />
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
};

/**
 * La campana con su panel (≥ 1024): conteo de los sin leer, Todos · Sin leer, la lista
 * compacta, «Marcar leídos» y «Ver todos». Se cierra con Escape (el foco vuelve
 * a la campana) o tocando fuera (el foco se queda donde la persona tocó).
 */
export interface CampanaAvisosProps {
  avisos: Aviso[];
  rutaAvisos: string;
  onLeerTodos: () => void;
  onAccion: (aviso: Aviso) => void;
  className?: string;
}

export const CampanaAvisos: React.FC<CampanaAvisosProps> = ({ avisos, rutaAvisos, onLeerTodos, onAccion, className = '' }) => {
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'nuevos'>('todos');
  const raiz = useRef<HTMLSpanElement>(null);
  const campana = useRef<HTMLButtonElement>(null);
  const sinLeer = avisos.filter((a) => !a.leido).length;

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      campana.current?.focus();
    };
    document.addEventListener('mousedown', alTocar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alTocar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const lista = filtro === 'nuevos' ? avisos.filter((a) => !a.leido) : avisos;

  return (
    <span ref={raiz} className={`relative ${className}`}>
      <button
        ref={campana}
        type="button"
        aria-label={sinLeer ? `Avisos: ${sinLeer} sin leer` : 'Avisos'}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink-2 hover:bg-rd-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
      >
        <Bell aria-hidden="true" className="h-4.5 w-4.5" />
        {sinLeer > 0 && <Contador n={sinLeer} className="absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1.25 text-rd-10-5 ring-2 ring-rd-surface" />}
      </button>
      {abierto && (
        <div role="dialog" aria-label="Avisos" className="absolute top-full right-0 z-900 mt-2 w-100 overflow-hidden rounded-rd-xl border border-rd-line bg-rd-surface text-left shadow-rd-2">
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <h2 className="font-rd m-0 text-rd-16 font-semibold text-rd-ink">Avisos</h2>
            <Segmented<'todos' | 'nuevos'>
              etiquetaGrupo="Qué avisos ver"
              valor={filtro}
              onChange={setFiltro}
              opciones={[
                { id: 'todos', etiqueta: 'Todos' },
                { id: 'nuevos', etiqueta: `Sin leer ${sinLeer}` },
              ]}
            />
          </div>
          <div className="sin-barra max-h-130 overflow-y-auto px-2 pb-2">
            <ListaAvisos avisos={lista} compacta onAccion={onAccion} />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-rd-line px-3 py-2">
            <Button nivel="terciario" tamano="sm" onClick={onLeerTodos} disabled={sinLeer === 0}>
              Marcar leídos
            </Button>
            <a href={rutaAvisos} className="font-rd inline-flex h-rd-h-sm items-center rounded-rd-sm px-2.75 text-rd-12-5 font-semibold text-rd-ink-2 hover:bg-rd-sunken hover:text-rd-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy">
              Ver todos
            </a>
          </div>
        </div>
      )}
    </span>
  );
};
