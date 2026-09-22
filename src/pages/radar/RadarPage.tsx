import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Flag, Funnel, Hand, HeartHandshake, List, Map as MapIcon, Search, Share2, X, Zap } from 'lucide-react';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { DialogoCompromiso, type Compromiso } from '../../components/ui/DialogoCompromiso';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from '../../components/ui/Etiqueta';
import { Donde } from '../../components/ui/Donde';
import { HojaFiltros } from '../../components/ui/HojaFiltros';
import { HojaPin } from '../../components/ui/HojaPin';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Segmented } from '../../components/ui/Segmented';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Vacio } from '../../components/ui/Vacio';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { PUBLICACIONES, UBICACION, obtenerPublicaciones } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { Publicacion, TipoPublicacion } from '../../types/publicacion';
import { coincidenciasDe, type CoincidenciaPublicacion } from '../../utils/cruce';
import { DialogoCoincidencias } from '../../components/ui/Coincidencias';
import { chipsDe, cuantosAplicados, filtrosVacios, ordenar, pasa, pasaResto, type Filtros } from '../../utils/filtros';
import { nombrePanel } from '../../utils/cuenta';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { Anillo } from '../../components/ui/Recursos';
import { actorPublicacion, distanciaKm, distanciaTexto, estadoPublicacion, estadoRecurso, iniciales, restante, tituloPublicacion } from '../../utils/publicaciones';
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
  const todas = obtenerPublicaciones();
  return id && todas.some((p) => p.id === id) ? id : null;
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
  const [todasLasPubs] = useState<Publicacion[]>(obtenerPublicaciones);
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
    const resto = todasLasPubs.filter((p) => pasaResto(p, filtros, UBICACION, busqueda));
    return { todo: resto.length, necesidad: resto.filter((p) => p.tipo === 'necesidad').length, oferta: resto.filter((p) => p.tipo === 'oferta').length };
  }, [filtros, busqueda, todasLasPubs]);

  const visibles = useMemo(() => ordenar(todasLasPubs.filter((p) => pasa(p, tipo, filtros, UBICACION, busqueda)), filtros.orden, UBICACION), [tipo, filtros, busqueda, todasLasPubs]);

  const distancias = useMemo(() => new Map(todasLasPubs.map((p) => [p.id, distanciaKm(UBICACION, p)])), [todasLasPubs]);
  const coincidencias = useMemo(() => new Map(todasLasPubs.map((p) => [p.id, coincidenciasDe(p, todasLasPubs)])), [todasLasPubs]);
  const [verCoincidencias, setVerCoincidencias] = useState<string | null>(null);
  const chips = chipsDe(filtros, UBICACION.zona);
  const aplicados = cuantosAplicados(filtros);
  const ordenTexto = filtros.orden === 'cerca' ? 'Ordenadas por cercanía' : filtros.orden === 'reciente' ? 'Ordenadas por más recientes' : 'Ordenadas por donde más falta';

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
  const abrirCompromiso = (id: string) => setCompromiso(todasLasPubs.find((p) => p.id === id) ?? null);
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

  /* Del carrusel de la hoja: la nueva publicación queda seleccionada, señalada en el mapa y
     la hoja conserva su altura. */
  const irDesdeHoja = (id: string) => {
    setSeleccionada(id);
    setHojaPin((h) => ({ id, expandida: h?.expandida ?? false }));
  };
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const publicacionDetalle = detalleId ? todasLasPubs.find((p) => p.id === detalleId) : undefined;
  const conteoTexto = (n: number, t: Tipo) => {
    if (t === 'necesidad') return `${n} ${n === 1 ? 'necesidad' : 'necesidades'}`;
    if (t === 'oferta') return `${n} ${n === 1 ? 'oferta' : 'ofertas'}`;
    return `${n} ${n === 1 ? 'publicación' : 'publicaciones'}`;
  };
  const estado = conteoTexto(visibles.length, tipo);
  const accionesTarjeta = {
    onPrimaria: abrirCompromiso,
    onCompartir: compartir,
    onReportar: (id: string) => setReporte(id),
    onVerCoincidencias: (id: string) => setVerCoincidencias(id),
  };
  const sinLeer = avisos.filter((a) => !a.leido).length;
  const publicacionHoja = hojaPin ? todasLasPubs.find((p) => p.id === hojaPin.id) : undefined;
  /* El mapa se tapará abajo según la altura de la hoja colapsada (para centrar el pin). */
  const tapadoAbajo = movil && hojaPin && !hojaPin.expandida && !hojaPin.cerrando ? 260 : 0;

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
          <CampoBuscar
            valor={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar recurso, barrio u organización"
            abierto={buscando}
            className="lg:w-72 xl:w-96"
          />
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
        </div>

        {/* ---- mapa + lista ---- */}
        {vista === 'lista' ? (
          <main
            role="region"
            aria-label="Lista de publicaciones"
            className="min-h-0 flex-1 overflow-y-auto bg-rd-fondo px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6"
          >
            {visibles.length === 0 ? (
              <Vacio
                icono={<Funnel className="h-6.5 w-6.5" />}
                titulo="Nada con estos filtros"
                texto="Prueba con menos filtros o una distancia mayor."
                accion={
                  <Button nivel="secundario" tamano="md" onClick={limpiar}>
                    Quitar los filtros
                  </Button>
                }
              />
            ) : (
              <>
                <p className="m-0 mb-3 flex flex-wrap items-baseline gap-x-2 text-rd-12-5 text-rd-ink-meta">
                  <b className="font-semibold text-rd-ink">{estado}</b>
                  <span>{ordenTexto}</span>
                </p>
                <div className="overflow-hidden rounded-rd-xl border border-rd-line bg-rd-surface shadow-xs divide-y divide-rd-line">
                  {/* Cabecera de columnas para escritorio (≥ 1280px) */}
                  <div className="hidden border-b border-rd-line bg-rd-sunken/40 px-5 py-3.5 sm:px-7 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_auto] xl:items-center xl:gap-8">
                    <span className="text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                      Publicación y organización
                    </span>
                    <span className="text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                      Recursos
                    </span>
                    <span className="text-right text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                      Acciones
                    </span>
                  </div>
                  {visibles.map((p: Publicacion) => (
                    <FilaPublicacion
                      key={p.id}
                      publicacion={p}
                      distanciaKm={distancias.get(p.id)}
                      coincidencias={coincidencias.get(p.id)}
                      enProceso={enProceso.includes(p.id)}
                      onVerDetalle={(id) => setDetalleId(id)}
                      onVerEnMapa={verEnMapa}
                      {...accionesTarjeta}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-12 max-lg:flex max-lg:flex-col">
            <MapaRadar
              publicaciones={visibles}
              ubicacion={UBICACION}
              seleccionada={seleccionada}
              onSeleccionar={seleccionarDesdeMapa}
              encuadrar={encuadrar}
              tapadoAbajo={tapadoAbajo}
              resaltadas={resaltadas}
              className="relative isolate z-0 col-span-7 min-h-0 xl:col-span-8 max-lg:min-h-0 max-lg:flex-1"
            />
            {/* Lista: al lado del mapa (5 · 4 columnas) */}
            <div className="col-span-5 flex min-h-0 flex-col border-l border-rd-line xl:col-span-4 max-lg:hidden">
              <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3">
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
                      <Tarjeta
                        key={p.id}
                        publicacion={p}
                        distanciaKm={distancias.get(p.id)}
                        coincidencias={coincidencias.get(p.id)}
                        seleccionada={p.id === seleccionada}
                        enProceso={enProceso.includes(p.id)}
                        onSeleccionar={setSeleccionada}
                        onVerEnMapa={verEnMapa}
                        {...accionesTarjeta}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        <HojaFiltros abierta={hojaFiltros} filtros={filtros} onCambiar={setFiltros} onCerrar={() => setHojaFiltros(false)} publicaciones={todasLasPubs} resultados={visibles.length} zonaPropia={UBICACION.zona} />
        <DialogoCompromiso publicacion={compromiso} onCerrar={() => setCompromiso(null)} onEnviar={enviarCompromiso} />
        {(() => {
          const pub = verCoincidencias ? todasLasPubs.find((p) => p.id === verCoincidencias) : undefined;
          return pub ? <DialogoCoincidencias abierto publicacion={pub} coincidencias={coincidencias.get(pub.id) ?? []} hechas={enProceso} onCerrar={() => setVerCoincidencias(null)} onPrimaria={(id) => { setVerCoincidencias(null); abrirCompromiso(id); }} onVerEnMapa={verEnMapaDesdeCoincidencias} /> : null;
        })()}
        <DialogoReporte abierto={reporte !== null} onCerrar={() => setReporte(null)} onEnviar={enviarReporte} />
        <DialogoDetallePublicacion
          publicacion={publicacionDetalle}
          distanciaKm={publicacionDetalle ? distancias.get(publicacionDetalle.id) : undefined}
          coincidencias={publicacionDetalle ? coincidencias.get(publicacionDetalle.id) : undefined}
          enProceso={publicacionDetalle ? enProceso.includes(publicacionDetalle.id) : false}
          onCerrar={() => setDetalleId(null)}
          onPrimaria={(id) => {
            setDetalleId(null);
            abrirCompromiso(id);
          }}
          onVerEnMapa={(id) => {
            setDetalleId(null);
            verEnMapa(id);
          }}
          onVerCoincidencias={(id) => {
            setDetalleId(null);
            setVerCoincidencias(id);
          }}
          onCompartir={compartir}
          onReportar={(id) => {
            setDetalleId(null);
            setReporte(id);
          }}
        />
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

/* ---------- la fila de la vista lista de la Radar ---------- */

/** Una publicación en vista de lista: quién y qué (avatar, tipo, estado, título, organización y zona),
 *  recursos con sus anillos e indicadores de disponibilidad y acciones directas
 *  (Ver detalle, Ver en el mapa y menú ⋮). */
const FilaPublicacion: React.FC<{
  publicacion: Publicacion;
  distanciaKm?: number;
  coincidencias?: CoincidenciaPublicacion[];
  enProceso?: boolean;
  onVerDetalle: (id: string) => void;
  onVerEnMapa: (id: string) => void;
  onCompartir: (id: string) => void;
  onReportar: (id: string) => void;
  onVerCoincidencias?: (id: string) => void;
}> = ({
  publicacion: p,
  distanciaKm: dist,
  enProceso,
  onVerDetalle,
  onVerEnMapa,
  onCompartir,
  onReportar,
}) => {
  const est = estadoPublicacion(p);
  const menu = [
    { texto: 'Ver en el mapa', icono: <MapIcon className="h-4 w-4" />, onElegir: () => onVerEnMapa(p.id) },
    { texto: 'Compartir', icono: <Share2 className="h-4 w-4" />, onElegir: () => onCompartir(p.id) },
    { texto: 'Reportar un problema', icono: <Flag className="h-4 w-4" />, onElegir: () => onReportar(p.id) },
  ];

  return (
    <article
      id={p.id}
      className="grid min-w-0 grid-cols-1 gap-5 py-7 px-5 transition-colors hover:bg-rd-fondo/50 sm:py-8 sm:px-7 md:grid-cols-2 md:gap-x-6 md:gap-y-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_auto] xl:items-center xl:gap-8 min-h-[185px]"
    >
      {/* 1. Publicación, tipo y ubicación */}
      <div className="flex min-w-0 items-start gap-3.5">
        <Avatar iniciales={iniciales(p.org)} tamano="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <EtiquetaTipo tipo={p.tipo} />
            <EtiquetaEstado estado={est} />
            {enProceso && (
              <span className="rounded-rd-sm bg-rd-amber-soft px-2 py-0.5 text-rd-11 font-medium text-rd-amber">
                En proceso
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-rd m-0 text-rd-14 font-semibold leading-snug text-rd-ink">
              {tituloPublicacion(p)}
            </h2>
            {p.verificada && (
              <BadgeCheck
                role="img"
                aria-label="Verificada"
                className="h-4 w-4 shrink-0 text-rd-navy"
              />
            )}
          </div>
          {p.org && p.org !== actorPublicacion(p) && (
            <span className="text-rd-12 text-rd-ink-2 truncate">{p.org}</span>
          )}
          <Donde
            lugar={p.dir ?? `${p.zona}${p.localidad ? ` · ${p.localidad}` : ''}`}
            distancia={dist !== undefined ? distanciaTexto(dist) : undefined}
            className="mt-0.5"
          />
          {p.descripcion && (
            <p className="m-0 mt-1 text-rd-12 text-rd-ink-2 line-clamp-2 leading-relaxed">
              {p.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* 2. Recursos ofrecidos o solicitados con sus anillos */}
      <div className="flex min-w-0 flex-col gap-2 max-md:border-t max-md:border-rd-line-soft max-md:pt-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {p.recursos.map((r) => {
            const completo = restante(r) === 0;
            return (
              <span key={r.item} className="flex items-center gap-2.5">
                <Anillo recurso={r} />
                <span className="flex min-w-0 flex-col leading-tight">
                  <b className="truncate text-rd-13 font-semibold text-rd-ink">{r.item}</b>
                  <span className={`text-rd-11-5 tabular-nums ${completo ? 'font-semibold text-rd-green' : 'text-rd-ink-2'}`}>
                    {estadoRecurso(r, p.tipo)}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. Acciones: Ver detalle + Ver en mapa + ⋮ */}
      <div className="flex min-w-0 items-center justify-end gap-2 max-md:border-t max-md:border-rd-line-soft max-md:pt-3">
        <Button
          nivel="primario"
          tamano="sm"
          onClick={() => onVerDetalle(p.id)}
        >
          Ver detalle
        </Button>
        <Button
          nivel="secundario"
          tamano="sm"
          soloIcono
          aria-label="Ver en el mapa"
          onClick={() => onVerEnMapa(p.id)}
        >
          <MapIcon className="h-4 w-4" />
        </Button>
        <MenuAcciones items={menu} etiqueta={`Más acciones de ${tituloPublicacion(p)}`} tamano="sm" flotante />
      </div>
    </article>
  );
};

/**
 * Diálogo que muestra la tarjeta completa de una publicación al hacer clic en «Ver detalle»
 * desde la vista de lista del Radar.
 */
const DialogoDetallePublicacion: React.FC<{
  publicacion?: Publicacion;
  distanciaKm?: number;
  coincidencias?: CoincidenciaPublicacion[];
  enProceso?: boolean;
  onCerrar: () => void;
  onPrimaria: (id: string) => void;
  onVerEnMapa: (id: string) => void;
  onVerCoincidencias: (id: string) => void;
  onCompartir: (id: string) => void;
  onReportar: (id: string) => void;
}> = ({
  publicacion: p,
  distanciaKm,
  coincidencias,
  enProceso,
  onCerrar,
  onPrimaria,
  onVerEnMapa,
  onVerCoincidencias,
  onCompartir,
  onReportar,
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) d.showModal();
    else if (!p && d.open) d.close();
  }, [p]);

  if (!p) return null;

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="font-rd m-auto w-full max-w-lg rounded-rd-xl border border-rd-line bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-rd-line px-5 py-3 bg-rd-sunken/40">
        <span className="text-rd-13 font-semibold text-rd-ink">Detalle de la publicación</span>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 sm:p-5 bg-rd-fondo/40">
        <Tarjeta
          publicacion={p}
          distanciaKm={distanciaKm}
          coincidencias={coincidencias}
          enProceso={enProceso}
          onPrimaria={(id) => {
            onCerrar();
            onPrimaria(id);
          }}
          onVerEnMapa={(id) => {
            onCerrar();
            onVerEnMapa(id);
          }}
          onVerCoincidencias={(id) => {
            onCerrar();
            onVerCoincidencias(id);
          }}
          onCompartir={onCompartir}
          onReportar={(id) => {
            onCerrar();
            onReportar(id);
          }}
        />
      </div>
    </dialog>
  );
};
