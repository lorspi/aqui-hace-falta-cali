import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleDashed, CircleDot, Clock, Download, Edit3, FileText, Hand, HeartHandshake, ListChecks, Map as MapIcon, Megaphone, Package, Phone, Search, TriangleAlert, Truck, Users, X } from 'lucide-react';
import { Dialogo, Opciones } from '../../components/ui/Dialogo';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { DialogoAsignar, DialogoCierre, DialogoDetallePublicacionPanel, DialogoEditarRecursoOfrecido, DialogoEditarRecursoPedido, DialogoGestionPublicacion, DialogoMiembro, DialogoRegistrarMiembro, DISPONIBILIDADES, VEHICULOS, type DatosPublicacionGestion } from './dialogos';
import { TarjetaRecibida, TarjetaSolicitud, accionesDe, menuDe, quienLleva, type AccionesSolicitud } from './TarjetaEntrega';
import { TiraFotos, VisorFotos, type GrupoFotos } from '../../components/ui/VisorFotos';
import { cuentaFotos, fotosDeEntrega, fotosDeRecibida, listaFotos } from '../../mocks/fotosMock';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { Button } from '../../components/ui/Button';
import { Avatar, EtiquetaCiclo } from '../../components/ui/Etiqueta';
import { Pestanas } from '../../components/ui/Pestanas';
import { Vacio } from '../../components/ui/Vacio';
import { Caja, Conteo } from '../../components/ui/Caja';
import { IconoRecursoDe } from '../../components/ui/Recursos';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, DEPTOS, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { ACTIVIDAD, DIAS_PARA_ARCHIVAR, DISPONIBILIDAD, EQUIPO, ESTADO_RECIBIDA, ESTADO_SOLICITUD, NECESIDAD, OFERTA, ORG, PUERTAS, RECIBIDAS, ROL_PLATAFORMA, SOLICITUDES } from '../../mocks/panelMock';
import { PUBLICACIONES } from '../../mocks/publicacionesMock';
import type { ModulosCuenta } from '../../types/cuenta';
import type { Acta, EntregaRecibida, Kpi, MiembroEquipo, Pendiente, RecursoOfrecido, RecursoPedido, Solicitud } from '../../types/panel';
import type { Publicacion } from '../../types/publicacion';
import { actasDe, archivarViejas, cantidadPorEstado, kpisDe, modulosGuardados, nuevas, pendientesCuenta, pendientesDe, pestanasDe, porConfirmar, quedan, recibidasPorConfirmar, resumenActas, textoCertificar, textoCierre } from '../../utils/panel';
import { nombrePanel } from '../../utils/cuenta';
import { cifra, iniciales, tituloPublicacion, unidad } from '../../utils/publicaciones';
import { Tabla } from '../../components/ui/Tabla';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Barra } from '../../components/ui/Barra';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';

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

export const PanelPage: React.FC = () => (
  <AvisosProvider>
    <Panel />
  </AvisosProvider>
);

const Panel: React.FC = () => {
  const avisar = useAviso();
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
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(EQUIPO);
  const [editandoOferta, setEditandoOferta] = useState<RecursoOfrecido | null>(null);
  const [editandoNecesidad, setEditandoNecesidad] = useState<RecursoPedido | null>(null);
  const [registrandoMiembro, setRegistrandoMiembro] = useState(false);
  const [editandoMiembro, setEditandoMiembro] = useState<MiembroEquipo | null>(null);
  const [miembroParaBaja, setMiembroParaBaja] = useState<MiembroEquipo | null>(null);

  const [pubOferta, setPubOferta] = useState<DatosPublicacionGestion>(() => {
    try {
      const guardado = localStorage.getItem('rd-oferta-creada-gestion');
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return {
      id: 'oferta-usme',
      tipo: 'oferta',
      titulo: 'Bomberos Voluntarios Usme · Recursos de estación',
      org: ORG.nombre,
      verificada: true,
      zona: 'Usme',
      dir: ORG.dir,
      descripcion: 'Recursos de la estación disponibles para la emergencia de la quebrada. Coordinamos por radio con el puesto de mando.',
      personaContacto: ORG.enlace.split(' · ')[0] || 'Carlos Peña',
      telContacto: ORG.contacto.tel,
      comoEntrega: 'Lo llevamos · Cobertura 15 km',
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
      titulo: 'Equipos de bombeo y protección · Emergencia Usme',
      org: ORG.nombre,
      verificada: true,
      zona: 'Usme',
      dir: ORG.dir,
      descripcion: 'Equipos y dotación requeridos con urgencia para atender las inundaciones y remoción de lodo en la calle 91 sur.',
      personaContacto: ORG.enlace.split(' · ')[0] || 'Carlos Peña',
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
      avisar('Oferta actualizada. Los cambios se guardaron y se reflejan en el Radar.', { tipo: 'ok' });
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
      avisar('Necesidad actualizada. Los cambios se guardaron y se reflejan en el Radar.', { tipo: 'ok' });
    }
  };
  const [cajon, setCajon] = useState(false);
  const [pasosOcultos, setPasosOcultos] = useState(false);
  const [tab, setTab] = useState(() => (window.location.hash || '#resumen').slice(1));

  useEffect(() => {
    document.title = `RaDAR · ${nombrePanel()}`;
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
    setSol((l) => l.filter((s) => s.id !== id));
    avisar('Le avisamos que esta vez no pueden.');
  };
  const recordar = (id: number) => {
    const s = sol.find((x) => x.id === id);
    if (s) avisar(`Le recordamos a ${s.quien} que confirme la entrega.`, { tipo: 'ok' });
  };
  const guardarOferta = (r: RecursoOfrecido) => {
    setRecursosOferta((prev) => {
      const act = prev.map((x) => (x.n === r.n ? r : x));
      try {
        localStorage.setItem('rd-oferta-creada-recursos', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar(`Oferta de ${r.n} actualizada con éxito`, { tipo: 'ok' });
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
    avisar(pausado ? `Oferta de ${r.n} pausada. No recibirá nuevas solicitudes en el Radar.` : `Oferta de ${r.n} reactivada en el Radar.`, { tipo: 'ok' });
  };
  const guardarNecesidad = (r: RecursoPedido) => {
    setRecursosNecesidad((prev) => {
      const act = prev.map((x) => (x.n === r.n ? r : x));
      try {
        localStorage.setItem('rd-necesidad-creada-recursos', JSON.stringify(act));
      } catch {}
      return act;
    });
    avisar(`Necesidad de ${r.n} actualizada con éxito`, { tipo: 'ok' });
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
    avisar(pausado ? `Necesidad de ${r.n} pausada temporalmente.` : `Necesidad de ${r.n} reactivada en el Radar.`, { tipo: 'ok' });
  };
  const registrarMiembro = (m: Omit<MiembroEquipo, 'id' | 'hechas'>) => {
    const nuevo: MiembroEquipo = {
      ...m,
      id: Math.max(...equipo.map((x) => x.id), 0) + 1,
      hechas: 0,
    };
    setEquipo((prev) => [nuevo, ...prev]);
    avisar(`${nuevo.n} registrado en tu equipo. Ahora puedes asignarle entregas.`, { tipo: 'ok' });
  };
  const editarMiembro = (id: number, m: Omit<MiembroEquipo, 'id' | 'hechas'>) => {
    setEquipo((prev) => prev.map((x) => (x.id === id ? { ...x, ...m } : x)));
    avisar(`Datos de ${m.n} actualizados.`, { tipo: 'ok' });
  };
  const eliminarMiembro = (id: number) => {
    const m = equipo.find((x) => x.id === id);
    setEquipo((prev) => prev.filter((x) => x.id !== id));
    avisar(`Colaborador ${m?.n ?? ''} desvinculado del equipo`);
  };
  /* Los cierres son de los dos lados (Alejandro, 16 de septiembre de 2026): quien entrega
     certifica con foto; quien recibe confirma con foto. Cada uno cierra por su cuenta y el
     otro lo valida. Los tres diálogos viven aquí para que Resumen, Seguimiento y Entregas
     recibidas los compartan. */
  const [asignando, setAsignando] = useState<Solicitud | null>(null);
  const [certificando, setCertificando] = useState<Solicitud | null>(null);
  const [confirmando, setConfirmando] = useState<EntregaRecibida | null>(null);
  const [cancelando, setCancelando] = useState<Solicitud | null>(null);
  /* Las fotos de una entrega, por lado: las ven las dos organizaciones de esa entrega. */
  const [fotos, setFotos] = useState<{ titulo: string; grupos: GrupoFotos[]; inicial: number } | null>(null);
  const verFotosEntrega = (s: Solicitud, inicial = 0) => {
    const f = fotosDeEntrega(s.id);
    setFotos({ inicial, titulo: `Entrega a ${s.quien} · ${cifra(s.cant)} ${s.u} de ${s.rec.toLowerCase()}`, grupos: [{ titulo: 'Las de quien entregó', fotos: f.entrega }, { titulo: `Las de ${s.quien}`, fotos: f.recibe }] });
  };
  const verFotosRecibida = (r: EntregaRecibida, inicial = 0) => {
    const f = fotosDeRecibida(r.id);
    setFotos({ inicial, titulo: `Entrega de ${r.org} · ${cifra(r.cant)} ${r.u} de ${r.rec.toLowerCase()}`, grupos: [{ titulo: `Las de ${r.org}`, fotos: f.entrega }, { titulo: 'Las tuyas', fotos: f.recibe }] });
  };
  /* --- reportes: las actas --- */
  const actas = useMemo(() => actasDe(modulos, { sol, recibidas, org: ORG.nombre, lleva: (s) => quienLleva(s, equipo)?.split(' · ')[0] ?? null }), [modulos, sol, recibidas, equipo]);
  const [acta, setActa] = useState<Acta | null>(null);
  const [pubDetalle, setPubDetalle] = useState<Publicacion | null>(null);

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
  const certificar = (id: number, fotos: number) => {
    const s = sol.find((x) => x.id === id);
    setSol((l) => l.map((x) => (x.id === id ? { ...x, estado: 'confirmada', cierre: { ...x.cierre, entrega: { fotos } } } : x)));
    if (s) avisar(s.cierre?.recibe ? `Entrega a ${s.quien} certificada. Ya la habían confirmado.` : `Entrega a ${s.quien} certificada. Le avisamos para que la confirme.`, { tipo: 'ok' });
  };
  const archivar = (id: number) => {
    const s = sol.find((x) => x.id === id);
    mover(id, 'archivada');
    if (s) avisar(`Entrega a ${s.quien} archivada.`);
  };
  const cancelar = (id: number, motivo: string) => {
    const s = sol.find((x) => x.id === id);
    setSol((l) => l.filter((x) => x.id !== id));
    if (s) avisar(`Compromiso con ${s.quien} cancelado: ${motivo.toLowerCase()}. Le avisamos.`);
  };
  const confirmarRecibido = (id: number, fotos: number) => {
    const r = recibidas.find((x) => x.id === id);
    setRecibidas((l) => l.map((x) => (x.id === id ? { ...x, estado: 'confirmada', cierre: { ...x.cierre, recibe: { fotos } } } : x)));
    if (r) avisar(`Listo, quedó confirmado lo que llegó de ${r.org}.`, { tipo: 'ok' });
  };
  const aceptarRecibida = (id: number) => {
    setRecibidas((l) => l.map((r) => (r.id === id ? { ...r, estado: 'aceptada' } : r)));
    avisar('Oferta de ayuda aceptada. La organización coordinará la entrega.', { tipo: 'ok' });
  };
  const rechazarRecibida = (id: number) => {
    setRecibidas((l) => l.filter((r) => r.id !== id));
    avisar('Le avisamos a la organización que no necesitas este recurso.');
  };
  /* Todo lo que se puede hacer con una solicitud, en un solo objeto: lo usan el tablero, la tabla y las tarjetas. */
  const accionesSolicitud: AccionesSolicitud = {
    onAceptar: aceptar,
    onRechazar: rechazar,
    onMover: mover,
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
    if (que === 'certificar') setCertificando(sol.find((s) => s.id === id) ?? null);
  };

  return (
    <Shell seccion="panel" panelNombre={nombrePanel()} cuenta={CUENTA} pendientes={pendientes} avisosNuevos={AVISOS.filter((a) => !a.leido).length} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
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
            </span>
            <BotonMenu onClick={() => setCajon(true)} abierto={cajon} />
          </span>
        </header>
        <div className="min-w-0 flex-none px-4 sm:px-6 lg:px-8">
          <Pestanas etiqueta={`Pestañas de ${nombrePanel()}`} pestanas={pestanas} actual={actual} onCambiar={cambiarTab} />
        </div>
        <main id={`panel-${actual}`} role="tabpanel" aria-labelledby={`pestana-${actual}`} className="min-h-0 flex-1 overflow-y-auto bg-rd-fondo px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="grid grid-cols-4 gap-x-4 gap-y-4 sm:grid-cols-8 lg:grid-cols-12 lg:gap-x-6">
            {actual === 'resumen' && <Resumen modulos={modulos} datos={datos} pasosOcultos={pasosOcultos} onOcultarPasos={() => setPasosOcultos(true)} onAccion={accion} />}
            {actual === 'necesidades' && (
              <MisNecesidades
                recursos={recursosNecesidad}
                idPublicacion={pubNecesidad.id}
                onEditar={(r) =>
                  setGestionandoPublicacion({
                    publicacion: pubNecesidad,
                    modoInicial: 'editar',
                    recursoFoco: r.n,
                  })
                }
                onTogglePausa={togglePausaNecesidad}
                onGestionarPublicacion={() =>
                  setGestionandoPublicacion({
                    publicacion: pubNecesidad,
                    modoInicial: 'vista',
                  })
                }
              />
            )}
            {actual === 'ofertas' && (
              <MisOfertas
                recursos={recursosOferta}
                sol={sol}
                idPublicacion={pubOferta.id}
                onEditar={(r) =>
                  setGestionandoPublicacion({
                    publicacion: pubOferta,
                    modoInicial: 'editar',
                    recursoFoco: r.n,
                  })
                }
                onTogglePausa={togglePausaOferta}
                onGestionarPublicacion={() =>
                  setGestionandoPublicacion({
                    publicacion: pubOferta,
                    modoInicial: 'vista',
                  })
                }
              />
            )}
            {actual === 'seguimiento' && (
              <Seguimiento
                modulos={modulos}
                sol={sol}
                recibidas={recibidas}
                acciones={accionesSolicitud}
                onConfirmarRecibido={(id) => accion(`confirmar:${id}`)}
                onVerFotosRecibida={verFotosRecibida}
                onAceptarRecibida={aceptarRecibida}
                onRechazarRecibida={rechazarRecibida}
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
          accion="Desvincular del equipo"
          nivelAccion="secundario"
          textoCancelar="Mantener en el equipo"
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
          <div className="rounded-rd-md bg-rd-sunken px-3 py-2.5 text-rd-12 text-rd-ink-2">
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
        <VisorFotos abierto={fotos !== null} grupos={fotos?.grupos ?? []} inicial={fotos?.inicial ?? 0} titulo={fotos?.titulo ?? ''} onCerrar={() => setFotos(null)} />
        <Dialogo
          abierto={cancelando !== null}
          titulo={cancelando ? `¿Cancelar el compromiso con ${cancelando.quien}?` : ''}
          accion="Cancelar el compromiso"
          nivelAccion="secundario"
          textoCancelar="Dejar como está"
          onCerrar={() => setCancelando(null)}
          onEnviar={(form) => {
            if (!cancelando) return;
            const motivo = String(new FormData(form).get('motivo') ?? '');
            setCancelando(null);
            cancelar(cancelando.id, MOTIVOS_CANCELAR.find((m) => m.valor === motivo)?.texto ?? motivo);
          }}
        >
          <p className="mb-4 text-rd-14 text-rd-ink-2">{cancelando?.quien} recibe el aviso en este momento y su necesidad vuelve a mostrar lo que le falta.</p>
          <Opciones nombre="motivo" etiqueta="Por qué" opciones={MOTIVOS_CANCELAR} columna />
        </Dialogo>
        <DialogoCierre
          abierto={certificando !== null}
          titulo={certificando ? `Certificar la entrega a ${certificando.quien}` : ''}
          texto={certificando ? `${cifra(certificando.cant)} ${certificando.u} de ${certificando.rec.toLowerCase()}. ${textoCertificar(certificando)}` : ''}
          accion="Certificar"
          onCerrar={() => setCertificando(null)}
          onEnviar={(fotos) => {
            if (certificando) certificar(certificando.id, fotos);
            setCertificando(null);
          }}
        />
        <DialogoCierre
          abierto={confirmando !== null}
          titulo={confirmando ? `Confirmar lo que llegó de ${confirmando.org}` : ''}
          texto={confirmando ? `${cifra(confirmando.cant)} ${confirmando.u} de ${confirmando.rec.toLowerCase()} · entregado ${confirmando.cuando}. Con tu confirmación la entrega cuenta como resuelta para los dos.` : ''}
          accion="Confirmar recibido"
          onCerrar={() => setConfirmando(null)}
          onEnviar={(fotos) => {
            if (confirmando) confirmarRecibido(confirmando.id, fotos);
            setConfirmando(null);
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
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {p.secundaria && (
                <Button nivel="secundario" tamano="sm" onClick={() => onAccion(p.secundaria!.al)}>
                  {p.secundaria.texto}
                </Button>
              )}
              <Button nivel={p.accion.nivel} tamano="sm" onClick={() => onAccion(p.accion.al)}>
                {p.accion.texto}
              </Button>
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
    detalleAccion = `${nuevasSol} ${nuevasSol === 1 ? 'solicitud nueva' : 'solicitudes nuevas'} · ${porConfRec} por confirmar`;
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
  const detalleMovimiento = partesMovimiento.length > 0 ? partesMovimiento.join(' · ') : 'Sin entregas en ruta en este momento';

  // 3. Entregas completadas
  const confOfrece = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'confirmada').length : 0;
  const confPide = modulos.pide ? datos.recibidas.filter((r) => r.estado === 'confirmada').length : 0;
  const totalCompletadas = confOfrece + confPide;
  const detalleCompletadas = totalCompletadas > 0 ? 'Cerradas y confirmadas con éxito' : 'Aún no hay entregas finalizadas';

  return (
    <Caja titulo="Pulso del día" className="col-span-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Decisiones / Acción */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('seccion-decisiones');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="group flex flex-col justify-between rounded-rd-lg border border-rd-line bg-rd-surface p-4 text-left transition-all hover:border-rd-coral-line hover:bg-rd-coral-soft/10 focus:outline-none focus:ring-2 focus:ring-rd-coral"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-rd-13-5 font-semibold text-rd-ink group-hover:text-rd-coral-ink">
              Requieren tu atención
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-md bg-rd-coral-soft text-rd-coral transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <Megaphone className="h-4.5 w-4.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="font-rd text-rd-28 font-bold leading-none tracking-rd-titulo text-rd-ink tabular-nums">
              {totalAccion}
            </span>
            <p className="m-0 mt-2 text-rd-12 leading-snug text-rd-ink-meta">
              {detalleAccion}
            </p>
          </div>
        </button>

        {/* Card 2: En movimiento */}
        <button
          type="button"
          onClick={() => onAccion('#seguimiento')}
          className="group flex flex-col justify-between rounded-rd-lg border border-rd-line bg-rd-surface p-4 text-left transition-all hover:border-rd-amber-line hover:bg-rd-amber-soft/10 focus:outline-none focus:ring-2 focus:ring-rd-amber"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-rd-13-5 font-semibold text-rd-ink group-hover:text-rd-amber-ink">
              En movimiento hoy
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-md bg-rd-amber-soft text-rd-amber-ink transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <Truck className="h-4.5 w-4.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="font-rd text-rd-28 font-bold leading-none tracking-rd-titulo text-rd-ink tabular-nums">
              {totalMovimiento}
            </span>
            <p className="m-0 mt-2 text-rd-12 leading-snug text-rd-ink-meta">
              {detalleMovimiento}
            </p>
          </div>
        </button>

        {/* Card 3: Completadas */}
        <button
          type="button"
          onClick={() => onAccion('#reportes')}
          className="group flex flex-col justify-between rounded-rd-lg border border-rd-line bg-rd-surface p-4 text-left transition-all hover:border-rd-green-line hover:bg-rd-green-soft/10 focus:outline-none focus:ring-2 focus:ring-rd-green"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-rd-13-5 font-semibold text-rd-ink group-hover:text-rd-green">
              Entregas completadas
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-md bg-rd-green-soft text-rd-green transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <Check className="h-4.5 w-4.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="font-rd text-rd-28 font-bold leading-none tracking-rd-titulo text-rd-ink tabular-nums">
              {totalCompletadas}
            </span>
            <p className="m-0 mt-2 text-rd-12 leading-snug text-rd-ink-meta">
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
    { id: 'publicar', t: 'Publica lo que puedes dar o lo que te hace falta', d: 'Es lo que te pone en el mapa.', hecho: !sinModulos, accion: <Button nivel="primario" tamano="sm" onClick={() => irA(RUTAS.ofrecer)}>Ofrecer ayuda</Button> },
    { id: 'verificar', t: 'Verifica la organización', d: 'Con la insignia, quien te lee sabe que existes y quién responde.', hecho: ORG.verificacion === 'verificada', accion: <Button nivel="terciario" tamano="sm" onClick={() => irA(`${RUTAS.perfil}#datos`)}>Adjuntar el certificado</Button> },
    { id: 'equipo', t: 'Registra a quien entrega', d: 'Para poder asignar entregas y saber quién las lleva.', hecho: EQUIPO.length > 0, accion: <Button nivel="terciario" tamano="sm" onClick={() => onAccion('#equipo')}>Ver mi equipo</Button> },
    { id: 'avisos', t: 'Revisa cómo te avisamos', d: 'Elige si algo te llega por WhatsApp, por correo o solo aquí.', hecho: ORG.canalesRevisados, accion: <Button nivel="terciario" tamano="sm" onClick={() => irA(`${RUTAS.perfil}#avisos`)}>Ver mis canales</Button> },
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
                <div key={k} className="flex flex-col gap-3 rounded-rd-lg border border-rd-line bg-rd-fondo p-4">
                  <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-rd-md text-white ${k === 'pedir' ? 'bg-rd-coral' : 'bg-rd-navy'}`}>
                    {k === 'pedir' ? <Hand className="h-5.5 w-5.5" /> : <HeartHandshake className="h-5.5 w-5.5" />}
                  </span>
                  <h2 className="font-rd m-0 text-rd-16 font-semibold text-rd-ink">{p.titulo}</h2>
                  <p className="m-0 text-rd-13-5 leading-normal text-rd-ink-2">{p.texto}</p>
                  <p className="m-0 text-rd-12 text-rd-ink-meta">
                    Abre: <b className="font-semibold text-rd-ink-2">{p.abre.join(' · ')}</b>
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
              Ver el seguimiento
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {historias.map((s) => (
              <figure key={s.id} className="m-0 flex flex-col gap-2 rounded-rd-lg border border-rd-line bg-rd-fondo p-4">
                <blockquote className="m-0 text-rd-13-5 leading-normal text-rd-ink">«{s.cierre?.historia}»</blockquote>
                <figcaption className="mt-auto text-rd-12 text-rd-ink-meta">
                  {cifra(s.cant)} {s.u} de {s.rec.toLowerCase()} · {s.quien} · {s.cuando}
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
                · Guía de puesta en marcha
              </span>
            </div>
          }
          accion={
            <div className="flex items-center gap-2">
              <Button
                nivel="secundario"
                tamano="sm"
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
              <Button nivel="terciario" tamano="sm" onClick={onOcultarPasos}>
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
  idPublicacion?: string;
  onEditar: (r: RecursoPedido) => void;
  onTogglePausa: (r: RecursoPedido) => void;
  onGestionarPublicacion?: () => void;
}> = ({ recursos, idPublicacion, onEditar, onTogglePausa, onGestionarPublicacion }) => (
  <Caja
    titulo="Mis necesidades"
    accion={
      <div className="flex items-center gap-2">
        {onGestionarPublicacion && (
          <Button nivel="secundario" tamano="md" onClick={onGestionarPublicacion}>
            Gestionar publicación
          </Button>
        )}
        <Button nivel="secundario" tamano="md" soloIcono aria-label="Ver en el mapa" title="Ver en el mapa" onClick={() => irA(`${RUTAS.radar}?punto=${idPublicacion || NECESIDAD.id}`)}>
          <MapIcon aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
    }
  >
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
          num: true,
          celda: (r) => {
            /* Una sola línea, «N de M», como manda el manual: apilar cifra y total se veía
               apeñuscado (Alejandro, 16 de septiembre de 2026). */
            const falta = Math.max(0, r.total - r.confirmada - r.camino);
            return <b className="font-semibold">{falta === 0 ? 'Nada' : `${cifra(falta)} de ${cifra(r.total)} ${r.unidad}`}</b>;
          },
        },
        {
          k: 'avance',
          etiqueta: 'Avance',
          ancha: true,
          celda: (r) => <BarraAvance hecho={Math.round((r.confirmada / r.total) * 100)} camino={Math.round((r.camino / r.total) * 100)} texto={`${cifra(r.confirmada)} confirmado · ${cifra(r.camino)} en camino`} />,
        },
        {
          k: 'acc',
          etiqueta: 'Acciones',
          acc: true,
          celda: (r) => (
            <>
              <Button nivel="secundario" tamano="sm" onClick={() => onEditar(r)}>
                Editar
              </Button>
              <Button nivel="secundario" tamano="sm" onClick={() => onTogglePausa(r)}>
                {r.pausado ? 'Reanudar' : 'Pausar'}
              </Button>
            </>
          ),
        },
      ]}
    />
  </Caja>
);




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
                    <Button nivel="secundario" tamano="sm" onClick={() => onVer(a)}>
                      Ver acta
                    </Button>
                    <span className="max-xl:ml-auto">
                      <MenuAcciones
                        tamano="sm"
                        etiqueta={`Más acciones del acta ${a.codigo}`}
                        items={[
                          { texto: 'Descargar en PDF', icono: <Download className="h-4 w-4" />, onElegir: () => onDescargar(a) },
                        ]}
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
      <div className="no-print flex items-center justify-between border-b border-rd-line px-5 py-3.5 bg-rd-sunken/40 shrink-0">
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
                  RaDAR · Aquí Hace Falta
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
            <h3 className="m-0 text-rd-16 font-bold text-rd-ink tracking-tight">
              Acta de Entrega y Recepción de Ayuda
            </h3>
            <p className="m-0 mt-0.5 text-rd-12 text-rd-ink-meta">
              Constancia bilateral de entrega en territorio y verificación de insumos
            </p>
          </div>

          {/* Cuadrícula bilateral de entidades intervinientes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            {/* Lado A: Entrega */}
            <div className="rounded-rd-md border border-rd-line bg-rd-sunken/40 p-3.5">
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
            <div className="rounded-rd-md border border-rd-line bg-rd-sunken/40 p-3.5">
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
          <div className="rounded-rd-md border border-rd-line bg-rd-surface p-3.5 mb-3.5">
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

          {/* Historia de impacto humano */}
          {a.historia && (
            <div className="rounded-rd-md border-l-3 border-brand-yellow bg-rd-sunken/60 p-3.5 mb-3.5">
              <p className="m-0 mb-1 text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                Impacto en territorio · Lo que permitió
              </p>
              <blockquote className="m-0 text-rd-13 leading-relaxed text-rd-ink italic">
                «{a.historia}»
              </blockquote>
            </div>
          )}

          {/* Soporte fotográfico */}
          {fotosDeActa(a).length > 0 && (
            <div className="rounded-rd-md border border-rd-line bg-rd-surface p-3.5 mb-3.5">
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
      <div className="no-print flex items-center justify-between border-t border-rd-line px-5 py-3.5 bg-rd-sunken/40 shrink-0">
        <Button nivel="terciario" tamano="md" onClick={onCerrar}>
          Cerrar
        </Button>
        <Button nivel="primario" tamano="md" icono={<Download className="h-4 w-4" />} onClick={() => onDescargar(a)}>
          Descargar en PDF
        </Button>
      </div>
    </dialog>
  );
};

/* ---------- módulo ofrece ---------- */

const MisOfertas: React.FC<{
  recursos: RecursoOfrecido[];
  sol: Solicitud[];
  idPublicacion?: string;
  onEditar: (r: RecursoOfrecido) => void;
  onTogglePausa: (r: RecursoOfrecido) => void;
  onGestionarPublicacion?: () => void;
}> = ({ recursos, sol, idPublicacion, onEditar, onTogglePausa, onGestionarPublicacion }) => (
  <Caja
    titulo="Mis ofertas"
    accion={
      <div className="flex items-center gap-2">
        {onGestionarPublicacion && (
          <Button nivel="secundario" tamano="md" onClick={onGestionarPublicacion}>
            Gestionar publicación
          </Button>
        )}
        <Button nivel="secundario" tamano="md" soloIcono aria-label="Ver en el mapa" title="Ver en el mapa" onClick={() => irA(`${RUTAS.radar}?punto=${idPublicacion || OFERTA.id}`)}>
          <MapIcon aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
    }
  >
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
          num: true,
          celda: (r) => {
            const q = quedan(sol, r);
            return (
              <b className="font-semibold">
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
            const texto = [`${cifra(conf)} confirmado`, porConf ? `${cifra(porConf)} entregado por confirmar` : '', camino ? `${cifra(camino)} en camino` : ''].filter(Boolean).join(' · ');
            return <BarraAvance hecho={Math.round((conf / r.total) * 100)} camino={Math.round(((porConf + camino) / r.total) * 100)} texto={texto} />;
          },
        },
        { k: 'disp', etiqueta: 'Disponible', celda: (r) => r.disp },
        { k: 'como', etiqueta: 'Cómo', celda: () => 'Lo llevamos · 15 km' },
        {
          k: 'acc',
          etiqueta: 'Acciones',
          acc: true,
          celda: (r) => (
            <>
              <Button nivel="secundario" tamano="sm" onClick={() => onEditar(r)}>
                Editar
              </Button>
              <Button nivel="secundario" tamano="sm" onClick={() => onTogglePausa(r)}>
                {r.pausado ? 'Reanudar' : 'Pausar'}
              </Button>
            </>
          ),
        },
      ]}
    />
  </Caja>
);


const COLUMNAS: { estado: Solicitud['estado']; nombre: string; vacia: string; clase: string; titulo: string; icono: React.ReactNode; soloConAlgo?: boolean }[] = [
  { estado: 'nueva', nombre: 'Solicitudes', vacia: 'Sin solicitudes por responder', clase: 'border-rd-coral/40', titulo: 'text-rd-coral', icono: <Megaphone className="h-4 w-4" /> },
  { estado: 'aceptada', nombre: 'Comprometida', vacia: 'Sin entregas comprometidas', clase: 'border-rd-line', titulo: 'text-rd-ink-2', icono: <CircleDashed className="h-4 w-4" /> },
  { estado: 'camino', nombre: 'En camino', vacia: 'Nada en camino', clase: 'border-rd-amber-line', titulo: 'text-rd-amber-ink', icono: <Clock className="h-4 w-4" /> },
  { estado: 'entregada', nombre: 'Por confirmar', vacia: 'Nada por confirmar', clase: 'border-rd-navy-line', titulo: 'text-rd-navy', icono: <CircleDot className="h-4 w-4" /> },
  { estado: 'confirmada', nombre: 'Confirmada', vacia: 'Sin entregas confirmadas', clase: 'border-rd-green-line', titulo: 'text-rd-green', icono: <Check className="h-4 w-4" /> },
  { estado: 'archivada', nombre: 'Archivadas', vacia: `Nada archivado todavía. Las confirmadas pasan aquí a los ${DIAS_PARA_ARCHIVAR} días`, clase: 'border-rd-line', titulo: 'text-rd-ink-meta', icono: <Archive className="h-4 w-4" /> },
];

const COLUMNAS_RECIBIDAS: { estado: EntregaRecibida['estado']; nombre: string; vacia: string; clase: string; titulo: string; icono: React.ReactNode; soloConAlgo?: boolean }[] = [
  { estado: 'nueva', nombre: 'Ofertas', vacia: 'Sin ofertas por responder', clase: 'border-rd-coral/40', titulo: 'text-rd-coral', icono: <Megaphone className="h-4 w-4" /> },
  { estado: 'aceptada', nombre: 'Comprometidas', vacia: 'Sin entregas comprometidas', clase: 'border-rd-line', titulo: 'text-rd-ink-2', icono: <CircleDashed className="h-4 w-4" /> },
  { estado: 'camino', nombre: 'En camino', vacia: 'Nada en camino hacia ti', clase: 'border-rd-amber-line', titulo: 'text-rd-amber-ink', icono: <Clock className="h-4 w-4" /> },
  { estado: 'entregada', nombre: 'Por confirmar', vacia: 'Sin entregas por confirmar', clase: 'border-rd-navy-line', titulo: 'text-rd-navy', icono: <CircleDot className="h-4 w-4" /> },
  { estado: 'confirmada', nombre: 'Confirmadas', vacia: 'Sin entregas confirmadas', clase: 'border-rd-green-line', titulo: 'text-rd-green', icono: <Check className="h-4 w-4" /> },
  { estado: 'archivada', nombre: 'Archivadas', vacia: 'Nada archivado todavía', clase: 'border-rd-line', titulo: 'text-rd-ink-meta', icono: <Archive className="h-4 w-4" /> },
];

const ORDEN_CICLO: Record<Solicitud['estado'], number> = { nueva: 0, aceptada: 1, camino: 2, entregada: 3, confirmada: 4, archivada: 5 };
const NOMBRE_ESTADO: Record<Solicitud['estado'], string> = { nueva: 'Nueva', aceptada: 'Comprometida', camino: 'En camino', entregada: 'Por confirmar', confirmada: 'Confirmada', archivada: 'Archivada' };

/** Las reglas de mover una tarjeta (`puedeMover` del prototipo): arrastrar hace lo mismo que
 *  el botón. Lo nuevo se responde, no se arrastra; a Confirmada no se llega (la cierran los dos
 *  lados con foto) y a Archivadas se llega con «Archivar»; de a un paso; a En camino solo con
 *  alguien asignado. Devuelve el motivo si no se puede, `null` si sí. */
function puedeMover(s: Solicitud, a: Solicitud['estado']): string | null {
  if (a === s.estado) return '';
  if (s.estado === 'nueva' || a === 'nueva') return 'Las solicitudes nuevas se aceptan o se declinan';
  if (a === 'archivada' || s.estado === 'archivada') return 'Las confirmadas se archivan con el botón';
  if (a === 'confirmada' || s.estado === 'confirmada') return 'Las confirmadas se cierran con foto, no se arrastran';
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
  onVerFotosRecibida: (r: EntregaRecibida, i: number) => void;
  onAceptarRecibida: (id: number) => void;
  onRechazarRecibida: (id: number) => void;
  onVerPublicacionRecibida?: (r: EntregaRecibida) => void;
}> = ({
  modulos,
  sol,
  recibidas,
  acciones,
  onConfirmarRecibido,
  onVerFotosRecibida,
  onAceptarRecibida,
  onRechazarRecibida,
  onVerPublicacionRecibida,
}) => {
  const tieneAmbos = modulos.pide && modulos.ofrece;
  const [vista, setVista] = useState<'entrego' | 'recibo'>(() => (modulos.ofrece ? 'entrego' : 'recibo'));
  const [nuevasColapsadas, setNuevasColapsadas] = useState(false);
  const [confirmadasColapsadas, setConfirmadasColapsadas] = useState(false);
  const [archivadasColapsadas, setArchivadasColapsadas] = useState(false);
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
    onMover(id, a);
  };

  const verEntregas = !modulos.pide || (modulos.ofrece && vista === 'entrego');

  return (
    <section className="col-span-full min-w-0">
      <div className="mb-4 flex flex-col items-start gap-2.5">
        <h2 className="font-rd m-0 text-rd-16 font-semibold tracking-rd-titulo text-rd-ink">
          Seguimiento
        </h2>
        {tieneAmbos && (
          <div className="inline-flex rounded-rd-md border border-rd-line bg-rd-sunken p-0.5">
            <button
              type="button"
              onClick={() => setVista('entrego')}
              className={`cursor-pointer rounded-rd-sm px-3 py-1 text-rd-12 font-medium transition-colors ${
                vista === 'entrego'
                  ? 'bg-rd-surface font-semibold text-rd-ink shadow-xs'
                  : 'text-rd-ink-2 hover:text-rd-ink'
              }`}
            >
              Ayuda que entrego
              <span className="ml-1.5 rounded-full bg-rd-sunken px-1.5 py-0.5 text-rd-11 font-semibold text-rd-ink-2">
                {sol.filter((s) => s.estado !== 'archivada').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVista('recibo')}
              className={`cursor-pointer rounded-rd-sm px-3 py-1 text-rd-12 font-medium transition-colors ${
                vista === 'recibo'
                  ? 'bg-rd-surface font-semibold text-rd-ink shadow-xs'
                  : 'text-rd-ink-2 hover:text-rd-ink'
              }`}
            >
              Ayuda que recibo
              <span className="ml-1.5 rounded-full bg-rd-sunken px-1.5 py-0.5 text-rd-11 font-semibold text-rd-ink-2">
                {recibidas.filter((r) => r.estado !== 'archivada').length}
              </span>
            </button>
          </div>
        )}
      </div>

      {verEntregas ? (
        <div
          role="region"
          aria-label="Tablero de seguimiento de entregas"
          tabIndex={0}
          className="zona-rd-scroll -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6 lg:-mx-8 lg:px-8 lg:scroll-pl-8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy"
        >
          {COLUMNAS.map((c) => {
            const items = sol.filter((s) => s.estado === c.estado);
            const esNueva = c.estado === 'nueva';
            const esConfirmada = c.estado === 'confirmada';
            const esArchivada = c.estado === 'archivada';

            const estaColapsada =
              (esNueva && (nuevasColapsadas || items.length === 0)) ||
              (esConfirmada && (confirmadasColapsadas || items.length === 0)) ||
              (esArchivada && archivadasColapsadas);

            if (estaColapsada) {
              const expandir = () => {
                if (esNueva) setNuevasColapsadas(false);
                else if (esConfirmada) setConfirmadasColapsadas(false);
                else if (esArchivada) setArchivadasColapsadas(false);
              };
              const direccion = esNueva ? 'der' : 'izq';
              return (
                <div
                  key={c.estado}
                  onClick={expandir}
                  title={`Clic para expandir ${c.nombre}`}
                  className="flex min-h-70 w-12 sm:basis-12 shrink-0 snap-start cursor-pointer flex-col items-center gap-3 rounded-rd-lg border border-rd-line bg-rd-sunken py-3 px-1 transition-colors hover:bg-rd-line-soft hover:border-rd-ink/30"
                >
                  <button
                    type="button"
                    aria-label={`Expandir columna ${c.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      expandir();
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                  >
                    {direccion === 'der' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                  <span aria-hidden="true" className="text-rd-ink-meta">{c.icono}</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  <span className="mt-2 text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta [writing-mode:vertical-rl] rotate-180">
                    {c.nombre}
                  </span>
                </div>
              );
            }
            const recibe = c.estado !== 'confirmada' && c.estado !== 'nueva' && c.estado !== 'archivada';
            return (
              <div
                key={c.estado}
                onDragOver={(e) => {
                  if (!recibe) return;
                  e.preventDefault();
                  setSobre(c.estado);
                }}
                onDragLeave={() => setSobre((x) => (x === c.estado ? null : x))}
                onDrop={(e) => {
                  e.preventDefault();
                  setSobre(null);
                  mover(Number(e.dataTransfer.getData('text/plain')), c.estado);
                }}
                className={`ranura-rd-tablero flex min-h-70 min-w-0 snap-start flex-col gap-2 rounded-rd-lg border p-2 transition-colors sm:flex-1 sm:min-w-80 ${
                  sobre === c.estado ? 'bg-rd-navy-soft ring-2 ring-rd-navy-line' : 'bg-rd-sunken'
                } ${c.clase}`}
              >
                <div
                  className={`flex items-center gap-2 px-2 pt-1.5 pb-2 text-rd-11 font-semibold tracking-wider uppercase ${c.titulo}`}
                >
                  <span aria-hidden="true">{c.icono}</span>
                  {c.nombre}
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  {esNueva && (
                    <button
                      type="button"
                      title="Colapsar columna"
                      aria-label={`Colapsar columna ${c.nombre}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNuevasColapsadas(true);
                      }}
                      className="ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  {(esConfirmada || esArchivada) && (
                    <button
                      type="button"
                      title="Colapsar columna"
                      aria-label={`Colapsar columna ${c.nombre}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (esConfirmada) setConfirmadasColapsadas(true);
                        else setArchivadasColapsadas(true);
                      }}
                      className="ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
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
          className="zona-rd-scroll -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6 lg:-mx-8 lg:px-8 lg:scroll-pl-8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy"
        >
          {COLUMNAS_RECIBIDAS.map((c) => {
            const items = recibidas.filter((r) => r.estado === c.estado);
            const esNueva = c.estado === 'nueva';
            const esConfirmada = c.estado === 'confirmada';
            const esArchivada = c.estado === 'archivada';

            const estaColapsada =
              (esNueva && (nuevasColapsadas || items.length === 0)) ||
              (esConfirmada && (confirmadasColapsadas || items.length === 0)) ||
              (esArchivada && archivadasColapsadas);

            if (estaColapsada) {
              const expandir = () => {
                if (esNueva) setNuevasColapsadas(false);
                else if (esConfirmada) setConfirmadasColapsadas(false);
                else if (esArchivada) setArchivadasColapsadas(false);
              };
              const direccion = esNueva ? 'der' : 'izq';
              return (
                <div
                  key={c.estado}
                  onClick={expandir}
                  title={`Clic para expandir ${c.nombre}`}
                  className="flex min-h-70 w-12 sm:basis-12 shrink-0 snap-start cursor-pointer flex-col items-center gap-3 rounded-rd-lg border border-rd-line bg-rd-sunken py-3 px-1 transition-colors hover:bg-rd-line-soft hover:border-rd-ink/30"
                >
                  <button
                    type="button"
                    aria-label={`Expandir columna ${c.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      expandir();
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                  >
                    {direccion === 'der' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                  <span aria-hidden="true" className="text-rd-ink-meta">{c.icono}</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  <span className="mt-2 text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta [writing-mode:vertical-rl] rotate-180">
                    {c.nombre}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={c.estado}
                className={`ranura-rd-tablero flex min-h-70 min-w-0 snap-start flex-col gap-2 rounded-rd-lg border bg-rd-sunken p-2 sm:flex-1 sm:min-w-80 ${c.clase}`}
              >
                <div
                  className={`flex items-center gap-2 px-2 pt-1.5 pb-2 text-rd-11 font-semibold tracking-wider uppercase ${c.titulo}`}
                >
                  <span aria-hidden="true">{c.icono}</span>
                  {c.nombre}
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                    {items.length}
                  </span>
                  {esNueva && (
                    <button
                      type="button"
                      title="Colapsar columna"
                      aria-label={`Colapsar columna ${c.nombre}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNuevasColapsadas(true);
                      }}
                      className="ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  {(esConfirmada || esArchivada) && (
                    <button
                      type="button"
                      title="Colapsar columna"
                      aria-label={`Colapsar columna ${c.nombre}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (esConfirmada) setConfirmadasColapsadas(true);
                        else setArchivadasColapsadas(true);
                      }}
                      className="ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-rd-sm text-rd-ink-meta hover:bg-rd-surface hover:text-rd-ink"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {items.map((r) => (
                  <TarjetaRecibida
                    key={r.id}
                    r={r}
                    onConfirmar={onConfirmarRecibido}
                    onVerFotos={onVerFotosRecibida}
                    onAceptar={onAceptarRecibida}
                    onRechazar={onRechazarRecibida}
                    onVerPublicacion={onVerPublicacionRecibida}
                    menuFlotante
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
        textoCancelar="Dejar como está"
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
              </b>{' '}
              · {devolviendo.s.quien} · hoy: {NOMBRE_ESTADO[devolviendo.s.estado]}
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

  const hayFiltros = Boolean(busqueda || filtroUbicacion || filtroVeh || filtroDisp);

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
      titulo={
        <>
          Mi equipo<Conteo n={equipo.length} />
        </>
      }
      accion={
        <Button nivel="secundario" tamano="md" onClick={onRegistrar}>
          Agregar persona
        </Button>
      }
    >
      <div className="mb-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <CampoBuscar
            valor={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por nombre, profesión, rol..."
            abierto={true}
            className="h-10 w-full sm:w-72"
          />

          <div className="relative inline-flex items-center">
            <select
              id="filtro-equipo-ubicacion"
              aria-label="Filtrar por ubicación"
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className={`font-rd h-10 cursor-pointer appearance-none rounded-full border bg-rd-surface pl-3.5 pr-8 text-rd-13 font-medium transition-colors hover:bg-rd-fondo focus:border-rd-navy focus:outline-none focus:ring-2 focus:ring-rd-navy-soft ${
                filtroUbicacion ? 'border-rd-navy bg-rd-navy/5 font-semibold text-rd-navy' : 'border-rd-line text-rd-ink'
              }`}
            >
              <option value="">Todas las ubicaciones</option>
              {DEPTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2.5 h-4 w-4 ${filtroUbicacion ? 'text-rd-navy' : 'text-rd-ink-3'}`} />
          </div>

          <div className="relative inline-flex items-center">
            <select
              id="filtro-equipo-vehiculo"
              aria-label="Filtrar por tipo de vehículo"
              value={filtroVeh}
              onChange={(e) => setFiltroVeh(e.target.value)}
              className={`font-rd h-10 cursor-pointer appearance-none rounded-full border bg-rd-surface pl-3.5 pr-8 text-rd-13 font-medium transition-colors hover:bg-rd-fondo focus:border-rd-navy focus:outline-none focus:ring-2 focus:ring-rd-navy-soft ${
                filtroVeh ? 'border-rd-navy bg-rd-navy/5 font-semibold text-rd-navy' : 'border-rd-line text-rd-ink'
              }`}
            >
              <option value="">Todos los vehículos</option>
              {VEHICULOS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2.5 h-4 w-4 ${filtroVeh ? 'text-rd-navy' : 'text-rd-ink-3'}`} />
          </div>

          <div className="relative inline-flex items-center">
            <select
              id="filtro-equipo-disponibilidad"
              aria-label="Filtrar por disponibilidad"
              value={filtroDisp}
              onChange={(e) => setFiltroDisp(e.target.value)}
              className={`font-rd h-10 cursor-pointer appearance-none rounded-full border bg-rd-surface pl-3.5 pr-8 text-rd-13 font-medium transition-colors hover:bg-rd-fondo focus:border-rd-navy focus:outline-none focus:ring-2 focus:ring-rd-navy-soft ${
                filtroDisp ? 'border-rd-navy bg-rd-navy/5 font-semibold text-rd-navy' : 'border-rd-line text-rd-ink'
              }`}
            >
              <option value="">Cualquier disponibilidad</option>
              {DISPONIBILIDADES.map((d) => (
                <option key={d.valor} value={d.valor}>{d.etiqueta}</option>
              ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2.5 h-4 w-4 ${filtroDisp ? 'text-rd-navy' : 'text-rd-ink-3'}`} />
          </div>

          {hayFiltros && (
            <span className="ml-auto text-rd-12 text-rd-ink-meta font-medium">
              Mostrando {filtrados.length} de {equipo.length}
            </span>
          )}
        </div>

        {hayFiltros && (
          <ZonaChips>
            {busqueda && (
              <ChipAplicado texto={`"${busqueda}"`} onQuitar={() => setBusqueda('')} />
            )}
            {filtroUbicacion && (
              <ChipAplicado texto={filtroUbicacion} onQuitar={() => setFiltroUbicacion('')} />
            )}
            {filtroVeh && (
              <ChipAplicado texto={filtroVeh} onQuitar={() => setFiltroVeh('')} />
            )}
            {filtroDisp && (
              <ChipAplicado
                texto={DISPONIBILIDADES.find((d) => d.valor === filtroDisp)?.etiqueta || filtroDisp}
                onQuitar={() => setFiltroDisp('')}
              />
            )}
            <QuitarTodos onClick={resetFiltros} />
          </ZonaChips>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-rd-lg border border-dashed border-rd-line bg-rd-sunken/40 py-8 text-center">
          <p className="text-rd-14 font-medium text-rd-ink">No se encontraron integrantes con los filtros seleccionados.</p>
          <p className="mt-1 text-rd-12 text-rd-ink-meta">Prueba cambiando la búsqueda, ubicación, vehículo o disponibilidad.</p>
          <Button nivel="secundario" tamano="sm" onClick={resetFiltros} className="mt-3">
            Quitar filtros
          </Button>
        </div>
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

                  <div className="shrink-0 -mr-1 -mt-1">
                    <MenuAcciones
                      tamano="sm"
                      flotante
                      etiqueta={`Opciones de ${e.n}`}
                      items={[
                        {
                          texto: 'Escribir por WhatsApp',
                          icono: <IconoWhatsApp className="h-4 w-4 text-rd-green" />,
                          onElegir: () => {
                            const num = e.tel.replace(/\D/g, '');
                            const numWa = num.startsWith('57') ? num : `57${num}`;
                            window.open(`https://wa.me/${numWa}`, '_blank', 'noopener');
                          },
                        },
                        {
                          texto: `Llamar (${e.tel})`,
                          icono: <Phone className="h-4 w-4" />,
                          onElegir: () => {
                            window.location.href = `tel:${e.tel.replace(/\s/g, '')}`;
                          },
                        },
                        {
                          texto: 'Editar datos',
                          icono: <Edit3 className="h-4 w-4" />,
                          onElegir: () => onEditar(e),
                        },
                        {
                          texto: 'Dar de baja',
                          icono: <X className="h-4 w-4" />,
                          tono: 'peligro',
                          onElegir: () => onConfirmarBaja(e),
                        },
                      ]}
                    />
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
                <div className="mt-2.5 flex items-center justify-between border-t border-rd-line-soft/60 pt-2 text-rd-11-5 text-rd-ink-meta">
                  <span>Entregas realizadas</span>
                  <span className="font-semibold text-rd-ink bg-rd-sunken px-2.5 py-0.5 rounded-full text-rd-11">
                    {e.hechas} {e.hechas === 1 ? 'entrega' : 'entregas'}
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
                  tamano="sm"
                  flotante
                  etiqueta={`Opciones de ${e.n}`}
                  items={[
                    {
                      texto: 'Escribir por WhatsApp',
                      icono: <IconoWhatsApp className="h-4 w-4 text-rd-green" />,
                      onElegir: () => {
                        const num = e.tel.replace(/\D/g, '');
                        const numWa = num.startsWith('57') ? num : `57${num}`;
                        window.open(`https://wa.me/${numWa}`, '_blank', 'noopener');
                      },
                    },
                    {
                      texto: `Llamar (${e.tel})`,
                      icono: <Phone className="h-4 w-4" />,
                      onElegir: () => {
                        window.location.href = `tel:${e.tel.replace(/\s/g, '')}`;
                      },
                    },
                    {
                      texto: 'Editar datos',
                      icono: <Edit3 className="h-4 w-4" />,
                      onElegir: () => onEditar(e),
                    },
                    {
                      texto: 'Dar de baja',
                      icono: <X className="h-4 w-4" />,
                      tono: 'peligro',
                      onElegir: () => onConfirmarBaja(e),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </Caja>
  );
};



