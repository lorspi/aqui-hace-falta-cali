import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Funnel, Hand, HeartHandshake, Info, List, Map as MapIcon, Search, X } from 'lucide-react';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { DialogoCompromiso } from '../../components/ui/DialogoCompromiso';
import { avisoCompromiso, type Compromiso } from '../../utils/compromiso';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { HojaFiltros } from '../../components/ui/HojaFiltros';
import { HojaPin } from '../../components/ui/HojaPin';
import { Segmented } from '../../components/ui/Segmented';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Vacio } from '../../components/ui/Vacio';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { PUBLICACIONES, UBICACION, obtenerPublicaciones } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { Publicacion, TipoPublicacion } from '../../types/publicacion';
import { coincidenciasDe, type CoincidenciaPublicacion } from '../../utils/cruce';
import { DialogoCoincidencias } from '../../components/ui/Coincidencias';
import { chipsDe, cuantosAplicados, filtrosVacios, ordenar, pasa, pasaResto, vacioDe, type Filtros } from '../../utils/filtros';
import { escribirUrl, paramsActuales, paramsDeRadar, radarDeParams } from '../../utils/enlace';
import { ciudadDeUbicacion } from '../../utils/lugares';
import { nombrePanel } from '../../utils/cuenta';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { distanciaKm, distanciaTexto } from '../../utils/publicaciones';
import { MapaRadar } from './MapaRadar';
import { FloatingCreateNeedFAB } from '../../components/FloatingCreateNeedFAB';


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


function irA(ruta: string): void {
  window.location.href = ruta;
}

import { supabase, dbNeedToNeed, dbOfferToOffer } from '../../lib/supabaseClient';
import { needToPublicacion, offerToPublicacion } from '../../utils/supabaseMappers';

export interface RadarProps {
  onOpenCreateNeedModal?: () => void;
  onOpenCreateOfferModal?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  authUser?: any;
}

export const RadarPage: React.FC<RadarProps> = (props) => (
  <AvisosProvider>
    <Radar {...props} />
  </AvisosProvider>
);

const Radar: React.FC<RadarProps> = ({
  onOpenCreateNeedModal,
  onOpenCreateOfferModal,
  onOpenLoginModal,
  onLogout,
  authUser,
}) => {
  const avisar = useAviso();
  /* Lo que se ve sale de la URL y vuelve a ella: una consulta armada se comparte por enlace
     (`utils/enlace.ts`). Sin parámetros, los valores por defecto de siempre. */
  const inicial = useMemo(() => radarDeParams(paramsActuales()), []);
  const [tipo, setTipo] = useState<Tipo>(inicial.tipo);
  /* El chip inicial es la ciudad de la persona, «Bogotá» (plan T2, 2.4, ahora a nivel de
     ciudad como en producción): un filtro común que se quita como cualquiera. Solo se
     preselecciona si nadie dijo nada: con un enlace (filtros, `?punto=` o `?buscar=`) manda
     el enlace. */
  const [filtros, setFiltros] = useState<Filtros>(() => {
    const propia = ciudadDeUbicacion(UBICACION);
    const pidieron = paramsActuales().toString() !== '';
    return pidieron || !propia ? inicial.filtros : { ...inicial.filtros, ciudades: [propia] };
  });
  const [hojaFiltros, setHojaFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState(inicial.busqueda);
  const [buscando, setBuscando] = useState(() => inicial.busqueda !== '');
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [encuadrar, setEncuadrarEstado] = useState<{ id: string; n: number } | null>(null);
  const setEncuadrar = (id: string) => setEncuadrarEstado((e) => ({ id, n: (e?.n ?? 0) + 1 }));
  const [resaltadas, setResaltadas] = useState<{ ids: string[]; n: number } | null>(null);
  const [hojaPin, setHojaPin] = useState<{ id: string; expandida: boolean; cerrando?: boolean } | null>(null);
  const cierreHoja = useRef<number | undefined>(undefined);
  const [vista, setVista] = useState<Vista>(inicial.vista);
  const [cajon, setCajon] = useState(false);
  const [movil, setMovil] = useState(esMovil);
  const [compromiso, setCompromiso] = useState<Publicacion | null>(null);
  const [reporte, setReporte] = useState<string | null>(null);
  const [enProceso, setEnProceso] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const [dbPubs, setDbPubs] = useState<Publicacion[]>([]);
  const [cargandoDb, setCargandoDb] = useState(true);
  const [panelDerechoMinimizado, setPanelDerechoMinimizado] = useState(false);
  const [leyendaExpandida, setLeyendaExpandida] = useState(false);



  const fetchPublicacionesSupabase = useCallback(async () => {
    setCargandoDb(true);
    try {
      const [{ data: needsData }, { data: offersData }] = await Promise.all([
        supabase.from('needs').select('*').neq('verification_status', 'ARCHIVED').order('created_at', { ascending: false }),
        supabase.from('offers').select('*').neq('verification_status', 'ARCHIVED').order('created_at', { ascending: false }),
      ]);

      const needsMapped = (needsData || []).map(dbNeedToNeed).map(needToPublicacion);
      const offersMapped = (offersData || []).map(dbOfferToOffer).map(offerToPublicacion);
      const combinadas = [...needsMapped, ...offersMapped];

      if (combinadas.length > 0) {
        setDbPubs(combinadas);
      } else {
        setDbPubs(obtenerPublicaciones());
      }
    } catch (err) {
      console.error('❌ Error cargando publicaciones desde Supabase:', err);
      setDbPubs(obtenerPublicaciones());
    } finally {
      setCargandoDb(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicacionesSupabase();

    const handleFocus = () => fetchPublicacionesSupabase();
    window.addEventListener('focus', handleFocus);

    const channel = supabase
      .channel('publicaciones-radar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'needs' }, fetchPublicacionesSupabase)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, fetchPublicacionesSupabase)
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, [fetchPublicacionesSupabase]);

  const todasLasPubs = useMemo(() => (dbPubs.length > 0 ? dbPubs : obtenerPublicaciones()), [dbPubs]);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Radar, RaDAR de ayuda';
    const mq = window.matchMedia('(max-width: 1023px)');
    const alCambiar = () => setMovil(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  /* La URL dice lo que se ve, para poder compartirlo. `punto` se conserva: es el enlace a una
     publicación, que no es parte de la consulta. */
  useEffect(() => {
    escribirUrl(paramsDeRadar({ filtros, tipo, busqueda, vista }), { punto: paramsActuales().get('punto') });
  }, [filtros, tipo, busqueda, vista]);

  /* Los tres conteos cuentan, por tipo, lo que pasa todos los demás filtros. */
  const conteo = useMemo(() => {
    const resto = todasLasPubs.filter((p) => pasaResto(p, filtros, UBICACION, busqueda));
    return { todo: resto.length, necesidad: resto.filter((p) => p.tipo === 'necesidad').length, oferta: resto.filter((p) => p.tipo === 'oferta').length };
  }, [filtros, busqueda, todasLasPubs]);

  const visibles = useMemo(() => ordenar(todasLasPubs.filter((p) => pasa(p, tipo, filtros, UBICACION, busqueda)), filtros.orden, UBICACION), [tipo, filtros, busqueda, todasLasPubs]);

  const distancias = useMemo(() => new Map(todasLasPubs.map((p) => [p.id, distanciaKm(UBICACION, p)])), [todasLasPubs]);
  const coincidencias = useMemo(() => new Map(todasLasPubs.map((p) => [p.id, coincidenciasDe(p, todasLasPubs)])), [todasLasPubs]);
  const [verCoincidencias, setVerCoincidencias] = useState<string | null>(null);
  /* El detalle que abre «Ver detalle» de la fila de 1280: la misma tarjeta, en un diálogo. */
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const publicacionDetalle = detalleId ? todasLasPubs.find((p) => p.id === detalleId) : undefined;
  const chips = chipsDe(filtros);
  /* Al cambiar de ciudades, el mapa encuadra lo que queda visible (como producción, que vuela a
     la ciudad elegida). */
  const [encuadrarCiudad, setEncuadrarCiudad] = useState<{ n: number } | null>(null);
  const llaveCiudades = filtros.ciudades.join(',');
  const ciudadesAnteriores = useRef(llaveCiudades);
  useEffect(() => {
    if (ciudadesAnteriores.current === llaveCiudades) return;
    ciudadesAnteriores.current = llaveCiudades;
    setEncuadrarCiudad((e) => ({ n: (e?.n ?? 0) + 1 }));
  }, [llaveCiudades]);
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
  /* El vacío nombra el filtro que más acota y ofrece soltar ese, no «quita todo». */
  const vacio = vacioDe(filtros, busqueda);
  const aflojar = () => {
    if (vacio.accion === 'Quitar la búsqueda') setBusqueda('');
    setFiltros(vacio.aflojar);
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
    avisar(avisoCompromiso(p.org, p.tipo, c), { tipo: 'ok' });
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
    avisar('Reporte enviado. Lo revisa moderación', { tipo: 'ok' });
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

  const cuentaUsuario = authUser
    ? {
        entidad: authUser.organization || authUser.name || 'Mi Organización',
        persona: authUser.name || authUser.email?.split('@')[0] || 'Usuario',
        rol: authUser.role || 'Miembro',
        iniciales: (authUser.name || authUser.email || 'US')
          .split(' ')
          .map((s: string) => s[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
      }
    : CUENTA;

  return (
    <Shell
      seccion="radar"
      panelNombre={nombrePanel()}
      cuenta={cuentaUsuario}
      authUser={authUser}
      onOpenLoginModal={onOpenLoginModal}
      onLogout={onLogout}
      pendientes={pendientesCuenta(modulosGuardados(), { sol: SOLICITUDES, recibidas: RECIBIDAS })}
      avisosNuevos={sinLeer}
      rutas={RUTAS_SHELL}
      onPedir={() => (onOpenCreateNeedModal ? onOpenCreateNeedModal() : irA(RUTAS.pedir))}
      onOfrecer={() => (onOpenCreateOfferModal ? onOpenCreateOfferModal() : irA(RUTAS.ofrecer))}
      cajonAbierto={cajon}
      onCerrarCajon={() => setCajon(false)}
    >
      <div className="flex h-full min-h-0 flex-col max-lg:h-dvh">
        {/* ---- cabecera ---- */}
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="font-rd m-0 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink">Radar</h1>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 lg:flex">
              <Button nivel="pedir" tamano="md" icono={<Hand className="h-4 w-4" />} onClick={() => (onOpenCreateNeedModal ? onOpenCreateNeedModal() : irA(RUTAS.pedir))}>
                Pedir ayuda
              </Button>
              <Button nivel="primario" tamano="md" icono={<HeartHandshake className="h-4 w-4" />} onClick={() => (onOpenCreateOfferModal ? onOpenCreateOfferModal() : irA(RUTAS.ofrecer))}>
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
          {/* Cómo lo ves, junto a qué ves: desde 1024 el conmutador Mapa | Lista vive en la barra
              de consulta, no en la cabecera (Alejandro, 21 de septiembre de 2026). Bajo 1024 sigue
              la píldora flotante de abajo. */}
          <div role="group" aria-label="Vista" className="inline-flex items-center gap-0.5 rounded-full border border-rd-line bg-rd-surface p-1 max-lg:hidden">
            <VistaBtn compacto actual={vista === 'mapa'} onClick={() => setVista('mapa')} etiqueta="Mapa" icono={<MapIcon className="h-5 w-5" />} />
            <VistaBtn compacto actual={vista === 'lista'} onClick={() => setVista('lista')} etiqueta="Lista" icono={<List className="h-5 w-5" />} />
          </div>
          <span aria-hidden="true" className="h-6 w-px flex-none bg-rd-line max-lg:hidden" />
          {/* Decisión 70: qué ves y cómo lo ves │ Filtros y chips │ el buscador a la derecha (146: lupa bajo 1024). */}
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
        {vista === 'lista' ? (
          <main
            role="region"
            aria-label="Lista de publicaciones"
            className="min-h-0 flex-1 overflow-y-auto bg-rd-surface px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6"
          >
            {visibles.length === 0 ? (
              <Vacio
                icono={<Funnel className="h-6.5 w-6.5" />}
                titulo={vacio.titulo}
                texto={vacio.texto}
                accion={
                  <Button nivel="secundario" tamano="md" onClick={aflojar}>
                    {vacio.accion}
                  </Button>
                }
              />
            ) : (
              /* La lista es la misma tarjeta del mapa y de la hoja del pin, no otra maquetación
                 (Alejandro, 22 de septiembre de 2026; es también lo que dice el prototipo): a lo
                 ancho en una cuadrícula de 2 o 3 columnas, con las acciones pegadas abajo. Sin
                 texto de conteo ni de orden: el segmentado ya cuenta y Filtros ya ordena. */
              /* Una tarjeta por fila, la misma del mapa y de la hoja del pin, con scroll
                 (Alejandro y el CEO, 24 de septiembre de 2026). Antes desde 1280 cambiaba a
                 `FilaPublicacion`, una maquetación en columnas que ya no existe: metía el
                 contenido de una tarjeta en tres columnas con 220 px fijos para cuatro
                 acciones, y ahí era donde «Ver detalle» se partía en dos renglones.
                 `max-w-2xl` son las ~6 columnas que pidió Alejandro: un poco más ancha que
                 junto al mapa, sin estirarse a lo ancho de una pantalla de 1440. */
              <div className="mx-auto flex w-full max-w-2xl flex-col items-stretch gap-3">
                {visibles.map((p: Publicacion) => (
                  <Tarjeta
                    key={p.id}
                    publicacion={p}
                    distanciaKm={distancias.get(p.id)}
                    coincidencias={coincidencias.get(p.id)}
                    enProceso={enProceso.includes(p.id)}
                    onVerEnMapa={verEnMapa}
                    {...accionesTarjeta}
                  />
                ))}
              </div>
            )}
          </main>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-12 max-lg:flex max-lg:flex-col">
            <div className={`relative isolate z-0 min-h-0 transition-all duration-300 max-lg:min-h-0 max-lg:flex-1 ${panelDerechoMinimizado ? 'col-span-12' : 'col-span-7 xl:col-span-8'}`}>
              <MapaRadar
                publicaciones={visibles}
                ubicacion={UBICACION}
                seleccionada={seleccionada}
                onSeleccionar={seleccionarDesdeMapa}
                encuadrar={encuadrar}
                encuadrarTodo={encuadrarCiudad}
                tapadoAbajo={tapadoAbajo}
                resaltadas={resaltadas}
                className="h-full w-full"
              />

              {/* Botón flotante del chatbot en la parte izquierda del mapa */}
              <FloatingCreateNeedFAB
                onClick={() => (onOpenCreateNeedModal ? onOpenCreateNeedModal() : irA(RUTAS.pedir))}
                position="in-map"
              />

              {/* Leyenda del mapa en la parte inferior central DENTRO del mapa */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] font-rd flex flex-col items-center">
                {leyendaExpandida ? (
                  <div className="w-56 rounded-rd-xl border border-rd-line bg-rd-surface/95 p-3 shadow-rd-2 backdrop-blur-md animate-in fade-in duration-150 text-rd-ink">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-rd-line">
                      <span className="text-rd-11 font-bold tracking-wider uppercase text-rd-ink-meta">
                        Leyenda del mapa
                      </span>
                      <button
                        type="button"
                        onClick={() => setLeyendaExpandida(false)}
                        className="p-1 text-rd-ink-3 hover:text-rd-ink rounded-rd-sm transition-colors cursor-pointer"
                        title="Minimizar leyenda"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5 text-rd-12 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rd-coral shrink-0" />
                        <span>Crítica</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Alta</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shrink-0" />
                        <span>Media</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rd-green shrink-0" />
                        <span>Baja</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-purple-600 shrink-0" />
                        <span>Centro de acopio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rd-navy shrink-0" />
                        <span>Oferta de ayuda</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLeyendaExpandida(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-rd-line bg-rd-surface/95 px-3.5 py-1.5 text-rd-12-5 font-semibold text-rd-ink shadow-rd-2 ring-1 ring-rd-ink/10 backdrop-blur-md transition-all hover:bg-rd-surface hover:text-rd-navy active:scale-95 cursor-pointer"
                  >
                    <Info className="h-4 w-4 text-rd-navy shrink-0" />
                    <span>Leyenda del mapa</span>
                    <ChevronUp className="h-4 w-4 text-rd-ink-3 shrink-0" />
                  </button>
                )}
              </div>

              {/* Botón para minimizar/desplegar el panel derecho hacia la derecha */}
              <button
                type="button"
                onClick={() => setPanelDerechoMinimizado((p) => !p)}
                aria-label={panelDerechoMinimizado ? 'Mostrar panel derecho' : 'Minimizar panel a la derecha'}
                title={panelDerechoMinimizado ? 'Mostrar panel derecho' : 'Minimizar panel a la derecha'}
                className="absolute top-4 right-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-rd-line bg-rd-surface/95 px-3 py-1.5 text-rd-12-5 font-semibold text-rd-ink shadow-rd-2 ring-1 ring-rd-ink/10 backdrop-blur-md transition-all hover:bg-rd-surface hover:text-rd-navy active:scale-95 cursor-pointer max-lg:hidden"
              >
                {panelDerechoMinimizado ? (
                  <>
                    <ChevronLeft className="h-4 w-4 text-rd-navy" />
                    <span>Mostrar panel</span>
                  </>
                ) : (
                  <>
                    <span>Minimizar mapa</span>
                    <ChevronRight className="h-4 w-4 text-rd-ink-3" />
                  </>
                )}
              </button>
            </div>

            {/* Lista / Menú lateral derecho (collapsible) */}
            {!panelDerechoMinimizado && (
              <div className="col-span-5 flex min-h-0 flex-col border-l border-rd-line xl:col-span-4 max-lg:hidden">
                <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-3">
                    {visibles.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center gap-2 px-4 py-8 text-center text-rd-ink-2">
                        <span aria-hidden="true" className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-rd-sunken text-rd-ink-3">
                          <Funnel className="h-6.5 w-6.5" />
                        </span>
                        <h3 className="font-rd m-0 text-rd-15 font-semibold text-rd-ink">{vacio.titulo}</h3>
                        <p className="m-0 max-w-90 text-rd-13-5 leading-normal">{vacio.texto}</p>
                        <Button nivel="secundario" tamano="md" className="mt-3" onClick={aflojar}>
                          {vacio.accion}
                        </Button>
                      </div>
                    ) : (
                      visibles.map((p: Publicacion) => (
                        <Tarjeta
                          key={p.id}
                          publicacion={p}
                          distanciaKm={distancias.get(p.id)}
                          coincidencias={coincidencias.get(p.id)}
                          enProceso={enProceso.includes(p.id)}
                          onVerEnMapa={verEnMapa}
                          {...accionesTarjeta}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        )}

        {/* ---- Mapa | Lista (solo < 1024) ---- */}
        {(!hojaPin || hojaPin.cerrando) && (
          <div
            role="group"
            aria-label="Vista"
            className="fixed bottom-20 left-1/2 z-780 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-rd-line/90 bg-rd-surface/98 p-1 shadow-[0_2px_6px_rgb(23_27_43/0.14),0_8px_24px_rgb(23_27_43/0.20),0_16px_36px_rgb(23_27_43/0.16)] ring-1 ring-rd-ink/15 backdrop-blur-md lg:hidden"
          >
            <VistaBtn actual={vista === 'mapa'} onClick={() => setVista('mapa')} etiqueta="Mapa" icono={<MapIcon className="h-5 w-5" />} />
            <VistaBtn actual={vista === 'lista'} onClick={() => setVista('lista')} etiqueta="Lista" icono={<List className="h-5 w-5" />} />
          </div>
        )}

        {publicacionHoja && hojaPin && (
          <HojaPin publicacion={publicacionHoja} vecinas={visibles} distancias={distancias} coincidencias={coincidencias} enProceso={enProceso.includes(publicacionHoja.id)} expandida={hojaPin.expandida} cerrando={hojaPin.cerrando} onExpandir={(e) => setHojaPin({ id: hojaPin.id, expandida: e })} onCerrar={cerrarHojaPin} onIr={irDesdeHoja} {...accionesTarjeta} />
        )}

        <HojaFiltros abierta={hojaFiltros} filtros={filtros} onCambiar={setFiltros} onCerrar={() => setHojaFiltros(false)} publicaciones={todasLasPubs} resultados={visibles.length} ubicacion={UBICACION} />
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
 * Un lado del conmutador Mapa | Lista. Mismo patrón que `Segmented`: pista con marco y la
 * opción activa en píldora llena de tinta (bg-rd-sel), con el icono heredando el blanco. El
 * anillo de foco va en blanco sobre la activa: el rd-navy sobre tinta no se vería.
 * `compacto` es el de la barra de consulta (desde 1024): repite la cuenta del `Segmented` para
 * que la pista dé 40 al lado de Filtros y del buscador. Sin él es el de la píldora flotante de
 * bajo 1024, que no comparte fila con nadie y se queda en 44 con el dedo: es como se cambia de
 * vista en el teléfono y encogerlo ahí sería peor.
 */
const VistaBtn: React.FC<{ actual: boolean; onClick: () => void; etiqueta: string; icono: React.ReactNode; compacto?: boolean }> = ({ actual, onClick, etiqueta, icono, compacto = false }) => (
  <button
    type="button"
    aria-pressed={actual}
    aria-label={etiqueta}
    onClick={onClick}
    className={`inline-flex w-11 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 active:translate-y-px ${
      compacto ? 'h-7.5 pointer-coarse:h-8.5' : 'h-9 pointer-coarse:h-rd-tactil'
    } ${
      actual
        ? 'bg-rd-sel font-semibold text-white focus-visible:outline-white'
        : 'text-rd-ink-2 hover:bg-rd-sunken hover:text-rd-ink focus-visible:outline-rd-navy'
    }`}
  >
    {icono}
  </button>
);

/* ---------- la fila de la vista lista de la Radar ---------- */


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
        {/* La × del modal del prototipo: `--md --ghost --icono` (28 px no llega a los 44 del dedo, 223 C4). */}
        <Button nivel="terciario" tamano="md" soloIcono aria-label="Cerrar detalle" onClick={onCerrar}>
          <X aria-hidden="true" className="h-5 w-5" />
        </Button>
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
