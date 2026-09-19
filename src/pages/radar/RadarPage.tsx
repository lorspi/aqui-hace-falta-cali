import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Funnel, Hand, HeartHandshake, List, Map as MapIcon, Search } from 'lucide-react';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { DialogoCompromiso, type Compromiso } from '../../components/ui/DialogoCompromiso';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { HojaFiltros } from '../../components/ui/HojaFiltros';
import { HojaPin } from '../../components/ui/HojaPin';
import { Segmented } from '../../components/ui/Segmented';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { PUBLICACIONES, UBICACION } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { Publicacion, TipoPublicacion } from '../../types/publicacion';
import { coincidenciasDe } from '../../utils/cruce';
import { DialogoCoincidencias } from '../../components/ui/Coincidencias';
import { chipsDe, cuantosAplicados, filtrosVacios, ordenar, pasa, pasaResto, type Filtros } from '../../utils/filtros';
import { nombrePanel } from '../../utils/cuenta';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { distanciaKm } from '../../utils/publicaciones';
import { MapaRadar } from './MapaRadar';

/**
 * La Radar (mockup/*): la portada con sesión del prototipo (`plantilla.html`). Cabecera con
 * el título, las dos acciones y la campana; la barra de consulta (Todo · Necesidades ·
 * Ofertas con sus conteos, Filtros con su hoja, los chips de lo aplicado, buscar); y el
 * espacio mapa + lista: 7 + 5 columnas desde 1024, 8 + 4 desde 1280 (22b: el mapa hasta el
 * borde), y bajo 1024 una sola vista a la vez, Mapa o Lista, con el conmutador flotante
 * sobre la píldora y la hoja del pin al tocar un pin. Lo que pasa al tocar una tarjeta
 * (`acciones.js`): Quiero ayudar / Solicitar abre el compromiso, ⋮ comparte o reporta, y
 * «Ver quién ofrece / lo necesita» resalta en el mapa. `?punto=<id>` abre esa publicación
 * (es el enlace que se comparte). Todo sale de los mocks; los conteos se calculan.
 */
type Tipo = 'todo' | TipoPublicacion;
type Vista = 'mapa' | 'lista';

const RUTA_RADAR = RUTAS.radar;

/** Solo bajo 1024 existe la hoja del pin. */
function esMovil(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

/** El enlace de una publicación: la Radar con `?punto=`. */
function enlaceDe(id: string): string {
  return `${window.location.origin}${RUTA_RADAR}?punto=${encodeURIComponent(id)}`;
}

/** El `?punto=<id>` de la URL, solo si existe. */
function puntoPedido(): string | null {
  const id = new URLSearchParams(window.location.search).get('punto');
  return id && PUBLICACIONES.some((p) => p.id === id) ? id : null;
}

/** `?buscar=<texto>`: la Radar abre con ese texto en el buscador (el Directorio manda aquí con
 *  el nombre de la organización, para ver todo lo suyo en el mapa). */
function busquedaPedida(): string {
  return new URLSearchParams(window.location.search).get('buscar')?.trim() ?? '';
}

function irA(ruta: string): void {
  window.location.href = ruta;
}

export const RadarPage: React.FC = () => (
  <AvisosProvider>
    <Radar />
  </AvisosProvider>
);

const Radar: React.FC = () => {
  const avisar = useAviso();
  const [tipo, setTipo] = useState<Tipo>('todo');
  /* El chip inicial es la zona de la persona, «Tu zona · Usme» (plan T2, 2.4): un filtro común
     que se quita como cualquiera. Si la URL trae un `?punto=` que existe, el enlace manda y no
     se preselecciona. */
  const [filtros, setFiltros] = useState<Filtros>(() => (puntoPedido() || busquedaPedida() ? filtrosVacios() : { ...filtrosVacios(), lugares: [UBICACION.zona] }));
  const [hojaFiltros, setHojaFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState(busquedaPedida);
  const [buscando, setBuscando] = useState(() => busquedaPedida() !== '');
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [encuadrar, setEncuadrarEstado] = useState<{ id: string; n: number } | null>(null);
  const setEncuadrar = (id: string) => setEncuadrarEstado((e) => ({ id, n: (e?.n ?? 0) + 1 }));
  const [resaltadas, setResaltadas] = useState<{ ids: string[]; n: number } | null>(null);
  const [hojaPin, setHojaPin] = useState<{ id: string; expandida: boolean; cerrando?: boolean } | null>(null);
  const cierreHoja = useRef<number | undefined>(undefined);
  const [vista, setVista] = useState<Vista>('mapa');
  const [cajon, setCajon] = useState(false);
  const [movil, setMovil] = useState(esMovil);
  const [compromiso, setCompromiso] = useState<Publicacion | null>(null);
  const [reporte, setReporte] = useState<string | null>(null);
  const [enProceso, setEnProceso] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'RaDAR · Radar';
    const mq = window.matchMedia('(max-width: 1023px)');
    const alCambiar = () => setMovil(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  /* Los tres conteos cuentan, por tipo, lo que pasa todos los demás filtros. */
  const conteo = useMemo(() => {
    const resto = PUBLICACIONES.filter((p) => pasaResto(p, filtros, UBICACION, busqueda));
    return { todo: resto.length, necesidad: resto.filter((p) => p.tipo === 'necesidad').length, oferta: resto.filter((p) => p.tipo === 'oferta').length };
  }, [filtros, busqueda]);

  const visibles = useMemo(() => ordenar(PUBLICACIONES.filter((p) => pasa(p, tipo, filtros, UBICACION, busqueda)), filtros.orden, UBICACION), [tipo, filtros, busqueda]);

  const distancias = useMemo(() => new Map(PUBLICACIONES.map((p) => [p.id, distanciaKm(UBICACION, p)])), []);
  const coincidencias = useMemo(() => new Map(PUBLICACIONES.map((p) => [p.id, coincidenciasDe(p, PUBLICACIONES)])), []);
  const [verCoincidencias, setVerCoincidencias] = useState<string | null>(null);
  const chips = chipsDe(filtros, UBICACION.zona);
  const aplicados = cuantosAplicados(filtros);

  /* Seleccionar desde el mapa trae la tarjeta a la vista (y, en móvil, abre la hoja
     colapsada); desde la tarjeta, encuadra el pin. */
  const seleccionarDesdeMapa = useCallback((id: string) => {
    setSeleccionada(id);
    if (esMovil()) {
      window.clearTimeout(cierreHoja.current);
      setHojaPin((h) => ({ id, expandida: h?.expandida ?? false }));
      setEncuadrar(id);
      return;
    }
    listaRef.current?.querySelector<HTMLElement>(`[data-punto="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);
  const verEnMapa = (id: string) => {
    setSeleccionada(id);
    setEncuadrar(id);
    setVista('mapa');
    if (esMovil()) setHojaPin({ id, expandida: false });
  };
  /* Cerrar desliza la hoja hacia abajo (300 ms) y solo entonces la desmonta. */
  const cerrarHojaPin = useCallback(() => {
    setHojaPin((h) => (h ? { ...h, cerrando: true } : h));
    window.clearTimeout(cierreHoja.current);
    cierreHoja.current = window.setTimeout(() => {
      setHojaPin(null);
      setSeleccionada(null);
    }, 300);
  }, []);
  const limpiar = () => {
    setTipo('todo');
    setFiltros(filtrosVacios());
    setBusqueda('');
  };

  /* `?punto=<id>`: la publicación compartida abre encuadrada; bajo 1024, con su hoja. */
  useEffect(() => {
    const id = puntoPedido();
    if (!id) return;
    setSeleccionada(id);
    setEncuadrar(id);
    if (esMovil()) setHojaPin({ id, expandida: false });
    else requestAnimationFrame(() => listaRef.current?.querySelector<HTMLElement>(`[data-punto="${id}"]`)?.scrollIntoView({ block: 'nearest' }));
  }, []);

  /* --- lo que pasa al tocar una tarjeta (`acciones.js`) --- */
  const abrirCompromiso = (id: string) => setCompromiso(PUBLICACIONES.find((p) => p.id === id) ?? null);
  const enviarCompromiso = (p: Publicacion, c: Compromiso) => {
    setCompromiso(null);
    setEnProceso((ids) => (ids.includes(p.id) ? ids : [...ids, p.id]));
    const n = `${c.recursos} ${c.recursos === 1 ? 'recurso' : 'recursos'}`;
    avisar(p.tipo === 'necesidad' ? `Compromiso enviado a ${p.org} · ${n} · ${c.cuando.toLowerCase()}` : `Solicitud enviada a ${p.org} · ${n}`, { tipo: 'ok' });
  };
  const compartir = (id: string) => {
    const url = enlaceDe(id);
    const listo = () => avisar('Enlace copiado', { tipo: 'ok' });
    if (navigator.share) navigator.share({ title: 'RaDAR de ayuda', url }).then(listo).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(listo, listo);
    else listo();
  };
  const enviarReporte = () => {
    setReporte(null);
    avisar('Reporte enviado. Lo revisa el equipo de moderación.', { tipo: 'ok' });
  };
  /* Las coincidencias de una publicación se abren en su diálogo; desde ahí, «Ver en el mapa»
     resalta ese pin y lo encuadra, y la primaria abre el compromiso con esa organización. */
  const verEnMapaDesdeCoincidencias = (id: string) => {
    setVerCoincidencias(null);
    setResaltadas((r) => ({ ids: [id], n: (r?.n ?? 0) + 1 }));
    verEnMapa(id);
  };

  /* --- la campana --- */
  const leerTodos = () => setAvisos((lista) => lista.map((a) => ({ ...a, leido: true })));
  const accionDeAviso = (a: Aviso) => {
    setAvisos((lista) => lista.map((x) => (x.id === a.id ? { ...x, leido: true } : x)));
    if (!a.accion) return;
    if (a.accion.al === 'confirmar') avisar(`Confirmaste lo que llegó de ${a.quien}`, { tipo: 'ok' });
    else if (a.accion.al === 'revalidar') avisar('Tu necesidad sigue arriba en el mapa', { tipo: 'ok' });
    else irA(a.accion.al);
  };

  const estado = `${visibles.length} ${visibles.length === 1 ? 'publicación' : 'publicaciones'}`;
  const publicacionHoja = hojaPin ? PUBLICACIONES.find((p) => p.id === hojaPin.id) : undefined;
  /* Del carrusel de la hoja: la nueva publicación queda seleccionada, señalada en el mapa y
     la hoja conserva su altura. */
  const irDesdeHoja = (id: string) => {
    setSeleccionada(id);
    setHojaPin((h) => ({ id, expandida: h?.expandida ?? false }));
    setEncuadrar(id);
  };
  /* La hoja abre a media pantalla: eso tapa el mapa desde abajo. */
  const tapadoAbajo = hojaPin && typeof window !== 'undefined' ? Math.round(window.innerHeight / 2) : 0;
  const sinLeer = avisos.filter((a) => !a.leido).length;
  const accionesTarjeta = { onPrimaria: abrirCompromiso, onVerCoincidencias: setVerCoincidencias, onCompartir: compartir, onReportar: setReporte };

  return (
    <Shell seccion="radar" panelNombre={nombrePanel()} cuenta={CUENTA} pendientes={pendientesCuenta(modulosGuardados(), { sol: SOLICITUDES, recibidas: RECIBIDAS })} avisosNuevos={sinLeer} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
      <div className="flex h-full min-h-0 flex-col max-lg:h-dvh">
        {/* ---- cabecera ---- */}
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="font-rd m-0 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink">Radar</h1>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 lg:flex">
              {/* Desde 1024 el conmutador vive en la cabecera: Mapa (con la lista al lado) o Lista a lo ancho. */}
              <div role="group" aria-label="Vista" className="inline-flex rounded-rd-lg border border-rd-line bg-rd-sunken p-0.75">
                <VistaBtn actual={vista === 'mapa'} onClick={() => setVista('mapa')} etiqueta="Mapa" icono={<MapIcon className="h-5 w-5" />} />
                <VistaBtn actual={vista === 'lista'} onClick={() => setVista('lista')} etiqueta="Lista" icono={<List className="h-5 w-5" />} />
              </div>
              <span aria-hidden="true" className="mx-1 h-6 w-px bg-rd-line" />
              <Button nivel="pedir" tamano="md" icono={<Hand className="h-4 w-4" />} onClick={() => irA(RUTAS.pedir)}>
                Pedir ayuda
              </Button>
              <Button nivel="primario" tamano="md" icono={<HeartHandshake className="h-4 w-4" />} onClick={() => irA(RUTAS.ofrecer)}>
                Ofrecer ayuda
              </Button>
              <span aria-hidden="true" className="mx-1 h-6 w-px bg-rd-line" />
              <CampanaAvisos avisos={avisos} rutaAvisos={RUTAS_SHELL.avisos} onLeerTodos={leerTodos} onAccion={accionDeAviso} />
            </span>
            <button
              type="button"
              onClick={() => setBuscando((b) => !b)}
              aria-label="Buscar"
              aria-expanded={buscando}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink pointer-coarse:h-11 pointer-coarse:w-11 focus-visible:outline-2 focus-visible:outline-rd-navy lg:hidden"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </button>
            <BotonMenu onClick={() => setCajon(true)} abierto={cajon} />
          </span>
        </header>

        {/* ---- consulta ---- */}
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line bg-rd-surface px-4 py-2 max-lg:gap-2 sm:px-6 lg:px-8">
          <Segmented<Tipo>
            etiquetaGrupo="Qué quieres ver"
            valor={tipo}
            onChange={setTipo}
            className="max-lg:w-full max-lg:overflow-x-auto"
            opciones={[
              { id: 'todo', etiqueta: 'Todo', n: conteo.todo },
              { id: 'necesidad', etiqueta: 'Necesidades', n: conteo.necesidad, pip: 'necesidad' },
              { id: 'oferta', etiqueta: 'Ofertas', n: conteo.oferta, pip: 'oferta' },
            ]}
          />
          <span aria-hidden="true" className="h-6 w-px flex-none bg-rd-line max-lg:hidden" />
          <BotonFiltros aplicados={aplicados} abierta={hojaFiltros} onClick={() => setHojaFiltros(true)} />
          <p id="rd-consulta-estado" aria-live="polite" aria-atomic="true" className="sr-only">
            {estado}
          </p>
          {chips.length > 0 && (
            <ZonaChips>
              {chips.map((c) => (
                <ChipAplicado key={c.clave} texto={c.texto} onQuitar={() => setFiltros(c.quitar(filtros))} />
              ))}
              <QuitarTodos onClick={() => setFiltros(filtrosVacios())} />
            </ZonaChips>
          )}
          <CampoBuscar valor={busqueda} onChange={setBusqueda} placeholder="Buscar recurso, barrio u organización" abierto={buscando} />
        </div>

        {/* ---- mapa + lista ---- */}
        <div className="grid min-h-0 flex-1 grid-cols-12 max-lg:flex max-lg:flex-col">
          <MapaRadar
            publicaciones={visibles}
            ubicacion={UBICACION}
            seleccionada={seleccionada}
            onSeleccionar={seleccionarDesdeMapa}
            encuadrar={encuadrar}
            tapadoAbajo={tapadoAbajo}
            resaltadas={resaltadas}
            className={`relative isolate z-0 col-span-7 min-h-0 xl:col-span-8 max-lg:min-h-0 max-lg:flex-1 ${vista === 'lista' ? 'hidden' : ''}`}
          />
          {/* Lista: al lado del mapa (5 · 4 columnas) o, con el conmutador en «Lista», a lo ancho
              y en cuadrícula de tarjetas (2 columnas desde 1024, 3 desde 1280). */}
          <div className={`flex min-h-0 flex-col max-lg:flex-1 ${vista === 'lista' ? 'col-span-12' : 'col-span-5 border-l border-rd-line xl:col-span-4 max-lg:border-l-0 max-lg:hidden'}`}>
            <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* «Lista» a lo ancho: las mismas tarjetas, en cuadrícula (2 columnas desde 1024, 3
                desde 1280), todas de la altura de su fila y con las acciones pegadas abajo. */}
            <div className={vista === 'lista' && !movil ? 'grid grid-cols-2 items-stretch gap-4 xl:grid-cols-3 xl:gap-6' : 'flex flex-col gap-3'}>
              {visibles.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-2 px-4 py-8 text-center text-rd-ink-2">
                  <span aria-hidden="true" className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-rd-sunken text-rd-ink-3">
                    <Funnel className="h-6.5 w-6.5" />
                  </span>
                  <h3 className="font-rd m-0 text-rd-15 font-semibold text-rd-ink">Nada con estos filtros</h3>
                  <p className="m-0 max-w-90 text-rd-13-5 leading-normal">Prueba con menos filtros o una distancia mayor.</p>
                  <Button nivel="secundario" tamano="md" className="mt-3" onClick={limpiar}>
                    Quitar los filtros
                  </Button>
                </div>
              ) : (
                visibles.map((p: Publicacion) => (
                  <Tarjeta key={p.id} publicacion={p} distanciaKm={distancias.get(p.id)} coincidencias={coincidencias.get(p.id)} seleccionada={p.id === seleccionada} enProceso={enProceso.includes(p.id)} onSeleccionar={setSeleccionada} onVerEnMapa={verEnMapa} {...accionesTarjeta} />
                ))
              )}
            </div>
            </div>
          </div>
        </div>

        {/* ---- Mapa | Lista (solo < 1024) ---- */}
        {(!hojaPin || hojaPin.cerrando) && (
          <div role="group" aria-label="Vista" className="fixed bottom-20 left-1/2 z-780 inline-flex -translate-x-1/2 rounded-rd-lg border border-rd-line bg-rd-sunken p-0.75 shadow-rd-2 lg:hidden">
            <VistaBtn actual={vista === 'mapa'} onClick={() => setVista('mapa')} etiqueta="Mapa" icono={<MapIcon className="h-5 w-5" />} />
            <VistaBtn actual={vista === 'lista'} onClick={() => setVista('lista')} etiqueta="Lista" icono={<List className="h-5 w-5" />} />
          </div>
        )}

        {publicacionHoja && hojaPin && (
          <HojaPin publicacion={publicacionHoja} vecinas={visibles} distancias={distancias} coincidencias={coincidencias} enProceso={enProceso.includes(publicacionHoja.id)} expandida={hojaPin.expandida} cerrando={hojaPin.cerrando} onExpandir={(e) => setHojaPin({ id: hojaPin.id, expandida: e })} onCerrar={cerrarHojaPin} onIr={irDesdeHoja} {...accionesTarjeta} />
        )}

        <HojaFiltros abierta={hojaFiltros} filtros={filtros} onCambiar={setFiltros} onCerrar={() => setHojaFiltros(false)} publicaciones={PUBLICACIONES} resultados={visibles.length} zonaPropia={UBICACION.zona} />
        <DialogoCompromiso publicacion={compromiso} onCerrar={() => setCompromiso(null)} onEnviar={enviarCompromiso} />
        {(() => {
          const pub = verCoincidencias ? PUBLICACIONES.find((p) => p.id === verCoincidencias) : undefined;
          return pub ? <DialogoCoincidencias abierto publicacion={pub} coincidencias={coincidencias.get(pub.id) ?? []} hechas={enProceso} onCerrar={() => setVerCoincidencias(null)} onPrimaria={(id) => { setVerCoincidencias(null); abrirCompromiso(id); }} onVerEnMapa={verEnMapaDesdeCoincidencias} /> : null;
        })()}
        <DialogoReporte abierto={reporte !== null} onCerrar={() => setReporte(null)} onEnviar={enviarReporte} />
      </div>
    </Shell>
  );
};

/**
 * La zona de chips de la consulta (`rd-consulta__chips`): una sola fila que se desplaza, con
 * el borde derecho desvanecido. Bajo 1024, si hay chips fuera de la vista aparece el › (44),
 * que vive fuera del contenedor de scroll y desplaza hasta el final; al llegar, se oculta.
 */
const VistaBtn: React.FC<{ actual: boolean; onClick: () => void; etiqueta: string; icono: React.ReactNode }> = ({ actual, onClick, etiqueta, icono }) => (
  <button
    type="button"
    aria-pressed={actual}
    aria-label={etiqueta}
    onClick={onClick}
    className={`inline-flex h-rd-h-sm w-11 cursor-pointer items-center justify-center rounded-rd-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy ${actual ? 'bg-rd-surface text-rd-ink shadow-xs' : 'text-rd-ink-2'}`}
  >
    {icono}
  </button>
);
