import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, ChevronDown, ChevronLeft, CircleAlert, House, Info, Map as MapIcon, Monitor, Package, Radar, Search, Share2, X } from 'lucide-react';
import { FilaSugerencias, ListaCoincidencias } from '../../components/ui/Coincidencias';
import { Explosion } from '../../components/ui/Explosion';
import { DialogoCompromiso } from '../../components/ui/DialogoCompromiso';
import { avisoCompromiso } from '../../utils/compromiso';
import { useAviso } from '../../components/ui/AvisoCorto';
import { RUTAS } from '../../mocks/cuentasMock';
import { PUBLICACIONES, obtenerPublicaciones } from '../../mocks/publicacionesMock';
import type { Publicacion } from '../../types/publicacion';
import { coincidenciasDe } from '../../utils/cruce';
import { pingSugerencia } from '../../utils/sonido';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { IconoRecursoDe, categoriaDe, iconoDe } from '../../components/ui/Recursos';
import { Stepper } from '../../components/ui/Stepper';
import { EXITO, TOPE_ARCHIVO } from '../../mocks/flujosMock';
import { TAXONOMIA } from '../../mocks/publicacionesMock';
import type { Foto, SubPaso } from '../../types/flujo';
import { nombrePanel } from '../../utils/cuenta';
import { numero } from '../../utils/equivalencias';
import { RadarPage } from '../radar/RadarPage';
import { cifra } from '../../utils/publicaciones';

/** Lo que la persona teclea manda mientras teclea; el valor de afuera (ya con el formato del
 *  manual) se impone al salir del campo o cuando cambia por otro camino (un sugerido). */
function useTexto(valor: string, onChange: (t: string) => void, onBlur?: (t: string) => void) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => {
    if ((numero(texto) || 0) !== (numero(valor) || 0)) setTexto(valor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return {
    texto,
    alCambiar: (t: string) => {
      setTexto(t);
      onChange(t);
    },
    alSalir: (t: string) => {
      setTexto(valor || t);
      onBlur?.(t);
    },
  };
}

/**
 * Lo que es igual en pedir y ofrecer (`flujo.js` y `flujo.css` del prototipo): el marco con
 * el progreso arriba y el pie con Volver y Continuar abajo, la pregunta de salida, las
 * pantallas que comparten (recursos, contacto, dónde, fotos, revisar, éxito) y los
 * controles del flujo (cifras sugeridas, campo numérico con unidad, chips de opción).
 * Cada página define su estado, su camino, `listo(sub)` y sus pantallas.
 */

/* ---------- validación al salir del campo (`data-valida` del prototipo) ---------- */
export type Regla = 'requerido' | 'telefono' | 'numero';

export function mensajeDe(reglas: Regla[], v: string, vacio = 'Este dato hace falta'): string | null {
  const t = v.trim();
  if (reglas.includes('requerido') && !t) return vacio;
  if (t && reglas.includes('telefono') && t.replace(/\D/g, '').length < 10) return 'Un celular tiene 10 dígitos, más el +57';
  if (reglas.includes('numero') && t !== '' && !/^[0-9.,\s]+$/.test(t)) return 'Escribe solo el número, sin palabras';
  if (reglas.includes('numero') && (t === '' || !(parseFloat(t.replace(/\./g, '').replace(',', '.')) > 0))) return 'Escribe una cantidad mayor que cero';
  return null;
}

/** Los errores de los campos de una pantalla, por id: se ponen al salir, se quitan al corregir
 *  y se olvidan al cambiar de pantalla (`clave`). */
export function useErrores(clave?: string) {
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  useEffect(() => setErrores({}), [clave]);
  return {
    errores,
    validar: (id: string, reglas: Regla[], v: string, vacio?: string) => setErrores((e) => ({ ...e, [id]: mensajeDe(reglas, v, vacio) })),
    limpiar: (id: string) => setErrores((e) => (e[id] ? { ...e, [id]: null } : e)),
    poner: (id: string, mensaje: string | null) => setErrores((e) => ({ ...e, [id]: mensaje })),
  };
}

/** «Mis necesidades y Seguimiento»; con tres o más, comas y la última con «y». */
function lista(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/* ---------- el marco ---------- */
export interface MarcoFlujoProps {
  /** Nombre corto de la ventana (para la pestaña y el lector de pantalla). */
  nombre: string;
  fases: string[];
  camino: SubPaso[];
  sub: SubPaso;
  publicado: boolean;
  listo: boolean;
  textoPublicar: string;
  onIrAFase: (fase: number) => void;
  onIrA: (id: string) => void;
  onAtras: () => void;
  onSiguiente: () => void;
  onPublicar: () => void;
  onCerrar: () => void;
  children: React.ReactNode;
}

/** El marco: la ventana del flujo (a ≥ 1024, una tarjeta de 680 centrada sobre el fondo,
 *  como el modal del prototipo; bajo 1024, la pantalla entera), el progreso fijo arriba,
 *  el cuerpo que desplaza y el pie fijo abajo. Al cambiar de paso el foco va al `h1`. */
export const MarcoFlujo: React.FC<MarcoFlujoProps> = ({ nombre, fases, camino, sub, publicado, listo, textoPublicar, onIrAFase, onIrA, onAtras, onSiguiente, onPublicar, onCerrar, children }) => {
  const cuerpo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cuerpo.current?.scrollTo({ top: 0 });
    const t = cuerpo.current?.querySelector<HTMLElement>('h1');
    if (t) {
      t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    }
  }, [sub.id, publicado]);

  const i = camino.findIndex((x) => x.id === sub.id);
  const ultimo = i === camino.length - 1;
  const tramos = camino.filter((x) => x.paso === sub.paso);
  const idx = tramos.findIndex((x) => x.id === sub.id);

  /* La Radar de fondo solo se monta desde 1024: bajo eso el flujo ocupa la pantalla entera y
     montar un mapa oculto sería trabajo en vano. */
  const [escritorio, setEscritorio] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const alCambiar = () => setEscritorio(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  /* Desde 1024 el flujo es una ventana sobre la Radar, como en la app real: detrás va la Radar
     inerte y atenuada (Alejandro, 16 de septiembre de 2026: «un dimmer detrás, no un fondo
     gris»). La tarjeta ocupa el alto de la ventana menos el margen, estable entre pasos: el
     cuerpo centra o desplaza por dentro y el pie con Volver y Continuar queda a la vista. */
  return (
    <div className="font-rd min-h-dvh bg-rd-fondo text-rd-ink lg:flex lg:h-dvh lg:items-stretch lg:justify-center lg:bg-transparent lg:py-6">
      {escritorio && (
        <div aria-hidden="true" inert className="fixed inset-0 -z-1 overflow-hidden">
          <RadarPage />
          {/* Por encima de las capas de Leaflet (llegan a 1000). */}
          <div className="absolute inset-0 z-2000 bg-rd-ink/50" />
        </div>
      )}
      <section aria-label={nombre} className="relative flex h-dvh w-full flex-col overflow-hidden bg-rd-surface lg:h-auto lg:max-h-full lg:max-w-170 lg:rounded-rd-xl lg:border lg:border-rd-line lg:shadow-rd-2">
        <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute top-2 right-2 z-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-rd-md bg-rd-surface text-rd-ink-2 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy lg:top-3 lg:right-3 lg:h-10 lg:w-10">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        {/* La pantalla de éxito empieza siempre arriba (Alejandro, 22 de septiembre de 2026):
            centrada, el contenido saltaba al pasar del resumen a las sugerencias, porque las dos
            vistas no miden lo mismo. Anclada arriba, el título se queda quieto y solo cambia lo
            de abajo. */}
        {publicado ? (
          <div ref={cuerpo} className="sin-barra flex min-h-0 flex-1 flex-col overflow-y-auto px-4 sm:px-6">
            {children}
          </div>
        ) : (
          <>
            <div className="flex-none px-4 pt-5 pr-14 sm:px-6 sm:pr-16">
              <Stepper fases={fases} faseActual={sub.paso} tramos={tramos.map((t, j) => ({ nombre: t.nombre, hecho: j < idx, actual: j === idx }))} onIrAFase={onIrAFase} onIrATramo={(j) => onIrA(tramos[j].id)} className="mb-0 pb-5" />
            </div>
            <div ref={cuerpo} className="sin-barra flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-5 sm:px-6">
              {children}
            </div>
            <div className="flex flex-none items-center justify-between gap-2 border-t border-rd-line bg-rd-surface px-4 py-3 sm:px-6">
              {i > 0 ? (
                <Button nivel="terciario" tamano="md" icono={<ChevronLeft className="h-4 w-4" />} onClick={onAtras}>
                  Volver
                </Button>
              ) : (
                <span />
              )}
              <Button nivel="primario" tamano="lg" disabled={!listo} onClick={ultimo ? onPublicar : onSiguiente}>
                {ultimo ? textoPublicar : 'Continuar'}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

/** Encabezado de una pantalla del flujo: la pregunta y, si hace falta, una línea debajo. */
export const Pregunta: React.FC<{ titulo: string; sub?: React.ReactNode }> = ({ titulo, sub }) => (
  <>
    <h1 className="font-rd mb-1 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink focus:outline-none">{titulo}</h1>
    {sub && <p className="mb-5 text-rd-14 text-rd-ink-2">{sub}</p>}
    {!sub && <div className="mb-4" />}
  </>
);

/** «(opcional)» dentro de una etiqueta. */
export const Opt: React.FC = () => <span className="font-normal text-rd-ink-meta"> (opcional)</span>;

/* ---------- la pregunta de salida (`modal.js`) ---------- */
export const SalidaDialogo: React.FC<{ abierto: boolean; onSeguir: () => void; onBorrador: () => void; onSalir: () => void }> = ({ abierto, onSeguir, onBorrador, onSalir }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog ref={ref} role="alertdialog" aria-labelledby={titulo} onClose={onSeguir} className="font-rd m-auto w-full max-w-100 rounded-rd-xl bg-rd-surface p-6 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto max-sm:max-w-full">
      {abierto && (
        <>
          <h2 id={titulo} className="font-rd m-0 mb-2 text-rd-18 font-semibold tracking-rd-titulo">
            ¿Sales sin publicar?
          </h2>
          <p className="mb-5 text-rd-14 text-rd-ink-2">Lo que llevas escrito se pierde, salvo que lo guardes como borrador.</p>
          <div className="flex flex-col gap-2">
            <Button nivel="primario" tamano="md" ancho autoFocus onClick={onSeguir}>
              Seguir editando
            </Button>
            <Button nivel="terciario" tamano="md" ancho onClick={onBorrador}>
              Guardar borrador
            </Button>
            <Button nivel="terciario" tamano="md" ancho onClick={onSalir}>
              Salir sin guardar
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
};

/* ---------- controles del flujo ---------- */

/** Chips de opción controlados (`rd-opciones`): radio o checkbox real dentro. */
export const Chips: React.FC<{
  nombre: string;
  etiqueta?: React.ReactNode;
  opciones: string[];
  valor: string | string[];
  onChange: (valor: string, marcado: boolean) => void;
  multi?: boolean;
  columna?: boolean;
  className?: string;
}> = ({ nombre, etiqueta, opciones, valor, onChange, multi = false, columna = false, className = '' }) => (
  <fieldset className={`m-0 min-w-0 border-0 p-0 ${className}`}>
    {etiqueta && <legend className="font-rd mb-1.5 p-0 text-rd-12 font-medium text-rd-ink-2">{etiqueta}</legend>}
    <div className={`flex flex-wrap gap-2 ${columna ? 'flex-col items-start' : ''}`}>
      {opciones.map((o) => {
        const marcada = multi ? (valor as string[]).includes(o) : valor === o;
        return (
          <label key={o} className="relative inline-flex">
            <input type={multi ? 'checkbox' : 'radio'} name={nombre} checked={marcada} onChange={(e) => onChange(o, e.target.checked)} className="peer absolute inset-0 m-0 cursor-pointer opacity-0" />
            <span className="font-rd inline-flex h-8 items-center rounded-full border border-rd-line bg-rd-surface px-3 text-rd-13 font-medium text-rd-ink peer-checked:border-rd-sel peer-checked:bg-rd-sel peer-checked:text-white peer-hover:border-rd-ink-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rd-navy pointer-coarse:h-rd-tactil">
              {o}
            </span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

/** Cifras sugeridas (`rd-sugeridos`): llenan el campo sin reemplazarlo; la que coincide va
 *  marcada. `onMouseDown` evita que el campo pierda el foco (y que un error lo empuje). */
export const Sugeridos: React.FC<{ cifras: number[]; unidad: string; valor: number | undefined; onElegir: (n: number) => void; etiqueta?: string }> = ({ cifras, unidad, valor, onElegir, etiqueta = 'Cifras sugeridas' }) => (
  <div role="group" aria-label={etiqueta} className="mt-2 flex flex-wrap gap-2">
    {cifras.map((n) => {
      const activa = Number(valor) === n;
      return (
        <button
          key={n}
          type="button"
          aria-label={`${n} ${unidad}`}
          aria-pressed={activa}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onElegir(n)}
          className={`font-rd inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-rd-13 font-medium tabular-nums transition-colors pointer-coarse:h-rd-tactil focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy active:translate-y-px ${activa ? 'border-rd-sel bg-rd-sel text-white' : 'border-rd-line bg-rd-surface text-rd-ink hover:border-rd-ink-3'}`}
        >
          {n}
        </button>
      );
    })}
  </div>
);

/** Campo numérico con su unidad al lado (`rd-num`). Es de texto: acepta «1.500» como manda
 *  el manual (un `type=number` rechazaría el punto de miles). */
export const CampoNumero: React.FC<{
  id: string;
  etiqueta: React.ReactNode;
  etiquetaClase?: string;
  unidad: string;
  valor: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
  ayuda?: string;
  error?: string | null;
  autoFocus?: boolean;
  ancho?: string;
}> = ({ id, etiqueta, etiquetaClase = 'font-rd mb-1 block text-rd-12 font-medium text-rd-ink-2', unidad, valor, onChange, onBlur, ayuda, error, autoFocus, ancho = 'w-28' }) => {
  const { texto, alCambiar, alSalir } = useTexto(valor, onChange, onBlur);
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  return (
    <div className="mb-3">
      <label htmlFor={id} className={etiquetaClase}>
        {etiqueta}
      </label>
      {ayuda && (
        <p id={idAyuda} className="mb-1.5 text-rd-12-5 text-rd-ink-2">
          {ayuda}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={texto}
          autoFocus={autoFocus}
          onChange={(e) => alCambiar(e.target.value)}
          onBlur={(e) => alSalir(e.target.value)}
          aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={`font-rd h-rd-h-md rounded-rd-md border bg-rd-surface px-3 text-right text-rd-14 text-rd-ink tabular-nums focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft ${ancho} ${error ? 'border-rd-coral focus:ring-rd-coral-soft' : 'border-rd-line hover:not-focus:border-rd-ink-3'}`}
        />
        <span className="text-rd-12-5 font-semibold text-rd-ink-2">{unidad}</span>
      </div>
      {error && (
        <p id={idError} className="mt-1.5 flex items-center gap-1.25 text-rd-12-5 text-rd-coral">
          <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

/** Un acordeón (`rd-cat`): summary con nombre, conteo y flecha. */
export const Acordeon: React.FC<{ titulo: React.ReactNode; n?: number; abierto: boolean; onToggle: (abierto: boolean) => void; sugerido?: boolean; icono?: React.ReactNode; children: React.ReactNode }> = ({ titulo, n = 0, abierto, onToggle, sugerido = false, icono, children }) => (
  <details open={abierto} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)} className={`mb-2 rounded-rd-lg border ${sugerido ? 'mb-4 border-rd-ink-3 bg-rd-sunken' : 'border-rd-line bg-rd-surface'}`}>
    <summary className="font-rd flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-rd-14 font-semibold text-rd-ink focus-visible:rounded-rd-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy">
      {icono && (
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-rd-sm border border-rd-line bg-rd-surface text-rd-ink-2">
          {icono}
        </span>
      )}
      <span className="min-w-0 flex-1">{titulo}</span>
      {n > 0 && <span aria-label={`${n} marcados`} className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-sel px-1.5 text-rd-11-5 font-semibold text-white tabular-nums">{n}</span>}
      <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 text-rd-ink-3 transition-transform ${abierto ? '' : '-rotate-90'}`} />
    </summary>
    <div className="flex flex-col gap-2 px-2 pb-2">{children}</div>
  </details>
);

/** Una fila de recurso para marcar (`rd-rec`): casilla, icono, nombre y una línea menor. */
export const FilaRecurso: React.FC<{ item: string; marcado: boolean; onToggle: () => void; linea?: string; sugerido?: boolean }> = ({ item, marcado, onToggle, linea, sugerido = false }) => (
  <label className={`flex cursor-pointer items-start gap-3 rounded-rd-md border p-3 transition-colors focus-within:border-rd-navy focus-within:ring-3 focus-within:ring-rd-navy-soft hover:border-rd-ink-3 ${marcado ? 'border-rd-sel ring-1 ring-rd-sel' : sugerido ? 'border-rd-line bg-rd-surface' : 'border-rd-line-soft bg-rd-surface'}`}>
    <input type="checkbox" checked={marcado} onChange={onToggle} className="m-0 mt-1 h-4.5 w-4.5 shrink-0 cursor-pointer accent-rd-sel focus-visible:outline-none" />
    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-rd-sm border border-rd-line bg-rd-sunken text-rd-ink-2">
      <IconoRecursoDe nombre={iconoDe(item)} className="h-3.75 w-3.75" />
    </span>
    <span className="min-w-0">
      <span className="block text-rd-14 font-semibold text-rd-ink">{item}</span>
      {linea && <span className="block text-rd-11-5 text-rd-ink-meta">{linea}</span>}
    </span>
  </label>
);

/** La lista de recursos para marcar: buscador, un primer grupo especial (sugeridos para la
 *  emergencia, o lo registrado por la organización) y la taxonomía en acordeones. Una
 *  categoría con algo marcado llega abierta; si la persona la cerró a mano, se respeta. */
export const ListaRecursos: React.FC<{
  q: string;
  onBuscar: (q: string) => void;
  sel: string[];
  onToggle: (item: string) => void;
  abiertos: Record<string, boolean>;
  onAbrir: (grupo: string, abierto: boolean) => void;
  primero: { nombre: string; items: string[]; icono?: React.ReactNode; sugerido: boolean; linea?: (item: string) => string | undefined };
  vacioTexto: string;
}> = ({ q, onBuscar, sel, onToggle, abiertos, onAbrir, primero, vacioTexto }) => {
  const busca = q.trim().toLowerCase();
  const coincide = (it: string) => !busca || it.toLowerCase().includes(busca);
  const grupos = [{ nombre: primero.nombre, items: primero.items, especial: true }, ...TAXONOMIA.map((c) => ({ nombre: c.nombre, items: c.items.filter((it) => !primero.items.includes(it)), especial: false }))];
  const hayAlgo = grupos.some((g) => g.items.filter(coincide).length);
  return (
    <>
      <label className="mb-3 flex h-10 items-center gap-2 rounded-rd-md border border-rd-line bg-rd-surface px-3 text-rd-ink-3 focus-within:border-rd-navy focus-within:ring-3 focus-within:ring-rd-navy-soft">
        <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <span className="sr-only">Buscar un recurso</span>
        <input type="search" value={q} onChange={(e) => onBuscar(e.target.value)} placeholder="Buscar un recurso" className="font-rd min-w-0 flex-1 bg-transparent text-rd-13 text-rd-ink outline-none placeholder:text-rd-ink-meta" />
      </label>
      {busca && !hayAlgo && (
        <div className="flex flex-col items-center gap-1 px-4 py-6 text-center text-rd-ink-2">
          <Search aria-hidden="true" className="mb-1 h-6 w-6 text-rd-ink-3" />
          <h2 className="font-rd m-0 text-rd-15 font-semibold text-rd-ink">No encontramos «{q.trim()}»</h2>
          <p className="m-0 text-rd-13">{vacioTexto}</p>
        </div>
      )}
      {grupos.map((g) => {
        const items = g.items.filter(coincide);
        if ((busca && !items.length) || !g.items.length) return null;
        const n = g.items.filter((it) => sel.includes(it)).length;
        const abierto = busca ? true : g.nombre in abiertos ? abiertos[g.nombre] : g.especial || n > 0;
        return (
          <Acordeon key={g.nombre} titulo={g.nombre} n={n} abierto={abierto} onToggle={(a) => !busca && onAbrir(g.nombre, a)} sugerido={g.especial && primero.sugerido} icono={g.especial ? primero.icono : undefined}>
            {items.map((it) => (
              <FilaRecurso key={it} item={it} marcado={sel.includes(it)} onToggle={() => onToggle(it)} linea={g.especial ? primero.linea?.(it) : undefined} sugerido={g.especial} />
            ))}
          </Acordeon>
        );
      })}
    </>
  );
};

/** Tarjetas de opción con icono en cuadrícula (`rd-eventos`): 2 por fila, 4 desde 640. */
export const TarjetasOpcion: React.FC<{ nombre: string; opciones: { id: string; nombre: string; icono: React.ReactNode }[]; valor: string; onChange: (id: string) => void }> = ({ nombre, opciones, valor, onChange }) => (
  <div role="radiogroup" aria-label={nombre} className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
    {opciones.map((o) => {
      const marcada = o.id === valor;
      return (
        <label key={o.id} className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-rd-md border bg-rd-surface px-2 py-4 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rd-navy hover:border-rd-ink-3 ${marcada ? 'border-rd-sel ring-1 ring-rd-sel' : 'border-rd-line'}`}>
          <input type="radio" name={nombre} checked={marcada} onChange={() => onChange(o.id)} className="absolute inset-0 m-0 cursor-pointer opacity-0" />
          <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-rd-md border ${marcada ? 'border-rd-sel bg-rd-sel text-white' : 'border-rd-line bg-rd-sunken text-rd-ink-2'}`}>
            {o.icono}
          </span>
          <span className="text-rd-13 leading-snug font-semibold text-rd-ink">{o.nombre}</span>
        </label>
      );
    })}
  </div>
);

/* ---------- pantallas compartidas ---------- */

/** Contacto: nombre y celular directo para llamadas y coordinación por WhatsApp. */
export const CamposContacto: React.FC<{
  contacto: string;
  tel: string;
  onChange: (campo: 'contacto' | 'tel', v: string) => void;
  errores: ReturnType<typeof useErrores>;
}> = ({ contacto, tel, onChange, errores }) => (
  <>
    <Field
      id="ct"
      etiqueta="Persona de contacto"
      valor={contacto}
      autoComplete="name"
      placeholder="Nombre de quien coordina en el sitio"
      requerido
      onChange={(v) => {
        onChange('contacto', v);
        errores.limpiar('ct');
      }}
      onBlur={(v) => errores.validar('ct', ['requerido'], v, 'Necesitamos un nombre para llamar')}
      error={errores.errores.ct}
      className="mb-3"
    />
    <Field
      id="tel"
      etiqueta="Celular"
      tipo="tel"
      valor={tel}
      autoComplete="tel"
      placeholder="+57 3.. ... ...."
      requerido
      ayuda="Se usará para llamadas y coordinación por WhatsApp."
      onChange={(v) => {
        onChange('tel', v);
        errores.limpiar('tel');
      }}
      onBlur={(v) => errores.validar('tel', ['requerido', 'telefono'], v, 'Necesitamos un celular para coordinar')}
      error={errores.errores.tel}
      className="mb-3"
    />
  </>
);

/** Acordeón de «Algo más» (opcional) al final de contacto. */
export const AlgoMas: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => {
  const [abierto, setAbierto] = useState(false);
  return (
    <Acordeon
      titulo={
        <>
          {titulo}
          <Opt />
        </>
      }
      abierto={abierto}
      onToggle={setAbierto}
    >
      <div className="px-1 pt-2">{children}</div>
    </Acordeon>
  );
};

/** El mapa pequeño con el punto que se arrastra (`miniMapa`). */
export const MiniMapa: React.FC<{ lat: number; lng: number; onMover: (lat: number, lng: number) => void }> = ({ lat, lng, onMover }) => {
  const nodo = useRef<HTMLDivElement>(null);
  const alMover = useRef(onMover);
  alMover.current = onMover;
  useEffect(() => {
    if (!nodo.current) return;
    const m = L.map(nodo.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    const pin = L.marker([lat, lng], { draggable: true, title: 'El punto donde llega la ayuda; arrástralo si es otro' }).addTo(m);
    pin.on('dragend', () => {
      const p = pin.getLatLng();
      alMover.current(p.lat, p.lng);
    });
    requestAnimationFrame(() => m.invalidateSize());
    return () => {
      m.remove();
    };
    // Se crea una vez con el punto inicial; el arrastre lo actualiza desde el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={nodo} aria-label="Mapa para ajustar el punto" className="rd-mapa mt-2 min-h-70 flex-1 overflow-hidden rounded-rd-md border border-rd-line bg-rd-mapa" />;
};

/** Fotos: el input de archivo no se rellena desde el estado; la lista vive aparte y la
 *  miniatura es un `objectURL` local (nada sale del navegador en la maqueta). */
export const CampoFotos: React.FC<{ fotos: Foto[]; onAgregar: (fotos: Foto[], pesados: number) => void; onQuitar: (i: number) => void; error?: string | null }> = ({ fotos, onAgregar, onQuitar, error }) => {
  const id = useId();
  const pesoLegible = (b: number) => (b >= 1024 * 1024 ? `${(Math.round((b / 1024 / 1024) * 10) / 10).toString().replace('.', ',')} MB` : `${Math.round(b / 1024)} KB`);
  return (
    <>
      <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-rd-lg border border-dashed px-4 py-6 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rd-navy hover:border-rd-ink-3 ${error ? 'border-rd-coral' : 'border-rd-line'}`}>
        <input
          id={id}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            const archivos = Array.from(e.target.files ?? []);
            const nuevas = archivos.filter((f) => f.size <= TOPE_ARCHIVO).map((f) => ({ nombre: f.name, peso: pesoLegible(f.size), tipo: f.type.startsWith('video') ? ('video' as const) : ('imagen' as const), url: URL.createObjectURL(f) }));
            onAgregar(nuevas, archivos.length - nuevas.length);
            e.target.value = '';
          }}
        />
        <Package aria-hidden="true" className="mb-1 h-5.5 w-5.5 text-rd-ink-3" />
        <span className="text-rd-14 font-semibold text-rd-ink">Elegir fotos o videos</span>
        <span className="text-rd-12-5 text-rd-ink-meta">Desde la galería o la cámara</span>
      </label>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.25 text-rd-12-5 text-rd-coral">
          <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {fotos.length > 0 && (
        <ul className="mt-3 flex list-none flex-col gap-2 p-0">
          {fotos.map((f, i) => (
            <li key={f.url} className="flex items-start gap-3 rounded-rd-md border border-rd-line bg-rd-surface p-2">
              {f.tipo === 'imagen' ? (
                <img src={f.url} alt="" className="h-11 w-11 shrink-0 rounded-rd-sm object-cover" />
              ) : (
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-rd-sm bg-rd-sunken text-rd-ink-2">
                  <Monitor className="h-4.5 w-4.5" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-rd-13 font-medium text-rd-ink">
                {f.nombre}
                <small className="block text-rd-11-5 font-normal text-rd-ink-meta">{f.peso}</small>
              </span>
              <Button nivel="terciario" tamano="sm" className="self-center" onClick={() => onQuitar(i)}>
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/** Una fila de «Revisar» (`rd-contexto`): la clave, el valor y «Cambiar». Toda la fila es
 *  el botón. */
export const FilaRevisar: React.FC<{ clave: string; valor: string; accion?: string; onClick: () => void }> = ({ clave, valor, accion = 'Cambiar', onClick }) => (
  <button type="button" onClick={onClick} className="font-rd mb-4 flex w-full cursor-pointer flex-wrap items-center gap-2 rounded-rd-md border border-rd-line bg-rd-surface p-3 text-left text-rd-13-5 transition-colors hover:border-rd-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy">
    <span className="text-rd-11-5 font-medium text-rd-ink-meta">{clave}</span>
    <span className="min-w-0 font-semibold text-rd-ink">{valor}</span>
    <span className="ml-auto text-rd-13 font-semibold text-rd-navy underline underline-offset-2">{accion}</span>
  </button>
);

/** El bloque «Se solicita» / «Se ofrece» de «Revisar» (`rd-resumen-pub`). */
export const ResumenPub: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <div className="mb-5 rounded-rd-md border border-rd-line bg-rd-surface">
    <div className="font-rd border-b border-rd-line bg-rd-sunken px-3 py-3 text-rd-11-5 font-semibold tracking-wider text-rd-ink-meta uppercase">{titulo}</div>
    {children}
  </div>
);

/** Una fila del resumen (`rd-meta-pub`): nombre, cifra editable, unidad y, debajo, la
 *  fórmula y el detalle. */
export const MetaPub: React.FC<{ item: string; valor: string; unidad: string; onChange?: (v: string) => void; linea?: React.ReactNode; children?: React.ReactNode; error?: string | null; onBlur?: (v: string) => void }> = ({ item, valor, unidad, onChange, linea, children, error, onBlur }) => {
  const { texto, alCambiar, alSalir } = useTexto(valor, onChange ?? (() => {}), onBlur);
  return (
  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-b border-rd-line-soft p-3 last:border-b-0">
    <div className="min-w-0 flex-1 text-rd-13-5 font-semibold text-rd-ink">{item}</div>
    <div className="flex items-center justify-end gap-2">
      {onChange ? (
        <input type="text" inputMode="decimal" value={texto} onChange={(e) => alCambiar(e.target.value)} onBlur={(e) => alSalir(e.target.value)} aria-label={`Cantidad de ${item}, en ${unidad}`} aria-invalid={error ? true : undefined} className={`font-rd h-rd-h-sm w-24 rounded-rd-sm border bg-rd-surface px-2 text-right text-rd-13 font-semibold text-rd-ink tabular-nums focus:border-rd-navy focus:outline-none focus:ring-3 focus:ring-rd-navy-soft ${error ? 'border-rd-coral' : 'border-rd-line'}`} />
      ) : (
        <b className="text-rd-14 tabular-nums">{valor}</b>
      )}
      <span className="max-w-23 truncate text-rd-12-5 font-semibold text-rd-ink-2">{unidad}</span>
    </div>
    {error && <p className="basis-full text-rd-12-5 text-rd-coral">{error}</p>}
    {linea && <div className="basis-full text-rd-11-5 text-rd-ink-meta wrap-anywhere">{linea}</div>}
    {children && <div className="mt-2 basis-full border-t border-dashed border-rd-line pt-2">{children}</div>}
  </div>
  );
};

/** La marca «editada» junto a una cifra que la persona cambió a mano. */
export const MarcaEditada: React.FC = () => (
  <span title="La cambiaste a mano. Al lado va lo que habíamos calculado." className="rounded-full border border-rd-amber-line bg-rd-amber-soft px-1.5 text-rd-10 font-semibold tracking-wide text-rd-amber-ink">
    editada
  </span>
);

/**
 * Una acción de solo icono con su nombre en un globo (Alejandro, 22 de septiembre de 2026). Un
 * icono solo no dice qué hace: en escritorio el nombre aparece al pasar por encima o al llegar
 * con el teclado. Es el `rd-tip` del prototipo (`Producto/css/componentes.css`), portado tal
 * cual: globo arriba con 8 px de aire, tinta sólida, texto blanco de 12 en medium, radio
 * pequeño y la flechita abajo; la flecha se dibuja con el cuadrado girado que ya usa el menú de
 * `Shell.tsx`. El nombre vive en el `aria-label` —no en `title`, que pintaría un segundo globo
 * nativo encima— y el globo va `aria-hidden` para que el lector no lo diga dos veces.
 *
 * Con el dedo no hay «encima»: `hover:` de Tailwind ya sale envuelto en `@media (hover: hover)`,
 * `focus-visible` no se activa al tocar y, por si acaso, el globo se esconde en `pointer-coarse`.
 * Ancho acotado (`w-max max-w-50`): un globo oculto sigue ocupando caja y así fue como la
 * decisión 59 terminó con la lista desplazándose en horizontal.
 */
const AccionExito: React.FC<{ etiqueta: string; onClick: () => void; children: React.ReactNode }> = ({ etiqueta, onClick, children }) => (
  <span className="relative inline-flex">
    <Button nivel="secundario" tamano="md" soloIcono aria-label={etiqueta} onClick={onClick} className="peer">
      {children}
    </Button>
    <span
      aria-hidden="true"
      className="pointer-events-none invisible absolute bottom-full left-1/2 z-2 mb-2 w-max max-w-50 -translate-x-1/2 rounded-rd-sm bg-rd-ink px-2.5 py-2 text-left text-rd-12 leading-snug font-medium text-rd-surface opacity-0 shadow-rd-2 transition-opacity duration-100 after:absolute after:-bottom-1 after:left-1/2 after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:rotate-45 after:bg-rd-ink peer-hover:visible peer-hover:opacity-100 peer-focus-visible:visible peer-focus-visible:opacity-100 pointer-coarse:hidden"
    >
      {etiqueta}
    </span>
  </span>
);

export interface ExitoFlujoProps {
  tipo: 'pedir' | 'ofrecer';
  /** Lo que se acaba de publicar: de aquí salen las sugerencias y las tres acciones. */
  publicacion: Publicacion;
  onVerMapa?: () => void;
  onPanel?: () => void;
  onOtra?: () => void;
  onCerrar?: () => void;
  abre?: string[];
  extra?: React.ReactNode;
}

/**
 * La pantalla de éxito, en dos vistas dentro de la misma ventana (Alejandro, 22 de septiembre
 * de 2026). **Resumen:** el visto, el título, la tarjeta de sugerencias, tres acciones en
 * icono sobre lo publicado, «¿Ahora qué sigue?» como línea de tiempo horizontal y, al final, el
 * botón de publicar otra, centrado. Sin pie. **Sugerencias:** al tocar la tarjeta, la ventana
 * cambia a la lista y lo anterior desaparece; arriba a la izquierda queda el volver y a la
 * derecha la × del marco.
 */
export const ExitoFlujo: React.FC<ExitoFlujoProps> = ({ tipo, publicacion, onVerMapa, onPanel, onOtra, onCerrar, abre, extra }) => {
  const t = EXITO[tipo];
  const avisar = useAviso();
  const cerrarAccion = onCerrar || onVerMapa;
  const [vista, setVista] = useState<'resumen' | 'sugerencias'>('resumen');
  const [buscando, setBuscando] = useState(true);
  const [compromiso, setCompromiso] = useState<Publicacion | null>(null);
  const [hechas, setHechas] = useState<string[]>([]);
  const coincidencias = useMemo(() => coincidenciasDe(publicacion, obtenerPublicaciones()), [publicacion]);
  const fuerte = coincidencias.length > 0 && coincidencias[0].puntaje >= SUGERENCIA_FUERTE;
  useEffect(() => {
    const t = window.setTimeout(() => {
      setBuscando(false);
      if (fuerte) pingSugerencia();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [fuerte]);

  const compartir = () => {
    const url = `${window.location.origin}${RUTAS.radar}?punto=${encodeURIComponent(publicacion.id)}`;
    const listo = () => avisar('Enlace copiado', { tipo: 'ok' });
    if (navigator.share) navigator.share({ title: `${publicacion.titulo}, RaDAR de ayuda`, url }).then(listo).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(listo, listo);
    else listo();
  };

  const lista = (
    <ListaCoincidencias
      publicacion={publicacion}
      coincidencias={coincidencias}
      hechas={hechas}
      onPrimaria={(id) => setCompromiso(obtenerPublicaciones().find((p) => p.id === id) ?? null)}
      onVerEnMapa={(id) => {
        window.location.href = `${RUTAS.radar}?punto=${encodeURIComponent(id)}`;
      }}
    />
  );

  const dialogo = (
    <DialogoCompromiso
      publicacion={compromiso}
      onCerrar={() => setCompromiso(null)}
      onEnviar={(p, c) => {
        setCompromiso(null);
        setHechas((h) => [...h, p.id]);
        avisar(avisoCompromiso(p.org, p.tipo, c), { tipo: 'ok' });
      }}
    />
  );

  if (vista === 'sugerencias') {
    return (
      <div className="mx-auto w-full max-w-140 py-6">
        {/* El volver, en espejo de la × del marco. */}
        <button
          type="button"
          onClick={() => setVista('resumen')}
          className="absolute top-2 left-2 z-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-rd-md bg-rd-surface text-rd-ink-2 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy lg:top-3 lg:left-3 lg:h-10 lg:w-10"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </button>
        {/* La entrada de la diapositiva repite la del resumen —el mismo círculo, el mismo tamaño
            de título— para que al cambiar de vista solo cambie el contenido. El círculo lleva el
            degradado coral → navy de las sugerencias (139), el único sitio donde los dos colores
            de la marca se tocan. */}
        <div className="text-center">
          <span aria-hidden="true" className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br/srgb from-rd-coral to-rd-navy text-white">
            <Radar className="h-7.5 w-7.5" />
          </span>
          <h1 tabIndex={-1} className="font-rd m-0 text-rd-24 leading-tight font-semibold tracking-rd-titulo text-rd-ink text-balance focus:outline-none sm:text-rd-28">
            {t.sugerencias.titulo}
          </h1>
          <p className="mx-auto mt-3 mb-8 max-w-120 text-rd-14 leading-normal text-rd-ink-2">{t.sugerencias.bajada}</p>
        </div>
        {lista}
        {dialogo}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-140 py-6 text-center">
      <Explosion tipo={tipo} />
      <span aria-hidden="true" className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rd-green-soft text-rd-green">
        <Check className="h-7.5 w-7.5" />
      </span>
      <h1 tabIndex={-1} className="font-rd m-0 text-rd-24 leading-tight font-semibold tracking-rd-titulo text-rd-ink text-balance focus:outline-none sm:text-rd-28">
        {t.titulo}
      </h1>

      {/* La tarjeta de sugerencias lleva a la lista, dentro de la misma ventana. */}
      {buscando ? (
        <p role="status" className="mt-6 flex items-center justify-center gap-3 text-rd-13 text-rd-ink-2">
          <span aria-hidden="true" className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rd-line bg-rd-surface">
            <span className="absolute inset-0 bg-conic from-rd-coral/60 to-transparent animate-rd-barrido motion-reduce:hidden" />
            <Radar className="relative h-4.5 w-4.5 text-rd-ink-2" />
          </span>
          Buscando matches…
        </p>
      ) : coincidencias.length > 0 ? (
        <FilaSugerencias n={coincidencias.length} total={(coincidencias as any).total ?? coincidencias.length} variante={fuerte ? 'relleno' : 'suave'} brillo={fuerte} onVer={() => setVista('sugerencias')} className="mt-6" />
      ) : null}

      {/* Tres acciones sobre lo que acabas de publicar, en icono. Nivel 2 (223): cambian de
          pantalla o sacan un enlace, no comprometen a nadie, pero con contorno se leen como
          botones y no como adorno. */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {cerrarAccion && (
          <AccionExito etiqueta="Ver en el mapa" onClick={cerrarAccion}>
            <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
          </AccionExito>
        )}
        <AccionExito etiqueta="Compartir" onClick={compartir}>
          <Share2 aria-hidden="true" className="h-4.5 w-4.5" />
        </AccionExito>
        {onPanel && (
          <AccionExito etiqueta={`Ir a ${nombrePanel()}`} onClick={onPanel}>
            <House aria-hidden="true" className="h-4.5 w-4.5" />
          </AccionExito>
        )}
      </div>

      {abre && abre.length > 0 && (
        <p className="mx-auto mt-4 max-w-110 text-rd-13 text-rd-ink-2">
          En tu panel ya está abierto <b className="font-semibold text-rd-ink">{abre.join(' · ')}</b>.
        </p>
      )}
      {extra}

      {/* Qué sigue: la línea de tiempo, horizontal desde 480 y en columna con el dedo. Separada
          por aire, no por una línea (Alejandro, 22 de septiembre de 2026). */}
      <div className="mt-12">
        {/* Del mismo tamaño que el título de arriba (Alejandro, 22 de septiembre de 2026): son
            los dos tiempos de la pantalla —lo que pasó y lo que viene—, no un título y su
            letra chica. Sigue siendo `h2`: el tamaño no es el nivel. */}
        <h2 className="font-rd m-0 mb-5 text-rd-24 leading-tight font-semibold tracking-rd-titulo text-rd-ink sm:text-rd-28">¿Ahora qué sigue?</h2>
        {/* En columna la lista se centra como bloque (`w-fit mx-auto`): si no, el título va
            centrado y los pasos pegados a la izquierda, y la mirada cambia de eje a media
            pantalla (Alejandro, 22 de septiembre de 2026). */}
        <ol className="m-0 flex list-none flex-col gap-3 p-0 max-xs:mx-auto max-xs:w-fit max-xs:text-left xs:flex-row">
          {t.pasos.map((p, i) => (
            <li key={p.titulo} className="relative flex flex-1 items-center gap-2.5 xs:flex-col xs:gap-2 xs:text-center">
              {/* El hilo entre pasos: vertical en columna, horizontal en fila. */}
              {i > 0 && <span aria-hidden="true" className="absolute max-xs:-top-3.5 max-xs:left-2 max-xs:h-3.5 max-xs:w-px xs:top-2 xs:right-1/2 xs:-left-1/2 xs:ml-3.5 xs:h-px bg-rd-line" />}
              <span aria-hidden="true" className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${p.hecho ? 'bg-rd-green text-white' : 'border border-dashed border-rd-ink-3 bg-rd-surface'}`}>
                {p.hecho && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className={`text-rd-12-5 leading-snug ${p.hecho ? 'font-semibold text-rd-ink' : 'text-rd-ink-2'}`}>{p.titulo}</span>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-4 text-rd-12-5 text-rd-ink-meta">{EXITO.canales}</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {onPanel && (
          <Button nivel="secundario" tamano="lg" onClick={onPanel}>
            Ver en panel
          </Button>
        )}
        {onOtra && (
          <Button nivel="primario" tamano="lg" onClick={onOtra}>
            {t.otra}
          </Button>
        )}
      </div>
      {dialogo}
    </div>
  );
};

/** Desde este puntaje una sugerencia es «fuerte» y merece el barrido y el ping al publicar
 *  (Alejandro, 21 de septiembre de 2026). Con `puntajeCoincidencia` (70–98) se alcanza a menos
 *  de 5 km con dos recursos en común, o a menos de 10 con tres. */
export const SUGERENCIA_FUERTE = 90;

/**
 * Las sugerencias al publicar: la experiencia «Radar Match» de la app real
 * (`components/RadarMatchModal.tsx`), con nuestro cruce y nuestra interfaz. Al publicar una
 * necesidad, las ofertas cercanas que tienen lo que falta; al publicar una oferta, las
 * necesidades cercanas que lo piden. Cada una con su porcentaje, lo que tiene en común y
 * las dos acciones: comprometerse desde aquí mismo o verla en el mapa. Primero «busca» un
 * momento con el barrido del radar de la marca (76); si la mejor sugerencia es fuerte
 * (≥ 90 %), el barrido se detiene sobre ella con un ping corto y la fila de sugerencias brilla
 * una vez; si no, la fila aparece sin más. Sin sugerencias, lo dice sin drama.
 */


/** Aviso corto en línea con icono (`rd-aviso` de flujo). */
export const AvisoLinea: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`flex items-start gap-2 text-rd-12-5 text-rd-ink-meta ${className}`}>
    <Info aria-hidden="true" className="mt-0.5 h-3.75 w-3.75 shrink-0 text-rd-ink-3" />
    <span>{children}</span>
  </p>
);

/** Ayuda para el nombre de la categoría de un recurso. */
export function nombreCategoria(item: string): string {
  return categoriaDe(item)?.nombre ?? '';
}

export { cifra };
