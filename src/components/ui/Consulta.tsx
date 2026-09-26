import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Funnel, Search, X } from 'lucide-react';

/**
 * Las piezas de la barra de consulta (`rd-consulta` del prototipo, decisión 70): una sola
 * para la Radar y el Directorio. El botón Filtros con su conteo, la zona de chips aplicados
 * (en una fila que se desplaza, con › cuando desborda en móvil) y el campo de búsqueda.
 */
/** El botón que abre los filtros. Dice «Filtrar y ordenar» porque la hoja de la Radar y del
 *  Directorio trae las dos cosas (Alejandro, 21 de septiembre de 2026; el prototipo decía
 *  «Filtros» con el orden escondido); donde solo se filtra, `etiqueta` lo dice.
 *
 *  Es el estándar de filtro de toda la herramienta (Alejandro, 25 de septiembre de 2026: «revisa
 *  que todos los botones de filtro sean del mismo tamaño y tengan los mismos estilos… el estándar
 *  es radar»). Mi equipo tenía su propia copia, con otro tamaño de texto, otro relleno, el activo
 *  en navy y el conteo en navy sobre blanco; en vez de repintarla se borró y usa esta. Quien abra
 *  un desplegable en vez de una hoja pide `chevron` y pasa `refBoton` para su clic afuera.
 *
 *  Activo no significa color: el marco pasa a tinta (`rd-sel`) y el conteo se queda en hundido.
 *  Pintar el botón de navy lo hacía competir con el botón primario de la sección. */
export const BotonFiltros: React.FC<{
  aplicados: number;
  abierta: boolean;
  onClick: () => void;
  etiqueta?: string;
  chevron?: boolean;
  refBoton?: React.RefObject<HTMLButtonElement | null>;
}> = ({ aplicados, abierta, onClick, etiqueta = 'Filtrar y ordenar', chevron = false, refBoton }) => (
  <button
    ref={refBoton}
    type="button"
    onClick={onClick}
    aria-expanded={abierta}
    aria-label={aplicados ? `${etiqueta}, ${aplicados} aplicados` : etiqueta}
    className={`font-rd inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border bg-rd-surface px-3 text-rd-13-5 font-medium whitespace-nowrap text-rd-ink hover:bg-rd-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy ${aplicados ? 'border-rd-sel' : 'border-rd-line'}`}
  >
    <Funnel aria-hidden="true" className="h-3.75 w-3.75 text-rd-ink-3" />
    {etiqueta}
    {aplicados > 0 && <span aria-hidden="true" className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-sunken px-1.5 text-rd-11-5 font-semibold text-rd-ink-2 tabular-nums">{aplicados}</span>}
    {chevron && <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 text-rd-ink-3 transition-transform duration-150 ${abierta ? 'rotate-180' : ''}`} />}
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

/** La fila de chips: se desplaza sin barra y, si hay chips fuera de la vista a la derecha,
 *  muestra › para llegar a ellos. En el prototipo ese botón vivía solo bajo 1024
 *  (`pantalla.css:628`, decisión 143); ahora va en todos los anchos (Alejandro, 22 de
 *  septiembre de 2026), porque desde 1024 la fila también se desborda cuando pasa bajo el
 *  buscador y sin el › no hay forma de saber que hay más. */
export const ZonaChips: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const zona = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);
  useEffect(() => {
    const z = zona.current;
    if (!z) return;
    const medir = () => {
      const ultimo = z.lastElementChild;
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

  /* El › no manda al final de un toque (Alejandro, 22 de septiembre de 2026): empuja un poco al
     apretarlo y, si se mantiene, sigue barriendo solo, acelerando hasta una velocidad de lectura.
     Un toque corto mueve un chip; mantenerlo recorre la fila. */
  const cuadro = useRef<number | undefined>(undefined);
  const espera = useRef<number | undefined>(undefined);
  const parar = useCallback(() => {
    if (cuadro.current !== undefined) cancelAnimationFrame(cuadro.current);
    if (espera.current !== undefined) window.clearTimeout(espera.current);
    cuadro.current = undefined;
    espera.current = undefined;
  }, []);
  const barrer = useCallback(() => {
    parar();
    /* El empujón del toque: lo que mide un chip corto, para que un clic se note. */
    if (zona.current) zona.current.scrollLeft += 56;
    /* Si sigue apretado tras un cuarto de segundo, el barrido continuo. */
    espera.current = window.setTimeout(() => {
      const desde = performance.now();
      const paso = (ahora: number) => {
        const z = zona.current;
        if (!z) return;
        /* De 3 a 8 px por cuadro (180 a 480 px/s) en el primer segundo. */
        z.scrollLeft += 3 + Math.min(1, (ahora - desde) / 1000) * 5;
        cuadro.current = requestAnimationFrame(paso);
      };
      cuadro.current = requestAnimationFrame(paso);
    }, 250);
  }, [parar]);
  useEffect(() => parar, [parar]);

  return (
    <>
      {/* La fila va en posición absoluta dentro de una caja de alto fijo: así los chips no cuentan
          como ancho mínimo de la página (Chrome en móvil agrandaría el viewport con ellos). */}
      <div className="relative h-10 min-w-0 flex-1 max-lg:h-11">
        <div
          ref={zona}
          className={`absolute inset-0 flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pr-4 ${
            desborda ? 'zona-rd-chips pr-15' : 'zona-rd-scroll'
          }`}
        >
          {children}
        </div>
      </div>
      {desborda && (
        <button
          type="button"
          aria-label="Ver más filtros aplicados"
          onPointerDown={(e) => {
            e.preventDefault();
            barrer();
          }}
          onPointerUp={parar}
          onPointerLeave={parar}
          onPointerCancel={parar}
          onBlur={parar}
          /* Con teclado: la repetición de `keydown` mientras se mantiene hace el mismo avance. */
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            if (zona.current) zona.current.scrollLeft += 56;
          }}
          /* Caja externa de 0: se pinta encima de los últimos 60 px de la zona, que conserva su
             ancho hasta el borde. `z-1` porque la máscara de la zona crea contexto de apilamiento
             y, sin él, el toque caería en el chip de debajo (prototipo, 78 G1). */
          className="relative z-1 -ml-13 flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink hover:bg-rd-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

/** El campo de búsqueda de la consulta (decisión 70): desde 1024 vive a la derecha de la barra,
 *  el último de la fila (`pantalla.css:240`: `margin-left:auto`, 360 de ancho). Bajo 1024 solo
 *  aparece cuando la lupa de la cabecera lo abre (`abierto`), a lo ancho y primero en la fila
 *  (146). Su sitio no lo decide quien lo usa: es el mismo en toda la herramienta.
 *  Al foco el marco va en tinta (`rd-sel`), el mismo negro con el que Filtros marca que tiene
 *  algo aplicado, porque comparten fila y el navy desentonaba (Alejandro, 24 de septiembre de
 *  2026). El halo acompaña en tinta al 10 %, no en navy. */
export const CampoBuscar: React.FC<{ valor: string; onChange: (v: string) => void; placeholder: string; abierto: boolean; className?: string }> = ({ valor, onChange, placeholder, abierto, className = '' }) => (
  <label className={`flex h-10 items-center gap-2 rounded-full border border-rd-line bg-rd-surface px-3 text-rd-ink-3 focus-within:border-rd-sel focus-within:ring-3 focus-within:ring-rd-ink/10 ${className ? className : 'lg:ml-auto lg:w-72 xl:w-90'} ${abierto ? 'max-lg:order-first max-lg:h-11 max-lg:w-full' : 'max-lg:hidden'}`}>
    <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
    <span className="sr-only">Buscar</span>
    <input type="search" value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="font-rd min-w-0 flex-1 bg-transparent text-rd-13 text-rd-ink outline-none placeholder:text-rd-ink-3" />
  </label>
);

/** El buscador que vive dentro de una hoja o de un bloque, no en la barra de consulta: el mismo
 *  dibujo de `CampoBuscar` —alto 40, esquina redonda, marco en tinta al foco— sin la lógica de
 *  sitio de la barra. Las hojas de filtros y el selector de recursos de los flujos tenían cada
 *  uno su propio campo, los dos enfocando en navy contra la decisión del 24 de septiembre, con
 *  la lupa a 14 en uno y a 16 en el otro (Alejandro, 25 de septiembre de 2026). */
export const CampoBuscarEnBloque: React.FC<{ valor: string; onChange: (v: string) => void; placeholder: string; etiqueta: string; className?: string }> = ({ valor, onChange, placeholder, etiqueta, className = '' }) => (
  <label className={`flex h-11 sm:h-12 w-full shrink-0 items-center gap-2.5 rounded-full border border-rd-line bg-rd-surface px-4 text-rd-ink-3 transition-colors focus-within:border-rd-sel focus-within:ring-3 focus-within:ring-rd-ink/10 ${className}`}>
    <Search aria-hidden="true" className="h-4.5 w-4.5 shrink-0 text-rd-ink-3" />
    <span className="sr-only">{etiqueta}</span>
    <input type="search" value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="font-rd min-w-0 flex-1 bg-transparent text-rd-14 sm:text-rd-14-5 text-rd-ink outline-none placeholder:text-rd-ink-3" />
    {valor && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Borrar búsqueda"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-rd-sunken text-rd-ink-2 hover:bg-rd-line hover:text-rd-ink transition-colors"
      >
        <X aria-hidden="true" className="h-3 w-3" />
      </button>
    )}
  </label>
);
