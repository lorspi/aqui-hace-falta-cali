import React, { useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin, Minus, Navigation, Search } from 'lucide-react';
import type { Ubicacion } from '../../types/publicacion';
import { alternarCiudades, ciudadDeUbicacion, gruposDeCiudades, nombreCiudades } from '../../utils/lugares';
import { Button } from './Button';

/**
 * El lugar, en una sola pieza (Alejandro, 21 de septiembre de 2026): un campo de búsqueda que
 * filtra por texto (ciudad o departamento) y, desplegado, ofrece primero el botón «Cerca de
 * mí» (una acción, no una opción), luego «Seleccionar todo» y después las ciudades agrupadas
 * por departamento, cada una con su casilla a la derecha; la casilla del departamento marca
 * todas las suyas. Se eligen varias; sin ninguna marcada, son todas. No nombra el país: el
 * territorio lo pone el dataset. Sin búsqueda, solo las ciudades que tienen algo, con su
 * conteo. `role="combobox"` + `listbox` múltiple, con teclado. Una sola pieza para la Radar y
 * el Directorio. Iconos sin color propio y hover el de las filas del Directorio, como manda
 * el DS.
 */
export interface SelectorCiudadProps {
  ciudades: string[];
  onCambiar: (ciudades: string[]) => void;
  /** Cuántas cosas hay por ciudad (id → n): decide qué ciudades se ven sin buscar. */
  conteos: Map<string, number>;
  /** La ubicación de la persona; en la maqueta es simulada. */
  ubicacion: Ubicacion;
  /** Qué pasa además con «Cerca de mí» (la Radar enciende «Más cerca»). */
  onCercaDeMi?: (ciudad: string) => void;
}

type Item =
  | { tipo: 'toda'; id: 'toda' }
  | { tipo: 'depto'; id: string; nombre: string; ids: string[] }
  | { tipo: 'ciudad'; id: string; nombre: string; n: number };

type Marca = 'si' | 'no' | 'parte';

export const SelectorCiudad: React.FC<SelectorCiudadProps> = ({ ciudades, onCambiar, conteos, ubicacion, onCercaDeMi }) => {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const [activo, setActivo] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const idLista = useId();
  const ciudadPropia = ciudadDeUbicacion(ubicacion);

  const grupos = useMemo(() => gruposDeCiudades(conteos, q), [conteos, q]);
  /* Los ítems en el orden en que se ven, para moverse con el teclado. Con texto escrito solo
     quedan los departamentos y ciudades que coinciden. */
  const items = useMemo<Item[]>(() => {
    const fijos: Item[] = q.trim() ? [] : [{ tipo: 'toda', id: 'toda' }];
    const lista: Item[] = grupos.flatMap((g) => [
      { tipo: 'depto', id: `depto:${g.departamento}`, nombre: g.departamento, ids: g.ciudades.map((c) => c.id) },
      ...g.ciudades.map<Item>((c) => ({ tipo: 'ciudad', id: c.id, nombre: c.nombre, n: c.n })),
    ]);
    return [...fijos, ...lista];
  }, [grupos, q]);
  const listadas = useMemo(() => grupos.flatMap((g) => g.ciudades.map((c) => c.id)), [grupos]);

  const marcaDe = (ids: string[]): Marca => {
    const n = ids.filter((id) => ciudades.includes(id)).length;
    return n === 0 ? 'no' : n === ids.length ? 'si' : 'parte';
  };
  const marca = (it: Item): Marca => {
    if (it.tipo === 'toda') return marcaDe(listadas);
    if (it.tipo === 'depto') return marcaDe(it.ids);
    return ciudades.includes(it.id) ? 'si' : 'no';
  };

  const abrir = () => {
    setAbierto(true);
    setQ('');
    setActivo(0);
  };
  const cerrar = () => {
    setAbierto(false);
    setQ('');
  };
  const cercaDeMi = () => {
    if (!ciudadPropia) return;
    onCambiar([ciudadPropia]);
    onCercaDeMi?.(ciudadPropia);
    cerrar();
    campo.current?.blur();
  };
  const elegir = (it: Item) => {
    if (it.tipo === 'toda') {
      /* Enciende todas las casillas de la lista; si ya están todas, las apaga. Sin ninguna
         marcada no hay filtro. */
      onCambiar(alternarCiudades(ciudades, listadas, marcaDe(listadas) !== 'si'));
      return;
    }
    if (it.tipo === 'depto') {
      onCambiar(alternarCiudades(ciudades, it.ids, marcaDe(it.ids) !== 'si'));
      return;
    }
    onCambiar(alternarCiudades(ciudades, [it.id], !ciudades.includes(it.id)));
  };
  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
      return;
    }
    if (!abierto && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      abrir();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => Math.max(a - 1, 0));
    } else if ((e.key === 'Enter' || e.key === ' ') && items[activo]) {
      e.preventDefault();
      elegir(items[activo]);
    }
  };
  const idDe = (i: number) => `${idLista}-${i}`;
  /* Se cierra cuando el foco sale de la pieza entera (campo, botón o lista). */
  const alSalir = (e: React.FocusEvent) => {
    if (!(e.relatedTarget instanceof Node) || !raiz.current?.contains(e.relatedTarget)) cerrar();
  };

  return (
    <div ref={raiz} className="relative">
      <label className="flex h-10 items-center gap-2 rounded-rd-md border border-rd-line bg-rd-surface px-3 text-rd-ink-3 focus-within:border-rd-navy focus-within:ring-3 focus-within:ring-rd-navy-soft">
        {abierto ? <Search aria-hidden="true" className="h-4 w-4 shrink-0" /> : <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />}
        <span className="sr-only">Ciudades</span>
        <input
          ref={campo}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={abierto && items[activo] ? idDe(activo) : undefined}
          value={abierto ? q : nombreCiudades(ciudades)}
          placeholder="Buscar ciudad o departamento"
          onFocus={abrir}
          onClick={() => !abierto && abrir()}
          onChange={(e) => {
            setQ(e.target.value);
            setActivo(0);
          }}
          onKeyDown={alTeclear}
          onBlur={alSalir}
          className="font-rd min-w-0 flex-1 bg-transparent text-rd-13 text-rd-ink outline-none placeholder:text-rd-ink-3"
        />
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </label>

      {/* El desplegable: «Cerca de mí» como botón (una acción) y debajo la lista con casillas. */}
      <div hidden={!abierto} className="absolute inset-x-0 top-full z-10 mt-1 flex max-h-80 flex-col overflow-hidden rounded-rd-md border border-rd-line bg-rd-surface shadow-rd-2">
        {ciudadPropia && !q.trim() && (
          <div className="border-b border-rd-line-soft p-2">
            <Button nivel="secundario" tamano="md" ancho icono={<Navigation className="h-4 w-4" />} onClick={cercaDeMi} onBlur={alSalir}>
              Cerca de mí
            </Button>
          </div>
        )}
        <div id={idLista} role="listbox" aria-label="Ciudades" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="m-0 px-3 py-2.5 text-rd-12-5 text-rd-ink-2">No se encontró «{q.trim()}»</p>
          ) : (
            items.map((it, i) => <Fila key={it.id} item={it} id={idDe(i)} activa={i === activo} marca={marca(it)} onElegir={() => elegir(it)} onEntrar={() => setActivo(i)} />)
          )}
        </div>
      </div>
    </div>
  );
};

/** Una opción de la lista, con la casilla a la derecha. El departamento va como rótulo en versalitas de 11,5 con línea suave
 *  debajo, sin fondo: el fondo es del hover (`hover:bg-rd-fondo/50`, el de las filas del
 *  Directorio). `onMouseDown` evita que el campo pierda el foco antes del clic. */
const Fila: React.FC<{ item: Item; id: string; activa: boolean; marca: Marca; onElegir: () => void; onEntrar: () => void }> = ({ item, id, activa, marca, onElegir, onEntrar }) => {
  const depto = item.tipo === 'depto';
  return (
    <div
      role="option"
      id={id}
      aria-selected={marca === 'si'}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={onEntrar}
      onClick={onElegir}
      className={`font-rd flex cursor-pointer items-center gap-2 text-left hover:bg-rd-fondo/50 pointer-coarse:min-h-rd-tactil ${depto ? 'mx-3 mt-2 border-b border-rd-line-soft py-1.5 text-rd-11-5 font-semibold tracking-wider text-rd-ink-meta uppercase' : 'px-3 py-2 text-rd-13 text-rd-ink'} ${item.tipo === 'toda' ? 'font-semibold' : ''} ${activa ? 'bg-rd-fondo/50' : ''}`}
    >
      <span className="min-w-0 flex-1 truncate">{item.tipo === 'toda' ? 'Seleccionar todo' : item.nombre}</span>
      {item.tipo === 'ciudad' && item.n > 0 && <span className="text-rd-11-5 font-medium text-rd-ink-meta tabular-nums">{item.n}</span>}
      <Casilla marca={marca} />
    </div>
  );
};

/** La casilla, dibujada como la del DS: relleno tinta (`rd-sel`) y marca blanca cuando está
 *  marcada; una raya cuando el grupo está a medias. */
const Casilla: React.FC<{ marca: Marca }> = ({ marca }) => (
  <span aria-hidden="true" className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-rd-sm border ${marca === 'no' ? 'border-rd-line bg-rd-surface' : 'border-rd-sel bg-rd-sel text-white'}`}>
    {marca === 'si' && <Check className="h-3 w-3" strokeWidth={3} />}
    {marca === 'parte' && <Minus className="h-3 w-3" strokeWidth={3} />}
  </span>
);
