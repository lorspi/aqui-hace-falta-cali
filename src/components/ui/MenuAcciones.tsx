import React, { useEffect, useRef, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from './Button';

/**
 * El ⋮ de una tarjeta (`rd-mas-acc` del prototipo): las acciones que no merecen un botón a la
 * vista, en un `role="menu"`. Al elegir, el menú se cierra y el foco vuelve al ⋮ antes de que
 * abra lo que sigue. Un ítem `peligro` (cancelar, borrar) va en coral y al final.
 *
 * Por defecto el menú se despliega hacia arriba, pegado al botón. Con `flotante` se fija a la
 * ventana desde la posición del botón: para tarjetas dentro de una zona que se desplaza
 * (el tablero de seguimiento), donde un menú absoluto quedaría recortado; se cierra al desplazar.
 */
export interface ItemMenu {
  texto: string;
  icono?: React.ReactNode;
  onElegir: () => void;
  tono?: 'normal' | 'peligro';
}

export const MenuAcciones: React.FC<{ items: ItemMenu[]; etiqueta?: string; tamano?: 'sm' | 'md'; flotante?: boolean }> = ({ items, etiqueta = 'Más acciones', tamano = 'md', flotante = false }) => {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const raiz = useRef<HTMLSpanElement>(null);
  const dots = useRef<HTMLButtonElement>(null);
  const elegir = (accion: () => void) => {
    setAbierto(false);
    dots.current?.focus();
    accion();
  };
  const abrir = () => {
    if (flotante && dots.current) {
      const r = dots.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setAbierto((a) => !a);
  };
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    const cerrar = () => setAbierto(false);
    document.addEventListener('mousedown', alTocar);
    document.addEventListener('keydown', alTeclear);
    if (flotante) document.addEventListener('scroll', cerrar, true);
    return () => {
      document.removeEventListener('mousedown', alTocar);
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('scroll', cerrar, true);
    };
  }, [abierto, flotante]);
  const item = 'font-rd flex w-full cursor-pointer items-center gap-3 rounded-rd-md p-2 text-left text-rd-13-5 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy';
  return (
    <span ref={raiz} className="relative">
      <Button
        ref={dots}
        nivel="terciario"
        tamano={tamano}
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        soloIcono
        onClick={(ev) => {
          ev.stopPropagation();
          abrir();
        }}
      >
        <EllipsisVertical aria-hidden="true" className="h-4.5 w-4.5" />
      </Button>
      {abierto && (
        <div
          role="menu"
          aria-label={etiqueta}
          style={flotante && pos ? { top: pos.top, right: pos.right } : undefined}
          className={`z-600 flex min-w-50 flex-col gap-0.5 rounded-rd-lg border border-rd-line bg-rd-surface p-1 shadow-rd-2 ${flotante ? 'fixed' : 'absolute right-0 bottom-full mb-2'}`}
          onClick={(ev) => ev.stopPropagation()}
        >
          {items.map((it) => (
            <button key={it.texto} type="button" role="menuitem" className={`${item} ${it.tono === 'peligro' ? 'text-rd-coral' : 'text-rd-ink'}`} onClick={() => elegir(it.onElegir)}>
              {it.icono && <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center ${it.tono === 'peligro' ? 'text-rd-coral' : 'text-rd-ink-3'}`}>{it.icono}</span>}
              <span>{it.texto}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
};
