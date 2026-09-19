import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Funnel, Search, X } from 'lucide-react';

/**
 * Las piezas de la barra de consulta (`rd-consulta` del prototipo, decisión 70): una sola
 * para la Radar y el Directorio. El botón Filtros con su conteo, la zona de chips aplicados
 * (en una fila que se desplaza, con › cuando desborda en móvil) y el campo de búsqueda.
 */
function esMovil(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

export const BotonFiltros: React.FC<{ aplicados: number; abierta: boolean; onClick: () => void }> = ({ aplicados, abierta, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={abierta}
    aria-label={aplicados ? `Filtros, ${aplicados} aplicados` : 'Filtros'}
    className={`font-rd inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border bg-rd-surface px-3 text-rd-13-5 font-medium whitespace-nowrap text-rd-ink hover:bg-rd-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${aplicados ? 'border-rd-sel' : 'border-rd-line'}`}
  >
    <Funnel aria-hidden="true" className="h-3.75 w-3.75 text-rd-ink-3" />
    Filtros
    {aplicados > 0 && <span aria-hidden="true" className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-sunken px-1.5 text-rd-11-5 font-semibold text-rd-ink-2 tabular-nums">{aplicados}</span>}
  </button>
);

/** Un chip aplicado con su ×. */
export const ChipAplicado: React.FC<{ texto: string; onQuitar: () => void }> = ({ texto, onQuitar }) => (
  <span className="inline-flex h-7 flex-none items-center gap-1.5 rounded-full border border-rd-line bg-rd-line-soft pr-1.25 pl-2.5 text-rd-12-5 font-semibold whitespace-nowrap text-rd-ink max-lg:h-9">
    {texto}
    <button type="button" aria-label={`Quitar ${texto}`} onClick={onQuitar} className="flex cursor-pointer rounded-full p-0.5 hover:bg-rd-line focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rd-navy">
      <X aria-hidden="true" className="h-3 w-3" />
    </button>
  </span>
);

export const QuitarTodos: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="font-rd mr-2 flex-none cursor-pointer px-1 text-rd-12-5 font-semibold whitespace-nowrap text-rd-ink-2 underline underline-offset-2 hover:text-rd-ink">
    Quitar todos
  </button>
);

/** La fila de chips: se desplaza sin barra y, si en móvil hay chips fuera de la vista a la
 *  derecha, muestra › para llegar a ellos (decisión 143). */
export const ZonaChips: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const zona = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);
  const [movil, setMovil] = useState(esMovil);
  useEffect(() => {
    const z = zona.current;
    if (!z) return;
    const medir = () => {
      const ultimo = z.lastElementChild;
      setMovil(esMovil());
      setDesborda(!!ultimo && ultimo.getBoundingClientRect().right > z.getBoundingClientRect().right + 1);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(z);
    z.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      ro.disconnect();
      z.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, [children]);
  return (
    <>
      {/* La fila va en posición absoluta dentro de una caja de alto fijo: así los chips no cuentan
          como ancho mínimo de la página (Chrome en móvil agrandaría el viewport con ellos). */}
      <div className="relative h-10 min-w-0 flex-1 max-lg:h-11">
        <div
          ref={zona}
          className={`absolute inset-0 flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pr-4 ${
            desborda ? `zona-rd-chips ${movil ? 'pr-15' : ''}` : 'zona-rd-scroll'
          }`}
        >
          {children}
        </div>
      </div>
      {desborda && (
        <button
          type="button"
          aria-label="Ver más filtros aplicados"
          onClick={() => zona.current?.scrollTo({ left: zona.current.scrollWidth, behavior: 'smooth' })}
          className="relative z-1 -ml-13 flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink hover:bg-rd-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy lg:hidden"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

/** El campo de búsqueda de la consulta: bajo 1024 solo aparece cuando la lupa de la cabecera
 *  lo abre (`abierto`), a lo ancho y primero en la fila; desde 1024 vive a la derecha por defecto
 *  o donde lo ubique quien lo use (con `className`). */
export const CampoBuscar: React.FC<{ valor: string; onChange: (v: string) => void; placeholder: string; abierto: boolean; className?: string }> = ({ valor, onChange, placeholder, abierto, className }) => (
  <label className={`flex h-10 items-center gap-2 rounded-full border border-rd-line bg-rd-surface px-3 text-rd-ink-3 focus-within:border-rd-navy focus-within:ring-3 focus-within:ring-rd-navy-soft ${className ?? 'lg:ml-auto lg:w-64 xl:w-80'} ${abierto ? 'order-first w-full max-lg:h-11' : 'max-lg:hidden'}`}>
    <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
    <span className="sr-only">Buscar</span>
    <input type="search" value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="font-rd min-w-0 flex-1 bg-transparent text-rd-13 text-rd-ink outline-none placeholder:text-rd-ink-3" />
  </label>
);
