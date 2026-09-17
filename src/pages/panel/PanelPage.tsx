import React, { useEffect, useMemo, useState } from 'react';
import { Archive, BadgeCheck, Check, CircleDashed, CircleDot, Clock, Copy, Download, FileText, Hand, HeartHandshake, Map as MapIcon, Megaphone, Package, TriangleAlert, Truck, Users } from 'lucide-react';
import { Dialogo, Opciones } from '../../components/ui/Dialogo';
import { DialogoAsignar, DialogoCierre } from './dialogos';
import { TarjetaRecibida, TarjetaSolicitud, accionesDe, menuDe, quienLleva, type AccionesSolicitud } from './TarjetaEntrega';
import { TiraFotos, VisorFotos, type GrupoFotos } from '../../components/ui/VisorFotos';
import { cuentaFotos, fotosDeEntrega, fotosDeRecibida, listaFotos } from '../../mocks/fotosMock';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { Button } from '../../components/ui/Button';
import { Avatar, EtiquetaCiclo } from '../../components/ui/Etiqueta';
import { InlineNotice } from '../../components/ui/InlineNotice';
import { Pestanas } from '../../components/ui/Pestanas';
import { Vacio } from '../../components/ui/Vacio';
import { FilaSwitch } from '../../components/ui/Switch';
import { Caja, Conteo } from '../../components/ui/Caja';
import { IconoRecursoDe } from '../../components/ui/Recursos';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { ACTIVIDAD, DIAS_PARA_ARCHIVAR, DISPONIBILIDAD, EQUIPO, ESTADO_RECIBIDA, ESTADO_SOLICITUD, INVITADOS, NECESIDAD, OFERTA, ORG, PUERTAS, RECIBIDAS, ROL_PLATAFORMA, SOLICITUDES } from '../../mocks/panelMock';
import type { ModulosCuenta } from '../../types/cuenta';
import type { Acta, BloqueResumen, EntregaRecibida, Kpi, Pendiente, Solicitud } from '../../types/panel';
import { actasDe, archivarViejas, bloquesResumen, cantidadPorEstado, kpisDe, modulosGuardados, nuevas, pendientesCuenta, pendientesDe, pestanasDe, porConfirmar, quedan, recibidasPorConfirmar, resumenActas, textoActa, textoCertificar, textoCierre } from '../../utils/panel';
import { nombrePanel } from '../../utils/cuenta';
import { cifra, iniciales, unidad } from '../../utils/publicaciones';
import { Tabla } from '../../components/ui/Tabla';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Barra, PuntoTono, type TonoTramo } from '../../components/ui/Barra';

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

  const datos = { oferta: OFERTA, sol, necesidad: NECESIDAD, recibidas };
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
  const actas = useMemo(() => actasDe(modulos, { sol, recibidas, org: ORG.nombre, lleva: (s) => quienLleva(s)?.split(' · ')[0] ?? null }), [modulos, sol, recibidas]);
  const [acta, setActa] = useState<Acta | null>(null);
  const verFotosActa = (a: Acta, inicial = 0) => {
    if (a.origen.tipo === 'solicitud') {
      const s = sol.find((x) => x.id === a.origen.id);
      if (s) verFotosEntrega(s, inicial);
    } else {
      const r = recibidas.find((x) => x.id === a.origen.id);
      if (r) verFotosRecibida(r, inicial);
    }
  };
  const copiarActa = (a: Acta) => {
    const listo = () => avisar(`Acta ${a.codigo} copiada`, { tipo: 'ok' });
    if (navigator.clipboard) navigator.clipboard.writeText(textoActa(a)).then(listo, listo);
    else listo();
  };
  const descargarActa = (a: Acta) => avisar(`Acta ${a.codigo} lista para descargar (en la app real, un PDF)`, { tipo: 'ok' });
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
  /* Todo lo que se puede hacer con una solicitud, en un solo objeto: lo usan el tablero, la tabla y las tarjetas. */
  const accionesSolicitud: AccionesSolicitud = { onAceptar: aceptar, onRechazar: rechazar, onMover: mover, onAsignar: setAsignando, onRecordar: recordar, onCertificar: setCertificando, onArchivar: archivar, onCancelar: setCancelando, onVerFotos: verFotosEntrega };
  const accion = (al: string) => {
    if (al.startsWith('#')) return cambiarTab(al.slice(1));
    const [que, idTexto] = al.split(':');
    const id = Number(idTexto);
    if (que === 'confirmar') setConfirmando(recibidas.find((r) => r.id === id) ?? null);
    if (que === 'recordar') recordar(id);
    if (que === 'aceptar') aceptar(id);
    if (que === 'rechazar') rechazar(id);
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
            {actual === 'necesidades' && <MisNecesidades />}
            {actual === 'recibidas' && <EntregasRecibidas recibidas={recibidas} onConfirmar={(id) => accion(`confirmar:${id}`)} onVerFotos={verFotosRecibida} />}
            {actual === 'ofertas' && <MisOfertas sol={sol} />}
            {actual === 'solicitudes' && <Solicitudes sol={sol} acciones={accionesSolicitud} />}
            {actual === 'seguimiento' && <Seguimiento sol={sol} acciones={accionesSolicitud} />}
            {actual === 'reportes' && <Reportes actas={actas} onVer={setActa} onCopiar={copiarActa} onDescargar={descargarActa} onVerFotos={verFotosActa} />}
            {actual === 'equipo' && <MiEquipo />}
            {actual === 'datos' && <Datos />}
          </div>
        </main>
        <DialogoAsignar solicitud={asignando} onCerrar={() => setAsignando(null)} onAsignar={asignar} />
        <DialogoActa acta={acta} onCerrar={() => setActa(null)} onCopiar={copiarActa} onVerFotos={verFotosActa} />
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

/** Icono y color de cada estado: los mismos que en las columnas del tablero y en la barra. */
const ICONO_ESTADO: Record<Solicitud['estado'], { icono: React.ReactNode; clase: string }> = {
  nueva: { icono: <Megaphone className="h-4.5 w-4.5" />, clase: 'text-rd-coral' },
  aceptada: { icono: <CircleDashed className="h-4.5 w-4.5" />, clase: 'text-rd-ink-2' },
  camino: { icono: <Truck className="h-4.5 w-4.5" />, clase: 'text-rd-amber-ink' },
  entregada: { icono: <Clock className="h-4.5 w-4.5" />, clase: 'text-rd-navy' },
  confirmada: { icono: <Check className="h-4.5 w-4.5" />, clase: 'text-rd-green' },
  archivada: { icono: <Archive className="h-4.5 w-4.5" />, clase: 'text-rd-ink-meta' },
};

/** El tono de la `Barra` para cada estado del ciclo: el mismo que su columna en el tablero. */
const TONO_ESTADO: Record<Solicitud['estado'], TonoTramo> = { nueva: 'nueva', aceptada: 'comprometida', camino: 'camino', entregada: 'porConfirmar', confirmada: 'confirmada', archivada: 'archivada' };

/** Un bloque del Resumen (patrón del «Spend overview» que eligió Alejandro, 16 de septiembre de
 *  2026, sobre nuestra `Caja`): el título y la acción de siempre, cuatro cuadritos con borde
 *  —icono a la izquierda, cifra con rótulo— y debajo la barra proporcional con su leyenda,
 *  sin contenedor. Una cara de la cuenta por bloque. */
const BloqueResumenVista: React.FC<{ bloque: BloqueResumen; onAccion: (al: string) => void }> = ({ bloque: b, onAccion }) => {
  const total = b.barra.reduce((t, x) => t + x.n, 0);
  return (
    <Caja
      titulo={b.titulo}
      accion={
        <Button nivel="terciario" tamano="md" onClick={() => onAccion(b.enlace.al)}>
          {b.enlace.texto}
        </Button>
      }
    >
      {/* El conteo va en el chip del sistema, nunca en una línea con puntos, y `Conteo` cuenta
          cosas de una lista, no dice estados (Alejandro, 16 de septiembre de 2026): el avance de
          la publicación no va aquí, vive en su pestaña. Aquí solo las entregas de esa cara:
          cuadritos y barra con las mismas cifras por estado. */}
      <p className="m-0 mb-2 text-rd-12 font-medium text-rd-ink-meta">
        {b.barraTitulo}
        <Conteo n={total} />
      </p>
      {/* Bajo 640 el icono va encima de la cifra: a dos columnas, «Comprometidas» no cabe al lado. */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {b.kpis.map((k) => (
          <div key={k.k} className="flex min-w-0 flex-col items-start gap-2 rounded-rd-lg border border-rd-line bg-rd-surface p-3 sm:flex-row sm:items-center sm:gap-3">
            <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-rd-md border border-rd-line ${ICONO_ESTADO[k.estado].clase}`}>
              {ICONO_ESTADO[k.estado].icono}
            </span>
            <span className="flex min-w-0 flex-col">
              {/* La cifra siempre en tinta; el tono solo en el icono (Alejandro, 16 de septiembre de 2026). */}
              <span className="text-rd-22 leading-none font-semibold tracking-rd-titulo text-rd-ink tabular-nums">{k.v}</span>
              <span className="mt-1 text-rd-12-5 leading-tight text-rd-ink-2" title={k.d}>
                {k.k}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        {total === 0 ? (
          <p className="m-0 text-rd-12-5 text-rd-ink-meta">Todavía nada. Aquí verás cada entrega según cómo va.</p>
        ) : (
          <>
            <Barra etiqueta={`${b.barraTitulo}: ${b.barra.map((t) => `${t.n} ${t.texto.toLowerCase()}`).join(', ')}`} tramos={b.barra.map((t) => ({ tono: TONO_ESTADO[t.estado], porcentaje: (100 * t.n) / total }))} />
            {/* La leyenda en filas alineadas, no en línea corrida: con seis estados el texto se
                pisaba (Alejandro, 16 de septiembre de 2026). */}
            <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-x-6 gap-y-1.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {b.barra.map((t) => (
                <li key={t.estado} className="flex min-w-0 items-center gap-2 text-rd-12-5">
                  <PuntoTono tono={TONO_ESTADO[t.estado]} />
                  <span className="min-w-0 flex-1 truncate font-medium text-rd-ink">{t.texto}</span>
                  <span className="w-6 shrink-0 text-right font-semibold text-rd-ink tabular-nums">{t.n}</span>
                  <span className="w-11 shrink-0 text-right text-rd-12 text-rd-ink-meta tabular-nums">{Math.round((100 * t.n) / total)} %</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Caja>
  );
};

const Resumen: React.FC<{ modulos: ModulosCuenta; datos: Parameters<typeof kpisDe>[1]; pasosOcultos: boolean; onOcultarPasos: () => void; onAccion: (al: string) => void }> = ({ modulos, datos, pasosOcultos, onOcultarPasos, onAccion }) => {
  const sinModulos = !modulos.pide && !modulos.ofrece;
  const bloques = bloquesResumen(modulos, datos);
  const pendientes = pendientesDe(modulos, datos);
  const decisiones = pendientes.filter((p) => p.grupo === 'decision');
  const operaciones = pendientes.filter((p) => p.grupo === 'operacion');
  const historias = modulos.ofrece ? datos.sol.filter((s) => s.estado === 'confirmada' && s.cierre?.historia) : [];
  const pasos = [
    { id: 'publicar', t: 'Publica lo que puedes dar o lo que te hace falta', d: 'Es lo que te pone en el mapa.', hecho: !sinModulos, accion: <Button nivel="primario" tamano="sm" onClick={() => irA(RUTAS.ofrecer)}>Ofrecer ayuda</Button> },
    { id: 'verificar', t: 'Verifica la organización', d: 'Con la insignia, quien te lee sabe que existes y quién responde.', hecho: ORG.verificacion === 'verificada', accion: <Button nivel="terciario" tamano="sm" onClick={() => onAccion('#datos')}>Adjuntar el certificado</Button> },
    { id: 'equipo', t: 'Registra a quien entrega', d: 'Para poder asignar entregas y saber quién las lleva.', hecho: EQUIPO.length > 0, accion: <Button nivel="terciario" tamano="sm" onClick={() => onAccion('#equipo')}>Ver mi equipo</Button> },
    { id: 'avisos', t: 'Revisa cómo te avisamos', d: 'Elige si algo te llega por WhatsApp, por correo o solo aquí.', hecho: ORG.canalesRevisados, accion: <Button nivel="terciario" tamano="sm">Ver mis canales</Button> },
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
      {bloques.map((b) => (
        <BloqueResumenVista key={b.id} bloque={b} onAccion={onAccion} />
      ))}
      {!pasosOcultos && listos < pasos.length && (
        <Caja
          titulo={
            <>
              Primeros pasos<Conteo n={`${listos} de ${pasos.length}`} />
            </>
          }
          accion={
            <Button nivel="terciario" tamano="md" onClick={onOcultarPasos}>
              Ocultar
            </Button>
          }
        >
          {pasos.map((p, i) => (
            <div key={p.id} className={`flex items-start gap-3 py-3 ${i ? 'border-t border-rd-line-soft' : 'pt-0'}`}>
              {p.hecho ? <Check aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-green" /> : <CircleDashed aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rd-ink-3" />}
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
        </Caja>
      )}
      {/* Dos niveles (de la rama de Fede, por decisión de Alejandro, 16 de septiembre de 2026):
          lo que hay que responder ya y lo que está en curso. Cada fila trae su acción. */}
      {!sinModulos && (
        <>
          <Caja titulo="Decisiones inmediatas" className="col-span-full xl:col-span-6">
            <ListaPendientes lista={decisiones} vacio={{ icono: <Check className="h-6.5 w-6.5" />, titulo: 'Sin decisiones pendientes', texto: 'Cuando alguien pida de tus ofertas o te llegue una entrega, aparece aquí para responder.' }} onAccion={onAccion} />
          </Caja>
          <Caja titulo="Operaciones del día" className="col-span-full xl:col-span-6">
            <ListaPendientes lista={operaciones} vacio={{ icono: <Truck className="h-6.5 w-6.5" />, titulo: 'Sin operaciones en curso', texto: 'Lo que esté por asignar, en camino o por certificar aparece aquí.' }} onAccion={onAccion} />
          </Caja>
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

const MisNecesidades: React.FC = () => (
  <Caja
    titulo="Mis necesidades"
    accion={
      <Button nivel="secundario" tamano="md" soloIcono aria-label="Ver en el mapa" title="Ver en el mapa" onClick={() => irA(`${RUTAS.radar}?punto=${NECESIDAD.id}`)}>
        <MapIcon aria-hidden="true" className="h-5 w-5" />
      </Button>
    }
  >
    <Tabla
      etiqueta="Mis necesidades"
      filas={NECESIDAD.recursos}
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
                <b className="block font-semibold">{r.n}</b>
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
      ]}
    />
  </Caja>
);

const EntregasRecibidas: React.FC<{ recibidas: EntregaRecibida[]; onConfirmar: (id: number) => void; onVerFotos: (r: EntregaRecibida, i: number) => void }> = ({ recibidas, onConfirmar, onVerFotos }) => (
  <Caja
    titulo={
      <>
        Entregas recibidas{recibidasPorConfirmar(recibidas).length > 0 && <Conteo n={`${recibidasPorConfirmar(recibidas).length} por confirmar`} />}
      </>
    }
  >
    {recibidas.length === 0 ? (
      <Vacio icono={<Package className="h-6.5 w-6.5" />} titulo="Nadie se ha comprometido todavía" texto="Las organizaciones cercanas ven tu necesidad en el mapa. Cuando alguna se comprometa, aparece aquí." />
    ) : (
      <Tabla
        etiqueta="Entregas recibidas"
        filas={recibidas}
        clave={(r) => r.id}
        tarjeta={(r) => <TarjetaRecibida r={r} onConfirmar={onConfirmar} onVerFotos={onVerFotos} estado={<EtiquetaCiclo texto={ESTADO_RECIBIDA[r.estado].texto} tono={ESTADO_RECIBIDA[r.estado].tono} enCamino={r.estado === 'camino'} />} />}
        columnas={[
          {
            k: 'que',
            etiqueta: 'Qué',
            celda: (r) => (
              <>
                <b className="font-semibold">
                  {cifra(r.cant)} {r.u} de {r.rec.toLowerCase()}
                </b>
                <small className="block text-rd-12 text-rd-ink-meta">
                  {r.org} · {r.cuando}
                  {r.dist ? ` · a ${r.dist}` : ''}
                  {r.detalle ? ` · ${r.detalle}` : ''}
                </small>
              </>
            ),
          },
          { k: 'estado', etiqueta: 'Estado', estado: true, celda: (r) => <EtiquetaCiclo texto={ESTADO_RECIBIDA[r.estado].texto} tono={ESTADO_RECIBIDA[r.estado].tono} enCamino={r.estado === 'camino'} /> },
          { k: 'quienLleva', etiqueta: 'Quién lo lleva', celda: (r) => r.vol ?? <span className="text-rd-ink-meta">—</span> },
          { k: 'cierre', etiqueta: 'Cierre', celda: (r) => (cuentaFotos(fotosDeRecibida(r.id)) > 0 ? <TiraFotos fotos={listaFotos(fotosDeRecibida(r.id))} tamano="sm" onAbrir={(i) => onVerFotos(r, i)} /> : <span className="text-rd-ink-meta">—</span>) },
          {
            k: 'acc',
            etiqueta: 'Acciones',
            acc: true,
            celda: (r) =>
              r.estado === 'entregada' ? (
                <Button nivel="primario" tamano="sm" onClick={() => onConfirmar(r.id)}>
                  Confirmar recibido
                </Button>
              ) : null,
          },
        ]}
      />
    )}
  </Caja>
);


/* ---------- reportes: las actas de entrega ---------- */

const fotosDeActa = (a: Acta) => listaFotos(a.origen.tipo === 'solicitud' ? fotosDeEntrega(a.origen.id) : fotosDeRecibida(a.origen.id));

/** Una acta por entrega confirmada, de las dos caras. La tabla desde 1280; tarjeta por debajo.
 *  Ver acta abre el acta completa; el ⋮ copia el texto o la descarga. */
const Reportes: React.FC<{ actas: Acta[]; onVer: (a: Acta) => void; onCopiar: (a: Acta) => void; onDescargar: (a: Acta) => void; onVerFotos: (a: Acta, i: number) => void }> = ({ actas, onVer, onCopiar, onDescargar, onVerFotos }) => {
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
              { k: 'entrego', etiqueta: 'Entregó', celda: (a) => (a.lado === 'ofrece' ? <span>{a.entrego}{a.lleva ? <small className="block text-rd-12 text-rd-ink-meta">{a.lleva}</small> : null}</span> : a.entrego) },
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
                      Ver el acta
                    </Button>
                    {/* En la tarjeta el ⋮ va solo, en el borde derecho, como en toda tarjeta. */}
                    <span className="max-xl:ml-auto">
                    <MenuAcciones
                      tamano="sm"
                      etiqueta={`Más acciones del acta ${a.codigo}`}
                      items={[
                        { texto: 'Copiar el texto', icono: <Copy className="h-4 w-4" />, onElegir: () => onCopiar(a) },
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

/** El acta completa: los datos en dos columnas, las fotos de los dos lados y la historia. */
const DialogoActa: React.FC<{ acta: Acta | null; onCerrar: () => void; onCopiar: (a: Acta) => void; onVerFotos: (a: Acta, i: number) => void }> = ({ acta: a, onCerrar, onCopiar, onVerFotos }) => (
  <Dialogo
    abierto={a !== null}
    titulo={a ? `Acta ${a.codigo}` : ''}
    accion="Copiar el texto"
    nivelAccion="secundario"
    textoCancelar="Cerrar"
    onCerrar={onCerrar}
    onEnviar={() => {
      if (a) onCopiar(a);
    }}
  >
    {a && (
      <>
        <dl className="m-0 mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {(
            [
              ['Fecha', a.fechaTexto],
              ['Qué', `${cifra(a.cant)} ${a.u} de ${a.rec.toLowerCase()}`],
              ['Entregó', a.entrego],
              ['Recibió', a.recibio],
              ...(a.lleva ? [['La llevó', a.lleva] as [string, string]] : []),
              ['Cierre', a.confirmacion],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="mb-0.5 text-rd-11 leading-snug font-medium text-rd-ink-meta">{k}</dt>
              <dd className="m-0 text-rd-13 leading-snug font-semibold text-rd-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {fotosDeActa(a).length > 0 && <TiraFotos fotos={fotosDeActa(a)} etiqueta max={4} onAbrir={(i) => onVerFotos(a, i)} className="mb-4" />}
        {a.historia && (
          <div className="mb-4">
            <p className="m-0 mb-1 text-rd-11 leading-snug font-medium text-rd-ink-meta">Lo que permitió</p>
            <p className="m-0 text-rd-13-5 leading-normal text-rd-ink">{a.historia}</p>
          </div>
        )}
      </>
    )}
  </Dialogo>
);

/* ---------- módulo ofrece ---------- */

const MisOfertas: React.FC<{ sol: Solicitud[] }> = ({ sol }) => (
  <Caja
    titulo="Mis ofertas"
    accion={
      <Button nivel="secundario" tamano="md" soloIcono aria-label="Ver en el mapa" title="Ver en el mapa" onClick={() => irA(`${RUTAS.radar}?punto=${OFERTA.id}`)}>
        <MapIcon aria-hidden="true" className="h-5 w-5" />
      </Button>
    }
  >
    <Tabla
      etiqueta="Mis ofertas"
      filas={OFERTA.recursos}
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
                <b className="block font-semibold">{r.n}</b>
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
          celda: () => (
            <>
              <Button nivel="secundario" tamano="sm">
                Editar
              </Button>
              <Button nivel="secundario" tamano="sm">
                Pausar
              </Button>
            </>
          ),
        },
      ]}
    />
  </Caja>
);


const ORDEN: Record<Solicitud['estado'], number> = { nueva: 0, aceptada: 1, camino: 2, entregada: 3, confirmada: 4, archivada: 5 };

const Solicitudes: React.FC<{ sol: Solicitud[]; acciones: AccionesSolicitud }> = ({ sol, acciones }) => {
  const lista = [...sol].sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);
  const chip = (s: Solicitud) => <EtiquetaCiclo texto={ESTADO_SOLICITUD[s.estado].texto} tono={ESTADO_SOLICITUD[s.estado].tono} enCamino={s.estado === 'camino'} />;
  return (
    <Caja
      titulo={
        <>
          Solicitudes{nuevas(sol) > 0 && <Conteo n={`${nuevas(sol)} nuevas`} />}
        </>
      }
    >
      {lista.length === 0 ? (
        <Vacio icono={<Megaphone className="h-6.5 w-6.5" />} titulo="Nadie ha pedido de tus ofertas todavía" texto="Las organizaciones cercanas ven tu oferta en el mapa. Cuando alguna la solicite, aparece aquí." />
      ) : (
        <Tabla
          etiqueta="Solicitudes"
          filas={lista}
          clave={(s) => s.id}
          tarjeta={(s) => <TarjetaSolicitud s={s} acciones={acciones} estado={chip(s)} />}
          columnas={[
            {
              k: 'que',
              etiqueta: 'Qué',
              celda: (s) => (
                <>
                  <b className="font-semibold">
                    {cifra(s.cant)} {s.u} de {s.rec.toLowerCase()}
                  </b>
                  <small className="block text-rd-12 text-rd-ink-meta">
                    {s.quien} · {s.cuando}
                    {s.dist ? ` · a ${s.dist}` : ''}
                  </small>
                </>
              ),
            },
            { k: 'estado', etiqueta: 'Estado', estado: true, celda: chip },
            { k: 'quienLleva', etiqueta: 'Quién lo lleva', celda: (s) => quienLleva(s) ?? <span className="text-rd-ink-meta">{s.estado === 'nueva' || s.estado === 'confirmada' || s.estado === 'archivada' ? '—' : 'Sin asignar'}</span> },
            {
              k: 'cierre',
              etiqueta: 'Cierre',
              celda: (s) =>
                s.estado === 'confirmada' || s.estado === 'archivada' ? (
                  <>
                    <span className="block text-rd-12 text-rd-ink-2">{textoCierre(s)}</span>
                    {cuentaFotos(fotosDeEntrega(s.id)) > 0 && <TiraFotos fotos={listaFotos(fotosDeEntrega(s.id))} tamano="sm" onAbrir={(i) => acciones.onVerFotos(s, i)} className="mt-1.5" />}
                  </>
                ) : (
                  <span className="text-rd-ink-meta">—</span>
                ),
            },
            /* Las mismas acciones y el mismo orden que en la tarjeta: el siguiente paso primero. */
            { k: 'acc', etiqueta: 'Acciones', acc: true, celda: (s) => (
              <>
                {accionesDe(s, acciones)}
                {menuDe(s, acciones)}
              </>
            ) },
          ]}
        />
      )}
    </Caja>
  );
};

/** Las cinco columnas del tablero (la de «Nuevas» viene de la rama de Fede, por decisión de
 *  Alejandro, 16 de septiembre de 2026): lo nuevo se responde ahí mismo, y la columna solo
 *  aparece cuando hay algo nuevo (`soloConAlgo`). «Archivadas» cierra el tablero: ahí van las
 *  confirmadas al archivarlas o solas a los 30 días, para que no se acumulen. */
const COLUMNAS: { estado: Solicitud['estado']; nombre: string; vacia: string; clase: string; titulo: string; icono: React.ReactNode; soloConAlgo?: boolean }[] = [
  { estado: 'nueva', nombre: 'Nuevas', vacia: 'Sin solicitudes por responder', clase: 'border-rd-coral/40', titulo: 'text-rd-coral', icono: <Megaphone className="h-4 w-4" />, soloConAlgo: true },
  { estado: 'aceptada', nombre: 'Comprometida', vacia: 'Sin entregas comprometidas', clase: 'border-rd-line', titulo: 'text-rd-ink-2', icono: <CircleDashed className="h-4 w-4" /> },
  { estado: 'camino', nombre: 'En camino', vacia: 'Nada en camino', clase: 'border-rd-amber-line', titulo: 'text-rd-amber-ink', icono: <Clock className="h-4 w-4" /> },
  { estado: 'entregada', nombre: 'Por confirmar', vacia: 'Nada por confirmar', clase: 'border-rd-navy-line', titulo: 'text-rd-navy', icono: <CircleDot className="h-4 w-4" /> },
  { estado: 'confirmada', nombre: 'Confirmada', vacia: 'Sin entregas confirmadas', clase: 'border-rd-green-line', titulo: 'text-rd-green', icono: <Check className="h-4 w-4" /> },
  { estado: 'archivada', nombre: 'Archivadas', vacia: `Nada archivado todavía. Las confirmadas pasan aquí a los ${DIAS_PARA_ARCHIVAR} días`, clase: 'border-rd-line', titulo: 'text-rd-ink-meta', icono: <Archive className="h-4 w-4" /> },
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

/** El tablero de entregas (`rd-kanban` del prototipo, más la columna «Nuevas» de Fede): una
 *  columna por estado del ciclo, cada tarjeta con lo que se lleva, a quién, cuándo (hoy en
 *  ámbar), quién la lleva y las acciones de ese paso. Se arrastran con las reglas de
 *  `puedeMover`; devolver una tarjeta atrás pide confirmación, porque cambia lo que la otra
 *  organización cree que tiene. */
const Seguimiento: React.FC<{ sol: Solicitud[]; acciones: AccionesSolicitud }> = ({ sol, acciones }) => {
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
  return (
    <section className="col-span-full min-w-0">
      <h2 className="font-rd m-0 mb-3 text-rd-16 font-semibold tracking-rd-titulo text-rd-ink">Seguimiento de entregas</h2>
      {/* Un tablero, como Trello: las columnas van de lado y se recorren en horizontal, nunca se
          apilan, tampoco en escritorio (Alejandro, 16 de septiembre de 2026). Bajo 640 cada
          columna ocupa casi todo el ancho; desde 640 mide 320, con aire para que las acciones
          quepan en una línea. El `scroll-pl` alinea la primera columna con el margen de la
          página al enganchar (sin él, el enganche la corría hasta el borde del relleno). */}
      <div role="region" aria-label="Tablero de seguimiento de entregas" tabIndex={0} className="zona-rd-scroll -mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6 lg:-mx-8 lg:px-8 lg:scroll-pl-8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-navy">
        {COLUMNAS.map((c) => {
          const items = sol.filter((s) => s.estado === c.estado);
          if (c.soloConAlgo && items.length === 0) return null;
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
              className={`ranura-rd-tablero flex min-h-70 min-w-0 snap-start flex-col gap-2 rounded-rd-lg border p-2 transition-colors sm:basis-80 ${sobre === c.estado ? 'bg-rd-navy-soft ring-2 ring-rd-navy-line' : 'bg-rd-sunken'} ${c.clase}`}
            >
              <div className={`flex items-center gap-2 px-2 pt-1.5 pb-2 text-rd-11 font-semibold tracking-wider uppercase ${c.titulo}`}>
                <span aria-hidden="true">{c.icono}</span>
                {c.nombre}
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rd-surface px-1.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">{items.length}</span>
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

const MiEquipo: React.FC = () => (
  <Caja
    titulo={
      <>
        Mi equipo<Conteo n={EQUIPO.length} />
      </>
    }
    accion={
      <Button nivel="secundario" tamano="md">
        Registrar a alguien
      </Button>
    }
  >
    <Tabla
      etiqueta="Mi equipo"
      filas={EQUIPO}
      clave={(e) => e.id}
      columnas={[
        {
          k: 'persona',
          etiqueta: 'Persona',
          celda: (e) => (
            <span className="flex items-start gap-2">
              <Avatar iniciales={iniciales(e.n)} tamano="md" />
              <span className="min-w-0">
                <b className="block font-semibold">{e.n}</b>
                <small className="block text-rd-12 text-rd-ink-meta">
                  {e.tel} · {e.correo}
                </small>
              </span>
            </span>
          ),
        },
        { k: 'hace', etiqueta: 'Qué hace', celda: (e) => e.rol },
        { k: 'veh', etiqueta: 'Vehículo', celda: (e) => e.veh },
        { k: 'acceso', etiqueta: 'Acceso en RaDAR', celda: (e) => ROL_PLATAFORMA[e.rolPlataforma] },
        { k: 'disp', etiqueta: 'Disponible', celda: (e) => DISPONIBILIDAD[e.disp] },
        { k: 'hechas', etiqueta: 'Entregas', num: true, celda: (e) => e.hechas },
      ]}
    />
  </Caja>
);


const Datos: React.FC = () => {
  const [directorio, setDirectorio] = useState(ORG.directorio);
  return (
    <>
      <Caja
        titulo="Datos de mi organización"
        className="col-span-full xl:col-span-7"
        accion={
          <Button nivel="secundario" tamano="md">
            Editar datos
          </Button>
        }
      >
        <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {[
            ['Nombre', ORG.nombre],
            ['Tipo', ORG.tipo],
            ['NIT', ORG.nit],
            ['Dirección', ORG.dir],
            ['Contacto público', `${ORG.contacto.tel}${ORG.contacto.wa ? ' · también WhatsApp' : ''} · ${ORG.contacto.correo}`],
            ['Enlace con RaDAR', ORG.enlace],
            ['Web', ORG.web],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-rd-11-5 font-medium text-rd-ink-meta">{k}</dt>
              <dd className="m-0 text-rd-13-5 text-rd-ink wrap-anywhere">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          {ORG.verificacion === 'verificada' && <InlineNotice variante="hecho" icono={<BadgeCheck className="h-4 w-4" />} titulo="Organización verificada" texto="La insignia sale en cada publicación." />}
          {ORG.verificacion === 'revision' && <InlineNotice variante="pendiente" icono={<Clock className="h-4 w-4" />} titulo="Verificación en revisión" texto="Revisamos el documento en menos de 2 días hábiles." />}
          {ORG.verificacion === 'sin' && <InlineNotice variante="neutro" icono={<BadgeCheck className="h-4 w-4" />} titulo="Sin verificar" texto="Adjunta el certificado de existencia y te ponemos la insignia." accion={<Button nivel="secundario" tamano="sm">Adjuntar el certificado</Button>} />}
        </div>
      </Caja>
      <Caja titulo="Visibilidad y accesos" className="col-span-full xl:col-span-5">
        {/* Un ajuste es un interruptor (Alejandro, 16 de septiembre de 2026), no una casilla en
            una caja con texto. */}
        <FilaSwitch id="org-directorio" rotulo="Aparecer en el Directorio" nota={directorio ? `Tu contacto se ve en el Directorio${ORG.directorioDesde ? ` desde ${ORG.directorioDesde}` : ''}` : 'Tu contacto no se ve en el Directorio'} encendido={directorio} onCambiar={setDirectorio} />
        <h2 className="font-rd mt-5 mb-3 text-rd-16 font-semibold tracking-rd-titulo text-rd-ink">Quién entra a esta cuenta</h2>
        {INVITADOS.map((p, i) => (
          <div key={p.n} className={`flex items-start gap-3 py-2.5 ${i ? 'border-t border-rd-line-soft' : 'pt-0'}`}>
            <Avatar iniciales={iniciales(p.n)} tamano="md" />
            <div className="min-w-0 flex-1">
              <b className="block text-rd-13-5 font-semibold text-rd-ink">{p.n}</b>
              <span className="text-rd-12-5 text-rd-ink-2">{p.rol}</span>
            </div>
            {p.estado === 'pendiente' ? <EtiquetaCiclo texto={`Invitación enviada ${p.cuando ?? ''}`} tono="inicial" /> : <EtiquetaCiclo texto="Activa" tono="completo" />}
          </div>
        ))}
        <Button nivel="secundario" tamano="md" className="mt-3">
          Invitar a alguien
        </Button>
      </Caja>
    </>
  );
};
