import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, ChevronDown, ChevronLeft, CircleAlert, CircleDashed, Info, Monitor, Package, Search, X, Zap } from 'lucide-react';
import { ListaCoincidencias } from '../../components/ui/Coincidencias';
import { DialogoCompromiso } from '../../components/ui/DialogoCompromiso';
import { useAviso } from '../../components/ui/AvisoCorto';
import { RUTAS } from '../../mocks/cuentasMock';
import { PUBLICACIONES } from '../../mocks/publicacionesMock';
import type { Publicacion } from '../../types/publicacion';
import { coincidenciasDe } from '../../utils/cruce';
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
  isModal?: boolean;
  children: React.ReactNode;
}

/** El marco: la ventana del flujo (a ≥ 1024, una tarjeta de 680 centrada sobre el fondo,
 *  como el modal del prototipo; bajo 1024, la pantalla entera), el progreso fijo arriba,
 *  el cuerpo que desplaza y el pie fijo abajo. Al cambiar de paso el foco va al `h1`. */
export const MarcoFlujo: React.FC<MarcoFlujoProps> = ({ nombre, fases, camino, sub, publicado, listo, textoPublicar, onIrAFase, onIrA, onAtras, onSiguiente, onPublicar, onCerrar, isModal = false, children }) => {
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

  return (
    <div className={isModal ? "fixed inset-0 z-50 flex items-center justify-center bg-rd-ink/60 backdrop-blur-xs p-0 lg:p-6 font-rd text-rd-ink overflow-y-auto" : "font-rd min-h-dvh bg-rd-fondo text-rd-ink lg:flex lg:h-dvh lg:items-stretch lg:justify-center lg:bg-transparent lg:py-6"}>
      {escritorio && !isModal && (
        <div aria-hidden="true" inert className="fixed inset-0 -z-1 overflow-hidden">
          <RadarPage />
          {/* Por encima de las capas de Leaflet (llegan a 1000). */}
          <div className="absolute inset-0 z-2000 bg-rd-ink/50" />
        </div>
      )}
      <section aria-label={nombre} className="relative flex h-dvh w-full flex-col bg-rd-surface lg:h-auto lg:max-h-full lg:max-w-170 lg:rounded-rd-xl lg:border lg:border-rd-line lg:shadow-rd-2">
        <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute top-2 right-2 z-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-rd-md bg-rd-surface text-rd-ink-2 hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy lg:top-3 lg:right-3 lg:h-10 lg:w-10">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        {/* La pantalla de éxito: `justify-center-safe` centra lo corto y, si el contenido es más
            alto que la caja, empieza arriba (con `justify-center` a secas el desborde se
            repartía y el título quedaba recortado sin poder llegar a él). */}
        {publicado ? (
          <div ref={cuerpo} className="flex min-h-0 flex-1 flex-col justify-center-safe overflow-y-auto px-4 py-6 sm:px-6">
            {children}
          </div>
        ) : (
          <>
            <div className="flex-none px-4 pt-5 pr-14 sm:px-6 sm:pr-16">
              <Stepper fases={fases} faseActual={sub.paso} tramos={tramos.map((t, j) => ({ nombre: t.nombre, hecho: j < idx, actual: j === idx }))} onIrAFase={onIrAFase} onIrATramo={(j) => onIrA(tramos[j].id)} className="mb-0 pb-5" />
            </div>
            <div ref={cuerpo} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-5 sm:px-6">
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

/** La pantalla de éxito del flujo, con «Qué pasa ahora». */
export const ExitoFlujo: React.FC<{ tipo: 'pedir' | 'ofrecer'; extra?: React.ReactNode; abre?: string[]; onPanel?: () => void; onVerMapa: () => void; onOtra: () => void }> = ({ tipo, extra, abre, onPanel, onVerMapa, onOtra }) => {
  const t = EXITO[tipo];
  return (
    <div className="py-6 text-center">
      <span aria-hidden="true" className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rd-green-soft text-rd-green">
        <Check className="h-7.5 w-7.5" />
      </span>
      <h1 tabIndex={-1} className="font-rd mb-2 text-rd-24 leading-tight font-semibold tracking-rd-titulo text-rd-ink text-balance focus:outline-none sm:text-rd-28">
        {t.titulo}
      </h1>
      <p className="mb-5 text-rd-14 text-rd-ink-2">{t.sub}</p>
      <div className="mx-auto mt-5 max-w-110 rounded-rd-lg border border-rd-line bg-rd-fondo p-4 text-left">
        <h2 className="font-rd mb-3 text-rd-13 font-semibold tracking-wide text-rd-ink-meta uppercase">Qué pasa ahora</h2>
        {t.pasos.map((p, i) => (
          <div key={p.titulo} className={`flex items-start gap-3 py-2.5 ${i ? 'border-t border-rd-line-soft' : 'pt-0'}`}>
            {p.hecho ? <Check aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-green" /> : <CircleDashed aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-ink-3" />}
            <span className="text-rd-12-5 leading-relaxed text-rd-ink-2">
              <b className="block text-rd-13-5 font-semibold text-rd-ink">{p.titulo}</b>
              {p.texto}
            </span>
          </div>
        ))}
        <p className="mt-3 border-t border-rd-line-soft pt-3 text-rd-12-5 text-rd-ink-2">{EXITO.canales}</p>
      </div>
      {extra}
      {abre && abre.length > 0 && (
        <p className="mx-auto mt-4 max-w-110 text-rd-13 text-rd-ink-2">
          En tu panel ya está abierto <b className="font-semibold text-rd-ink">{abre.join(' · ')}</b>.{' '}
          {onPanel && (
            <button type="button" onClick={onPanel} className="font-rd cursor-pointer font-semibold text-rd-navy underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-navy">
              Ir a {nombrePanel()}
            </button>
          )}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button nivel="primario" tamano="md" onClick={onVerMapa}>
          Ver en el mapa
        </Button>
        <Button nivel="secundario" tamano="md" onClick={onOtra}>
          {t.otra}
        </Button>
      </div>
    </div>
  );
};

/**
 * Las coincidencias al publicar: la experiencia «Radar Match» de la app real
 * (`components/RadarMatchModal.tsx`), con nuestro cruce y nuestra interfaz. Al publicar una
 * necesidad, las ofertas cercanas que tienen lo que falta; al publicar una oferta, las
 * necesidades cercanas que lo piden. Cada una con su porcentaje, lo que tiene en común y
 * las dos acciones: comprometerse desde aquí mismo o verla en el mapa. Primero «busca» un
 * momento, como en producción; sin coincidencias, lo dice sin drama.
 */
export const Coincidencias: React.FC<{ publicacion: Publicacion }> = ({ publicacion }) => {
  const avisar = useAviso();
  const [buscando, setBuscando] = useState(true);
  const [compromiso, setCompromiso] = useState<Publicacion | null>(null);
  const [hechas, setHechas] = useState<string[]>([]);
  const coincidencias = useMemo(() => coincidenciasDe(publicacion, PUBLICACIONES), [publicacion]);
  useEffect(() => {
    const t = window.setTimeout(() => setBuscando(false), 900);
    return () => window.clearTimeout(t);
  }, []);
  const pide = publicacion.tipo === 'necesidad';
  return (
    <section aria-label="Coincidencias" className="mx-auto mt-5 max-w-110 text-left">
      <h2 className="font-rd mb-1 flex items-center gap-2 text-rd-16 font-semibold tracking-rd-titulo text-rd-ink">
        <Zap aria-hidden="true" className="h-4.5 w-4.5 text-rd-navy" />
        Coincidencias cerca
        {!buscando && coincidencias.length > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-sunken px-1.5 text-rd-11-5 font-semibold text-rd-ink-2 tabular-nums">{coincidencias.length}</span>}
      </h2>
      <p className="mb-3 text-rd-13 text-rd-ink-2">{pide ? 'Ofertas a menos de 20 km que tienen algo de lo que te falta.' : 'Necesidades a menos de 20 km que piden algo de lo que ofreces.'}</p>
      {buscando ? (
        <p role="status" className="flex items-center gap-2 rounded-rd-lg border border-rd-line bg-rd-fondo px-4 py-5 text-rd-13 text-rd-ink-2">
          <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-rd-line border-t-rd-navy" />
          Buscando coincidencias cerca…
        </p>
      ) : (
        <ListaCoincidencias publicacion={publicacion} coincidencias={coincidencias} hechas={hechas} onPrimaria={(id) => setCompromiso(PUBLICACIONES.find((p) => p.id === id) ?? null)} onVerEnMapa={(id) => { window.location.href = `${RUTAS.radar}?punto=${encodeURIComponent(id)}`; }} />
      )}
      <DialogoCompromiso
        publicacion={compromiso}
        onCerrar={() => setCompromiso(null)}
        onEnviar={(p, c) => {
          setCompromiso(null);
          setHechas((h) => [...h, p.id]);
          const cant = c.partes ? c.partes.length : (c.recursos ?? 1);
          const n = `${cant} ${cant === 1 ? 'recurso' : 'recursos'}`;
          const cuandoTxt = c.cuando ? ` · ${c.cuando.toLowerCase()}` : '';
          avisar(p.tipo === 'necesidad' ? `Compromiso enviado a ${p.org} · ${n}${cuandoTxt}` : `Solicitud enviada a ${p.org} · ${n}`, { tipo: 'ok' });
        }}
      />
    </section>
  );
};

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
