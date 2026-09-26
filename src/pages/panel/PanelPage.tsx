import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleDashed, CircleDot, Clock, Download, Edit3, Eye, FileText, Funnel, Hand, HeartHandshake, ListChecks, Megaphone, Package, Pause, Phone, Play, Radar, TriangleAlert, Truck, Users, X } from 'lucide-react';
import { Dialogo, Opciones } from '../../components/ui/Dialogo';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { DialogoAsignar, DialogoCierre, DialogoDetallePublicacionPanel, DialogoEditarRecursoOfrecido, DialogoEditarRecursoPedido, DialogoGestionPublicacion, DialogoMiembro, DialogoRegistrarMiembro, DISPONIBILIDADES, type DatosPublicacionGestion } from './dialogos';
import { TarjetaRecibida, TarjetaSolicitud, accionesDe, menuDe, quienLleva, type AccionesSolicitud } from './TarjetaEntrega';
import { TiraFotos, VisorFotos, type GrupoFotos } from '../../components/ui/VisorFotos';
import { cuentaFotos, fotosDeEntrega, fotosDeRecibida, listaFotos, FOTOS_ENTREGA, FOTOS_RECIBIDA } from '../../mocks/fotosMock';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { Avatar, EtiquetaCiclo } from '../../components/ui/Etiqueta';
import { Pestanas } from '../../components/ui/Pestanas';
import { Segmented } from '../../components/ui/Segmented';
import { Divisor } from '../../components/ui/Divisor';
import { Vacio } from '../../components/ui/Vacio';
import { Caja, Conteo } from '../../components/ui/Caja';
import { IconoRecursoDe } from '../../components/ui/Recursos';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { DialogoCoincidencias, FilaSugerencias } from '../../components/ui/Coincidencias';
import { coincidenciasDe, coincideItem, type CoincidenciaPublicacion } from '../../utils/cruce';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { ACTIVIDAD, DIAS_PARA_ARCHIVAR, DISPONIBILIDAD, EQUIPO, ESTADO_RECIBIDA, ESTADO_SOLICITUD, NECESIDAD, OFERTA, OFRECIMIENTOS_ENVIADOS, ORG, PUERTAS, RECIBIDAS, ROL_PLATAFORMA, SOLICITUDES, SOLICITUDES_ENVIADAS } from '../../mocks/panelMock';
import { PUBLICACIONES, obtenerPublicaciones } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { ModulosCuenta } from '../../types/cuenta';
import type { Foto } from '../../types/flujo';
import type { Acta, EntregaRecibida, Kpi, MiembroEquipo, OfrecimientoEnviado, Pendiente, PestanaPanel, RecursoOfrecido, RecursoPedido, Solicitud, SolicitudEnviada } from '../../types/panel';
import type { FotoPublicada, Publicacion } from '../../types/publicacion';
import { actasDe, archivarViejas, cantidadPorEstado, kpisDe, modulosGuardados, nuevas, pendientesCuenta, pendientesDe, pestanasDe, porConfirmar, quedan, recibidasPorConfirmar, resumenActas, textoCertificar, textoCierre } from '../../utils/panel';
import { nombrePanel } from '../../utils/cuenta';
import { cifra, iniciales, tituloPublicacion, unidad } from '../../utils/publicaciones';
import { Tabla } from '../../components/ui/Tabla';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Barra } from '../../components/ui/Barra';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { HojaFiltrosEquipo } from './HojaFiltrosEquipo';

/**
 * El panel de la cuenta (mockup/*): «Mi organización» del prototipo (`organizacion.html`,
 * `comunidad.html`). **Se arma con lo que la cuenta hizo**, no con lo que dijo ser: sin
 * publicar nada hay resumen, equipo y datos, y dos puertas (pedir, ofrecer) que dicen qué
 * abre cada una. Publicar una necesidad abre Mis necesidades y Entregas recibidas; publicar
 * una oferta abre Mis ofertas, Solicitudes y Seguimiento. Los módulos los guardan los flujos
 * (`utils/panel.ts`); `?modulos=pide,ofrece` o `?modulos=ninguno` los fuerzan para verlo.
 * Todo sale de `panelMock.ts`; los conteos se calculan.
 */

function irA(ruta: string): void {
  window.location.href = ruta;
}

/**
 * Conmutador horizontal de módulos del panel en pestañas:
 * Mismo patrón que `Pestanas` (el estándar de la app): fila sobre la línea inferior, activa en
 * tinta con la línea abajo (border-rd-sel) e inactivas en rd-ink-meta. Solo texto, sin icono.
 * Alto 46 (h-11.5), que es también el objetivo táctil en móvil.
 * Si desborda hacia la derecha (en móviles o pantallas medianas), activa la máscara degradada
 * (`zona-rd-chips`) y muestra la flecha › flotante que avanza el scroll suavemente al tocarla.
 */
const PestanasPanel: React.FC<{
  pestanas: PestanaPanel[];
  actual: string;
  onCambiar: (id: string) => void;
  nombrePanel: string;
}> = ({ pestanas, actual, onCambiar, nombrePanel }) => {
  const zonaRef = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);

  useEffect(() => {
    const z = zonaRef.current;
    if (!z) return;
    const medir = () => {
      const restante = z.scrollWidth - (z.scrollLeft + z.clientWidth);
      setDesborda(restante > 8);
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
  }, [pestanas]);

  useEffect(() => {
    const z = zonaRef.current;
    if (!z) return;
    const activa = z.querySelector<HTMLElement>('[aria-selected="true"]');
    if (activa && typeof activa.scrollIntoView === 'function') {
      activa.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [actual]);

  const avanzar = () => {
    if (zonaRef.current) {
      zonaRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  const alTeclear = (e: React.KeyboardEvent, i: number) => {
    const k =
      e.key === 'ArrowRight' ? (i + 1) % pestanas.length
      : e.key === 'ArrowLeft' ? (i - 1 + pestanas.length) % pestanas.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? pestanas.length - 1
      : -1;
    if (k === -1) return;
    e.preventDefault();
    onCambiar(pestanas[k].id);
    (e.currentTarget.parentElement?.children[k] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="min-w-0 flex-none bg-rd-surface px-4 sm:px-6 lg:px-8">
      <div className="relative flex h-11.5 w-full min-w-0 items-stretch border-b border-rd-line">
        <div
          ref={zonaRef}
          role="tablist"
          aria-label={`Pestañas de ${nombrePanel}`}
          className={`zona-rd-scroll absolute inset-0 flex flex-nowrap items-stretch gap-5 overflow-x-auto overflow-y-hidden ${
            desborda ? 'zona-rd-chips pr-12' : ''
          }`}
        >
          {pestanas.map((p, i) => {
            const sel = p.id === actual;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={`pestana-${p.id}`}
                aria-selected={sel}
                /* Solo el panel de la activa existe en el árbol: apuntar al de las demás
                   dejaría un `aria-controls` colgando. */
                aria-controls={sel ? `panel-${p.id}` : undefined}
                tabIndex={sel ? 0 : -1}
                onClick={() => onCambiar(p.id)}
                onKeyDown={(e) => alTeclear(e, i)}
                className={`font-rd inline-flex h-11.5 flex-none cursor-pointer items-center gap-2 border-b-2 whitespace-nowrap text-rd-13-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy ${
                  sel
                    ? 'border-rd-sel font-semibold text-rd-ink'
                    : 'border-transparent font-medium text-rd-ink-meta hover:border-rd-line hover:text-rd-ink'
                }`}
              >
                <span>{p.nombre}</span>
                {p.n ? (
                  <>
                    <span className="sr-only">, </span>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-coral px-1.5 text-rd-11 font-semibold text-white tabular-nums">
                      {p.n}
                    </span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
        {desborda && (
          <button
            type="button"
            aria-label="Ver más pestañas a la derecha"
            onClick={avanzar}
            className="absolute top-1/2 right-0 z-1 flex h-8.5 w-8.5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-rd-md border border-rd-line bg-rd-surface text-rd-ink shadow-xs transition-colors hover:bg-rd-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy active:scale-95"
          >
            <ChevronRight aria-hidden="true" className="h-4.5 w-4.5 text-rd-ink" />
          </button>
        )}
      </div>
    </div>
  );
};

export const PanelPage: React.FC = () => (
  <AvisosProvider>
    <Panel />
  </AvisosProvider>
);

const Panel: React.FC = () => {
  const avisar = useAviso();
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const sinLeer = useMemo(() => avisos.filter((a) => !a.leido).length, [avisos]);

  /* --- la campana --- */
  const leerTodos = () => setAvisos((lista) => lista.map((a) => ({ ...a, leido: true })));
  const accionDeAviso = (a: Aviso) => {
    setAvisos((lista) => lista.map((x) => (x.id === a.id ? { ...x, leido: true } : x)));
    if (!a.accion) return;
    if (a.accion.al === 'confirmar') avisar(`Confirmaste lo que llegó de ${a.quien}`, { tipo: 'ok' });
    else if (a.accion.al === 'revalidar') avisar('Tu necesidad sigue arriba en el mapa', { tipo: 'ok' });
    else irA(a.accion.al);
  };

  const [modulos] = useState<ModulosCuenta>(modulosGuardados);
  /* Al abrir, las confirmadas de 30 días o más pasan solas a Archivadas. */
  const [sol, setSol] = useState<Solicitud[]>(() => archivarViejas(SOLICITUDES, new Date()));
  const [recibidas, setRecibidas] = useState<EntregaRecibida[]>(RECIBIDAS);
  const [recursosOferta, setRecursosOferta] = useState<RecursoOfrecido[]>(() => {
    try {
      const guardado = localStorage.getItem('rd-oferta-creada-recursos');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return OFERTA.recursos;
  });
  const [recursosNecesidad, setRecursosNecesidad] = useState<RecursoPedido[]>(() => {
    try {
      const guardado = localStorage.getItem('rd-necesidad-creada-recursos');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return NECESIDAD.recursos;
  });
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<SolicitudEnviada[]>(() => {
    try {
      const guardado = localStorage.getItem('rd-solicitudes-enviadas');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return SOLICITUDES_ENVIADAS;
  });
  const [ofrecimientosEnviados, setOfrecimientosEnviados] = useState<OfrecimientoEnviado[]>(() => {
    try {
      const guardado = localStorage.getItem('rd-ofrecimientos-enviados');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return OFRECIMIENTOS_ENVIADOS;
  });
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(EQUIPO);
  const [editandoOferta, setEditandoOferta] = useState<RecursoOfrecido | null>(null);
  const [editandoNecesidad, setEditandoNecesidad] = useState<RecursoPedido | null>(null);
  const [registrandoMiembro, setRegistrandoMiembro] = useState(false);
  const [editandoMiembro, setEditandoMiembro] = useState<MiembroEquipo | null>(null);
  const [miembroParaBaja, setMiembroParaBaja] = useState<MiembroEquipo | null>(null);
  const [asignando, setAsignando] = useState<Solicitud | null>(null);
  const [marcandoEnCamino, setMarcandoEnCamino] = useState<Solicitud | null>(null);
  const [certificando, setCertificando] = useState<Solicitud | null>(null);
  const [confirmando, setConfirmando] = useState<EntregaRecibida | null>(null);
  const [distribuyendo, setDistribuyendo] = useState<EntregaRecibida | null>(null);
  const [cancelando, setCancelando] = useState<Solicitud | null>(null);
  const [rechazandoSolicitud, setRechazandoSolicitud] = useState<Solicitud | null>(null);
  const [rechazandoRecibida, setRechazandoRecibida] = useState<EntregaRecibida | null>(null);
  const [cancelandoSolicitudEnviada, setCancelandoSolicitudEnviada] = useState<SolicitudEnviada | null>(null);
  const [cancelandoOfrecimientoEnviado, setCancelandoOfrecimientoEnviado] = useState<OfrecimientoEnviado | null>(null);
  const [cancelandoRecibidaCompromiso, setCancelandoRecibidaCompromiso] = useState<EntregaRecibida | null>(null);

  const [pubOferta, setPubOferta] = useState<DatosPublicacionGestion>(() => {
    try {
      const guardado = localStorage.getItem('rd-oferta-creada-gestion');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return {
      id: 'oferta-usme',
      tipo: 'oferta',
      titulo: 'Bomberos Voluntarios Usme, recursos de estación',
      org: ORG.nombre,
      verificada: true,
      zona: 'Usme',
      dir: ORG.dir,
      descripcion: 'Recursos de la estación disponibles para la emergencia de la quebrada. Coordinamos por radio con el puesto de mando.',
      personaContacto: ORG.enlace.split(', ')[0] || 'Carlos Peña',
      telContacto: ORG.contacto.tel,
      comoEntrega: 'Lo llevamos, cobertura 15 km',
      horario: 'Lunes a domingo 8:00 a 18:00',
      recursos: OFERTA.recursos.map((r) => ({
        item: r.n,
        total: r.total,
        unidad: r.unidad,
        disp: r.disp,
        pres: r.pres,
        icono: r.icono,
        pausado: r.pausado,
        confirmada: 0,
        camino: 0,
      })),
      pausadaGlobal: false,
    };
  });

  const [pubNecesidad, setPubNecesidad] = useState<DatosPublicacionGestion>(() => {
    try {
      const guardado = localStorage.getItem('rd-necesidad-creada-gestion');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return {
      id: 'necesidad-usme',
      tipo: 'necesidad',
      titulo: 'Equipos de bombeo y protección, emergencia Usme',
      org: ORG.nombre,
      verificada: true,
      zona: 'Usme',
      dir: ORG.dir,
      descripcion: 'Equipos y dotación requeridos con urgencia para atender las inundaciones y remoción de lodo en la calle 91 sur.',
      personaContacto: ORG.enlace.split(', ')[0] || 'Carlos Peña',
      telContacto: ORG.contacto.tel,
      comoEntrega: 'Recepción en Estación Usme',
      horario: 'Atención 24 horas',
      recursos: NECESIDAD.recursos.map((r) => ({
        item: r.n,
        total: r.total,
        unidad: r.unidad,
        para: r.para,
        icono: r.icono,
        pausado: r.pausado,
        confirmada: r.confirmada,
        camino: r.camino,
      })),
      pausadaGlobal: false,
    };
  });

  const [gestionandoPublicacion, setGestionandoPublicacion] = useState<{
    publicacion: DatosPublicacionGestion;
    modoInicial: 'vista' | 'editar';
    recursoFoco?: string;
  } | null>(null);

  const guardarGestionPublicacion = (datos: DatosPublicacionGestion) => {
    if (datos.tipo === 'oferta') {
      setPubOferta(datos);
      const nuevos = datos.recursos.map((r) => ({
        n: r.item,
        icono: (r.icono as any) || 'package',
        unidad: r.unidad,
        total: r.total,
        disp: r.disp || 'Inmediata',
        pres: r.pres || 'Estándar',
        pausado: r.pausado,
      }));
      setRecursosOferta(nuevos);
      try {
        localStorage.setItem('rd-oferta-creada-gestion', JSON.stringify(datos));
        localStorage.setItem('rd-oferta-creada-recursos', JSON.stringify(nuevos));
      } catch {}
      avisar('Oferta actualizada', { tipo: 'ok' });
    } else {
      setPubNecesidad(datos);
      const nuevos = datos.recursos.map((r) => ({
        n: r.item,
        icono: (r.icono as any) || 'bolt',
        unidad: r.unidad,
        total: r.total,
        confirmada: r.confirmada || 0,
        camino: r.camino || 0,
        para: r.para || 'Atención de la comunidad',
        pausado: r.pausado,
      }));
      setRecursosNecesidad(nuevos);
      try {
        localStorage.setItem('rd-necesidad-creada-gestion', JSON.stringify(datos));
        localStorage.setItem('rd-necesidad-creada-recursos', JSON.stringify(nuevos));
      } catch {}
      avisar('Necesidad actualizada', { tipo: 'ok' });
    }
  };
  const [cajon, setCajon] = useState(false);
  const [pasosOcultos, setPasosOcultos] = useState(false);
  const [tab, setTab] = useState(() => (window.location.hash || '#resumen').slice(1));

  useEffect(() => {
    document.title = `${nombrePanel()}, RaDAR de ayuda`;
  }, []);
  useEffect(() => {
    const alCambiar = () => setTab((window.location.hash || '#resumen').slice(1));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const datos = {
    oferta: { ...OFERTA, id: pubOferta.id, titulo: pubOferta.titulo, recursos: recursosOferta },
    sol,
    necesidad: { ...NECESIDAD, id: pubNecesidad.id, titulo: pubNecesidad.titulo, recursos: recursosNecesidad },
    recibidas,
  };
  const pestanas = useMemo(() => pestanasDe(modulos, { porConfirmarRecibidas: recibidasPorConfirmar(recibidas).length, nuevas: nuevas(sol), porConfirmar: porConfirmar(sol).length }), [modulos, sol, recibidas]);
  const actual = pestanas.some((p) => p.id === tab) ? tab : 'resumen';
  const cambiarTab = (id: string) => {
    window.location.hash = id;
    setTab(id);
  };
  const pendientes = pendientesCuenta(modulos, { sol, recibidas });

  /* --- lo que se puede hacer desde aquí (sin backend: cambia el estado y avisa) --- */
  const mover = (id: number, estado: Solicitud['estado']) => setSol((l) => l.map((s) => (s.id === id ? { ...s, estado } : s)));
  const asignar = (id: number, vol: number | null) => setSol((l) => l.map((s) => (s.id === id ? { ...s, vol } : s)));
  const aceptar = (id: number) => {
    mover(id, 'aceptada');
    avisar('Solicitud aceptada. Asigna quién la lleva.', { tipo: 'ok' });
  };
  const rechazar = (id: number) => {
    const s = sol.find((x) => x.id === id);
    if (s) setRechazandoSolicitud(s);
  };
  /* PENDIENTE: el motivo no se guarda. Antes solo se repetía en el aviso, que dura 3,6 s y se
     lo lleva; al acortar los avisos (Alejandro, 24 de septiembre de 2026) quedó a la vista que
     nunca llegó a ninguna parte. Debería persistirse como `motivoCancelacion` —lo hacen
     `confirmarCancelarSolicitudEnviada` y `confirmarCancelarOfrecimientoEnviado`— y viajar en
     el aviso que recibe la otra organización. */
  const confirmarRechazoSolicitud = (id: number, motivo?: string) => {
    const s = sol.find((x) => x.id === id);
    setSol((l) => l.filter((x) => x.id !== id));
    if (s) {
      avisar(`Le avisamos a ${s.quien}`);
    }
  };
  const recordar = (id: number) => {
    const s = sol.find((x) => x.id === id);
    if (s) avisar(`Le recordamos a ${s.quien}`, { tipo: 'ok' });
  };
  const guardarOferta = (r: RecursoOfrecido) => {
    setRecursosOferta((prev) => {
      const act = prev.map((x) => (x.n === r.n ? r : x));
      try {
        localStorage.setItem('rd-oferta-creada-recursos', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar(`Oferta de ${r.n} actualizada`, { tipo: 'ok' });
  };
  const togglePausaOferta = (r: RecursoOfrecido) => {
    const pausado = !r.pausado;
    setRecursosOferta((prev) => {
      const act = prev.map((x) => (x.n === r.n ? { ...x, pausado } : x));
      try {
        localStorage.setItem('rd-oferta-creada-recursos', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar(pausado ? `Oferta de ${r.n} pausada` : `Oferta de ${r.n} reactivada`, { tipo: 'ok' });
  };
  const guardarNecesidad = (r: RecursoPedido) => {
    setRecursosNecesidad((prev) => {
      const act = prev.map((x) => (x.n === r.n ? r : x));
      try {
        localStorage.setItem('rd-necesidad-creada-recursos', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar(`Necesidad de ${r.n} actualizada`, { tipo: 'ok' });
  };
  const togglePausaNecesidad = (r: RecursoPedido) => {
    const pausado = !r.pausado;
    setRecursosNecesidad((prev) => {
      const act = prev.map((x) => (x.n === r.n ? { ...x, pausado } : x));
      try {
        localStorage.setItem('rd-necesidad-creada-recursos', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar(pausado ? `Necesidad de ${r.n} pausada` : `Necesidad de ${r.n} reactivada`, { tipo: 'ok' });
  };
  const cancelarSolicitudEnviada = (id: number | string) => {
    const s = solicitudesEnviadas.find((x) => x.id === id);
    if (s) setCancelandoSolicitudEnviada(s);
  };
  const confirmarCancelarSolicitudEnviada = (id: number | string, motivo?: string) => {
    setSolicitudesEnviadas((prev) => {
      const act = prev.map((s) => (s.id === id ? { ...s, estado: 'cancelada' as const, motivoCancelacion: motivo || undefined } : s));
      try {
        localStorage.setItem('rd-solicitudes-enviadas', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar('Solicitud cancelada', { tipo: 'ok' });
  };
  const cancelarOfrecimientoEnviado = (id: number | string) => {
    const o = ofrecimientosEnviados.find((x) => x.id === id);
    if (o) setCancelandoOfrecimientoEnviado(o);
  };
  const confirmarCancelarOfrecimientoEnviado = (id: number | string, motivo?: string) => {
    setOfrecimientosEnviados((prev) => {
      const act = prev.map((o) => (o.id === id ? { ...o, estado: 'cancelado' as const, motivoCancelacion: motivo || undefined } : o));
      try {
        localStorage.setItem('rd-ofrecimientos-enviados', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar('Oferta cancelada', { tipo: 'ok' });
  };
  const registrarMiembro = (m: Omit<MiembroEquipo, 'id' | 'hechas'>) => {
    const nuevo: MiembroEquipo = {
      ...m,
      id: Math.max(...equipo.map((x) => x.id), 0) + 1,
      hechas: 0,
    };
    setEquipo((prev) => [nuevo, ...prev]);
    avisar(`${nuevo.n} ya está en tu equipo`, { tipo: 'ok' });
  };
  const editarMiembro = (id: number, m: Omit<MiembroEquipo, 'id' | 'hechas'>) => {
    setEquipo((prev) => prev.map((x) => (x.id === id ? { ...x, ...m } : x)));
    avisar(`Datos de ${m.n} actualizados.`, { tipo: 'ok' });
  };
  const eliminarMiembro = (id: number) => {
    const m = equipo.find((x) => x.id === id);
    setEquipo((prev) => prev.filter((x) => x.id !== id));
    avisar(`${m?.n ?? 'Ya'} salió de tu equipo`);
  };
  /* Las fotos de una entrega, por lado: las ven las dos organizaciones de esa entrega. */
  const [fotos, setFotos] = useState<{ titulo: string; grupos: GrupoFotos[]; inicial: number } | null>(null);
  const verFotosEntrega = (s: Solicitud, inicial = 0) => {
    const f = fotosDeEntrega(s.id);
    setFotos({ inicial, titulo: `Entrega a ${s.quien}, ${cifra(s.cant)} ${s.u} de ${s.rec.toLowerCase()}`, grupos: [{ titulo: 'Las de quien entregó', fotos: f.entrega }, { titulo: `Las de ${s.quien}`, fotos: f.recibe }] });
  };
  const verFotosRecibida = (r: EntregaRecibida, inicial = 0) => {
    const f = fotosDeRecibida(r.id);
    setFotos({ inicial, titulo: `Entrega de ${r.org}, ${cifra(r.cant)} ${r.u} de ${r.rec.toLowerCase()}`, grupos: [{ titulo: `Las de ${r.org}`, fotos: f.entrega }, { titulo: 'Las tuyas', fotos: f.recibe }] });
  };
  /* --- reportes: las actas --- */
  const actas = useMemo(() => actasDe(modulos, { sol, recibidas, org: ORG.nombre, lleva: (s) => quienLleva(s, equipo)?.split(', ')[0] ?? null }), [modulos, sol, recibidas, equipo]);
  const [acta, setActa] = useState<Acta | null>(null);
  const [pubDetalle, setPubDetalle] = useState<Publicacion | null>(null);

  /* --- matches de necesidades y ofertas propias --- */
  const todasLasPubs = useMemo(() => obtenerPublicaciones(), []);

  const pubNecesidadComoPublicacion: Publicacion = useMemo(() => ({
    id: pubNecesidad.id,
    tipo: 'necesidad',
    titulo: pubNecesidad.titulo,
    org: ORG.nombre,
    verificada: true,
    lat: 4.51,
    lng: -74.115,
    zona: pubNecesidad.zona || 'Usme',
    dir: pubNecesidad.dir || ORG.dir,
    descripcion: pubNecesidad.descripcion,
    recursos: recursosNecesidad.map((r) => ({
      item: r.n,
      unidad: r.unidad,
      total: r.total,
      tramos: [
        ...(r.confirmada > 0 ? [{ t: 'hecho' as const, cant: r.confirmada, quien: ORG.nombre, cuando: 'Confirmado' }] : []),
        ...(r.camino > 0 ? [{ t: 'camino' as const, cant: r.camino, quien: ORG.nombre, cuando: 'En camino' }] : []),
      ],
    })),
  }), [pubNecesidad, recursosNecesidad]);

  const pubOfertaComoPublicacion: Publicacion = useMemo(() => ({
    id: pubOferta.id,
    tipo: 'oferta',
    titulo: pubOferta.titulo,
    org: ORG.nombre,
    verificada: true,
    lat: 4.51,
    lng: -74.115,
    zona: pubOferta.zona || 'Usme',
    dir: pubOferta.dir || ORG.dir,
    descripcion: pubOferta.descripcion,
    recursos: recursosOferta.map((r) => ({
      item: r.n,
      unidad: r.unidad,
      total: r.total,
      tramos: [],
    })),
  }), [pubOferta, recursosOferta]);

  const matchesNecesidadPorRecurso = useMemo(() => {
    const map = new Map<string, CoincidenciaPublicacion[]>();
    const todasCoincidencias = coincidenciasDe(pubNecesidadComoPublicacion, todasLasPubs, 20);
    recursosNecesidad.forEach((r) => {
      const filtradas = todasCoincidencias.filter((c) =>
        c.recursos.some((cr) => coincideItem(cr.item, r.n))
      );
      map.set(r.n, filtradas);
    });
    return map;
  }, [pubNecesidadComoPublicacion, recursosNecesidad, todasLasPubs]);

  const matchesOfertaPorRecurso = useMemo(() => {
    const map = new Map<string, CoincidenciaPublicacion[]>();
    const todasCoincidencias = coincidenciasDe(pubOfertaComoPublicacion, todasLasPubs, 20);
    recursosOferta.forEach((r) => {
      const filtradas = todasCoincidencias.filter((c) =>
        c.recursos.some((cr) => coincideItem(cr.item, r.n))
      );
      map.set(r.n, filtradas);
    });
    return map;
  }, [pubOfertaComoPublicacion, recursosOferta, todasLasPubs]);

  const [matchesDialogo, setMatchesDialogo] = useState<{
    publicacion: Publicacion;
    coincidencias: CoincidenciaPublicacion[];
    recursoFoco?: string;
  } | null>(null);

  const abrirMatchesRecurso = (tipo: 'necesidad' | 'oferta', recursoNombre: string) => {
    const pub = tipo === 'necesidad' ? pubNecesidadComoPublicacion : pubOfertaComoPublicacion;
    const map = tipo === 'necesidad' ? matchesNecesidadPorRecurso : matchesOfertaPorRecurso;
    const coincidencias = map.get(recursoNombre) ?? [];
    setMatchesDialogo({
      publicacion: pub,
      coincidencias,
      recursoFoco: recursoNombre,
    });
  };

  const obtenerPublicacionDeSolicitud = (s: Solicitud): Publicacion => {
    const norm = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const n = norm(s.quien);
    const found = PUBLICACIONES.find((p) => {
      const org = norm(p.org);
      const tit = norm(p.titulo);
      return org.includes(n) || n.includes(org) || tit.includes(n) || n.includes(tit);
    });
    if (found) return found;

    const pub: Publicacion = {
      id: `sol-${s.id}`,
      tipo: 'necesidad',
      titulo: '',
      punto: s.quien,
      org: s.quien,
      verificada: false,
      lat: 4.52,
      lng: -74.11,
      zona: s.dist ? `A ${s.dist}` : 'Bogotá D. C.',
      dir: 'Punto de atención en territorio',
      descripcion: `Requerimiento en territorio para atención de emergencia. Solicitud gestionada y despachada a través de RaDAR.`,
      recursos: [
        {
          item: s.rec,
          unidad: s.u,
          total: s.cant,
          tramos: s.estado === 'confirmada'
            ? [{ t: 'hecho', cant: s.cant, quien: 'Bomberos Voluntarios Usme', cuando: s.cuando }]
            : s.estado === 'camino' || s.estado === 'entregada'
            ? [{ t: 'camino', cant: s.cant, quien: 'Bomberos Voluntarios Usme', cuando: s.cuando }]
            : [],
        },
      ],
    };
    return { ...pub, titulo: tituloPublicacion(pub) };
  };

  const obtenerPublicacionDeRecibida = (r: EntregaRecibida): Publicacion => {
    const norm = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const n = norm(r.org);
    const found = PUBLICACIONES.find((p) => {
      const org = norm(p.org);
      const tit = norm(p.titulo);
      return org.includes(n) || n.includes(org) || tit.includes(n) || n.includes(tit);
    });
    if (found) return found;

    const pub: Publicacion = {
      id: `rec-${r.id}`,
      tipo: 'oferta',
      titulo: '',
      punto: r.org,
      org: r.org,
      verificada: true,
      lat: 4.52,
      lng: -74.11,
      zona: r.dist ? `A ${r.dist}` : 'Bogotá D. C.',
      dir: 'Sede operativa de acopio y despacho',
      descripcion: r.detalle || `Oferta humanitaria de ${r.rec} coordinada para apoyar la atención de la emergencia en la zona afectada.`,
      recursos: [
        {
          item: r.rec,
          unidad: r.u,
          total: r.cant,
          tramos: r.estado === 'confirmada'
            ? [{ t: 'hecho', cant: r.cant, quien: 'Nuestra organización', cuando: r.cuando }]
            : [{ t: 'camino', cant: r.cant, quien: 'En ruta de entrega', cuando: r.cuando }],
        },
      ],
    };
    return { ...pub, titulo: tituloPublicacion(pub) };
  };

  const verFotosActa = (a: Acta, inicial = 0) => {
    if (a.origen.tipo === 'solicitud') {
      const s = sol.find((x) => x.id === a.origen.id);
      if (s) verFotosEntrega(s, inicial);
    } else {
      const r = recibidas.find((x) => x.id === a.origen.id);
      if (r) verFotosRecibida(r, inicial);
    }
  };
  const descargarActa = (a: Acta) => {
    setActa(a);
    setTimeout(() => {
      window.print();
    }, 150);
  };
  const marcarEnCamino = (id: number, fotos: number, fotosLista?: Foto[], notas?: string) => {
    const s = sol.find((x) => x.id === id);
    if (!s) return;
    if (fotosLista && fotosLista.length > 0) {
      if (!FOTOS_ENTREGA[id]) {
        FOTOS_ENTREGA[id] = { entrega: [], recibe: [] };
      }
      const quien = quienLleva(s, equipo) ?? 'Bomberos Voluntarios Usme';
      const nuevasFotos: FotoPublicada[] = fotosLista.map((f) => ({
        url: f.url,
        alt: `En camino a ${s.quien} - ${f.nombre}`,
        quien,
        cuando: 'Hoy en camino',
      }));
      FOTOS_ENTREGA[id].entrega = [...nuevasFotos, ...FOTOS_ENTREGA[id].entrega];
    }
    setSol((l) =>
      l.map((x) =>
        x.id === id
          ? {
              ...x,
              estado: 'camino',
              notasCamino: notas || x.notasCamino,
              ...(fotosLista?.length || fotos > 0 || notas
                ? {
                    cierre: {
                      ...x.cierre,
                      notasCamino: notas || x.cierre?.notasCamino,
                      entrega: { fotos: (x.cierre?.entrega?.fotos ?? 0) + (fotosLista?.length ?? fotos) },
                    },
                  }
                : {}),
            }
          : x
      )
    );
    avisar(`En camino. Le avisamos a ${s.quien}`, { tipo: 'ok' });
  };
  const certificar = (id: number, fotos: number, fotosLista?: Foto[], notas?: string) => {
    const s = sol.find((x) => x.id === id);
    if (fotosLista && fotosLista.length > 0) {
      if (!FOTOS_ENTREGA[id]) {
        FOTOS_ENTREGA[id] = { entrega: [], recibe: [] };
      }
      const quien = (s ? quienLleva(s, equipo) : null) ?? 'Bomberos Voluntarios Usme';
      const nuevasFotos: FotoPublicada[] = fotosLista.map((f) => ({
        url: f.url,
        alt: `Certificación de entrega - ${f.nombre}`,
        quien,
        cuando: 'Hoy cert.',
      }));
      FOTOS_ENTREGA[id].entrega = [...nuevasFotos, ...FOTOS_ENTREGA[id].entrega];
    }
    const hoyIso = new Date().toISOString().slice(0, 10);
    setSol((l) =>
      l.map((x) =>
        x.id === id
          ? {
              ...x,
              estado: 'confirmada',
              cerradaEl: x.cerradaEl || hoyIso,
              notasEntrega: notas || x.notasEntrega,
              cierre: {
                ...x.cierre,
                notasEntrega: notas || x.cierre?.notasEntrega,
                entrega: { fotos: (x.cierre?.entrega?.fotos ?? 0) + (fotosLista?.length ?? fotos) },
              },
            }
          : x
      )
    );
    if (s) avisar(s.cierre?.recibe ? 'Entrega certificada. Ya la habían confirmado' : `Entrega certificada. Le avisamos a ${s.quien}`, { tipo: 'ok' });
  };
  const archivar = (id: number) => {
    const s = sol.find((x) => x.id === id);
    mover(id, 'archivada');
    if (s) avisar(`Entrega a ${s.quien} archivada`);
  };
  /* PENDIENTE: el motivo no se guarda (ver la nota de `confirmarRechazoSolicitud`). */
  const cancelar = (id: number, motivo: string) => {
    const s = sol.find((x) => x.id === id);
    setSol((l) => l.filter((x) => x.id !== id));
    if (s) avisar(`Compromiso cancelado. Le avisamos a ${s.quien}`);
  };
  const confirmarRecibido = (id: number, fotos: number, fotosLista?: Foto[], notas?: string) => {
    const r = recibidas.find((x) => x.id === id);
    if (fotosLista && fotosLista.length > 0) {
      if (!FOTOS_RECIBIDA[id]) {
        FOTOS_RECIBIDA[id] = { entrega: [], recibe: [] };
      }
      const nuevasFotos: FotoPublicada[] = fotosLista.map((f) => ({
        url: f.url,
        alt: `Confirmación de recibido - ${f.nombre}`,
        quien: 'Carlos Peña, Bomberos Voluntarios Usme',
        cuando: 'Hoy conf.',
      }));
      FOTOS_RECIBIDA[id].recibe = [...nuevasFotos, ...FOTOS_RECIBIDA[id].recibe];
    }
    const hoyIso = new Date().toISOString().slice(0, 10);
    setRecibidas((l) =>
      l.map((x) =>
        x.id === id
          ? {
              ...x,
              estado: 'confirmada',
              cerradaEl: x.cerradaEl || hoyIso,
              notasRecibe: notas || x.notasRecibe,
              cierre: {
                ...x.cierre,
                notasRecibe: notas || x.cierre?.notasRecibe,
                recibe: { fotos: (x.cierre?.recibe?.fotos ?? 0) + (fotosLista?.length ?? fotos) },
              },
            }
          : x
      )
    );
    if (r) avisar(`Confirmaste lo que llegó de ${r.org}`, { tipo: 'ok' });
  };
  const distribuirRecibida = (id: number, fotos: number, fotosLista?: Foto[], nota?: string, personasBeneficiadas?: number) => {
    const r = recibidas.find((x) => x.id === id);
    if (!r) return;
    if (fotosLista && fotosLista.length > 0) {
      if (!FOTOS_RECIBIDA[id]) {
        FOTOS_RECIBIDA[id] = { entrega: [], recibe: [] };
      }
      const nuevasFotos: FotoPublicada[] = fotosLista.map((f) => ({
        url: f.url,
        alt: `Distribución en comunidad - ${f.nombre}`,
        quien: 'JAC / Comunidad receptora',
        cuando: 'Hoy dist.',
      }));
      FOTOS_RECIBIDA[id].recibe = [...nuevasFotos, ...FOTOS_RECIBIDA[id].recibe];
    }
    setRecibidas((l) =>
      l.map((x) =>
        x.id === id
          ? {
              ...x,
              estado: 'distribuida',
              cierre: {
                ...x.cierre,
                historia: nota || x.cierre?.historia,
                personasBeneficiadas: personasBeneficiadas ?? x.cierre?.personasBeneficiadas,
                recibe: {
                  fotos: (x.cierre?.recibe?.fotos ?? 0) + (fotosLista?.length ?? fotos),
                },
              },
            }
          : x
      )
    );
    avisar('Distribución certificada', { tipo: 'ok' });
  };
  const archivarRecibida = (id: number) => {
    const r = recibidas.find((x) => x.id === id);
    setRecibidas((l) => l.map((x) => (x.id === id ? { ...x, estado: 'archivada' } : x)));
    if (r) avisar(`Entrega de ${r.org} archivada`);
  };
  const aceptarRecibida = (id: number) => {
    setRecibidas((l) => l.map((r) => (r.id === id ? { ...r, estado: 'aceptada' } : r)));
    avisar('Oferta aceptada. Coordinan la entrega contigo', { tipo: 'ok' });
  };
  const rechazarRecibida = (id: number) => {
    const r = recibidas.find((x) => x.id === id);
    if (r) setRechazandoRecibida(r);
  };
  /* PENDIENTE: el motivo no se guarda (ver la nota de `confirmarRechazoSolicitud`). */
  const confirmarRechazoRecibida = (id: number, motivo?: string) => {
    const r = recibidas.find((x) => x.id === id);
    setRecibidas((l) => l.filter((x) => x.id !== id));
    if (r) {
      avisar(`Le avisamos a ${r.org}`);
    }
  };
  /* PENDIENTE: el motivo no se guarda (ver la nota de `confirmarRechazoSolicitud`). */
  const confirmarCancelarRecibidaCompromiso = (id: number, motivo?: string) => {
    const r = recibidas.find((x) => x.id === id);
    setRecibidas((l) => l.filter((x) => x.id !== id));
    if (r) {
      avisar(`Compromiso cancelado. Le avisamos a ${r.org}`);
    }
  };
  /* Todo lo que se puede hacer con una solicitud, en un solo objeto: lo usan el tablero, la tabla y las tarjetas. */
  const accionesSolicitud: AccionesSolicitud = {
    onAceptar: aceptar,
    onRechazar: rechazar,
    onMover: mover,
    onEnCamino: setMarcandoEnCamino,
    onAsignar: setAsignando,
    onRecordar: recordar,
    onCertificar: setCertificando,
    onArchivar: archivar,
    onCancelar: setCancelando,
    onVerFotos: verFotosEntrega,
    onVerPublicacion: (s) => setPubDetalle(obtenerPublicacionDeSolicitud(s)),
  };
  const accion = (al: string) => {
    if (al.startsWith('#')) return cambiarTab(al.slice(1));
    const [que, idTexto] = al.split(':');
    const id = Number(idTexto);
    if (que === 'confirmar') setConfirmando(recibidas.find((r) => r.id === id) ?? null);
    if (que === 'recordar') recordar(id);
    if (que === 'aceptar') aceptar(id);
    if (que === 'rechazar') rechazar(id);
    if (que === 'aceptar-recibida') aceptarRecibida(id);
    if (que === 'rechazar-recibida') rechazarRecibida(id);
    if (que === 'asignar') setAsignando(sol.find((s) => s.id === id) ?? null);
    if (que === 'camino') {
      const s = sol.find((x) => x.id === id);
      if (s) setMarcandoEnCamino(s);
    }
    if (que === 'certificar') setCertificando(sol.find((s) => s.id === id) ?? null);
  };

  return (
    <Shell seccion="panel" panelNombre={nombrePanel()} cuenta={CUENTA} pendientes={pendientes} avisosNuevos={sinLeer} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
      <div className="flex h-full min-h-0 flex-col max-lg:min-h-dvh">
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="font-rd m-0 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink">{nombrePanel()}</h1>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 lg:flex">
              <Button nivel="pedir" tamano="md" icono={<Hand className="h-4 w-4" />} onClick={() => irA(RUTAS.pedir)}>
                Pedir ayuda
              </Button>
              <Button nivel="primario" tamano="md" icono={<HeartHandshake className="h-4 w-4" />} onClick={() => irA(RUTAS.ofrecer)}>
                Ofrecer ayuda
              </Button>
              <span aria-hidden="true" className="mx-1 h-6 w-px bg-rd-line" />
              <CampanaAvisos avisos={avisos} rutaAvisos={RUTAS_SHELL.avisos} onLeerTodos={leerTodos} onAccion={accionDeAviso} />
            </span>
            <BotonMenu onClick={() => setCajon(true)} abierto={cajon} />
          </span>
        </header>
        <PestanasPanel pestanas={pestanas} actual={actual} onCambiar={cambiarTab} nombrePanel={nombrePanel()} />
        <main id={`panel-${actual}`} role="tabpanel" aria-labelledby={`pestana-${actual}`} className="min-h-0 flex-1 overflow-y-auto bg-rd-surface px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="grid grid-cols-4 gap-x-4 gap-y-4 sm:grid-cols-8 lg:grid-cols-12 lg:gap-x-6">
            {actual === 'resumen' && <Resumen modulos={modulos} datos={datos} pasosOcultos={pasosOcultos} onOcultarPasos={() => setPasosOcultos(true)} onAccion={accion} />}
            {actual === 'necesidades' && (
              <MisNecesidades
                recursos={recursosNecesidad}
                solicitudesEnviadas={solicitudesEnviadas}
                matchesPorRecurso={matchesNecesidadPorRecurso}
                onVerMatches={(rec) => abrirMatchesRecurso('necesidad', rec)}
                onVerPublicacion={() => setPubDetalle(pubNecesidadComoPublicacion)}
                onEditar={(r) =>
                  setGestionandoPublicacion({
                    publicacion: pubNecesidad,
                    modoInicial: 'editar',
                    recursoFoco: r.n,
                  })
                }
                onTogglePausa={togglePausaNecesidad}
                onCancelarSolicitudEnviada={cancelarSolicitudEnviada}
                onIrASeguimiento={() => cambiarTab('seguimiento')}
              />
            )}
            {actual === 'ofertas' && (
              <MisOfertas
                recursos={recursosOferta}
                sol={sol}
                ofrecimientosEnviados={ofrecimientosEnviados}
                matchesPorRecurso={matchesOfertaPorRecurso}
                onVerMatches={(rec) => abrirMatchesRecurso('oferta', rec)}
                onVerPublicacion={() => setPubDetalle(pubOfertaComoPublicacion)}
                onEditar={(r) =>
                  setGestionandoPublicacion({
                    publicacion: pubOferta,
                    modoInicial: 'editar',
                    recursoFoco: r.n,
                  })
                }
                onTogglePausa={togglePausaOferta}
                onCancelarOfrecimientoEnviado={cancelarOfrecimientoEnviado}
                onIrASeguimiento={() => cambiarTab('seguimiento')}
              />
            )}
            {actual === 'seguimiento' && (
              <Seguimiento
                modulos={modulos}
                sol={sol}
                recibidas={recibidas}
                acciones={accionesSolicitud}
                onConfirmarRecibido={(id) => accion(`confirmar:${id}`)}
                onDistribuirRecibida={setDistribuyendo}
                onArchivarRecibida={archivarRecibida}
                onVerFotosRecibida={verFotosRecibida}
                onAceptarRecibida={aceptarRecibida}
                onRechazarRecibida={rechazarRecibida}
                onCancelarRecibida={(r) => setCancelandoRecibidaCompromiso(r)}
                onVerPublicacionRecibida={(r) => setPubDetalle(obtenerPublicacionDeRecibida(r))}
              />
            )}
            {actual === 'reportes' && <Reportes actas={actas} onVer={setActa} onDescargar={descargarActa} onVerFotos={verFotosActa} />}
            {actual === 'equipo' && (
              <MiEquipo
                equipo={equipo}
                onRegistrar={() => {
                  setEditandoMiembro(null);
                  setRegistrandoMiembro(true);
                }}
                onEditar={(m) => setEditandoMiembro(m)}
                onConfirmarBaja={(m) => setMiembroParaBaja(m)}
              />
            )}
          </div>
        </main>
        <DialogoAsignar solicitud={asignando} equipo={equipo} onCerrar={() => setAsignando(null)} onAsignar={asignar} />
        <DialogoActa acta={acta} onCerrar={() => setActa(null)} onDescargar={descargarActa} onVerFotos={verFotosActa} />
        <DialogoEditarRecursoOfrecido recurso={editandoOferta} onCerrar={() => setEditandoOferta(null)} onGuardar={guardarOferta} />
        <DialogoEditarRecursoPedido recurso={editandoNecesidad} onCerrar={() => setEditandoNecesidad(null)} onGuardar={guardarNecesidad} />
        <DialogoMiembro
          abierto={registrandoMiembro || editandoMiembro !== null}
          miembro={editandoMiembro}
          onCerrar={() => {
            setRegistrandoMiembro(false);
            setEditandoMiembro(null);
          }}
          onGuardar={(datos, id) => {
            if (id) editarMiembro(id, datos);
            else registrarMiembro(datos);
          }}
        />
        <Dialogo
          abierto={miembroParaBaja !== null}
          titulo={miembroParaBaja ? `¿Desvincular a ${miembroParaBaja.n} del equipo?` : ''}
          accion="Quitar"
          nivelAccion="secundario"
          textoAlterno="Mantener en el equipo"
          onCerrar={() => setMiembroParaBaja(null)}
          onEnviar={() => {
            if (!miembroParaBaja) return;
            eliminarMiembro(miembroParaBaja.id);
            setMiembroParaBaja(null);
          }}
        >
          <p className="mb-3 text-rd-14 text-rd-ink-2">
            Esta persona dejará de tener acceso a la coordinación y entregas asignadas en la organización.
          </p>
          <div className="rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2.5 text-rd-12 text-rd-ink-2">
            <p className="font-semibold text-rd-ink">Protección de identidad y auditoría:</p>
            <p className="mt-0.5 text-rd-ink-meta">
              Su cuenta de usuario en RaDAR y el registro histórico de las {miembroParaBaja?.hechas ?? 0} entregas que ya realizó permanecerán intactos en los reportes y actas oficiales.
            </p>
          </div>
        </Dialogo>
        <DialogoGestionPublicacion
          abierto={gestionandoPublicacion !== null}
          publicacion={gestionandoPublicacion?.publicacion ?? null}
          modoInicial={gestionandoPublicacion?.modoInicial ?? 'vista'}
          recursoFoco={gestionandoPublicacion?.recursoFoco}
          onCerrar={() => setGestionandoPublicacion(null)}
          onGuardar={guardarGestionPublicacion}
          onVerEnMapa={(id) => irA(`${RUTAS.radar}?punto=${id}`)}
        />
        <DialogoDetallePublicacionPanel
          publicacion={pubDetalle}
          onCerrar={() => setPubDetalle(null)}
          onVerEnMapa={(id) => irA(`${RUTAS.radar}?punto=${id}`)}
        />
        {matchesDialogo && (
          <DialogoCoincidencias
            abierto={Boolean(matchesDialogo)}
            publicacion={matchesDialogo.publicacion}
            coincidencias={matchesDialogo.coincidencias}
            recursoFoco={matchesDialogo.recursoFoco}
            onCerrar={() => setMatchesDialogo(null)}
            onPrimaria={(id) => {
              setMatchesDialogo(null);
              const target = todasLasPubs.find((p) => p.id === id);
              if (target) setPubDetalle(target);
            }}
            onVerEnMapa={(id) => {
              setMatchesDialogo(null);
              irA(`${RUTAS.radar}?punto=${id}`);
            }}
          />
        )}
        <VisorFotos abierto={fotos !== null} grupos={fotos?.grupos ?? []} inicial={fotos?.inicial ?? 0} titulo={fotos?.titulo ?? ''} onCerrar={() => setFotos(null)} />
        <Dialogo
          abierto={cancelando !== null}
          titulo={cancelando ? `¿Cancelar el compromiso con ${cancelando.quien}?` : ''}
          accion="Cancelar"
          nivelAccion="secundario"
          textoAlterno="Dejar como está"
          onCerrar={() => setCancelando(null)}
          onEnviar={(form) => {
            if (!cancelando) return;
            const data = new FormData(form);
            const motivo = String(data.get('motivo') ?? '');
            const detalle = String(data.get('detalle') ?? '').trim();
            const id = cancelando.id;
            setCancelando(null);
            const textoMotivo = MOTIVOS_CANCELAR.find((m) => m.valor === motivo)?.texto ?? motivo;
            const motivoCompleto = detalle ? `${textoMotivo}: ${detalle}` : textoMotivo;
            cancelar(id, motivoCompleto);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">{cancelando?.quien} recibe el aviso en este momento y su necesidad vuelve a mostrar lo que le falta.</p>
          <Opciones nombre="motivo" etiqueta="Por qué" opciones={MOTIVOS_CANCELAR} columna />
          <div className="mt-3">
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="cancelar-compromiso-detalle" className="block text-rd-13 font-semibold text-rd-ink">
                Detalle o mensaje adicional
              </label>
              <span className="text-rd-11-5 text-rd-ink-meta">(opcional)</span>
            </div>
            <textarea
              id="cancelar-compromiso-detalle"
              name="detalle"
              rows={2}
              placeholder="Explica brevemente para que la contraparte esté informada..."
              className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink transition-colors placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-1 focus:ring-rd-navy"
            />
          </div>
        </Dialogo>
        <Dialogo
          abierto={rechazandoSolicitud !== null}
          titulo={rechazandoSolicitud ? `¿Confirmar que no pueden atender a ${rechazandoSolicitud.quien}?` : ''}
          accion="Confirmar"
          nivelAccion="secundario"
          textoAlterno="Volver"
          onCerrar={() => setRechazandoSolicitud(null)}
          onEnviar={(form) => {
            if (!rechazandoSolicitud) return;
            const motivo = String(new FormData(form).get('motivo') ?? '').trim();
            const id = rechazandoSolicitud.id;
            setRechazandoSolicitud(null);
            confirmarRechazoSolicitud(id, motivo);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">
            {rechazandoSolicitud ? (
              <>
                Solicitud de <strong>{cifra(rechazandoSolicitud.cant)} {rechazandoSolicitud.u}</strong> de{' '}
                <strong>{rechazandoSolicitud.rec.toLowerCase()}</strong>. Le notificaremos a {rechazandoSolicitud.quien} para que pueda buscar otras opciones en el Radar.
              </>
            ) : null}
          </p>
          <div className="mb-2">
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="motivo-rechazo-solicitud" className="block text-rd-13 font-semibold text-rd-ink">
                Mensaje o motivo para la contraparte
              </label>
              <span className="text-rd-11-5 text-rd-ink-meta">(opcional)</span>
            </div>
            <textarea
              id="motivo-rechazo-solicitud"
              name="motivo"
              rows={3}
              placeholder="Ej. En este momento no contamos con capacidad logística para cubrir esta zona o fecha..."
              className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink transition-colors placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-1 focus:ring-rd-navy"
            />
            <p className="mt-1 text-rd-11-5 text-rd-ink-meta">
              Este mensaje se incluirá en la notificación para mantener la transparencia en la red.
            </p>
          </div>
        </Dialogo>
        <Dialogo
          abierto={rechazandoRecibida !== null}
          titulo={rechazandoRecibida ? `¿Rechazar la ayuda ofrecida por ${rechazandoRecibida.org}?` : ''}
          accion="Confirmar"
          nivelAccion="secundario"
          textoAlterno="Volver"
          onCerrar={() => setRechazandoRecibida(null)}
          onEnviar={(form) => {
            if (!rechazandoRecibida) return;
            const motivo = String(new FormData(form).get('motivo') ?? '').trim();
            const id = rechazandoRecibida.id;
            setRechazandoRecibida(null);
            confirmarRechazoRecibida(id, motivo);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">
            {rechazandoRecibida ? (
              <>
                Ofrecimiento de <strong>{cifra(rechazandoRecibida.cant)} {rechazandoRecibida.u}</strong> de{' '}
                <strong>{rechazandoRecibida.rec.toLowerCase()}</strong>. Le notificaremos a {rechazandoRecibida.org} para que pueda reasignar este recurso a otra comunidad que lo necesite.
              </>
            ) : null}
          </p>
          <div className="mb-2">
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="motivo-rechazo-recibida" className="block text-rd-13 font-semibold text-rd-ink">
                Mensaje o motivo para la organización
              </label>
              <span className="text-rd-11-5 text-rd-ink-meta">(opcional)</span>
            </div>
            <textarea
              id="motivo-rechazo-recibida"
              name="motivo"
              rows={3}
              placeholder="Ej. Ya cubrimos esta necesidad con otra donación y queremos que la ayuda llegue a quienes aún les falta..."
              className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink transition-colors placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-1 focus:ring-rd-navy"
            />
            <p className="mt-1 text-rd-11-5 text-rd-ink-meta">
              Un mensaje opcional ayuda a que la organización entienda el motivo y reasigne la ayuda rápidamente.
            </p>
          </div>
        </Dialogo>
        <Dialogo
          abierto={cancelandoSolicitudEnviada !== null}
          titulo={cancelandoSolicitudEnviada ? `¿Cancelar solicitud a ${cancelandoSolicitudEnviada.donante}?` : ''}
          accion="Confirmar"
          nivelAccion="secundario"
          textoAlterno="Mantener solicitud"
          onCerrar={() => setCancelandoSolicitudEnviada(null)}
          onEnviar={(form) => {
            if (!cancelandoSolicitudEnviada) return;
            const motivo = String(new FormData(form).get('motivo') ?? '').trim();
            const id = cancelandoSolicitudEnviada.id;
            setCancelandoSolicitudEnviada(null);
            confirmarCancelarSolicitudEnviada(id, motivo);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">
            {cancelandoSolicitudEnviada ? (
              <>
                Solicitud de <strong>{cifra(cancelandoSolicitudEnviada.cant)} {cancelandoSolicitudEnviada.u}</strong> de{' '}
                <strong>{cancelandoSolicitudEnviada.rec.toLowerCase()}</strong>. La solicitud dejará de estar en revisión y el donante será notificado.
              </>
            ) : null}
          </p>
          <div className="mb-2">
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="motivo-cancelar-sol-env" className="block text-rd-13 font-semibold text-rd-ink">
                Motivo o mensaje de cancelación
              </label>
              <span className="text-rd-11-5 text-rd-ink-meta">(opcional)</span>
            </div>
            <textarea
              id="motivo-cancelar-sol-env"
              name="motivo"
              rows={3}
              placeholder="Ej. Recibimos apoyo por otra fuente o ya no requerimos este recurso..."
              className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink transition-colors placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-1 focus:ring-rd-navy"
            />
            <p className="mt-1 text-rd-11-5 text-rd-ink-meta">
              Este motivo quedará visible en el historial de solicitudes enviadas.
            </p>
          </div>
        </Dialogo>
        <Dialogo
          abierto={cancelandoOfrecimientoEnviado !== null}
          titulo={cancelandoOfrecimientoEnviado ? `¿Cancelar ayuda ofrecida a ${cancelandoOfrecimientoEnviado.comunidad}?` : ''}
          accion="Confirmar"
          nivelAccion="secundario"
          textoAlterno="Mantener ofrecimiento"
          onCerrar={() => setCancelandoOfrecimientoEnviado(null)}
          onEnviar={(form) => {
            if (!cancelandoOfrecimientoEnviado) return;
            const motivo = String(new FormData(form).get('motivo') ?? '').trim();
            const id = cancelandoOfrecimientoEnviado.id;
            setCancelandoOfrecimientoEnviado(null);
            confirmarCancelarOfrecimientoEnviado(id, motivo);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">
            {cancelandoOfrecimientoEnviado ? (
              <>
                Ofrecimiento de <strong>{cifra(cancelandoOfrecimientoEnviado.cant)} {cancelandoOfrecimientoEnviado.u}</strong> de{' '}
                <strong>{cancelandoOfrecimientoEnviado.rec.toLowerCase()}</strong>. La comunidad será notificada y su necesidad volverá a mostrar que le falta este recurso.
              </>
            ) : null}
          </p>
          <div className="mb-2">
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="motivo-cancelar-ofrec-env" className="block text-rd-13 font-semibold text-rd-ink">
                Motivo o mensaje de cancelación
              </label>
              <span className="text-rd-11-5 text-rd-ink-meta">(opcional)</span>
            </div>
            <textarea
              id="motivo-cancelar-ofrec-env"
              name="motivo"
              rows={3}
              placeholder="Ej. Inconvenientes de logística o cambio en la disponibilidad de insumos..."
              className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink transition-colors placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-1 focus:ring-rd-navy"
            />
            <p className="mt-1 text-rd-11-5 text-rd-ink-meta">
              Este motivo quedará visible en el historial de ayudas ofrecidas.
            </p>
          </div>
        </Dialogo>
        <Dialogo
          abierto={cancelandoRecibidaCompromiso !== null}
          titulo={cancelandoRecibidaCompromiso ? `¿Cancelar el compromiso de ayuda con ${cancelandoRecibidaCompromiso.org}?` : ''}
          accion="Cancelar"
          nivelAccion="secundario"
          textoAlterno="Dejar como está"
          onCerrar={() => setCancelandoRecibidaCompromiso(null)}
          onEnviar={(form) => {
            if (!cancelandoRecibidaCompromiso) return;
            const motivo = String(new FormData(form).get('motivo') ?? '').trim();
            const id = cancelandoRecibidaCompromiso.id;
            setCancelandoRecibidaCompromiso(null);
            confirmarCancelarRecibidaCompromiso(id, motivo);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">
            {cancelandoRecibidaCompromiso ? (
              <>
                Entrega de <strong>{cifra(cancelandoRecibidaCompromiso.cant)} {cancelandoRecibidaCompromiso.u}</strong> de{' '}
                <strong>{cancelandoRecibidaCompromiso.rec.toLowerCase()}</strong>. Le notificaremos de inmediato a {cancelandoRecibidaCompromiso.org} para que no despache el transporte y pueda redirigir la ayuda.
              </>
            ) : null}
          </p>
          <div className="mb-2">
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="motivo-cancelar-recibida-comp" className="block text-rd-13 font-semibold text-rd-ink">
                Motivo de cancelación
              </label>
              <span className="text-rd-11-5 text-rd-ink-meta">(opcional)</span>
            </div>
            <textarea
              id="motivo-cancelar-recibida-comp"
              name="motivo"
              rows={3}
              placeholder="Ej. Cambio de planes en el territorio o ya no es posible recibir la ayuda en este momento..."
              className="w-full rounded-rd-md border border-rd-line bg-rd-surface px-3 py-2 text-rd-13 text-rd-ink transition-colors placeholder:text-rd-ink-meta focus:border-rd-navy focus:outline-none focus:ring-1 focus:ring-rd-navy"
            />
          </div>
        </Dialogo>
        <DialogoCierre
          abierto={marcandoEnCamino !== null}
          titulo={marcandoEnCamino ? `Marcar en camino la entrega a ${marcandoEnCamino.quien}` : ''}
          texto={
            marcandoEnCamino
              ? `${cifra(marcandoEnCamino.cant)} ${marcandoEnCamino.u} de ${marcandoEnCamino.rec.toLowerCase()}, ${quienLleva(marcandoEnCamino, equipo) ?? 'Equipo asignado'}. Puedes registrar fotos del cargue o despacho y notas de transporte para evidenciar que la ayuda va en ruta.`
              : ''
          }
          accion="Despachar"
          etiquetaFotos="Fotos del cargue o salida (opcionales)"
          nota={{
            etiqueta: 'Detalles de despacho o transporte (vehículo, conductor, ruta)',
            placeholder: 'Ej. Vehículo furgón blanco placa XYZ-123, conductor Luis, llegada estimada 2:30 PM...',
            ayuda: 'Estas notas quedarán registradas en el seguimiento y en el acta oficial de entrega.',
          }}
          onCerrar={() => setMarcandoEnCamino(null)}
          onEnviar={(fotos, lista, notaTexto) => {
            if (marcandoEnCamino) marcarEnCamino(marcandoEnCamino.id, fotos, lista, notaTexto);
            setMarcandoEnCamino(null);
          }}
        />
        <DialogoCierre
          abierto={certificando !== null}
          titulo={certificando ? `Certificar la entrega a ${certificando.quien}` : ''}
          texto={certificando ? `${cifra(certificando.cant)} ${certificando.u} de ${certificando.rec.toLowerCase()}. ${textoCertificar(certificando)}` : ''}
          accion="Certificar"
          nota={{
            etiqueta: 'Observaciones o constancia de entrega',
            placeholder: 'Ej. Entregado a la líder comunitaria Martha en la sede comunal, insumos verificados a satisfacción...',
            ayuda: 'Detalles de la entrega que quedarán registrados en el acta oficial bilateral.',
          }}
          onCerrar={() => setCertificando(null)}
          onEnviar={(fotos, lista, notaTexto) => {
            if (certificando) certificar(certificando.id, fotos, lista, notaTexto);
            setCertificando(null);
          }}
        />
        <DialogoCierre
          abierto={confirmando !== null}
          titulo={confirmando ? `Confirmar lo que llegó de ${confirmando.org}` : ''}
          texto={confirmando ? `${cifra(confirmando.cant)} ${confirmando.u} de ${confirmando.rec.toLowerCase()}, entregado ${confirmando.cuando}. Con tu confirmación la entrega cuenta como resuelta para los dos.` : ''}
          accion="Confirmar"
          nota={{
            etiqueta: 'Observaciones o novedades sobre lo recibido',
            placeholder: 'Ej. Recibido a entera conformidad en buen estado, insumos completos según lo acordado...',
            ayuda: 'Tus observaciones quedarán registradas en el acta oficial bilateral.',
          }}
          onCerrar={() => setConfirmando(null)}
          onEnviar={(fotos, lista, notaTexto) => {
            if (confirmando) confirmarRecibido(confirmando.id, fotos, lista, notaTexto);
            setConfirmando(null);
          }}
        />
        <DialogoCierre
          abierto={distribuyendo !== null}
          titulo={distribuyendo ? `Certificar distribución en la comunidad` : ''}
          texto={
            distribuyendo
              ? `${cifra(distribuyendo.cant)} ${distribuyendo.u} de ${distribuyendo.rec.toLowerCase()} recibidos de ${distribuyendo.org}. Registra la historia de impacto, el número de personas beneficiadas y las evidencias de entrega en territorio.`
              : ''
          }
          accion="Certificar"
          etiquetaFotos="Fotos de la entrega o planilla comunitaria (opcionales)"
          nota={{
            etiqueta: 'Historia de impacto (a quién benefició y cómo los ayudó)',
            placeholder: 'Describe a quién benefició esta entrega, cómo les ayudó en el territorio, testimonios o detalles del impacto...',
            ayuda: 'Cuéntanos cómo transformó esta ayuda a la comunidad o a las familias que la recibieron.',
          }}
          beneficiarios={{
            etiqueta: 'Número de personas beneficiadas',
            placeholder: 'Ej. 45',
            ayuda: 'Selecciona una cantidad rápida o escribe el número aproximado de personas o familias atendidas.',
            sugerencias: [10, 25, 50, 100, 200],
          }}
          onCerrar={() => setDistribuyendo(null)}
          onEnviar={(fotos, lista, notaTexto, personasBeneficiadas) => {
            if (distribuyendo) distribuirRecibida(distribuyendo.id, fotos, lista, notaTexto, personasBeneficiadas);
            setDistribuyendo(null);
          }}
        />
      </div>
    </Shell>
  );
};

/* ---------- piezas del panel ---------- */


const ICONO_PENDIENTE: Record<Pendiente['icono'], { icono: React.ReactNode; clase: string }> = {
  nueva: { icono: <Megaphone className="h-4.5 w-4.5" />, clase: 'bg-rd-coral-soft text-rd-coral' },
  tiempo: { icono: <Clock className="h-4.5 w-4.5" />, clase: 'bg-rd-amber-soft text-rd-amber-ink' },
  equipo: { icono: <Users className="h-4.5 w-4.5" />, clase: 'bg-rd-sunken text-rd-ink-2' },
  paquete: { icono: <Package className="h-4.5 w-4.5" />, clase: 'bg-rd-amber-soft text-rd-amber-ink' },
  aviso: { icono: <TriangleAlert className="h-4.5 w-4.5" />, clase: 'bg-rd-amber-soft text-rd-amber-ink' },
  camino: { icono: <Truck className="h-4.5 w-4.5" />, clase: 'bg-rd-navy-soft text-rd-navy' },
};

/** Una lista de pendientes (`rd-pendiente`): icono en el color del contexto, título y detalle,
 *  y a la derecha la acción principal con su segunda salida a la izquierda, si la hay. */
const ListaPendientes: React.FC<{ lista: Pendiente[]; vacio: { icono: React.ReactNode; titulo: string; texto: string }; onAccion: (al: string) => void }> = ({ lista, vacio, onAccion }) => {
  if (lista.length === 0) return <Vacio icono={vacio.icono} titulo={vacio.titulo} texto={vacio.texto} />;
  return (
    <>
      {lista.map((p, i) => {
        const ic = ICONO_PENDIENTE[p.icono];
        return (
          <div key={p.id} className={`flex flex-wrap items-start gap-3 py-3 ${i ? 'border-t border-rd-line-soft' : 'pt-0'}`}>
            <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ic.clase}`}>
              {ic.icono}
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <b className="block text-rd-13-5 font-semibold text-rd-ink">{p.titulo}</b>
              <span className="text-rd-12-5 text-rd-ink-2">{p.detalle}</span>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2 max-sm:mt-2 max-sm:w-full max-sm:pl-12 max-sm:justify-start">
              {/* De mayor a menor jerarquía: primero la que mueve la aguja. */}
              <Button nivel={p.accion.nivel} tamano="md" onClick={() => onAccion(p.accion.al)}>
                {p.accion.texto}
              </Button>
              {p.secundaria && (
                <Button nivel="secundario" tamano="md" onClick={() => onAccion(p.secundaria!.al)}>
                  {p.secundaria.texto}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ---------- Resumen ---------- */

/** El Pulso del Día (Camino 1): resumen ejecutivo en tres macro-estados orientados a la acción:
 *  1. Lo que requiere decisión o respuesta urgente (Decisiones inmediatas).
 *  2. Lo que está en movimiento hoy (logística en curso).
 *  3. Lo completado con éxito (impacto acumulado). */
const PulsoOperativo: React.FC<{
  modulos: ModulosCuenta;
  datos: Parameters<typeof kpisDe>[1];
  onAccion: (al: string) => void;
}> = ({ modulos, datos, onAccion }) => {
  // 1. Acciones pendientes (Decisiones inmediatas)
  const nuevasSol = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'nueva').length : 0;
  const porConfRec = modulos.pide ? datos.recibidas.filter((r) => r.estado === 'entregada').length : 0;
  const totalAccion = nuevasSol + porConfRec;

  let detalleAccion = 'Al día: sin decisiones pendientes';
  if (nuevasSol > 0 && porConfRec > 0) {
    detalleAccion = `${nuevasSol} ${nuevasSol === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}, ${porConfRec} por confirmar`;
  } else if (nuevasSol > 0) {
    detalleAccion = `${nuevasSol} ${nuevasSol === 1 ? 'solicitud nueva por responder' : 'solicitudes nuevas por responder'}`;
  } else if (porConfRec > 0) {
    detalleAccion = `${porConfRec} ${porConfRec === 1 ? 'entrega recibida por confirmar' : 'entregas recibidas por confirmar'}`;
  }

  // 2. En movimiento hoy (Operaciones en curso)
  const enCaminoOfrece = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'camino').length : 0;
  const sinAsignarOfrece = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'aceptada' && !s.vol).length : 0;
  const enCaminoPide = modulos.pide ? datos.recibidas.filter((r) => r.estado === 'camino').length : 0;
  const comprometidasPide = modulos.pide ? datos.recibidas.filter((r) => r.estado === 'aceptada').length : 0;
  const totalMovimiento = enCaminoOfrece + sinAsignarOfrece + enCaminoPide + comprometidasPide;

  const partesMovimiento: string[] = [];
  const enRuta = enCaminoOfrece + enCaminoPide;
  if (enRuta > 0) partesMovimiento.push(`${enRuta} en camino`);
  if (sinAsignarOfrece > 0) partesMovimiento.push(`${sinAsignarOfrece} por asignar`);
  if (comprometidasPide > 0) partesMovimiento.push(`${comprometidasPide} comprometidas`);
  const detalleMovimiento = partesMovimiento.length > 0 ? partesMovimiento.join(', ') : 'Sin entregas en ruta en este momento';

  // 3. Entregas completadas
  const confOfrece = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'confirmada').length : 0;
  const confPide = modulos.pide ? datos.recibidas.filter((r) => r.estado === 'confirmada').length : 0;
  const totalCompletadas = confOfrece + confPide;
  const detalleCompletadas = totalCompletadas > 0 ? 'Cerradas y confirmadas con éxito' : 'Aún no hay entregas finalizadas';

  return (
    <Caja titulo="Pulso del día" className="col-span-full">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {/* Card 1: Decisiones / Acción */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('seccion-decisiones');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="group flex items-center justify-between gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-2.5 text-left transition-all hover:border-rd-coral-line hover:bg-rd-coral-soft/10 focus:outline-none focus:ring-2 focus:ring-rd-coral pointer-coarse:min-h-rd-tactil sm:flex-col sm:items-stretch sm:justify-between sm:p-4"
        >
          <div className="flex min-w-0 items-center gap-2.5 sm:justify-between">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-md bg-rd-coral-soft text-rd-coral transition-transform group-hover:scale-105 sm:order-2"
              aria-hidden="true"
            >
              <Megaphone className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1 sm:order-1">
              <span className="block truncate text-rd-13 font-semibold text-rd-ink group-hover:text-rd-coral-ink sm:text-rd-13-5">
                Requieren tu atención
              </span>
              <p className="m-0 truncate text-rd-11-5 text-rd-ink-meta sm:hidden">
                {detalleAccion}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right sm:mt-3 sm:text-left">
            <span className="font-rd text-rd-20 font-bold leading-none tracking-rd-titulo text-rd-ink tabular-nums sm:text-rd-28">
              {totalAccion}
            </span>
            <p className="m-0 mt-2 hidden text-rd-12 leading-snug text-rd-ink-meta sm:block">
              {detalleAccion}
            </p>
          </div>
        </button>

        {/* Card 2: En movimiento */}
        <button
          type="button"
          onClick={() => onAccion('#seguimiento')}
          className="group flex items-center justify-between gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-2.5 text-left transition-all hover:border-rd-amber-line hover:bg-rd-amber-soft/10 focus:outline-none focus:ring-2 focus:ring-rd-amber pointer-coarse:min-h-rd-tactil sm:flex-col sm:items-stretch sm:justify-between sm:p-4"
        >
          <div className="flex min-w-0 items-center gap-2.5 sm:justify-between">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-md bg-rd-amber-soft text-rd-amber-ink transition-transform group-hover:scale-105 sm:order-2"
              aria-hidden="true"
            >
              <Truck className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1 sm:order-1">
              <span className="block truncate text-rd-13 font-semibold text-rd-ink group-hover:text-rd-amber-ink sm:text-rd-13-5">
                En movimiento hoy
              </span>
              <p className="m-0 truncate text-rd-11-5 text-rd-ink-meta sm:hidden">
                {detalleMovimiento}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right sm:mt-3 sm:text-left">
            <span className="font-rd text-rd-20 font-bold leading-none tracking-rd-titulo text-rd-ink tabular-nums sm:text-rd-28">
              {totalMovimiento}
            </span>
            <p className="m-0 mt-2 hidden text-rd-12 leading-snug text-rd-ink-meta sm:block">
              {detalleMovimiento}
            </p>
          </div>
        </button>

        {/* Card 3: Completadas */}
        <button
          type="button"
          onClick={() => onAccion('#reportes')}
          className="group flex items-center justify-between gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-2.5 text-left transition-all hover:border-rd-green-line hover:bg-rd-green-soft/10 focus:outline-none focus:ring-2 focus:ring-rd-green pointer-coarse:min-h-rd-tactil sm:flex-col sm:items-stretch sm:justify-between sm:p-4"
        >
          <div className="flex min-w-0 items-center gap-2.5 sm:justify-between">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-md bg-rd-green-soft text-rd-green transition-transform group-hover:scale-105 sm:order-2"
              aria-hidden="true"
            >
              <Check className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1 sm:order-1">
              <span className="block truncate text-rd-13 font-semibold text-rd-ink group-hover:text-rd-green sm:text-rd-13-5">
                Entregas completadas
              </span>
              <p className="m-0 truncate text-rd-11-5 text-rd-ink-meta sm:hidden">
                {detalleCompletadas}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right sm:mt-3 sm:text-left">
            <span className="font-rd text-rd-20 font-bold leading-none tracking-rd-titulo text-rd-ink tabular-nums sm:text-rd-28">
              {totalCompletadas}
            </span>
            <p className="m-0 mt-2 hidden text-rd-12 leading-snug text-rd-ink-meta sm:block">
              {detalleCompletadas}
            </p>
          </div>
        </button>
      </div>
    </Caja>
  );
};

const Resumen: React.FC<{ modulos: ModulosCuenta; datos: Parameters<typeof kpisDe>[1]; pasosOcultos: boolean; onOcultarPasos: () => void; onAccion: (al: string) => void }> = ({ modulos, datos, pasosOcultos, onOcultarPasos, onAccion }) => {
  const [pasosDesplegados, setPasosDesplegados] = useState(false);
  const sinModulos = !modulos.pide && !modulos.ofrece;
  const pendientes = pendientesDe(modulos, datos);
  const decisiones = pendientes.filter((p) => p.grupo === 'decision');
  const operaciones = pendientes.filter((p) => p.grupo === 'operacion');
  const historias = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'confirmada' && s.cierre?.historia) : [];
  const pasos = [
    { id: 'publicar', t: 'Publica lo que puedes dar o lo que te hace falta', d: 'Es lo que te pone en el mapa.', hecho: !sinModulos, accion: <Button nivel="terciario" tamano="sm" onClick={() => irA(RUTAS.ofrecer)}>Ofrecer ayuda</Button> },
    { id: 'verificar', t: 'Verifica la organización', d: 'Con la insignia, quien te lee sabe que existes y quién responde.', hecho: ORG.verificacion === 'verificada', accion: <Button nivel="terciario" tamano="sm" onClick={() => irA(`${RUTAS.perfil}#datos`)}>Adjuntar</Button> },
    { id: 'equipo', t: 'Registra a quien entrega', d: 'Para poder asignar entregas y saber quién las lleva.', hecho: EQUIPO.length > 0, accion: <Button nivel="terciario" tamano="sm" aria-label="Ver mi equipo" onClick={() => onAccion('#equipo')}>Ver</Button> },
    { id: 'avisos', t: 'Revisa cómo te avisamos', d: 'Elige si algo te llega por WhatsApp, por correo o solo aquí.', hecho: ORG.canalesRevisados, accion: <Button nivel="terciario" tamano="sm" aria-label="Ver mis canales" onClick={() => irA(`${RUTAS.perfil}#avisos`)}>Ver</Button> },
  ];
  const listos = pasos.filter((p) => p.hecho).length;
  return (
    <>
      {sinModulos && (
        <Caja className="col-span-full">
          <p className="mb-4 text-rd-14 text-rd-ink-2">Empieza por una de las dos:</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['pedir', 'ofrecer'] as const).map((k) => {
              const p = PUERTAS[k];
              return (
                <div key={k} className="flex flex-col gap-3 rounded-rd-lg border border-rd-line bg-rd-surface p-4">
                  <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-rd-md text-white ${k === 'pedir' ? 'bg-rd-coral' : 'bg-rd-navy'}`}>
                    {k === 'pedir' ? <Hand className="h-5.5 w-5.5" /> : <HeartHandshake className="h-5.5 w-5.5" />}
                  </span>
                  <h2 className="font-rd m-0 text-rd-15 font-semibold text-rd-ink">{p.titulo}</h2>
                  <p className="m-0 text-rd-13-5 leading-normal text-rd-ink-2">{p.texto}</p>
                  <p className="m-0 text-rd-12 text-rd-ink-meta">
                    Abre: <b className="font-semibold text-rd-ink-2">{p.abre.join(', ')}</b>
                  </p>
                  <Button nivel={k === 'pedir' ? 'pedir' : 'primario'} tamano="md" className="mt-auto self-start" onClick={() => irA(k === 'pedir' ? RUTAS.pedir : RUTAS.ofrecer)}>
                    {p.titulo}
                  </Button>
                </div>
              );
            })}
          </div>
        </Caja>
      )}
      {!sinModulos && (
        <PulsoOperativo modulos={modulos} datos={datos} onAccion={onAccion} />
      )}
      {/* Dos niveles: lo que hay que responder ya y lo que está en curso. Cada fila trae su acción. */}
      {!sinModulos && (
        <>
          <div id="seccion-decisiones" className="col-span-full xl:col-span-6 scroll-mt-4">
            <Caja titulo="Decisiones inmediatas" className="h-full w-full">
              <ListaPendientes lista={decisiones} vacio={{ icono: <Check className="h-6.5 w-6.5" />, titulo: 'Sin decisiones pendientes', texto: 'Cuando alguien pida de tus ofertas o te llegue una entrega, aparece aquí para responder.' }} onAccion={onAccion} />
            </Caja>
          </div>
          <div className="col-span-full xl:col-span-6 scroll-mt-4">
            <Caja titulo="Operaciones del día" className="h-full w-full">
              <ListaPendientes lista={operaciones} vacio={{ icono: <Truck className="h-6.5 w-6.5" />, titulo: 'Sin operaciones en curso', texto: 'Lo que esté por asignar, en camino o por certificar aparece aquí.' }} onAccion={onAccion} />
            </Caja>
          </div>
        </>
      )}
      {historias.length > 0 && (
        <Caja
          titulo="Historias de impacto"
          className="col-span-full"
          accion={
            <Button nivel="terciario" tamano="md" onClick={() => onAccion('#seguimiento')}>
              Ver
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {historias.map((s) => (
              <figure key={s.id} className="m-0 flex flex-col gap-2 rounded-rd-lg border border-rd-line bg-rd-surface p-4">
                <blockquote className="m-0 text-rd-13-5 leading-normal text-rd-ink">«{s.cierre?.historia}»</blockquote>
                <figcaption className="mt-auto text-rd-12 text-rd-ink-meta">
                  {cifra(s.cant)} {s.u} de {s.rec.toLowerCase()}
                  <Divisor />
                  {s.quien}
                  <Divisor />
                  {s.cuando}
                </figcaption>
              </figure>
            ))}
          </div>
        </Caja>
      )}
      <Caja titulo="Actividad reciente" className="col-span-full">
        {sinModulos ? (
          <Vacio icono={<Clock className="h-6.5 w-6.5" />} titulo="Sin actividad todavía" texto="Aquí queda lo que pase con tus publicaciones y entregas." />
        ) : (
          ACTIVIDAD.map((a, i) => (
            <div key={i} className={`flex gap-3 py-2 text-rd-13 ${i ? 'border-t border-rd-line-soft' : 'pt-0'}`}>
              <time className="w-16 shrink-0 text-rd-ink-meta tabular-nums">{a.cuando}</time>
              <span className="text-rd-ink">{a.texto}</span>
            </div>
          ))
        )}
      </Caja>
      {!pasosOcultos && listos < pasos.length && (
        <Caja
          className="col-span-full border-rd-line bg-rd-surface"
          titulo={
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5">
                <ListChecks aria-hidden="true" className="h-4.5 w-4.5 text-rd-navy" />
                <span>Primeros pasos</span>
              </span>
              <Conteo n={`${listos} de ${pasos.length}`} />
              <span className="hidden text-rd-12 font-normal text-rd-ink-meta sm:inline">
                <Divisor />
                Guía de puesta en marcha
              </span>
            </div>
          }
          accion={
            <div className="flex items-center gap-2">
              <Button
                nivel="secundario"
                tamano="md"
                onClick={() => setPasosDesplegados((v) => !v)}
                iconoDespues={
                  pasosDesplegados ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                }
              >
                {pasosDesplegados ? 'Plegar' : 'Ver pasos'}
              </Button>
              <Button nivel="terciario" tamano="md" onClick={onOcultarPasos}>
                Ocultar
              </Button>
            </div>
          }
        >
          {pasosDesplegados ? (
            <div className="mt-2 space-y-0 divide-y divide-rd-line-soft border-t border-rd-line-soft pt-1">
              {pasos.map((p) => (
                <div key={p.id} className="flex items-start gap-3 py-3">
                  {p.hecho ? (
                    <Check aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-green" />
                  ) : (
                    <CircleDashed aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-ink-3" />
                  )}
                  <div className="min-w-0 flex-1">
                    <b className={`block text-rd-13-5 font-semibold ${p.hecho ? 'text-rd-ink-meta line-through' : 'text-rd-ink'}`}>
                      <span className="sr-only">{p.hecho ? 'Hecho: ' : 'Pendiente: '}</span>
                      {p.t}
                    </b>
                    <span className="text-rd-12-5 text-rd-ink-2">{p.d}</span>
                  </div>
                  {!p.hecho && <div className="shrink-0">{p.accion}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-rd-13 text-rd-ink-2">
              Te faltan {pasos.length - listos} {pasos.length - listos === 1 ? 'paso' : 'pasos'} para completar la configuración de tu organización. Toca «Ver pasos» para completarlos cuando tengas tiempo.
            </p>
          )}
        </Caja>
      )}
    </>
  );
};

/* ---------- módulo pide ---------- */

const BarraAvance: React.FC<{ hecho: number; camino: number; texto: string }> = ({ hecho, camino, texto }) => (
  <>
    <Barra
      etiqueta={texto}
      tramos={[
        { tono: 'confirmada', porcentaje: hecho },
        { tono: 'camino', porcentaje: camino },
      ]}
    />
    <span className="mt-1 block text-rd-12 text-rd-ink-meta">{texto}</span>
  </>
);

const MisNecesidades: React.FC<{
  recursos: RecursoPedido[];
  solicitudesEnviadas?: SolicitudEnviada[];
  matchesPorRecurso?: Map<string, CoincidenciaPublicacion[]>;
  onVerMatches?: (recursoNombre: string) => void;
  onVerPublicacion?: () => void;
  onEditar: (r: RecursoPedido) => void;
  onTogglePausa: (r: RecursoPedido) => void;
  onCancelarSolicitudEnviada?: (id: number | string) => void;
  onIrASeguimiento?: () => void;
}> = ({
  recursos,
  solicitudesEnviadas = [],
  matchesPorRecurso,
  onVerMatches,
  onVerPublicacion,
  onEditar,
  onTogglePausa,
  onCancelarSolicitudEnviada,
}) => {
  // Las solicitudes aceptadas pasan 100% al tablero de Seguimiento (Ayuda que recibo)
  const solicitudesVisibles = useMemo(
    () => solicitudesEnviadas.filter((s) => s.estado !== 'aceptada'),
    [solicitudesEnviadas],
  );

  return (
    <>
      <Caja titulo="Mis necesidades" plana>
        <Tabla
          etiqueta="Mis necesidades"
          filas={recursos}
          clave={(r) => r.n}
          columnas={[
            {
              k: 'recurso',
              etiqueta: 'Recurso',
              celda: (r) => (
                <span className="flex items-start gap-2">
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-rd-sm border border-rd-line bg-rd-sunken text-rd-ink-2">
                    <IconoRecursoDe nombre={r.icono} className="h-3.75 w-3.75" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <b className={`font-semibold ${r.pausado ? 'text-rd-ink-meta line-through' : ''}`}>{r.n}</b>
                      {r.pausado && (
                        <span className="rounded-full bg-rd-sunken px-1.5 py-0.5 text-rd-10 font-semibold text-rd-amber-ink uppercase tracking-wider">
                          Pausada
                        </span>
                      )}
                    </span>
                    <small className="block text-rd-12 text-rd-ink-meta">{r.para}</small>
                  </span>
                </span>
              ),
            },
            {
              k: 'falta',
              etiqueta: 'Falta',
              celda: (r) => {
                /* Una sola línea, «N de M», como manda el manual: apilar cifra y total se veía
                   apeñuscado (Alejandro, 16 de septiembre de 2026). */
                const falta = Math.max(0, r.total - r.confirmada - r.camino);
                return <b className="font-semibold tabular-nums">{falta === 0 ? 'Nada' : `${cifra(falta)} de ${cifra(r.total)} ${r.unidad}`}</b>;
              },
            },
            {
              k: 'avance',
              etiqueta: 'Avance',
              ancha: true,
              celda: (r) => <BarraAvance hecho={Math.round((r.confirmada / r.total) * 100)} camino={Math.round((r.camino / r.total) * 100)} texto={`${cifra(r.confirmada)} confirmado, ${cifra(r.camino)} en camino`} />,
            },
            {
              k: 'acc',
              etiqueta: 'Acciones',
              acc: true,
              celda: (r) => {
                const matches = matchesPorRecurso?.get(r.n) ?? [];
                return (
                  /* `max-xl:flex-1`: en móvil la celda de acciones es el pie de la tarjeta y este
                     bloque es uno de sus hijos; sin ocupar el ancho, su `justify-end` no empuja nada
                     y el ⋮ se quedaba a la izquierda (Alejandro, 25 de septiembre de 2026). */
                  <div className="flex max-xl:flex-1 items-center justify-end gap-2">
                    {matches.length > 0 && (
                      <FilaSugerencias
                        n={matches.length}
                        total={(matches as any).total ?? matches.length}
                        onVer={() => onVerMatches?.(r.n)}
                        compacta
                        tamano="sm"
                        variante="suave"
                        brillo={false}
                      />
                    )}
                    <MenuAcciones
                      items={[
                        {
                          texto: 'Ver',
                          icono: <Eye className="h-4 w-4" />,
                          onElegir: () => onVerPublicacion?.(),
                        },
                        {
                          texto: 'Editar',
                          icono: <Edit3 className="h-4 w-4" />,
                          onElegir: () => onEditar(r),
                        },
                        {
                          texto: r.pausado ? 'Reanudar recurso' : 'Pausar recurso',
                          icono: r.pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />,
                          onElegir: () => onTogglePausa(r),
                        },
                      ]}
                      etiqueta={`Acciones de ${r.n}`}
                      tamano="md"
                      nivel="secundario"
                      flotante
                      className="shadow-2xs"
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </Caja>

      <Caja
        plana
        className="col-span-full mt-6 border-t-4 border-rd-line pt-8"
        titulo={
          <span className="flex items-center gap-2">
            <span>Mis solicitudes a organizaciones</span>
            {solicitudesVisibles.length > 0 && <Conteo n={solicitudesVisibles.length} />}
          </span>
        }
      >
        {solicitudesVisibles.length === 0 ? (
          <Vacio
            icono={<Megaphone className="h-6 w-6 text-rd-ink-2" />}
            titulo="Sin solicitudes directas enviadas"
            texto="Cuando encuentres una oferta de ayuda en el Radar y pidas recursos directamente a una organización, podrás ver aquí el estado de tu solicitud."
            accion={
              <Button nivel="secundario" tamano="md" onClick={() => irA(`${RUTAS.radar}?tipo=oferta`)}>
                Ver ofertas en el Radar
              </Button>
            }
          />
        ) : (
          <Tabla
            etiqueta="Solicitudes a organizaciones"
            filas={solicitudesVisibles}
            clave={(s) => String(s.id)}
            columnas={[
              {
                k: 'donante',
                etiqueta: 'Organización donante',
                celda: (s) => (
                  <div className="min-w-0">
                    <b className="block font-semibold text-rd-ink">{s.donante}</b>
                    {s.donanteTipo && <small className="block text-rd-12 text-rd-ink-meta">{s.donanteTipo}</small>}
                    {s.contacto?.tel && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-rd-12 text-rd-ink-2">
                        <Phone className="h-3 w-3 text-rd-ink-3" />
                        {s.contacto.tel}
                        {s.contacto.wa && <IconoWhatsApp className="h-3 w-3 text-rd-whatsapp" />}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                k: 'recurso',
                etiqueta: 'Recurso solicitado',
                celda: (s) => (
                  <span className="flex items-center gap-2">
                    {s.icono && (
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-rd-sm border border-rd-line bg-rd-sunken text-rd-ink-2">
                        <IconoRecursoDe nombre={s.icono} className="h-3.75 w-3.75" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <b className="font-semibold text-rd-ink">{cifra(s.cant)} {s.u}</b>
                      <small className="block text-rd-12 text-rd-ink-meta">{s.rec}</small>
                    </span>
                  </span>
                ),
              },
              {
                k: 'cuando',
                etiqueta: 'Radicado',
                celda: (s) => (
                  <span className="text-rd-12-5 text-rd-ink-2 inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-rd-ink-3" />
                    {s.cuando}
                  </span>
                ),
              },
              {
                k: 'estado',
                etiqueta: 'Estado',
                estado: true,
                celda: (s) => {
                  if (s.estado === 'en_revision') {
                    return (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rd-amber-soft px-2.5 py-0.5 text-rd-11 font-semibold text-rd-amber-ink">
                          <Clock className="h-3 w-3" />
                          En revisión
                        </span>
                        <small className="mt-1 block text-rd-11 text-rd-ink-meta">Esperando respuesta de la entidad</small>
                      </div>
                    );
                  }
                  if (s.estado === 'declinada') {
                    return (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rd-sunken px-2.5 py-0.5 text-rd-11 font-semibold text-rd-ink-2">
                          <X className="h-3 w-3" />
                          Declinada
                        </span>
                        {s.motivo && <small className="mt-1 block text-rd-11 text-rd-ink-meta leading-tight">{s.motivo}</small>}
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center rounded-full bg-rd-sunken px-2.5 py-0.5 text-rd-11 font-medium text-rd-ink-meta">
                        Cancelada
                      </span>
                      {s.motivoCancelacion && (
                        <small className="mt-1 block text-rd-11 text-rd-ink-meta leading-tight">{s.motivoCancelacion}</small>
                      )}
                    </div>
                  );
                },
              },
              {
                k: 'acc',
                etiqueta: 'Acción',
                acc: true,
                celda: (s) => {
                  if (s.estado === 'en_revision') {
                    return (
                      <Button
                        nivel="secundario"
                        tamano="md"
                        className="shadow-2xs"
                        onClick={() => onCancelarSolicitudEnviada?.(s.id)}
                      >
                        Cancelar
                      </Button>
                    );
                  }
                  return null;
                },
              },
            ]}
          />
        )}
      </Caja>
    </>
  );
};




/* ---------- reportes: las actas de entrega ---------- */

const fotosDeActa = (a: Acta) => listaFotos(a.origen.tipo === 'solicitud' ? fotosDeEntrega(a.origen.id) : fotosDeRecibida(a.origen.id));

/** Una acta por entrega confirmada, de las dos caras. La tabla desde 1280; tarjeta por debajo.
 *  Ver acta abre el acta completa; el menú de opciones permite descargar en PDF. */
const Reportes: React.FC<{
  actas: Acta[];
  onVer: (a: Acta) => void;
  onDescargar: (a: Acta) => void;
  onVerFotos: (a: Acta, i: number) => void;
}> = ({ actas, onVer, onDescargar, onVerFotos }) => {
  const r = resumenActas(actas);
  return (
    <Caja
      plana
      titulo={
        <>
          Actas de entrega{actas.length > 0 && <Conteo n={actas.length} />}
        </>
      }
    >
      {actas.length === 0 ? (
        <Vacio icono={<FileText className="h-6.5 w-6.5" />} titulo="Todavía no hay entregas confirmadas" texto="Cada entrega confirmada deja aquí su acta: quién entregó, quién recibió, qué, cuándo y las fotos de los dos lados." />
      ) : (
        <>
          <p className="m-0 mb-3 text-rd-12-5 text-rd-ink-2">
            {r.actas} {r.actas === 1 ? 'entrega confirmada' : 'entregas confirmadas'} con {r.organizaciones} {r.organizaciones === 1 ? 'organización' : 'organizaciones'}
          </p>
          <Tabla
            etiqueta="Actas de entrega"
            filas={actas}
            clave={(a) => a.codigo}
            tarjeta={(a) => (
              <div
                key={a.codigo}
                className="flex flex-col gap-2.5 rounded-rd-lg border border-rd-line bg-rd-surface p-3 transition-colors hover:border-rd-line-strong"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="font-semibold text-rd-ink tabular-nums text-rd-13">
                      {a.codigo}
                    </span>
                    <span className="text-rd-12 text-rd-ink-meta">
                      <Divisor />
                      {a.fechaTexto}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-rd-13-5 font-semibold text-rd-ink">
                    {cifra(a.cant)} {a.u} de {a.rec.toLowerCase()}
                  </div>
                  <div className="mt-0.5 truncate text-rd-12 text-rd-ink-2">
                    {a.entrego} → {a.recibio}
                  </div>
                </div>

                {/* Los botones al pie de la tarjeta, con línea arriba, como en el tablero y en las
                    filas de tabla en móvil (Alejandro, 25 de septiembre de 2026). */}
                <div className="flex items-center gap-1.5 border-t border-rd-line-soft pt-2.5">
                  <Button nivel="secundario" tamano="md" className="shadow-2xs" onClick={() => onVer(a)}>
                    Ver
                  </Button>
                  <span className="ml-auto flex">
                  <MenuAcciones
                    tamano="md"
                    flotante
                    etiqueta={`Más acciones del acta ${a.codigo}`}
                    items={[
                      { texto: 'Descargar', icono: <Download className="h-4 w-4" />, onElegir: () => onDescargar(a) },
                    ]}
                    className="shadow-2xs"
                  />
                  </span>
                </div>
              </div>
            )}
            columnas={[
              {
                k: 'acta',
                etiqueta: 'Acta',
                celda: (a) => (
                  <>
                    <b className="font-semibold tabular-nums">{a.codigo}</b>
                    <small className="block text-rd-12 text-rd-ink-meta">{a.fechaTexto}</small>
                  </>
                ),
              },
              {
                k: 'que',
                etiqueta: 'Qué',
                celda: (a) => (
                  <b className="font-semibold">
                    {cifra(a.cant)} {a.u} de {a.rec.toLowerCase()}
                  </b>
                ),
              },
              {
                k: 'entrego',
                etiqueta: 'Entregó',
                celda: (a) => (
                  a.lado === 'ofrece' ? (
                    <span>
                      {a.entrego}
                      {a.lleva ? <small className="block text-rd-12 text-rd-ink-meta">{a.lleva}</small> : null}
                    </span>
                  ) : (
                    a.entrego
                  )
                ),
              },
              { k: 'recibio', etiqueta: 'Recibió', celda: (a) => a.recibio },
              {
                k: 'cierre',
                etiqueta: 'Cierre',
                celda: (a) => (
                  <>
                    <span className="block text-rd-12-5">{a.confirmacion}</span>
                    {fotosDeActa(a).length > 0 && <TiraFotos fotos={fotosDeActa(a)} tamano="sm" onAbrir={(i) => onVerFotos(a, i)} className="mt-1.5" />}
                  </>
                ),
              },
              {
                k: 'acc',
                etiqueta: 'Acciones',
                acc: true,
                celda: (a) => (
                  <>
                    <Button nivel="secundario" tamano="md" className="shadow-2xs" onClick={() => onVer(a)}>
                      Ver
                    </Button>
                    <span className="flex max-xl:ml-auto">
                      <MenuAcciones
                        tamano="md"
                        etiqueta={`Más acciones del acta ${a.codigo}`}
                        items={[
                          { texto: 'Descargar', icono: <Download className="h-4 w-4" />, onElegir: () => onDescargar(a) },
                        ]}
                        className="shadow-2xs"
                      />
                    </span>
                  </>
                ),
              },
            ]}
          />
        </>
      )}
    </Caja>
  );
};

/** El acta completa: Certificado oficial de entrega y recepción en formato institucional,
 *  con desglose bilateral, detalle de insumos, testimonio comunitario, soportes y firmas en PDF. */
const DialogoActa: React.FC<{
  acta: Acta | null;
  onCerrar: () => void;
  onDescargar: (a: Acta) => void;
  onVerFotos: (a: Acta, i: number) => void;
}> = ({ acta: a, onCerrar, onDescargar, onVerFotos }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (a !== null && !d.open) d.showModal();
    else if (a === null && d.open) d.close();
  }, [a]);

  if (!a) return null;

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="font-rd m-auto w-full max-w-2xl rounded-rd-xl border border-rd-line bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-3 max-sm:w-auto overflow-hidden max-h-[92dvh] flex flex-col"
    >
      {/* Cabecera del diálogo en pantalla */}
      <div className="no-print flex items-center justify-between border-b border-rd-line px-5 py-3.5 bg-rd-surface shrink-0">
        <div>
          <span className="text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta block leading-none">
            Acta oficial de entrega
          </span>
          <span className="font-mono text-rd-14 font-bold text-rd-ink mt-0.5 block leading-tight">
            {a.codigo}
          </span>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar acta"
          className="rounded-rd-md p-1.5 text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Contenedor desplazable con el documento oficial */}
      <div className="overflow-y-auto p-5 sm:p-6 grow">
        <div id="documento-acta-imprimible" className="rounded-rd-lg border border-rd-line bg-rd-surface p-5 sm:p-6">
          {/* Membrete institucional */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-rd-line">
            <div className="flex items-center gap-3">
              <img src="/logo-radar.svg" alt="RaDAR" className="h-7 w-auto" />
              <div>
                <p className="m-0 text-rd-12 font-bold tracking-tight text-rd-ink uppercase">
                  RaDAR
                  <Divisor />
                  Aquí Hace Falta
                </p>
                <p className="m-0 text-rd-11 text-rd-ink-meta">
                  Red de Apoyo y Distribución de Ayuda
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="m-0 font-mono text-rd-13 font-bold text-rd-ink tabular-nums">
                {a.codigo}
              </p>
              <p className="m-0 text-rd-11 text-rd-ink-meta">
                Fecha: <span className="font-semibold text-rd-ink">{a.fechaTexto}</span>
              </p>
            </div>
          </div>

          {/* Título formal del documento */}
          <div className="mt-4 mb-4">
            <h3 className="font-rd m-0 text-rd-16 font-semibold text-rd-ink tracking-tight">
              Acta de Entrega y Recepción de Ayuda
            </h3>
            <p className="m-0 mt-0.5 text-rd-13-5 text-rd-ink-2">
              Constancia bilateral de entrega en territorio y verificación de insumos
            </p>
          </div>

          {/* Cuadrícula bilateral de entidades intervinientes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            {/* Lado A: Entrega */}
            <div className="rounded-rd-md border border-rd-line bg-rd-surface p-3.5">
              <span className="block text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta mb-1">
                Entidad que entrega
              </span>
              <p className="m-0 text-rd-14 font-bold text-rd-ink">
                {a.entrego}
              </p>
              <p className="m-0 mt-0.5 text-rd-11 text-rd-ink-2">
                {a.lado === 'ofrece' ? 'Nuestra organización (Titular de oferta)' : 'Organización cooperante'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-rd-line text-rd-11 text-rd-ink-meta flex items-center justify-between">
                <span>Llevó / Transporte:</span>
                <b className="text-rd-ink font-semibold">{a.lleva || 'Despacho directo'}</b>
              </div>
            </div>

            {/* Lado B: Recibe */}
            <div className="rounded-rd-md border border-rd-line bg-rd-surface p-3.5">
              <span className="block text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta mb-1">
                Entidad / Persona que recibe
              </span>
              <p className="m-0 text-rd-14 font-bold text-rd-ink">
                {a.recibio}
              </p>
              <p className="m-0 mt-0.5 text-rd-11 text-rd-ink-2">
                {a.lado === 'pide' ? 'Nuestra organización (Punto receptor)' : 'Comunidad / Beneficiario registrado'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-rd-line text-rd-11 text-rd-ink-meta flex items-center justify-between">
                <span>Verificación:</span>
                <b className="text-rd-ink font-semibold">{a.confirmacion}</b>
              </div>
            </div>
          </div>

          {/* Especificación de bienes */}
          <div className="border-t border-rd-line-soft pt-3.5 mb-3.5">
            <span className="block text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta mb-1">
              Recurso entregado y certificado
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-rd-20 font-extrabold text-rd-ink">
                {cifra(a.cant)} {a.u}
              </span>
              <span className="text-rd-14 font-semibold text-rd-ink-2">
                de {a.rec.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Observaciones y constancia operativa */}
          {(a.notasCamino || a.notasEntrega || a.notasRecibe) && (
            <div className="border-t border-rd-line-soft pt-3.5 mb-3.5 space-y-2.5">
              <span className="block text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                Observaciones y constancia operativa
              </span>
              {a.notasCamino && (
                <div className="text-rd-12">
                  <span className="font-semibold text-rd-ink flex items-center gap-1.5 mb-0.5">
                    <Truck className="h-3.5 w-3.5 text-rd-navy" />
                    Notas de despacho y transporte en ruta:
                  </span>
                  <p className="m-0 text-rd-ink-2 pl-5 italic">«{a.notasCamino}»</p>
                </div>
              )}
              {a.notasEntrega && (
                <div className="text-rd-12">
                  <span className="font-semibold text-rd-ink flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rd-green" />
                    Constancia al certificar entrega ({a.entrego}):
                  </span>
                  <p className="m-0 text-rd-ink-2 pl-5 italic">«{a.notasEntrega}»</p>
                </div>
              )}
              {a.notasRecibe && (
                <div className="text-rd-12">
                  <span className="font-semibold text-rd-ink flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rd-navy" />
                    Constancia al confirmar recepción ({a.recibio}):
                  </span>
                  <p className="m-0 text-rd-ink-2 pl-5 italic">«{a.notasRecibe}»</p>
                </div>
              )}
            </div>
          )}

          {/* Historia de impacto humano y beneficiarios */}
          {(a.historia || a.cierre.personasBeneficiadas) && (
            <div className="border-l-3 border-brand-yellow pl-3.5 mb-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <p className="m-0 text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                  Impacto en territorio
                  <Divisor />
                  Lo que permitió
                </p>
                {a.cierre.personasBeneficiadas && (
                  <span className="rounded-rd-full bg-rd-green-soft px-2 py-0.5 text-rd-11 font-semibold text-rd-green">
                    {a.cierre.personasBeneficiadas} {a.cierre.personasBeneficiadas === 1 ? 'persona beneficiada' : 'personas beneficiadas'}
                  </span>
                )}
              </div>
              {a.historia && (
                <blockquote className="m-0 text-rd-13 leading-relaxed text-rd-ink italic">
                  «{a.historia}»
                </blockquote>
              )}
            </div>
          )}

          {/* Soporte fotográfico */}
          {fotosDeActa(a).length > 0 && (
            <div className="border-t border-rd-line-soft pt-3.5 mb-3.5">
              <span className="block text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta mb-2">
                Soporte fotográfico ({fotosDeActa(a).length} {fotosDeActa(a).length === 1 ? 'registro' : 'registros'})
              </span>
              <TiraFotos fotos={fotosDeActa(a)} etiqueta max={4} onAbrir={(i) => onVerFotos(a, i)} />
            </div>
          )}

          {/* Firmas físicas para versión impresa / PDF */}
          <div className="print-only salto-evitar mt-8 pt-4">
            <p className="text-rd-11 font-semibold text-center mb-7 text-rd-ink">
              Firmas de constancia y conformidad de entrega:
            </p>
            <div className="grid grid-cols-2 gap-10 text-center text-rd-11">
              <div>
                <div className="border-b border-rd-ink mb-2 h-10"></div>
                <p className="font-bold text-rd-ink">{a.entrego}</p>
                <p className="text-rd-10 text-rd-ink-meta">Entregó a conformidad</p>
              </div>
              <div>
                <div className="border-b border-rd-ink mb-2 h-10"></div>
                <p className="font-bold text-rd-ink">{a.recibio}</p>
                <p className="text-rd-10 text-rd-ink-meta">Recibió a conformidad</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de acciones del diálogo en pantalla */}
      {/* Abajo solo acciones: «Cerrar» se fue porque repetía exactamente lo que hace la × de
          arriba, y la regla del 22 de septiembre dice que esa × es la salida y la única.
          Descargar no cambia nada que otros vean, así que no es nivel 1: la 223 C8 pone
          «Imprimir» y «Exportar en CSV» en secundario y esto es lo mismo. */}
      <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-rd-line px-5 py-3.5 bg-rd-surface shrink-0 max-sm:flex-col max-sm:items-stretch">
        <Button nivel="secundario" tamano="lg" icono={<Download className="h-4 w-4" />} onClick={() => onDescargar(a)}>
          Descargar
        </Button>
      </div>
    </dialog>
  );
};

/* ---------- módulo ofrece ---------- */

const MisOfertas: React.FC<{
  recursos: RecursoOfrecido[];
  sol: Solicitud[];
  ofrecimientosEnviados?: OfrecimientoEnviado[];
  matchesPorRecurso?: Map<string, CoincidenciaPublicacion[]>;
  onVerMatches?: (recursoNombre: string) => void;
  onVerPublicacion?: () => void;
  onEditar: (r: RecursoOfrecido) => void;
  onTogglePausa: (r: RecursoOfrecido) => void;
  onCancelarOfrecimientoEnviado?: (id: number | string) => void;
  onIrASeguimiento?: () => void;
}> = ({
  recursos,
  sol,
  ofrecimientosEnviados = [],
  matchesPorRecurso,
  onVerMatches,
  onVerPublicacion,
  onEditar,
  onTogglePausa,
  onCancelarOfrecimientoEnviado,
}) => {
  // Los ofrecimientos aceptados pasan 100% al tablero de Seguimiento (Ayuda que entrego)
  const ofrecimientosVisibles = useMemo(
    () => ofrecimientosEnviados.filter((o) => o.estado !== 'aceptado'),
    [ofrecimientosEnviados],
  );

  return (
    <>
      <Caja titulo="Mis ofertas" plana>
        <Tabla
          etiqueta="Mis ofertas"
          filas={recursos}
          clave={(r) => r.n}
          columnas={[
            {
              k: 'recurso',
              etiqueta: 'Recurso',
              celda: (r) => (
                <span className="flex items-start gap-2">
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-rd-sm border border-rd-line bg-rd-sunken text-rd-ink-2">
                    <IconoRecursoDe nombre={r.icono} className="h-3.75 w-3.75" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <b className={`font-semibold ${r.pausado ? 'text-rd-ink-meta line-through' : ''}`}>{r.n}</b>
                      {r.pausado && (
                        <span className="rounded-full bg-rd-sunken px-1.5 py-0.5 text-rd-10 font-semibold text-rd-amber-ink uppercase tracking-wider">
                          Pausada
                        </span>
                      )}
                    </span>
                    <small className="block text-rd-12 text-rd-ink-meta">{r.pres}</small>
                  </span>
                </span>
              ),
            },
            {
              k: 'quedan',
              etiqueta: 'Quedan',
              celda: (r) => {
                const q = quedan(sol, r);
                return (
                  <b className="font-semibold tabular-nums">
                    {cifra(q)} de {cifra(r.total)} {unidad(r.total, r.unidad)}
                  </b>
                );
              },
            },
            {
              k: 'avance',
              etiqueta: 'Avance',
              ancha: true,
              celda: (r) => {
                const conf = cantidadPorEstado(sol, r.n, ['confirmada']);
                const porConf = cantidadPorEstado(sol, r.n, ['entregada']);
                const camino = cantidadPorEstado(sol, r.n, ['camino']);
                const texto = [`${cifra(conf)} confirmado`, porConf ? `${cifra(porConf)} entregado por confirmar` : '', camino ? `${cifra(camino)} en camino` : ''].filter(Boolean).join(', ');
                return <BarraAvance hecho={Math.round((conf / r.total) * 100)} camino={Math.round(((porConf + camino) / r.total) * 100)} texto={texto} />;
              },
            },
            { k: 'disp', etiqueta: 'Disponible', celda: (r) => r.disp },
            { k: 'como', etiqueta: 'Cómo', celda: () => 'Lo llevamos, 15 km' },
            {
              k: 'acc',
              etiqueta: 'Acciones',
              acc: true,
              celda: (r) => {
                const matches = matchesPorRecurso?.get(r.n) ?? [];
                return (
                  /* `max-xl:flex-1`: en móvil la celda de acciones es el pie de la tarjeta y este
                     bloque es uno de sus hijos; sin ocupar el ancho, su `justify-end` no empuja nada
                     y el ⋮ se quedaba a la izquierda (Alejandro, 25 de septiembre de 2026). */
                  <div className="flex max-xl:flex-1 items-center justify-end gap-2">
                    {matches.length > 0 && (
                      <FilaSugerencias
                        n={matches.length}
                        total={(matches as any).total ?? matches.length}
                        onVer={() => onVerMatches?.(r.n)}
                        compacta
                        tamano="sm"
                        variante="suave"
                        brillo={false}
                      />
                    )}
                    <MenuAcciones
                      items={[
                        {
                          texto: 'Ver',
                          icono: <Eye className="h-4 w-4" />,
                          onElegir: () => onVerPublicacion?.(),
                        },
                        {
                          texto: 'Editar',
                          icono: <Edit3 className="h-4 w-4" />,
                          onElegir: () => onEditar(r),
                        },
                        {
                          texto: r.pausado ? 'Reanudar recurso' : 'Pausar recurso',
                          icono: r.pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />,
                          onElegir: () => onTogglePausa(r),
                        },
                      ]}
                      etiqueta={`Acciones de ${r.n}`}
                      tamano="md"
                      nivel="secundario"
                      flotante
                      className="shadow-2xs"
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </Caja>

      <Caja
        plana
        className="col-span-full mt-6 border-t-4 border-rd-line pt-8"
        titulo={
          <span className="flex items-center gap-2">
            <span>Ayudas ofrecidas a comunidades</span>
            {ofrecimientosVisibles.length > 0 && <Conteo n={ofrecimientosVisibles.length} />}
          </span>
        }
      >
        {ofrecimientosVisibles.length === 0 ? (
          <Vacio
            icono={<HeartHandshake className="h-6 w-6 text-rd-ink-2" />}
            titulo="Sin ofrecimientos directos a comunidades"
            texto="Cuando encuentres una necesidad urgente en el Radar y ofrezcas ayuda directamente a una comunidad, podrás ver aquí el estado de tu propuesta."
          />
        ) : (
          <Tabla
            etiqueta="Ayudas ofrecidas a comunidades"
            filas={ofrecimientosVisibles}
            clave={(o) => String(o.id)}
            columnas={[
              {
                k: 'comunidad',
                etiqueta: 'Comunidad / Necesidad',
                celda: (o) => (
                  <div className="min-w-0">
                    <b className="block font-semibold text-rd-ink">{o.comunidad}</b>
                    {o.lugar && <small className="block text-rd-12 text-rd-ink-meta">{o.lugar}</small>}
                    {o.contacto?.tel && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-rd-12 text-rd-ink-2">
                        <Phone className="h-3 w-3 text-rd-ink-3" />
                        {o.contacto.nombre ? `${o.contacto.nombre}, ${o.contacto.tel}` : o.contacto.tel}
                        {o.contacto.wa && <IconoWhatsApp className="h-3 w-3 text-rd-whatsapp" />}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                k: 'recurso',
                etiqueta: 'Recurso ofrecido',
                celda: (o) => (
                  <span className="flex items-center gap-2">
                    {o.icono && (
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-rd-sm border border-rd-line bg-rd-sunken text-rd-ink-2">
                        <IconoRecursoDe nombre={o.icono} className="h-3.75 w-3.75" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <b className="font-semibold text-rd-ink">{cifra(o.cant)} {o.u}</b>
                      <small className="block text-rd-12 text-rd-ink-meta">{o.rec}</small>
                    </span>
                  </span>
                ),
              },
              {
                k: 'cuando',
                etiqueta: 'Ofrecido',
                celda: (o) => (
                  <span className="text-rd-12-5 text-rd-ink-2 inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-rd-ink-3" />
                    {o.cuando}
                  </span>
                ),
              },
              {
                k: 'estado',
                etiqueta: 'Estado',
                estado: true,
                celda: (o) => {
                  if (o.estado === 'pendiente') {
                    return (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rd-amber-soft px-2.5 py-0.5 text-rd-11 font-semibold text-rd-amber-ink">
                          <Clock className="h-3 w-3" />
                          En espera de respuesta
                        </span>
                        <small className="mt-1 block text-rd-11 text-rd-ink-meta">Esperando respuesta del líder comunitario</small>
                      </div>
                    );
                  }
                  if (o.estado === 'declinado') {
                    return (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rd-sunken px-2.5 py-0.5 text-rd-11 font-semibold text-rd-ink-2">
                          <X className="h-3 w-3" />
                          Declinado
                        </span>
                        {o.motivo && <small className="mt-1 block text-rd-11 text-rd-ink-meta leading-tight">{o.motivo}</small>}
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center rounded-full bg-rd-sunken px-2.5 py-0.5 text-rd-11 font-medium text-rd-ink-meta">
                        Cancelado
                      </span>
                      {o.motivoCancelacion && (
                        <small className="mt-1 block text-rd-11 text-rd-ink-meta leading-tight">{o.motivoCancelacion}</small>
                      )}
                    </div>
                  );
                },
              },
              {
                k: 'acc',
                etiqueta: 'Acción',
                acc: true,
                celda: (o) => {
                  if (o.estado === 'pendiente') {
                    return (
                      <Button
                        nivel="secundario"
                        tamano="md"
                        className="shadow-2xs"
                        onClick={() => onCancelarOfrecimientoEnviado?.(o.id)}
                      >
                        Cancelar
                      </Button>
                    );
                  }
                  return null;
                },
              },
            ]}
          />
        )}
      </Caja>
    </>
  );
};


const COLUMNAS: { estado: Solicitud['estado']; nombre: string; vacia: string; clase: string; titulo: string; icono: React.ReactNode; soloConAlgo?: boolean }[] = [
  { estado: 'nueva', nombre: 'Solicitudes', vacia: 'Sin solicitudes por responder', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-coral text-white">
        <Megaphone className="h-3.5 w-3.5" />
      </span>
    ) },
  { estado: 'aceptada', nombre: 'Comprometida', vacia: 'Sin entregas comprometidas', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-ink-3 text-white">
        <CircleDashed className="h-3.5 w-3.5" />
      </span>
    ) },
  { estado: 'camino', nombre: 'En camino', vacia: 'Nada en camino', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-amber text-rd-ink">
        <Clock className="h-3.5 w-3.5" />
      </span>
    ) },
  { estado: 'entregada', nombre: 'Entregada', vacia: 'Sin entregas pendientes por certificar', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-navy text-white">
        <CircleDot className="h-3.5 w-3.5" />
      </span>
    ) },
  { estado: 'confirmada', nombre: 'Completada', vacia: 'Sin entregas completadas', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-green text-white">
        <Check className="h-3.5 w-3.5" />
      </span>
    ) },
  { estado: 'archivada', nombre: 'Archivadas', vacia: `Nada archivado todavía. Las completadas pasan aquí a los ${DIAS_PARA_ARCHIVAR} días`, clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-ink-3 text-white">
        <Archive className="h-3.5 w-3.5" />
      </span>
    ) },
];

const COLUMNAS_RECIBIDAS: {
  id: 'ofertas' | 'aceptada' | 'camino' | 'recibido' | 'distribuido' | 'archivadas';
  estados: EntregaRecibida['estado'][];
  nombre: string;
  vacia: string;
  clase: string;
  titulo: string;
  icono: React.ReactNode;
  soloConAlgo?: boolean;
}[] = [
  { id: 'ofertas', estados: ['nueva'], nombre: 'Ofertas', vacia: 'Sin ofertas por responder', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-coral text-white">
        <Megaphone className="h-3.5 w-3.5" />
      </span>
    ) },
  { id: 'aceptada', estados: ['aceptada'], nombre: 'Comprometido', vacia: 'Sin entregas comprometidas', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-ink-3 text-white">
        <CircleDashed className="h-3.5 w-3.5" />
      </span>
    ) },
  { id: 'camino', estados: ['camino', 'entregada'], nombre: 'En camino', vacia: 'Nada en camino hacia ti', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-amber text-rd-ink">
        <Truck className="h-3.5 w-3.5" />
      </span>
    ) },
  { id: 'recibido', estados: ['confirmada'], nombre: 'Recibido', vacia: 'Nada recibido todavía', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-green text-white">
        <Package className="h-3.5 w-3.5" />
      </span>
    ) },
  { id: 'distribuido', estados: ['distribuida'], nombre: 'Distribuido', vacia: 'Nada distribuido todavía', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-green text-white">
        <Users className="h-3.5 w-3.5" />
      </span>
    ) },
  { id: 'archivadas', estados: ['archivada'], nombre: 'Archivadas', vacia: 'Nada archivado todavía', clase: 'border-rd-line', titulo: 'text-rd-ink', icono: (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-rd-sm bg-rd-ink-3 text-white">
        <Archive className="h-3.5 w-3.5" />
      </span>
    ) },
];

const ORDEN_CICLO: Record<Solicitud['estado'], number> = { nueva: 0, aceptada: 1, camino: 2, entregada: 3, confirmada: 4, distribuida: 5, archivada: 6 };
const NOMBRE_ESTADO: Record<Solicitud['estado'], string> = { nueva: 'Nueva', aceptada: 'Comprometida', camino: 'En camino', entregada: 'Entregada', confirmada: 'Completada', distribuida: 'Distribuido', archivada: 'Archivada' };

/** Las reglas de mover una tarjeta (`puedeMover` del prototipo): arrastrar hace lo mismo que
 *  el botón. Lo nuevo se responde, no se arrastra; a Confirmada/Completada se llega certificando con foto
 *  y a Archivadas se llega con «Archivar»; de a un paso; a En camino solo con
 *  alguien asignado. Devuelve el motivo si no se puede, `null` si sí. */
function puedeMover(s: Solicitud, a: Solicitud['estado']): string | null {
  if (a === s.estado) return '';
  if (s.estado === 'nueva' || a === 'nueva') return 'Las solicitudes nuevas se aceptan o se declinan';
  if (a === 'archivada' || s.estado === 'archivada') return 'Las completadas se archivan con el botón';
  if (a === 'confirmada') return null; // Arrastrar a Completada abre la certificación
  if (s.estado === 'confirmada') return 'Las completadas se archivan con el botón';
  if (a === 'camino' && !s.vol) return 'Asigna primero a alguien';
  if (Math.abs(ORDEN_CICLO[a] - ORDEN_CICLO[s.estado]) > 1) return 'De a un paso';
  return null;
}

const MOTIVOS_CANCELAR = [
  { valor: 'sin-recurso', texto: 'Ya no tenemos el recurso' },
  { valor: 'sin-quien', texto: 'No hay quien lo lleve' },
  { valor: 'no-responden', texto: 'No responden para coordinar' },
  { valor: 'otro', texto: 'Otro motivo' },
];

/** El tablero de entregas: unificado para ambas caras (ayuda que se entrega o ayuda que se recibe).
 *  Para organizaciones permite mover y asignar equipo; para líderes comunitarios permite aceptar
 *  ayuda ofrecida, ver lo que viene en camino y certificar/confirmar lo recibido. */
const Seguimiento: React.FC<{
  modulos: ModulosCuenta;
  sol: Solicitud[];
  recibidas: EntregaRecibida[];
  acciones: AccionesSolicitud;
  onConfirmarRecibido: (id: number) => void;
  onDistribuirRecibida?: (r: EntregaRecibida) => void;
  onArchivarRecibida?: (id: number) => void;
  onVerFotosRecibida: (r: EntregaRecibida, i: number) => void;
  onAceptarRecibida: (id: number) => void;
  onRechazarRecibida: (id: number) => void;
  onCancelarRecibida?: (r: EntregaRecibida) => void;
  onVerPublicacionRecibida?: (r: EntregaRecibida) => void;
}> = ({
  modulos,
  sol,
  recibidas,
  acciones,
  onConfirmarRecibido,
  onDistribuirRecibida,
  onArchivarRecibida,
  onVerFotosRecibida,
  onAceptarRecibida,
  onRechazarRecibida,
  onCancelarRecibida,
  onVerPublicacionRecibida,
}) => {
  const tieneAmbos = modulos.pide && modulos.ofrece;
  const [vista, setVista] = useState<'entrego' | 'recibo'>(() => (modulos.ofrece ? 'entrego' : 'recibo'));
  const [colapsadasEntrego, setColapsadasEntrego] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    COLUMNAS.forEach((c) => {
      const items = sol.filter((s) => s.estado === c.estado);
      map[c.estado] = items.length === 0 || c.estado === 'archivada';
    });
    return map;
  });

  const [colapsadasRecibo, setColapsadasRecibo] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    COLUMNAS_RECIBIDAS.forEach((c) => {
      const items = recibidas.filter((r) => c.estados.includes(r.estado));
      map[c.id] = items.length === 0 || c.id === 'archivadas';
    });
    return map;
  });
  const { onMover } = acciones;
  const avisar = useAviso();
  const [sobre, setSobre] = useState<Solicitud['estado'] | null>(null);
  const [devolviendo, setDevolviendo] = useState<{ s: Solicitud; a: Solicitud['estado'] } | null>(null);
  const mover = (id: number, a: Solicitud['estado']) => {
    const s = sol.find((x) => x.id === id);
    if (!s) return;
    const motivo = puedeMover(s, a);
    if (motivo === '') return;
    if (motivo) return avisar(motivo);
    if (ORDEN_CICLO[a] < ORDEN_CICLO[s.estado]) return setDevolviendo({ s, a });
    if (a === 'camino' && acciones.onEnCamino) {
      acciones.onEnCamino(s);
      return;
    }
    onMover(id, a);
  };

  const verEntregas = !modulos.pide || (modulos.ofrece && vista === 'entrego');

  return (
    /* La única sección sin contenedor (Alejandro, 25 de septiembre de 2026): el tablero ya
       tiene sus propias columnas, y meterlo en una caja era una caja dentro de otra. Las demás
       secciones sí conservan la suya. */
    <section className="col-span-full min-w-0">
      {/* El conmutador va debajo del título y con aire a los dos lados (Alejandro, 25 de
          septiembre de 2026): 20 entre el título y él, 24 entre él y el tablero. Apretados los
          tres, no se distinguía dónde acaba la cabecera y dónde empieza el tablero. */}
      <div className="mb-6 flex flex-col items-start gap-5">
        <h2 className="font-rd m-0 text-rd-16 font-semibold tracking-rd-titulo text-rd-ink">
          Seguimiento
        </h2>
        {tieneAmbos && (
          <Segmented<'entrego' | 'recibo'>
            etiquetaGrupo="Tablero de seguimiento"
            valor={vista}
            onChange={setVista}
            opciones={[
              {
                id: 'entrego',
                etiqueta: 'Entrego',
                n: sol.filter((s) => s.estado !== 'archivada').length,
              },
              {
                id: 'recibo',
                etiqueta: 'Recibo',
                n: recibidas.filter((r) => r.estado !== 'archivada').length,
              },
            ]}
          />
        )}
      </div>

      {verEntregas ? (
        <div
          role="region"
          aria-label="Tablero de seguimiento de entregas"
          tabIndex={0}
          className="zona-rd-scroll -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6 lg:-mx-8 lg:px-8 lg:scroll-pl-8"
        >
          {COLUMNAS.map((c, idx) => {
            const items = sol.filter((s) => s.estado === c.estado);
            const estaColapsada = !!colapsadasEntrego[c.estado];
            const recibe = c.estado !== 'nueva' && c.estado !== 'archivada';

            if (estaColapsada) {
              const expandir = () => {
                setColapsadasEntrego((prev) => ({ ...prev, [c.estado]: false }));
              };
              return (
                <div
                  key={c.estado}
                  onClick={expandir}
                  onDragOver={(e) => {
                    if (c.estado === 'confirmada' || c.estado === 'archivada' || recibe) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = Number(e.dataTransfer.getData('text/plain'));
                    if (c.estado === 'confirmada') {
                      const s = sol.find((x) => x.id === id);
                      if (s) acciones.onCertificar(s);
                    } else if (c.estado !== 'nueva') {
                      mover(id, c.estado);
                    }
                    expandir();
                  }}
                  title={`Clic para expandir ${c.nombre}`}
                  className="flex min-h-70 w-12 sm:basis-12 shrink-0 snap-start cursor-pointer flex-col items-center gap-3 rounded-rd-lg border border-rd-line bg-rd-fondo py-3 px-1 transition-colors hover:bg-rd-line-soft hover:border-rd-ink/30"
                >
                  <button
                    type="button"
                    aria-label={`Expandir columna ${c.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      expandir();
                    }}
                    className="flex h-rd-h-sm w-rd-h-sm items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span aria-hidden="true">{c.icono}</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  <span className="mt-2 text-rd-13 font-semibold text-rd-ink [writing-mode:vertical-rl] rotate-180">
                    {c.nombre}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={c.estado}
                onDragOver={(e) => {
                  if (c.estado === 'confirmada') {
                    e.preventDefault();
                    setSobre(c.estado);
                    return;
                  }
                  if (!recibe) return;
                  e.preventDefault();
                  setSobre(c.estado);
                }}
                onDragLeave={() => setSobre((x) => (x === c.estado ? null : x))}
                onDrop={(e) => {
                  e.preventDefault();
                  setSobre(null);
                  const id = Number(e.dataTransfer.getData('text/plain'));
                  if (c.estado === 'confirmada') {
                    const s = sol.find((x) => x.id === id);
                    if (s) acciones.onCertificar(s);
                  } else {
                    mover(id, c.estado);
                  }
                }}
                className={`ranura-rd-tablero flex min-h-70 min-w-0 snap-start flex-col gap-2 rounded-rd-lg border p-2 transition-colors sm:flex-1 sm:min-w-80 ${
                  sobre === c.estado ? 'bg-rd-navy-soft ring-2 ring-rd-navy-line' : 'bg-rd-fondo'
                } ${c.clase}`}
              >
                <div
                  className={`flex items-center gap-2 px-2 pt-1.5 pb-2 text-rd-13-5 font-semibold ${c.titulo}`}
                >
                  <span aria-hidden="true">{c.icono}</span>
                  {c.nombre}
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  <button
                    type="button"
                    title={`Colapsar columna ${c.nombre}`}
                    aria-label={`Colapsar columna ${c.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setColapsadasEntrego((prev) => ({ ...prev, [c.estado]: true }));
                    }}
                    className="ml-1 flex h-rd-h-sm w-rd-h-sm cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
                {items.map((s) => (
                  <TarjetaSolicitud
                    key={s.id}
                    s={s}
                    acciones={acciones}
                    menuFlotante
                    arrastre={{
                      draggable: c.estado !== 'confirmada' && c.estado !== 'nueva' && c.estado !== 'archivada',
                      onDragStart: (e) => {
                        e.dataTransfer.setData('text/plain', String(s.id));
                        e.dataTransfer.effectAllowed = 'move';
                      },
                    }}
                  />
                ))}
                {items.length === 0 && <p className="m-0 px-1 py-3 text-center text-rd-12-5 text-rd-ink-meta">{c.vacia}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          role="region"
          aria-label="Tablero de seguimiento de ayuda recibida"
          tabIndex={0}
          className="zona-rd-scroll -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6 lg:-mx-8 lg:px-8 lg:scroll-pl-8"
        >
          {COLUMNAS_RECIBIDAS.map((c, idx) => {
            const items = recibidas.filter((r) => c.estados.includes(r.estado));
            const estaColapsada = !!colapsadasRecibo[c.id];

            if (estaColapsada) {
              const expandir = () => {
                setColapsadasRecibo((prev) => ({ ...prev, [c.id]: false }));
              };
              return (
                <div
                  key={c.id}
                  onClick={expandir}
                  onDragOver={(e) => {
                    if (c.id === 'recibido' || c.id === 'distribuido' || c.id === 'archivadas') {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data.startsWith('recibida:')) {
                      const id = Number(data.replace('recibida:', ''));
                      const r = recibidas.find((x) => x.id === id);
                      if (!r) return;
                      if (c.id === 'recibido' && r.estado === 'entregada') {
                        onConfirmarRecibido(id);
                      } else if (c.id === 'distribuido' && r.estado === 'confirmada') {
                        onDistribuirRecibida?.(r);
                      } else if (c.id === 'archivadas' && r.estado === 'distribuida') {
                        onArchivarRecibida?.(id);
                      }
                      expandir();
                    }
                  }}
                  title={`Clic para expandir ${c.nombre}`}
                  className="flex min-h-70 w-12 sm:basis-12 shrink-0 snap-start cursor-pointer flex-col items-center gap-3 rounded-rd-lg border border-rd-line bg-rd-fondo py-3 px-1 transition-colors hover:bg-rd-line-soft hover:border-rd-ink/30"
                >
                  <button
                    type="button"
                    aria-label={`Expandir columna ${c.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      expandir();
                    }}
                    className="flex h-rd-h-sm w-rd-h-sm items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span aria-hidden="true">{c.icono}</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  <span className="mt-2 text-rd-13 font-semibold text-rd-ink [writing-mode:vertical-rl] rotate-180">
                    {c.nombre}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={c.id}
                onDragOver={(e) => {
                  if (c.id === 'recibido' || c.id === 'distribuido' || c.id === 'archivadas') {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = e.dataTransfer.getData('text/plain');
                  if (data.startsWith('recibida:')) {
                    const id = Number(data.replace('recibida:', ''));
                    const r = recibidas.find((x) => x.id === id);
                    if (!r) return;
                    if (c.id === 'recibido' && r.estado === 'entregada') {
                      onConfirmarRecibido(id);
                    } else if (c.id === 'distribuido' && r.estado === 'confirmada') {
                      onDistribuirRecibida?.(r);
                    } else if (c.id === 'archivadas' && r.estado === 'distribuida') {
                      onArchivarRecibida?.(id);
                    }
                  }
                }}
                className={`ranura-rd-tablero flex min-h-70 min-w-0 snap-start flex-col gap-2 rounded-rd-lg border bg-rd-fondo p-2 sm:flex-1 sm:min-w-80 ${c.clase}`}
              >
                <div
                  className={`flex items-center gap-2 px-2 pt-1.5 pb-2 text-rd-13-5 font-semibold ${c.titulo}`}
                >
                  <span aria-hidden="true">{c.icono}</span>
                  {c.nombre}
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  <button
                    type="button"
                    title={`Colapsar columna ${c.nombre}`}
                    aria-label={`Colapsar columna ${c.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setColapsadasRecibo((prev) => ({ ...prev, [c.id]: true }));
                    }}
                    className="ml-1 flex h-rd-h-sm w-rd-h-sm cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
                {items.map((r) => (
                  <TarjetaRecibida
                    key={r.id}
                    r={r}
                    onConfirmar={onConfirmarRecibido}
                    onDistribuir={onDistribuirRecibida}
                    onArchivar={onArchivarRecibida}
                    onVerFotos={onVerFotosRecibida}
                    onAceptar={onAceptarRecibida}
                    onRechazar={onRechazarRecibida}
                    onCancelar={onCancelarRecibida}
                    onVerPublicacion={onVerPublicacionRecibida}
                    menuFlotante
                    arrastre={{
                      draggable: r.estado === 'entregada' || r.estado === 'confirmada' || r.estado === 'distribuida',
                      onDragStart: (e) => {
                        e.dataTransfer.setData('text/plain', `recibida:${r.id}`);
                        e.dataTransfer.effectAllowed = 'move';
                      },
                    }}
                  />
                ))}
                {items.length === 0 && <p className="m-0 px-1 py-3 text-center text-rd-12-5 text-rd-ink-meta">{c.vacia}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Volver atrás cambia lo que la otra organización cree que tiene: se confirma con la
          consecuencia a la vista y se le avisa (`confirmarAtras` del prototipo). */}
      <Dialogo
        abierto={devolviendo !== null}
        titulo={devolviendo ? `¿Devolver a ${NOMBRE_ESTADO[devolviendo.a]}?` : ''}
        accion={devolviendo ? `Devolver y avisar a ${devolviendo.s.quien}` : 'Devolver y avisar'}
        textoAlterno="Dejar como está"
        onCerrar={() => setDevolviendo(null)}
        onEnviar={() => {
          if (!devolviendo) return;
          onMover(devolviendo.s.id, devolviendo.a);
          setDevolviendo(null);
          avisar(`Devuelta a ${NOMBRE_ESTADO[devolviendo.a]}. Le avisamos a ${devolviendo.s.quien}.`);
        }}
      >
        {devolviendo && (
          <>
            <p className="mb-3 text-rd-14 text-rd-ink">
              <b className="font-semibold">
                {cifra(devolviendo.s.cant)} {devolviendo.s.u} de {devolviendo.s.rec.toLowerCase()}
              </b>
              <Divisor />
              {devolviendo.s.quien}
              <Divisor />
              hoy: {NOMBRE_ESTADO[devolviendo.s.estado]}
            </p>
            <InlineNotice
              variante="pendiente"
              icono={<TriangleAlert className="h-4 w-4" />}
              titulo={`${devolviendo.s.quien} recibe el aviso ahora mismo`}
              texto={devolviendo.s.estado === 'entregada' ? `Para ${devolviendo.s.quien} esto ya estaba entregado. Al devolverlo a En camino, su necesidad vuelve a quedar sin cubrir y deja de contar como resuelta.` : `Para ${devolviendo.s.quien} esto ya iba en camino. Al devolverlo a Comprometida, deja de esperar la entrega hoy.`}
            />
          </>
        )}
      </Dialogo>
    </section>
  );
};

/* ---------- siempre ---------- */

const MiEquipo: React.FC<{
  equipo: MiembroEquipo[];
  onRegistrar: () => void;
  onEditar: (m: MiembroEquipo) => void;
  onConfirmarBaja: (m: MiembroEquipo) => void;
}> = ({ equipo, onRegistrar, onEditar, onConfirmarBaja }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroVeh, setFiltroVeh] = useState('');
  const [filtroDisp, setFiltroDisp] = useState('');

  /* La hoja se cierra con Escape y con el velo, dentro de `Hoja`: aquí ya no hace falta el
     detector de clic afuera que necesitaba el popover. */
  const [hojaFiltros, setHojaFiltros] = useState(false);

  const filtrosDropdownActivos = [filtroUbicacion, filtroVeh, filtroDisp].filter(Boolean).length;
  const hayFiltros = Boolean(busqueda || filtrosDropdownActivos > 0);

  const resetFiltros = () => {
    setBusqueda('');
    setFiltroUbicacion('');
    setFiltroVeh('');
    setFiltroDisp('');
  };

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return equipo.filter((m) => {
      if (q) {
        const coincideNombre = m.n.toLowerCase().includes(q);
        const coincideRol = (m.rol || '').toLowerCase().includes(q);
        const coincideTel = (m.tel || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''));
        const coincideCorreo = (m.correo || '').toLowerCase().includes(q);
        const coincideUbicacion = (m.ubicacion || '').toLowerCase().includes(q);
        if (!coincideNombre && !coincideRol && !coincideTel && !coincideCorreo && !coincideUbicacion) {
          return false;
        }
      }
      if (filtroUbicacion && m.ubicacion !== filtroUbicacion) return false;
      if (filtroVeh && m.veh !== filtroVeh) return false;
      if (filtroDisp) {
        if (filtroDisp === 'tiempo_completo') {
          if (!['tiempo_completo', 'tardes', 'hoy', 'manana'].includes(m.disp)) return false;
        } else if (filtroDisp === 'fines_de_semana') {
          if (!['fines_de_semana', 'finde'].includes(m.disp)) return false;
        } else if (filtroDisp === 'emergencias') {
          if (m.disp !== 'emergencias') return false;
        } else if (m.disp !== filtroDisp) {
          return false;
        }
      }
      return true;
    });
  }, [equipo, busqueda, filtroUbicacion, filtroVeh, filtroDisp]);

  return (
    <Caja
      plana
      titulo={
        <>
          Mi equipo<Conteo n={equipo.length} />
        </>
      }
      accion={
        <Button nivel="secundario" tamano="md" onClick={onRegistrar}>
          Agregar
        </Button>
      }
    >
      {/* La barra de consulta, en el orden de la Radar y del Directorio (decisión 70): el filtro
          primero, los chips de lo aplicado, y el buscador al final. Mi equipo la tenía al revés
          —buscador de primero, chips en una segunda fila— y el filtro abría un popover con tres
          `<select>` en vez de la hoja (Alejandro, 25 de septiembre de 2026). El conteo pasa a
          `sr-only`, como en las demás secciones: los chips ya dicen qué está aplicado. */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <BotonFiltros
          aplicados={filtrosDropdownActivos}
          abierta={hojaFiltros}
          onClick={() => setHojaFiltros(true)}
          etiqueta="Filtrar"
        />
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {filtrados.length} de {equipo.length} {equipo.length === 1 ? 'persona' : 'personas'}
        </p>
        {hayFiltros && (
          <ZonaChips>
            {busqueda && <ChipAplicado texto={`«${busqueda}»`} onQuitar={() => setBusqueda('')} />}
            {filtroUbicacion && <ChipAplicado texto={filtroUbicacion} onQuitar={() => setFiltroUbicacion('')} />}
            {filtroVeh && <ChipAplicado texto={filtroVeh} onQuitar={() => setFiltroVeh('')} />}
            {filtroDisp && (
              <ChipAplicado texto={DISPONIBILIDADES.find((d) => d.valor === filtroDisp)?.etiqueta || filtroDisp} onQuitar={() => setFiltroDisp('')} />
            )}
            <QuitarTodos onClick={resetFiltros} />
          </ZonaChips>
        )}
        <CampoBuscar valor={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, rol o lugar" abierto className="h-10 w-full sm:ml-auto sm:w-72" />
      </div>

      <HojaFiltrosEquipo
        abierta={hojaFiltros}
        onCerrar={() => setHojaFiltros(false)}
        equipo={equipo}
        ubicacion={filtroUbicacion}
        veh={filtroVeh}
        disp={filtroDisp}
        onUbicacion={setFiltroUbicacion}
        onVeh={setFiltroVeh}
        onDisp={setFiltroDisp}
        onQuitarTodos={() => {
          setFiltroUbicacion('');
          setFiltroVeh('');
          setFiltroDisp('');
        }}
        aplicados={filtrosDropdownActivos}
        resultados={filtrados.length}
      />

      {/* El vacío del sistema, el mismo de la Radar y del Directorio: icono en círculo hundido,
          título 15/600 y texto corto. Mi equipo lo tenía a mano, en una caja de borde punteado. */}
      {filtrados.length === 0 ? (
        <Vacio
          icono={<Funnel className="h-6.5 w-6.5" />}
          titulo="Nadie coincide con estos filtros"
          texto="Prueba con otro lugar, otro vehículo u otra disponibilidad."
          accion={
            <Button nivel="secundario" tamano="md" onClick={resetFiltros}>
              Quitar los filtros
            </Button>
          }
        />
      ) : (
        <Tabla
          etiqueta="Mi equipo"
          filas={filtrados}
          clave={(e) => e.id}
          tarjeta={(e) => {
            const rolEtiqueta = e.rolPlataforma
              ? (ROL_PLATAFORMA[e.rolPlataforma] ?? e.rolPlataforma)
              : 'Solo en terreno';
            return (
              <div
                key={e.id}
                className="rounded-rd-xl border border-rd-line bg-rd-surface p-3.5 shadow-2xs transition-colors hover:border-rd-line-strong"
              >
                {/* Cabecera: Avatar, Datos de persona y menú de acciones en esquina superior derecha */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Avatar iniciales={iniciales(e.n)} tamano="md" />
                    <div className="min-w-0 flex flex-col">
                      <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                        <b className="font-semibold text-rd-ink text-rd-14">{e.n}</b>
                        <span className="inline-flex items-center rounded-full bg-rd-sunken px-2 py-0.5 text-rd-11 font-medium text-rd-ink-2 shrink-0">
                          {rolEtiqueta}
                        </span>
                      </div>
                      <span className="mt-0.5 text-rd-12 text-rd-ink-meta leading-tight">
                        {e.tel}
                      </span>
                      {e.correo && (
                        <span className="block truncate text-rd-12 text-rd-ink-meta mt-0.5 leading-tight">
                          {e.correo}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Grid 2x2 compacto sin espacios muertos */}
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-rd-line-soft pt-2.5 text-rd-12">
                  <div>
                    <span className="block text-rd-11 font-medium text-rd-ink-meta">Qué hace / Profesión</span>
                    <span className="font-medium text-rd-ink leading-tight">{e.rol || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-rd-11 font-medium text-rd-ink-meta">Ubicación</span>
                    <span className="font-medium text-rd-ink leading-tight">{e.ubicacion || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-rd-11 font-medium text-rd-ink-meta">Vehículo</span>
                    <span className="font-medium text-rd-ink leading-tight">{e.veh || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-rd-11 font-medium text-rd-ink-meta">Disponible</span>
                    <span className="font-medium text-rd-ink leading-tight">
                      {e.disp ? (DISPONIBILIDAD[e.disp] ?? e.disp) : '—'}
                    </span>
                  </div>
                </div>

                {/* Pie: Entregas realizadas */}
                <div className="mt-2.5 flex items-center justify-between text-rd-11-5 text-rd-ink-meta">
                  <span>Entregas realizadas</span>
                  <span className="font-semibold text-rd-ink bg-rd-sunken px-2.5 py-0.5 rounded-full text-rd-11">
                    {e.hechas} {e.hechas === 1 ? 'entrega' : 'entregas'}
                  </span>
                </div>
                {/* El ⋮ al pie de la tarjeta y al extremo derecho, como en el resto (Alejandro, 25 de
                    septiembre de 2026). Estaba suelto en la esquina superior. */}
                <div className="mt-2.5 flex items-center border-t border-rd-line-soft pt-2.5">
                  <span className="ml-auto flex">
                    <MenuAcciones
                      tamano="md"
                      nivel="secundario"
                      flotante
                      etiqueta={`Opciones de ${e.n}`}
                      items={[
                          {
                            texto: 'Escribir por WhatsApp',
                            icono: <IconoWhatsApp className="h-4 w-4" />,
                            onElegir: () => {
                              const num = e.tel.replace(/\D/g, '');
                              const numWa = num.startsWith('57') ? num : `57${num}`;
                              window.open(`https://wa.me/${numWa}`, '_blank', 'noopener');
                            },
                          },
                          {
                            texto: `Llamar`,
                            icono: <Phone className="h-4 w-4" />,
                            onElegir: () => {
                              window.location.href = `tel:${e.tel.replace(/\s/g, '')}`;
                            },
                          },
                          {
                            texto: 'Editar',
                            icono: <Edit3 className="h-4 w-4" />,
                            onElegir: () => onEditar(e),
                          },
                          {
                            texto: 'Quitar',
                            icono: <X className="h-4 w-4" />,
                            tono: 'peligro',
                            onElegir: () => onConfirmarBaja(e),
                          },
                      ]}
                      className="shadow-2xs"
                    />
                  </span>
                </div>
              </div>
            );
          }}
          columnas={[
            {
              k: 'persona',
              etiqueta: 'Persona',
              celda: (e) => {
                const rolEtiqueta = e.rolPlataforma ? (ROL_PLATAFORMA[e.rolPlataforma] ?? e.rolPlataforma) : 'Solo en terreno';
                return (
                  <span className="flex items-start gap-2.5">
                    <Avatar iniciales={iniciales(e.n)} tamano="md" />
                    <span className="min-w-0 flex flex-col">
                      <span className="flex flex-wrap items-center gap-1.5 leading-snug">
                        <b className="font-semibold text-rd-ink">{e.n}</b>
                        <span className="inline-flex items-center rounded-full bg-rd-sunken px-2 py-0.5 text-rd-11 font-medium text-rd-ink-2">
                          {rolEtiqueta}
                        </span>
                      </span>
                      <small className="block text-rd-12 text-rd-ink-meta mt-0.5 leading-tight">
                        {e.tel}
                      </small>
                      {e.correo && (
                        <small className="block truncate text-rd-12 text-rd-ink-meta mt-0.5 leading-tight">
                          {e.correo}
                        </small>
                      )}
                    </span>
                  </span>
                );
              },
            },
            { k: 'ubi', etiqueta: 'Ubicación', celda: (e) => e.ubicacion || '—' },
            { k: 'hace', etiqueta: 'Qué hace / Profesión', celda: (e) => e.rol || '—' },
            { k: 'veh', etiqueta: 'Vehículo', celda: (e) => e.veh || '—' },
            { k: 'disp', etiqueta: 'Disponible', celda: (e) => (e.disp ? (DISPONIBILIDAD[e.disp] ?? e.disp) : '—') },
            { k: 'hechas', etiqueta: 'Entregas', num: true, celda: (e) => e.hechas },
            {
              k: 'acc',
              etiqueta: 'Acciones',
              acc: true,
              celda: (e) => (
                <MenuAcciones
                  tamano="md"
                  nivel="secundario"
                  flotante
                  etiqueta={`Opciones de ${e.n}`}
                  items={[
                    {
                      texto: 'Escribir por WhatsApp',
                      icono: <IconoWhatsApp className="h-4 w-4" />,
                      onElegir: () => {
                        const num = e.tel.replace(/\D/g, '');
                        const numWa = num.startsWith('57') ? num : `57${num}`;
                        window.open(`https://wa.me/${numWa}`, '_blank', 'noopener');
                      },
                    },
                    {
                      texto: `Llamar`,
                      icono: <Phone className="h-4 w-4" />,
                      onElegir: () => {
                        window.location.href = `tel:${e.tel.replace(/\s/g, '')}`;
                      },
                    },
                    {
                      texto: 'Editar',
                      icono: <Edit3 className="h-4 w-4" />,
                      onElegir: () => onEditar(e),
                    },
                    {
                      texto: 'Quitar',
                      icono: <X className="h-4 w-4" />,
                      tono: 'peligro',
                      onElegir: () => onConfirmarBaja(e),
                    },
                  ]}
                  className="shadow-2xs"
                />
              ),
            },
          ]}
        />
      )}
    </Caja>
  );
};



