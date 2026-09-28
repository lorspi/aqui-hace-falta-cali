import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Flag, Funnel, Hand, HeartHandshake, List, Map as MapIcon, Search, Share2, X } from 'lucide-react';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { DialogoCompromiso } from '../../components/ui/DialogoCompromiso';
import { avisoCompromiso, type Compromiso } from '../../utils/compromiso';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from '../../components/ui/Etiqueta';
import { Donde } from '../../components/ui/Donde';
import { HojaFiltros } from '../../components/ui/HojaFiltros';
import { HojaPin } from '../../components/ui/HojaPin';
import { Segmented } from '../../components/ui/Segmented';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { DialogoDetallePublicacion } from '../../components/ui/DialogoDetallePublicacion';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Vacio } from '../../components/ui/Vacio';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { PUBLICACIONES, UBICACION, obtenerPublicaciones } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { Publicacion, TipoPublicacion, Ubicacion } from '../../types/publicacion';
import { coincidenciasDe, type CoincidenciaPublicacion } from '../../utils/cruce';
import { DialogoCoincidencias, ResumenCoincidencias } from '../../components/ui/Coincidencias';
import { chipsDe, cuantosAplicados, filtrosVacios, ordenar, pasa, pasaResto, vacioDe, type Filtros } from '../../utils/filtros';
import { escribirUrl, paramsActuales, paramsDeRadar, radarDeParams } from '../../utils/enlace';
import { ciudadDeUbicacion } from '../../utils/lugares';
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
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('punto');
}


function irA(ruta: string): void {
  if (!ruta || ruta === '#') return;
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    window.location.href = ruta;
    return;
  }
  if (window.location.pathname !== ruta) {
    window.history.pushState({}, '', ruta);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

import { supabase, dbNeedToNeed, dbOfferToOffer } from '../../lib/supabaseClient';
import { needToPublicacion, offerToPublicacion } from '../../utils/supabaseMappers';

export interface RadarProps {
  onOpenCreateNeedModal?: () => void;
  onOpenCreateOfferModal?: () => void;
  onOpenLoginModal?: () => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
  authUser?: any;
  isModeratorOrAdmin?: boolean;
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
  onOpenProfileModal,
  onLogout,
  authUser,
  isModeratorOrAdmin,
}) => {
  const avisar = useAviso();
  /* Lo que se ve sale de la URL y vuelve a ella: una consulta armada se comparte por enlace
     (`utils/enlace.ts`). Sin parámetros, los valores por defecto de siempre. */
  const inicial = useMemo(() => radarDeParams(paramsActuales()), []);
  const [tipo, setTipo] = useState<Tipo>(inicial.tipo);
  /* Por defecto mostramos todas las ciudades para encuadrar todo Colombia al iniciar */
  const [filtros, setFiltros] = useState<Filtros>(() => inicial.filtros);
  const [ubicacionActual, setUbicacionActual] = useState<Ubicacion>(UBICACION);

  /* Detectar la ubicación real del usuario si da permisos en el navegador */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacionActual({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            zona: 'Tu ubicación',
            simulada: false,
          });
        },
        () => {
          // Si deniega o falla, conserva la ubicación por defecto
        },
        { timeout: 8000 }
      );
    }
  }, []);

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

  const todasLasPubs = useMemo(() => {
    const mockPubs = obtenerPublicaciones();
    const source = dbPubs.length > 0
      ? [...dbPubs, ...mockPubs.filter((p) => !dbPubs.some((dp) => dp.id === p.id))]
      : mockPubs;

    // Deduplicación preventiva por id y por (título + coordenadas + tipo) para evitar pines repetidos
    const seenIds = new Set<string>();
    const seenCoords = new Set<string>();
    const deduplicadas: Publicacion[] = [];

    for (const p of source) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);

      const latStr = typeof p.lat === 'number' ? p.lat.toFixed(4) : '';
      const lngStr = typeof p.lng === 'number' ? p.lng.toFixed(4) : '';
      const coordKey = `${(p.titulo || '').trim().toLowerCase()}::${latStr}::${lngStr}::${p.tipo}`;
      if (latStr && lngStr && seenCoords.has(coordKey)) continue;
      if (latStr && lngStr) seenCoords.add(coordKey);

      deduplicadas.push(p);
    }
    return deduplicadas;
  }, [dbPubs]);
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
    const resto = todasLasPubs.filter((p) => pasaResto(p, filtros, ubicacionActual, busqueda));
    return { todo: resto.length, necesidad: resto.filter((p) => p.tipo === 'necesidad').length, oferta: resto.filter((p) => p.tipo === 'oferta').length };
  }, [filtros, busqueda, todasLasPubs, ubicacionActual]);

  const visibles = useMemo(() => ordenar(todasLasPubs.filter((p) => pasa(p, tipo, filtros, ubicacionActual, busqueda)), filtros.orden, ubicacionActual), [tipo, filtros, busqueda, todasLasPubs, ubicacionActual]);

  const distancias = useMemo(() => new Map(todasLasPubs.map((p) => [p.id, distanciaKm(ubicacionActual, p)])), [todasLasPubs, ubicacionActual]);
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
    setPanelDerechoMinimizado(false);
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

  /* `?punto=<id>`: la publicación compartida o seleccionada desde Directorio abre encuadrada sin filtrar el resto */
  const aplicarPuntoUrl = useCallback((id: string) => {
    const pub = todasLasPubs.find((p) => p.id === id);
    if (pub) {
      if (tipo !== 'todo' && tipo !== pub.tipo) {
        setTipo('todo');
      }
      if (filtros.ciudades.length > 0 && pub.ciudad && !filtros.ciudades.includes(pub.ciudad)) {
        setFiltros((prev) => ({ ...prev, ciudades: [] }));
      }
    }
    setSeleccionada(id);
    setEncuadrar(id);
    setVista('mapa');
    setPanelDerechoMinimizado(false);
    if (esMovil()) {
      setHojaPin({ id, expandida: false });
    } else {
      requestAnimationFrame(() => listaRef.current?.querySelector<HTMLElement>(`[data-punto="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  }, [todasLasPubs, tipo, filtros.ciudades]);

  useEffect(() => {
    const id = puntoPedido();
    if (id) {
      aplicarPuntoUrl(id);
    }

    const onPopState = () => {
      const nuevoId = puntoPedido();
      if (nuevoId) {
        aplicarPuntoUrl(nuevoId);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [aplicarPuntoUrl]);

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
    onVerDetalle: (id: string) => setDetalleId(id),
  };
  const sinLeer = avisos.filter((a) => !a.leido).length;
  const publicacionHoja = hojaPin ? todasLasPubs.find((p) => p.id === hojaPin.id) : undefined;
  /* El mapa se tapará abajo según la altura de la hoja colapsada (para centrar el pin). */
  const tapadoAbajo = movil && hojaPin && !hojaPin.expandida && !hojaPin.cerrando ? 260 : 0;

  const usuarioEfectivo = useMemo(() => {
    if (authUser) return authUser;
    if (typeof window !== 'undefined') {
      const adminLocal = localStorage.getItem('ahf_admin_user');
      if (adminLocal) {
        try { return JSON.parse(adminLocal); } catch {}
      }
      const authLocal = localStorage.getItem('ahf_auth_user');
      if (authLocal) {
        try { return JSON.parse(authLocal); } catch {}
      }
    }
    return null;
  }, [authUser]);

  const esModOAdmin = useMemo(() => {
    if (isModeratorOrAdmin) return true;
    if (!usuarioEfectivo) return false;
    const role = (usuarioEfectivo.role || '').toString().trim().toUpperCase();
    return role === 'ADMIN' || role === 'MODERATOR' || role === 'MODERADOR' || role === 'ADMINISTRADOR';
  }, [isModeratorOrAdmin, usuarioEfectivo]);

  const cuentaUsuario = usuarioEfectivo
    ? {
        entidad: usuarioEfectivo.organization || usuarioEfectivo.org_name || usuarioEfectivo.name || 'Mi Organización',
        persona: usuarioEfectivo.name || usuarioEfectivo.email?.split('@')[0] || 'Usuario',
        rol: usuarioEfectivo.role || 'Miembro',
        iniciales: (usuarioEfectivo.name || usuarioEfectivo.email || 'US')
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
      authUser={usuarioEfectivo}
      isModeratorOrAdmin={esModOAdmin}
      onOpenLoginModal={onOpenLoginModal}
      onOpenProfileModal={onOpenProfileModal}
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
        <div className="flex flex-none flex-col border-b border-rd-line bg-rd-surface px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:gap-3 lg:px-8">
          {/* Fila 1 en móvil: Tabs Todo / Necesidades / Ofertas (+ Mapa/Lista en desktop) */}
          <div className="flex items-center gap-2 overflow-x-auto max-lg:w-full lg:shrink-0">
            <Segmented<Tipo>
              etiquetaGrupo="Qué quieres ver"
              valor={tipo}
              onChange={setTipo}
              className="shrink-0 max-lg:w-full max-lg:justify-between"
              opciones={[
                { id: 'todo', etiqueta: 'Todo', n: conteo.todo },
                { id: 'necesidad', etiqueta: 'Necesidades', n: conteo.necesidad, pip: 'necesidad' },
                { id: 'oferta', etiqueta: 'Ofertas', n: conteo.oferta, pip: 'oferta' },
              ]}
            />
            {/* Cómo lo ves, junto a qué ves: desde 1024 el conmutador Mapa | Lista vive en la barra
                de consulta, no en la cabecera (Alejandro, 21 de septiembre de 2026). Bajo 1024 sigue
                la píldora flotante de abajo. */}
            <div role="group" aria-label="Vista" className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-rd-line bg-rd-surface p-1 max-lg:hidden">
              <VistaBtn compacto actual={vista === 'mapa'} onClick={() => setVista('mapa')} etiqueta="Mapa" icono={<MapIcon className="h-5 w-5" />} />
              <VistaBtn compacto actual={vista === 'lista'} onClick={() => setVista('lista')} etiqueta="Lista" icono={<List className="h-5 w-5" />} />
            </div>
            <span aria-hidden="true" className="h-6 w-px shrink-0 flex-none bg-rd-line max-lg:hidden" />
          </div>

          {/* Fila 2 en móvil (abajo de los tabs): Pill de filtros, chips aplicados y buscador */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pt-2 max-lg:w-full sm:gap-3 lg:pt-0">
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
            <CampoBuscar valor={busqueda} onChange={setBusqueda} placeholder="Buscar recurso, barrio u organización" abierto={buscando} className="min-w-[160px] max-w-xs flex-1 lg:ml-auto" />
          </div>
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
              <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:flex xl:flex-col xl:gap-3">
                {/* Cabecera de columnas, solo desde 1280 (rótulo suelto: cada fila es una tarjeta) */}
                <div className="hidden px-5 pb-1 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_220px] xl:items-center xl:gap-8">
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">Publicación y organización</span>
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">Recursos</span>
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">Acciones</span>
                </div>
                {visibles.map((p: Publicacion) => (
                  <React.Fragment key={p.id}>
                    {/* hasta 1279: la tarjeta en grid responsivo (1 col en móvil, 2 en tablet) */}
                    <Tarjeta
                      publicacion={p}
                      distanciaKm={distancias.get(p.id)}
                      coincidencias={coincidencias.get(p.id)}
                      enProceso={enProceso.includes(p.id)}
                      onVerEnMapa={verEnMapa}
                      {...accionesTarjeta}
                      className="xl:hidden"
                    />
                    {/* desde 1280: la misma información en fila estructurada a lo ancho de la pantalla */}
                    <FilaPublicacion
                      publicacion={p}
                      distanciaKm={distancias.get(p.id)}
                      coincidencias={coincidencias.get(p.id)}
                      enProceso={enProceso.includes(p.id)}
                      onVerDetalle={(id) => setDetalleId(id)}
                      onVerEnMapa={verEnMapa}
                      onCompartir={compartir}
                      onReportar={(id) => setReporte(id)}
                      onVerCoincidencias={(id) => setVerCoincidencias(id)}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </main>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-12 max-lg:flex max-lg:flex-col">
            <div className={`relative isolate z-0 min-h-0 transition-all duration-300 max-lg:min-h-0 max-lg:flex-1 ${panelDerechoMinimizado ? 'col-span-12' : 'col-span-7 xl:col-span-8'}`}>
              <MapaRadar
                publicaciones={visibles}
                ubicacion={ubicacionActual}
                seleccionada={seleccionada}
                onSeleccionar={seleccionarDesdeMapa}
                encuadrar={encuadrar}
                encuadrarTodo={encuadrarCiudad}
                tapadoAbajo={tapadoAbajo}
                resaltadas={resaltadas}
                className="h-full w-full"
              />

              {/* Botón para minimizar/desplegar el panel derecho hacia la derecha */}
              <button
                type="button"
                onClick={() => setPanelDerechoMinimizado((p) => !p)}
                aria-label={panelDerechoMinimizado ? 'Mostrar panel derecho' : 'Minimizar panel'}
                title={panelDerechoMinimizado ? 'Mostrar panel derecho' : 'Minimizar panel'}
                className="absolute top-4 right-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-rd-line bg-rd-surface/95 px-3 py-1.5 text-rd-12-5 font-semibold text-rd-ink shadow-rd-2 ring-1 ring-rd-ink/10 backdrop-blur-md transition-all hover:bg-rd-surface hover:text-rd-navy active:scale-95 cursor-pointer max-lg:hidden"
              >
                {panelDerechoMinimizado ? (
                  <>
                    <ChevronLeft className="h-4 w-4 text-rd-navy" />
                    <span>Mostrar panel</span>
                  </>
                ) : (
                  <>
                    <span>Minimizar panel</span>
                    <ChevronRight className="h-4 w-4 text-rd-ink-3" />
                  </>
                )}
              </button>
            </div>

            {/* Lista / Menú lateral derecho (collapsible) */}
            {!panelDerechoMinimizado && (
              <div className="col-span-5 flex min-h-0 flex-col border-l border-rd-line xl:col-span-4 max-lg:hidden">
                <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
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

        <HojaFiltros abierta={hojaFiltros} filtros={filtros} onCambiar={setFiltros} onCerrar={() => setHojaFiltros(false)} publicaciones={todasLasPubs} resultados={visibles.length} ubicacion={ubicacionActual} />
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

/** Una publicación en la vista de lista **desde 1280**: una tarjeta horizontal independiente que
 *  reparte en columnas lo mismo que la tarjeta vertical de bajo 1280, igual que la fila del
 *  Directorio (Alejandro, 22 de septiembre de 2026). Lo que no cabe en una fila —las fotos y el
 *  detalle de cada recurso— lo abre «Ver detalle» en su diálogo. Bajo 1280 esta fila no existe:
 *  manda la tarjeta. */
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
  coincidencias,
  enProceso,
  onVerDetalle,
  onVerEnMapa,
  onCompartir,
  onReportar,
  onVerCoincidencias,
}) => {
  const est = estadoPublicacion(p);
  const menu = [
    { texto: 'Ver en el mapa', icono: <MapIcon className="h-4 w-4" />, onElegir: () => onVerEnMapa(p.id) },
    { texto: 'Compartir', icono: <Share2 className="h-4 w-4" />, onElegir: () => onCompartir(p.id) },
    { texto: 'Reportar', icono: <Flag className="h-4 w-4" />, onElegir: () => onReportar(p.id) },
  ];

  return (
    <article
      id={p.id}
      className="hidden min-w-0 rounded-rd-xl border border-rd-line bg-rd-surface px-5 py-4 transition duration-200 hover:border-rd-navy-line hover:shadow-xs xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_220px] xl:items-center xl:gap-8"
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
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="font-rd m-0 min-w-0 truncate text-rd-13-5 font-semibold leading-snug text-rd-ink">
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
      <div className="flex min-w-0 flex-col gap-2">
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

      {/* 3. Acciones: el mismo trío que la fila del Directorio: Ver detalle, el mapa como icono
       *  y ⋮, ahora con nivel secundario y sombra sutil para que se distingan como botones
       *  con marco interactivo. En `md` para mantener la escala tipográfica intacta. */}
      <div className="flex min-w-0 flex-col items-end gap-2 self-stretch">
        <ResumenCoincidencias publicacion={p} coincidencias={coincidencias} onVer={() => onVerCoincidencias?.(p.id)} compacta />
        <div className="mt-auto flex items-center gap-1">
          <Button nivel="secundario" tamano="md" className="shadow-2xs" onClick={() => onVerDetalle(p.id)}>
            Ver detalle
          </Button>
          <Button nivel="secundario" tamano="md" soloIcono aria-label="Ver en el mapa" className="shadow-2xs" onClick={() => onVerEnMapa(p.id)}>
            <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
          <MenuAcciones items={menu} etiqueta={`Más acciones de ${tituloPublicacion(p)}`} tamano="md" nivel="secundario" className="shadow-2xs" flotante />
        </div>
      </div>
    </article>
  );
};

