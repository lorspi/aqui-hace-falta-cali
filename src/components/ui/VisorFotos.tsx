import React, { useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { FotoPublicada } from '../../types/publicacion';
import { Divisor } from './Divisor';

/**
 * Las fotos ya cargadas, accesibles desde donde están (Alejandro, 16 de septiembre de 2026).
 *
 *   `TiraFotos`   las miniaturas en la tarjeta o en la hoja: hasta tres y «+N»; al tocar una se
 *                 abre el visor en esa foto.
 *   `VisorFotos`  el visor a pantalla completa en un `<dialog>` nativo: una foto a la vez, pasar
 *                 con las flechas o el teclado, «2 de 3», y al pie quién la subió y cuándo. Recibe
 *                 grupos con título para las fotos de una entrega («Las de quien entregó», «Las de
 *                 quien recibió»); con un solo grupo sin título es la galería de una publicación.
 */
const FLECHA = 'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-rd-ink/60 text-white hover:bg-rd-ink/85 focus-visible:outline-2 focus-visible:outline-white';

export interface GrupoFotos {
  titulo?: string;
  fotos: FotoPublicada[];
}

/** `max` cuadritos y el resto como «+N» sobre el último; `etiqueta` pone «Fotos» encima (en la
 *  tarjeta de una publicación); en las tarjetas del tablero van solas, sin conteo (Alejandro,
 *  16 de septiembre de 2026). */
export const TiraFotos: React.FC<{ fotos: FotoPublicada[]; onAbrir: (i: number) => void; max?: number; etiqueta?: boolean; tamano?: 'sm' | 'md'; className?: string }> = ({ fotos, onAbrir, max = 3, etiqueta = false, tamano = 'md', className = '' }) => {
  if (!fotos.length) return null;
  const visibles = fotos.slice(0, max);
  const mas = fotos.length - visibles.length;
  return (
    <div className={className}>
      {etiqueta && (
        <p className="mb-1.5 flex items-center gap-1 text-rd-11-5 font-medium text-rd-ink-meta">
          <Camera aria-hidden="true" className="h-3.5 w-3.5" />
          Fotos
        </p>
      )}
      <ul className="m-0 flex list-none gap-1.5 p-0">
        {visibles.map((f, i) => (
          <li key={f.url + i}>
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                onAbrir(i);
              }}
              className={`relative block cursor-pointer overflow-hidden rounded-rd-md border border-rd-line bg-rd-sunken p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${tamano === 'sm' ? 'h-12 w-12' : 'h-16 w-16'}`}
              aria-label={`Ver foto ${i + 1} de ${fotos.length}: ${f.alt}`}
            >
              <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              {i === visibles.length - 1 && mas > 0 && <span className={`absolute inset-0 flex items-center justify-center bg-rd-ink/55 font-semibold text-white ${tamano === 'sm' ? 'text-rd-12-5' : 'text-rd-14'}`}>+{mas}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export interface VisorFotosProps {
  abierto: boolean;
  grupos: GrupoFotos[];
  /** Índice inicial sobre la lista aplanada de todos los grupos. */
  inicial?: number;
  titulo: string;
  onCerrar: () => void;
}

export const VisorFotos: React.FC<VisorFotosProps> = ({ abierto, grupos, inicial = 0, titulo, onCerrar }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const lista = grupos.flatMap((g) => g.fotos.map((f) => ({ ...f, grupo: g.titulo })));
  const [i, setI] = useState(inicial);
  useEffect(() => {
    if (abierto) setI(Math.min(inicial, Math.max(0, lista.length - 1)));
    // Solo al abrir: la posición la maneja el visor después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, inicial]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);
  const ir = (paso: number) => setI((k) => (k + paso + lista.length) % lista.length);
  const f = lista[i];
  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') ir(1);
        if (e.key === 'ArrowLeft') ir(-1);
      }}
      aria-label={titulo}
      className="font-rd m-auto h-dvh max-h-dvh w-full max-w-full bg-rd-ink p-0 text-white backdrop:bg-rd-ink/80"
    >
      {abierto && f && (
        <div className="flex h-full flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-none items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-rd-14 font-semibold">{titulo}</p>
              <p className="m-0 text-rd-12-5 text-white/70 tabular-nums">
                {i + 1} de {lista.length}
                {f.grupo ? (
                  <>
                    <Divisor className="bg-white/25" />
                    {f.grupo}
                  </>
                ) : null}
              </p>
            </div>
            <button type="button" aria-label="Cerrar" onClick={onCerrar} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-rd-md text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <img key={f.url + i} src={f.url} alt={f.alt} className="max-h-full max-w-full rounded-rd-md object-contain" />
            {lista.length > 1 && (
              <>
                <button type="button" aria-label="Foto anterior" onClick={() => ir(-1)} className={FLECHA + ' left-2'}>
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Foto siguiente" onClick={() => ir(1)} className={FLECHA + ' right-2'}>
                  <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="flex-none px-4 py-3">
            <p className="m-0 text-rd-13 leading-snug">{f.alt}</p>
            <p className="m-0 mt-0.5 text-rd-12 text-white/70">
              {f.quien}
              <Divisor className="bg-white/25" />
              {f.cuando}
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
};
