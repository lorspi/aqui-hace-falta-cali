import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

/**
 * El armazón de una hoja de filtros (`rd-hoja` del prototipo): velo, panel de 440 pegado a la
 * derecha, cabecera con el título y la ×, cuerpo que se desplaza y pie fijo. Escape y el velo
 * cierran; el foco entra en la × al abrir.
 *
 * Nació el 25 de septiembre de 2026 al unificar el filtro de Mi equipo con el de la Radar
 * (Alejandro: «el filtro de mi equipo no es igual al de las demás secciones. unifica»). Había
 * una hoja y un popover con selects; repintar el popover lo habría dejado derivar otra vez, así
 * que el armazón es uno solo y lo único que cambia es el cuerpo y el pie.
 *
 * El título va a `rd-18`, el de todo diálogo y toda hoja (decisión 242). La hoja de filtros de
 * la Radar lo tenía a `rd-16`, que es el de una sección.
 */
export const Hoja: React.FC<{
  abierta: boolean;
  titulo: string;
  idTitulo: string;
  onCerrar: () => void;
  /** Pestañas entre la cabecera y el cuerpo, si la hoja las tiene. */
  pestanas?: React.ReactNode;
  /** Los botones del pie, ya armados: a la izquierda quitar, a la derecha ver. */
  pie: React.ReactNode;
  children: React.ReactNode;
}> = ({ abierta, titulo, idTitulo, onCerrar, pestanas, pie, children }) => {
  const hoja = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierta, onCerrar]);

  /* El foco va a la × solo al abrir. Aparte del efecto de arriba: `onCerrar` cambia en cada
     render de la página y, si el foco dependiera de él, saltaría a la × con cada filtro tocado
     (y cerraría el selector de ciudad, que se cierra al perder el foco). */
  useEffect(() => {
    if (abierta) hoja.current?.querySelector<HTMLElement>('button')?.focus();
  }, [abierta]);

  if (!abierta) return null;

  return (
    <>
      <button type="button" aria-label="Cerrar los filtros" onClick={onCerrar} className="fixed inset-0 z-900 cursor-default bg-rd-ink/32" />
      <aside ref={hoja} role="dialog" aria-modal="true" aria-labelledby={idTitulo} className="font-rd fixed top-0 right-0 bottom-0 z-901 flex w-full max-w-110 flex-col bg-rd-surface shadow-rd-2">
        <div className="flex items-center gap-2 border-b border-rd-line px-4 py-3">
          <h2 id={idTitulo} className="m-0 flex-1 text-rd-18 leading-snug font-semibold tracking-rd-titulo text-rd-ink">
            {titulo}
          </h2>
          <Button nivel="terciario" tamano="sm" aria-label="Cerrar" soloIcono onClick={onCerrar}>
            <X aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
        </div>

        {pestanas}

        <div className="sin-barra min-h-0 flex-1 overflow-y-auto px-4">{children}</div>

        <div className="flex items-center justify-between gap-2 border-t border-rd-line bg-rd-surface px-4 py-3">{pie}</div>
      </aside>
    </>
  );
};
