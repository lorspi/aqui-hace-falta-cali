import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';
import { Button, type NivelBoton } from './Button';

/**
 * El ⋮ de una tarjeta (`rd-mas-acc` del prototipo): las acciones que no merecen un botón a la
 * vista, en un `role="menu"`. Al elegir, el menú se cierra y el foco vuelve al ⋮ antes de que
 * abra lo que sigue. Un ítem `peligro` (cancelar, borrar) va en coral y al final.
 *
 * Por defecto el menú se despliega hacia arriba, pegado al botón. Con `flotante` se fija al
 * body con `createPortal`: para tarjetas dentro de una zona que se desplaza (el tablero de
 * seguimiento o tablas), evitando recortes por overflow o contextos de apilamiento por transform.
 */
export interface ItemMenu {
  texto: string;
  icono?: React.ReactNode;
  onElegir: () => void;
  tono?: 'normal' | 'peligro';
}

export interface MenuAccionesProps {
  items: ItemMenu[];
  etiqueta?: string;
  tamano?: 'sm' | 'md';
  flotante?: boolean;
  nivel?: NivelBoton;
  className?: string;
}

export const MenuAcciones: React.FC<MenuAccionesProps> = ({
  items,
  etiqueta = 'Más acciones',
  tamano = 'md',
  flotante = false,
  nivel = 'terciario',
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number; arriba?: boolean } | null>(null);
  const raiz = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLButtonElement>(null);

  const elegir = (accion: () => void) => {
    setAbierto(false);
    dots.current?.focus();
    accion();
  };

  const abrir = () => {
    if (flotante && dots.current) {
      const r = dots.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - r.bottom;
      const arriba = espacioAbajo < 220;
      setPos({
        top: arriba ? r.top - 4 : r.bottom + 4,
        right: Math.max(8, window.innerWidth - r.right),
        arriba,
      });
    }
    setAbierto((a) => !a);
  };

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      const target = e.target as Node;
      if (raiz.current?.contains(target) || menuRef.current?.contains(target)) return;
      setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    const cerrar = () => setAbierto(false);

    document.addEventListener('mousedown', alTocar);
    document.addEventListener('keydown', alTeclear);
    if (flotante) {
      document.addEventListener('scroll', cerrar, true);
      window.addEventListener('resize', cerrar);
    }
    return () => {
      document.removeEventListener('mousedown', alTocar);
      document.removeEventListener('keydown', alTeclear);
      if (flotante) {
        document.removeEventListener('scroll', cerrar, true);
        window.removeEventListener('resize', cerrar);
      }
    };
  }, [abierto, flotante]);

  const item = 'font-rd flex w-full cursor-pointer items-center gap-3 rounded-rd-md p-2 text-left text-rd-13-5 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy';

  const menuContenido = (
    <div
      ref={menuRef}
      role="menu"
      aria-label={etiqueta}
      style={flotante && pos ? { top: pos.top, right: pos.right, transform: pos.arriba ? 'translateY(-100%)' : undefined } : undefined}
      className={`z-50 flex min-w-50 flex-col gap-0.5 rounded-rd-lg border border-rd-line bg-rd-surface p-1 shadow-rd-2 ${flotante ? 'fixed' : 'absolute right-0 bottom-full mb-2'}`}
      onClick={(ev) => ev.stopPropagation()}
    >
      {items.map((it) => (
        <button key={it.texto} type="button" role="menuitem" className={`${item} ${it.tono === 'peligro' ? 'text-rd-coral' : 'text-rd-ink'}`} onClick={() => elegir(it.onElegir)}>
          {it.icono && <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center ${it.tono === 'peligro' ? 'text-rd-coral' : 'text-rd-ink-3'}`}>{it.icono}</span>}
          <span>{it.texto}</span>
        </button>
      ))}
    </div>
  );

  return (
    <span ref={raiz} className="relative">
      <Button
        ref={dots}
        nivel={nivel}
        tamano={tamano}
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        soloIcono
        className={className}
        onClick={(ev) => {
          ev.stopPropagation();
          abrir();
        }}
      >
        <EllipsisVertical aria-hidden="true" className="h-4.5 w-4.5" />
      </Button>
      {abierto && (flotante ? createPortal(menuContenido, document.body) : menuContenido)}
    </span>
  );
};
