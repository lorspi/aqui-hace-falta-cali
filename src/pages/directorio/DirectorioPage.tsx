import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Flag, Funnel, Hand, HeartHandshake, Map as MapIcon, Phone, Search, Share2, Users, X } from 'lucide-react';
import { Donde } from '../../components/ui/Donde';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { DialogoCompromiso, type Compromiso } from '../../components/ui/DialogoCompromiso';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from '../../components/ui/Etiqueta';
import { Opcion } from '../../components/ui/Opcion';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Pestanas } from '../../components/ui/Pestanas';
import { SelectorCiudad } from '../../components/ui/SelectorCiudad';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { FilaSwitch } from '../../components/ui/Switch';
import { Vacio } from '../../components/ui/Vacio';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { ENTIDADES, ENTIDAD_PROPIA } from '../../mocks/directorioMock';
import { RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { PUBLICACIONES, UBICACION } from '../../mocks/publicacionesMock';
import type { Aviso } from '../../types/aviso';
import type { ClaseEntidad, ConsultaDirectorio, Entidad } from '../../types/directorio';
import type { Publicacion } from '../../types/publicacion';
import { nombrePanel } from '../../utils/cuenta';
import { chipsDe, cifraDe, consultaVacia, conteoTexto, cuantosAplicados, entidadesDe, filtrar, publicacionesDe, recursosDeVista, resumenPublica } from '../../utils/directorio';
import { conteoPorCiudad } from '../../utils/lugares';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { cifra, distanciaKm, distanciaTexto, estadoPublicacion, iniciales, restante } from '../../utils/publicaciones';

/**
 * El Directorio (mockup/*): quién está en la red (`organizaciones.html` del prototipo,
 * decisiones 120, 121, 161). Dos pestañas —Organizaciones · Comunidades—, la misma barra de
 * consulta de la Radar (Filtros con su hoja, chips, buscar) y una fila por entidad: quién
 * (avatar, nombre, insignia, tipo, dónde), lo que publica en números (sale de sus
 * publicaciones en la Radar), el contacto en dos columnas y las acciones de consulta («Ver en
 * el mapa» abre la Radar filtrada por su nombre; ⋮ con WhatsApp, Llamar, Compartir, Reportar).
 * Es una sección de consulta (Alejandro, 16 de septiembre de 2026): Solicitar y Quiero ayudar
 * viven en la Radar. Con sesión se ve el contacto; la maqueta siempre tiene sesión.
 */
const PESTANAS: { id: ClaseEntidad; nombre: string }[] = [
  { id: 'organizacion', nombre: 'Organizaciones' },
  { id: 'comunidad', nombre: 'Comunidades' },
];
const MOTIVOS_ENTIDAD = [
  { valor: 'falsa', texto: 'No existe o es falsa' },
  { valor: 'datos', texto: 'Los datos están mal' },
  { valor: 'conducta', texto: 'Se comportó mal con nosotros' },
];

function irA(ruta: string): void {
  window.location.href = ruta;
}

/** `?vista=comunidades` abre esa pestaña (es el enlace que se comparte). */
function vistaPedida(): ClaseEntidad {
  return new URLSearchParams(window.location.search).get('vista') === 'comunidades' ? 'comunidad' : 'organizacion';
}

export const DirectorioPage: React.FC = () => (
  <AvisosProvider>
    <Directorio />
  </AvisosProvider>
);

const Directorio: React.FC = () => {
  const avisar = useAviso();
  const [clase, setClase] = useState<ClaseEntidad>(vistaPedida);
  const [q, setQ] = useState<ConsultaDirectorio>(consultaVacia);
  const [hoja, setHoja] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [cajon, setCajon] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const [reporte, setReporte] = useState<Entidad | null>(null);
  const [detalle, setDetalle] = useState<Entidad | null>(null);
  const [compromiso, setCompromiso] = useState<Publicacion | null>(null);

  useEffect(() => {
    document.title = 'RaDAR · Directorio';
  }, []);

  const deVista = useMemo(() => entidadesDe(clase, ENTIDADES, ENTIDAD_PROPIA), [clase]);
  const lista = useMemo(() => filtrar(deVista, PUBLICACIONES, q, UBICACION), [deVista, q]);
  const chips = chipsDe(q);
  const aplicados = cuantosAplicados(q);

  const cambiarVista = (id: string) => {
    const c = id as ClaseEntidad;
    setClase(c);
    /* los recursos son de cada vista: al cambiar, ese filtro se limpia; el resto se queda */
    setQ((v) => ({ ...v, recursos: [] }));
    const url = new URL(window.location.href);
    if (c === 'comunidad') url.searchParams.set('vista', 'comunidades');
    else url.searchParams.delete('vista');
    window.history.replaceState(null, '', url);
  };

  /* --- lo que pasa al tocar una fila --- */
  const compartir = (e: Entidad) => {
    const url = `${window.location.origin}${RUTAS.directorio}${e.clase === 'comunidad' ? '?vista=comunidades' : ''}#${e.id}`;
    const listo = () => avisar('Enlace copiado', { tipo: 'ok' });
    if (navigator.share) navigator.share({ title: `${e.nombre} · RaDAR de ayuda`, url }).then(listo).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(listo, listo);
    else listo();
  };
  const enviarReporte = () => {
    setReporte(null);
    avisar('Reporte enviado. Lo revisa el equipo de moderación.', { tipo: 'ok' });
  };
  const enviarCompromiso = (p: Publicacion, c: Compromiso) => {
    setCompromiso(null);
    const n = `${c.recursos} ${c.recursos === 1 ? 'recurso' : 'recursos'}`;
    avisar(p.tipo === 'necesidad' ? `Compromiso enviado a ${p.org} · ${n} · ${c.cuando.toLowerCase()}` : `Solicitud enviada a ${p.org} · ${n}`, { tipo: 'ok' });
  };

  /* --- la campana --- */
  const leerTodos = () => setAvisos((l) => l.map((a) => ({ ...a, leido: true })));
  const accionDeAviso = (a: Aviso) => {
    setAvisos((l) => l.map((x) => (x.id === a.id ? { ...x, leido: true } : x)));
    if (!a.accion) return;
    if (a.accion.al === 'confirmar') avisar(`Confirmaste lo que llegó de ${a.quien}`, { tipo: 'ok' });
    else if (a.accion.al === 'revalidar') avisar('Tu necesidad sigue arriba en el mapa', { tipo: 'ok' });
    else irA(a.accion.al);
  };

  const estado = conteoTexto(lista.length, clase);

  return (
    <Shell seccion="directorio" panelNombre={nombrePanel()} cuenta={CUENTA} pendientes={pendientesCuenta(modulosGuardados(), { sol: SOLICITUDES, recibidas: RECIBIDAS })} avisosNuevos={avisos.filter((a) => !a.leido).length} rutas={RUTAS_SHELL} onPedir={() => irA(RUTAS.pedir)} onOfrecer={() => irA(RUTAS.ofrecer)} cajonAbierto={cajon} onCerrarCajon={() => setCajon(false)}>
      <div className="flex h-full min-h-0 flex-col max-lg:min-h-dvh">
        {/* ---- cabecera: la misma de la Radar y del panel ---- */}
        <header className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="font-rd m-0 text-rd-22 leading-tight font-semibold tracking-rd-titulo text-rd-ink">Directorio</h1>
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

        <div className="min-w-0 flex-none px-4 sm:px-6 lg:px-8">
          <Pestanas etiqueta="Qué quieres ver" pestanas={PESTANAS} actual={clase} onCambiar={cambiarVista} />
        </div>

        {/* ---- consulta ---- */}
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line bg-rd-surface px-4 py-2 max-lg:gap-2 sm:px-6 lg:px-8">
          {/* Decisión 70: Filtros y chips a la izquierda, el buscador a la derecha (146: lupa bajo 1024). */}
          <BotonFiltros aplicados={aplicados} abierta={hoja} onClick={() => setHoja(true)} />
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {estado}
          </p>
          {chips.length > 0 && (
            <ZonaChips>
              {chips.map((c) => (
                <ChipAplicado key={c.clave} texto={c.texto} onQuitar={() => setQ(c.quitar(q))} />
              ))}
              <QuitarTodos onClick={() => setQ({ ...consultaVacia(), orden: q.orden })} />
            </ZonaChips>
          )}
          <CampoBuscar valor={q.texto} onChange={(texto) => setQ({ ...q, texto })} placeholder={clase === 'comunidad' ? 'Buscar comunidad, barrio o necesidad' : 'Buscar organización, barrio o recurso'} abierto={buscando} />
        </div>

        {/* ---- la lista ---- */}
        <main id={`panel-${clase}`} role="tabpanel" aria-labelledby={`pestana-${clase}`} className="min-h-0 flex-1 overflow-y-auto bg-rd-surface px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          {lista.length === 0 ? (
            aplicados > 0 ? (
              <Vacio
                icono={<Funnel className="h-6.5 w-6.5" />}
                titulo={`Ninguna ${clase === 'comunidad' ? 'comunidad' : 'organización'} con estos filtros`}
                texto="Prueba con menos filtros o busca otro recurso."
                accion={
                  <Button nivel="secundario" tamano="md" onClick={() => setQ({ ...consultaVacia(), orden: q.orden })}>
                    Quitar los filtros
                  </Button>
                }
              />
            ) : (
              <Vacio
                icono={<Users className="h-6.5 w-6.5" />}
                titulo={clase === 'comunidad' ? 'Todavía ninguna comunidad publicó lo que necesita' : 'Todavía ninguna organización publicó lo que ofrece'}
                accion={
                  clase === 'comunidad' ? (
                    <Button nivel="pedir" tamano="md" onClick={() => irA(RUTAS.pedir)}>
                      Pedir ayuda
                    </Button>
                  ) : (
                    <Button nivel="primario" tamano="md" onClick={() => irA(RUTAS.ofrecer)}>
                      Ofrecer ayuda
                    </Button>
                  )
                }
              />
            )
          ) : (
            <>
              {/* Sin texto de conteo ni de orden (Alejandro, 21 de septiembre de 2026): las
                  pestañas ya cuentan y Filtros ya ordena. El conteo sigue en la región viva. */}
              {/* Vista de lista del Directorio: cada fila es una tarjeta independiente, como las
                  del Radar (`rd-org-fila` del prototipo: borde, radio xl), separadas por espacio
                  (Alejandro, 21 de septiembre de 2026). La cabecera de columnas queda como rótulo. */}
              <div className="flex flex-col gap-3">
                {/* Cabecera de columnas para escritorio (≥ 1280px) */}
                <div className="hidden px-4 pb-1 sm:px-5 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,3fr)_190px] xl:items-center xl:gap-6">
                  <span className="text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                    {clase === 'comunidad' ? 'Comunidad y zona' : 'Organización y zona'}
                  </span>
                  <span className="text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                    Actividad y recursos
                  </span>
                  <span className="text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                    Contacto
                  </span>
                  <span className="text-right text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                    Acciones
                  </span>
                </div>
                {lista.map((e) => (
                  <FilaEntidad key={e.id} entidad={e} onVerDetalle={() => setDetalle(e)} onCompartir={() => compartir(e)} onReportar={() => setReporte(e)} />
                ))}
              </div>
            </>
          )}
        </main>

        <HojaDirectorio abierta={hoja} clase={clase} consulta={q} entidades={deVista} onCambiar={setQ} onCerrar={() => setHoja(false)} resultados={lista.length} />
        <DialogoReporte abierto={reporte !== null} titulo={reporte ? `Reportar a ${reporte.nombre}` : 'Reportar'} motivos={MOTIVOS_ENTIDAD} onCerrar={() => setReporte(null)} onEnviar={enviarReporte} />
        <DialogoDetalleEntidad abierto={detalle !== null} entidad={detalle} onCerrar={() => setDetalle(null)} onCompromiso={(pub) => setCompromiso(pub)} />
        <DialogoCompromiso publicacion={compromiso} onCerrar={() => setCompromiso(null)} onEnviar={enviarCompromiso} />
      </div>
    </Shell>
  );
};

/* ---------- la fila ---------- */

/** Una entidad en vista de lista: quién, dónde está, lo que publica en números (cuántos recursos
 *  ofrece y pide), datos de contacto en bloque compacto y a la derecha las acciones («Ver detalle»
 *  y menú ⋮ con Ver en el mapa, WhatsApp, Llamar, Compartir y Reportar).
 *  «Ver detalle» solo muestra: es terciario `md` (RaDAR 223, nivel 3 «vista o cierre»; C2). El
 *  compromiso —«Solicitar» / «Quiero ayudar»— vive en el diálogo de detalle, no en la fila. */
const FilaEntidad: React.FC<{ entidad: Entidad; onVerDetalle: () => void; onCompartir: () => void; onReportar: () => void }> = ({ entidad: e, onVerDetalle, onCompartir, onReportar }) => {
  const com = e.clase === 'comunidad';
  const cifraE = cifraDe(e, PUBLICACIONES);
  const publica = resumenPublica(e, PUBLICACIONES);
  const km = distanciaKm(UBICACION, e);
  const recursos = (n: number) => `${n} ${n === 1 ? 'recurso' : 'recursos'}`;
  const datos: [string, string][] = [];
  if (publica.ofrece) datos.push(['Ofrece', recursos(publica.ofrece)]);
  if (publica.pide) datos.push(['Pide', recursos(publica.pide)]);
  if (!com) datos.push([cifraE.que[0].toUpperCase() + cifraE.que.slice(1), cifra(cifraE.n)]);
  if (e.personas) datos.push(['Personas afectadas', cifra(e.personas)]);
  if (e.familias) datos.push(['Familias', cifra(e.familias)]);
  const verEnMapa = () => irA(`${RUTAS.radar}?buscar=${encodeURIComponent(e.nombre)}`);
  const menu = [
    ...(e.wa ? [{ texto: 'Escribir por WhatsApp', icono: <IconoWhatsApp className="h-4 w-4" />, onElegir: () => window.open(`https://wa.me/${e.tel.replace(/\D/g, '')}`, '_blank', 'noopener') }] : []),
    { texto: 'Llamar', icono: <Phone className="h-4 w-4" />, onElegir: () => irA(`tel:${e.tel.replace(/\s/g, '')}`) },
    { texto: 'Compartir', icono: <Share2 className="h-4 w-4" />, onElegir: onCompartir },
    { texto: 'Reportar', icono: <Flag className="h-4 w-4" />, onElegir: onReportar },
  ];

  return (
    <article
      id={e.id}
      className="grid min-w-0 grid-cols-1 gap-3.5 rounded-rd-xl border border-rd-line bg-rd-surface p-4 transition duration-200 hover:border-rd-navy-line hover:shadow-xs sm:p-5 md:grid-cols-2 md:gap-x-6 md:gap-y-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,3fr)_190px] xl:items-center xl:gap-6"
    >
      {/* 1. Quién y dónde: avatar, nombre, insignia, tipo y ubicación */}
      <div className="flex min-w-0 items-start gap-3">
        <Avatar iniciales={iniciales(e.nombre)} tamano="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="font-rd m-0 text-rd-14 font-semibold leading-snug text-rd-ink">
              {e.nombre}
            </h2>
            {e.verificada && (
              <BadgeCheck
                role="img"
                aria-label={com ? 'Comunidad verificada' : 'Organización verificada'}
                className="h-4 w-4 shrink-0 text-rd-navy"
              />
            )}
          </div>
          <span className="text-rd-12 text-rd-ink-2">{e.tipo}</span>
          <Donde lugar={e.zona} distancia={distanciaTexto(km)} className="mt-1" />
        </div>
      </div>

      {/* 2. Publicaciones y métricas */}
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        {datos.map(([k, v]) => (
          <div
            key={k}
            className="inline-flex items-center gap-1.5 rounded-rd-sm border border-rd-line-soft bg-rd-sunken px-2.5 py-1 text-rd-12 whitespace-nowrap"
          >
            <span className="font-medium text-rd-ink-meta">{k}:</span>
            <span className="font-semibold text-rd-ink tabular-nums">{v}</span>
          </div>
        ))}
      </div>

      {/* 3. Contacto: Teléfono (con WhatsApp), Dirección, Correo */}
      <div className="flex min-w-0 flex-col gap-1 text-rd-12 text-rd-ink-2 max-md:border-t max-md:border-rd-line-soft max-md:pt-2.5">
        <div className="flex items-center gap-1.5 font-medium text-rd-ink tabular-nums">
          <Phone className="h-3.5 w-3.5 shrink-0 text-rd-ink-meta" aria-hidden="true" />
          <a href={`tel:${e.tel.replace(/\s/g, '')}`} className="text-rd-ink no-underline hover:underline">
            {e.tel}
          </a>
          {e.wa && <IconoWhatsApp titulo="También por WhatsApp" className="h-3.5 w-3.5 shrink-0 text-rd-green" />}
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="shrink-0 font-medium text-rd-ink-meta">Dir:</span>
          <span className="truncate" title={e.dir}>{e.dir}</span>
        </div>
        {e.correo && (
          <div className="flex items-center gap-1.5 truncate">
            <span className="shrink-0 font-medium text-rd-ink-meta">Correo:</span>
            <a href={`mailto:${e.correo}`} className="truncate text-rd-ink no-underline hover:underline" title={e.correo}>
              {e.correo}
            </a>
          </div>
        )}
      </div>

      {/* 4. Acciones: el mismo trío que la fila del Radar: Ver detalle, el mapa como icono (busca
       *  la entidad en la Radar) y ⋮, los tres terciarios y en `md`. */}
      <div className="flex min-w-0 items-center justify-end gap-1 max-md:border-t max-md:border-rd-line-soft max-md:pt-2.5">
        <Button nivel="terciario" tamano="md" onClick={onVerDetalle}>
          Ver detalle
        </Button>
        <Button nivel="terciario" tamano="md" soloIcono aria-label="Ver en el mapa" onClick={verEnMapa}>
          <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
        </Button>
        <MenuAcciones items={menu} etiqueta={`Más acciones de ${e.nombre}`} tamano="md" flotante />
      </div>
    </article>
  );
};

const MIS_OFERTAS = PUBLICACIONES.filter((p) => (p.org === ENTIDAD_PROPIA || p.propia) && p.tipo === 'oferta');

/* ---------- el diálogo de detalle de entidad ---------- */

const DialogoDetalleEntidad: React.FC<{
  abierto: boolean;
  entidad: Entidad | null;
  onCerrar: () => void;
  onCompromiso?: (pub: Publicacion) => void;
}> = ({ abierto, entidad: e, onCerrar, onCompromiso }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);

  if (!e) return null;

  const com = e.clase === 'comunidad';
  const cifraE = cifraDe(e, PUBLICACIONES);
  const km = distanciaKm(UBICACION, e);
  const publicaciones = publicacionesDe(e, PUBLICACIONES);

  const verEnMapa = (puntoId?: string) => {
    if (puntoId) {
      irA(`${RUTAS.radar}?punto=${puntoId}`);
    } else {
      irA(`${RUTAS.radar}?buscar=${encodeURIComponent(e.nombre)}`);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(ev) => ev.target === ref.current && onCerrar()}
      aria-labelledby="detalle-entidad-titulo"
      className="font-rd m-auto max-h-[90dvh] w-full max-w-145 rounded-rd-xl bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto max-sm:max-w-full"
    >
      {abierto && (
        <div className="flex max-h-[90dvh] flex-col" onClick={(ev) => ev.stopPropagation()}>
          {/* Cabecera */}
          <div className="flex flex-none items-start justify-between gap-3 border-b border-rd-line p-5 pb-4">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar iniciales={iniciales(e.nombre)} tamano="lg" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <h2 id="detalle-entidad-titulo" className="font-rd m-0 text-rd-16 font-semibold leading-snug text-rd-ink">
                    {e.nombre}
                  </h2>
                  {e.verificada && (
                    <BadgeCheck
                      role="img"
                      aria-label={com ? 'Comunidad verificada' : 'Organización verificada'}
                      className="h-4.5 w-4.5 shrink-0 text-rd-navy"
                    />
                  )}
                </div>
                <span className="text-rd-12 text-rd-ink-2">{e.tipo}</span>
                <Donde lugar={e.zona} distancia={distanciaTexto(km)} className="mt-0.5" />
              </div>
            </div>
            <Button nivel="terciario" tamano="md" soloIcono aria-label="Cerrar" onClick={onCerrar}>
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          </div>

          {/* Cuerpo con scroll */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
            {/* Contacto y datos clave */}
            <div className="rounded-rd-lg border border-rd-line-soft bg-rd-fondo/60 p-3.5">
              <h3 className="font-rd mb-2.5 text-rd-11 font-semibold uppercase tracking-wider text-rd-ink-meta">
                Datos de contacto y ubicación
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-rd-12-5">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-rd-ink-meta" aria-hidden="true" />
                  <a href={`tel:${e.tel.replace(/\s/g, '')}`} className="font-semibold text-rd-ink tabular-nums no-underline hover:underline">
                    {e.tel}
                  </a>
                  {e.wa && (
                    <a
                      href={`https://wa.me/${e.tel.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener"
                      title="Escribir por WhatsApp"
                      className="inline-flex items-center gap-1 text-rd-green no-underline hover:underline"
                    >
                      <IconoWhatsApp className="h-4 w-4 shrink-0 text-rd-green" />
                      <span className="text-rd-11 font-medium">WhatsApp</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-rd-ink-meta shrink-0">Dirección:</span>
                  <span className="text-rd-ink font-semibold truncate" title={e.dir}>{e.dir}</span>
                </div>
                {e.correo && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <span className="font-medium text-rd-ink-meta shrink-0">Correo:</span>
                    <a href={`mailto:${e.correo}`} className="text-rd-ink font-semibold truncate no-underline hover:underline" title={e.correo}>
                      {e.correo}
                    </a>
                  </div>
                )}
                {e.lider && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-rd-ink-meta shrink-0">Líder:</span>
                    <span className="text-rd-ink font-semibold">{e.lider}</span>
                  </div>
                )}
                {!com && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-rd-ink-meta shrink-0">Entregas confirmadas:</span>
                    <span className="text-rd-ink font-semibold tabular-nums">{cifra(cifraE.n)}</span>
                  </div>
                )}
                {e.personas && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-rd-ink-meta shrink-0">Personas afectadas:</span>
                    <span className="text-rd-ink font-semibold tabular-nums">{cifra(e.personas)}</span>
                  </div>
                )}
                {e.familias && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-rd-ink-meta shrink-0">Familias afectadas:</span>
                    <span className="text-rd-ink font-semibold tabular-nums">{cifra(e.familias)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actividad / Publicaciones en la Radar */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-rd m-0 text-rd-13 font-semibold text-rd-ink">
                  Publicaciones en RaDAR
                </h3>
                <span className="rounded-full bg-rd-sunken px-2 py-0.5 text-rd-11 font-semibold text-rd-ink-2 tabular-nums">
                  {publicaciones.length} {publicaciones.length === 1 ? 'publicación' : 'publicaciones'}
                </span>
              </div>

              {publicaciones.length === 0 ? (
                <p className="m-0 rounded-rd-lg border border-dashed border-rd-line p-4 text-center text-rd-12-5 text-rd-ink-meta">
                  Esta {com ? 'comunidad' : 'organización'} no tiene publicaciones activas en la Radar en este momento.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {publicaciones.map((pub) => {
                    const est = estadoPublicacion(pub);
                    const esOferta = pub.tipo === 'oferta';
                    const esNecesidad = pub.tipo === 'necesidad';
                    const esPropia = pub.propia || pub.org === ENTIDAD_PROPIA || e.nombre === ENTIDAD_PROPIA;

                    // Oferta: solo solicitar y solo si la oferta no está comprometida aún en su totalidad
                    const ofertaDisponible = esOferta && !esPropia && pub.recursos.some((r) => restante(r) > 0);

                    // Necesidad: debe decir ayudar y solo si yo tengo lo que ellos necesitan (así sea parcial) y ellos aún necesitan de ese recurso
                    const puedeAyudarNecesidad =
                      esNecesidad &&
                      !esPropia &&
                      pub.recursos.some((r) => {
                        const ellosNecesitan = restante(r) > 0;
                        if (!ellosNecesitan) return false;
                        const yoTengo = MIS_OFERTAS.some((mo) =>
                          mo.recursos.some((mor) => mor.item.toLowerCase() === r.item.toLowerCase() && restante(mor) > 0)
                        );
                        return yoTengo;
                      });

                    return (
                      <div
                        key={pub.id}
                        className="flex flex-col gap-2 rounded-rd-lg border border-rd-line bg-rd-surface p-3 transition-colors hover:border-rd-navy-line/30"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <EtiquetaTipo tipo={pub.tipo} />
                            <EtiquetaEstado estado={est} />
                          </div>
                          <span className="text-rd-11 text-rd-ink-meta">{pub.zona}</span>
                        </div>

                        <h4 className="font-rd m-0 text-rd-13 font-semibold text-rd-ink">
                          {pub.titulo}
                        </h4>

                        {pub.descripcion && (
                          <p className="m-0 text-rd-12 text-rd-ink-2 line-clamp-2">
                            {pub.descripcion}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rd-line-soft pt-2 mt-1">
                          <div className="flex flex-wrap items-center gap-1">
                            {pub.recursos.map((r) => (
                              <span
                                key={r.item}
                                className="rounded-rd-sm bg-rd-sunken px-2 py-0.5 text-rd-11 font-medium text-rd-ink"
                              >
                                {r.total} {r.unidad} {r.item}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Pie de tarjeta: todo en `md` (223 C1); el primario nunca va en `sm`. */}
                            {ofertaDisponible && (
                              <Button nivel="primario" tamano="md" onClick={() => onCompromiso?.(pub)}>
                                Solicitar
                              </Button>
                            )}
                            {puedeAyudarNecesidad && (
                              <Button nivel="primario" tamano="md" onClick={() => onCompromiso?.(pub)}>
                                Ayudar
                              </Button>
                            )}
                            <Button nivel="secundario" tamano="md" icono={<MapIcon className="h-4 w-4" />} onClick={() => verEnMapa(pub.id)}>
                              Ver en el mapa
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pie: cerrar no cambia datos y el diálogo ya tiene sus primarios por publicación → terciario (223). */}
          <div className="flex flex-none items-center justify-end border-t border-rd-line bg-rd-surface px-5 py-3">
            <Button nivel="terciario" tamano="md" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
};

/* ---------- la hoja de filtros del directorio: la misma hoja de la Radar, con sus secciones ---------- */

const TITULO = 'font-rd mb-3 text-rd-11-5 font-semibold tracking-wider text-rd-ink-meta uppercase';

const HojaDirectorio: React.FC<{ abierta: boolean; clase: ClaseEntidad; consulta: ConsultaDirectorio; entidades: Entidad[]; onCambiar: (q: ConsultaDirectorio) => void; onCerrar: () => void; resultados: number }> = ({ abierta, clase, consulta: q, entidades, onCambiar, onCerrar, resultados }) => {
  const hoja = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierta, onCerrar]);
  /* El foco va a la × solo al abrir (no con cada filtro tocado: `onCerrar` cambia en cada render). */
  useEffect(() => {
    if (abierta) hoja.current?.querySelector<HTMLElement>('button')?.focus();
  }, [abierta]);
  if (!abierta) return null;
  const alternar = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  const com = clase === 'comunidad';
  return (
    <>
      <button type="button" aria-label="Cerrar los filtros" onClick={onCerrar} className="fixed inset-0 z-900 cursor-default bg-rd-ink/32" />
      <aside ref={hoja} role="dialog" aria-modal="true" aria-labelledby="hoja-dir-t" className="font-rd fixed top-0 right-0 bottom-0 z-901 flex w-full max-w-110 flex-col bg-rd-surface shadow-rd-2">
        <div className="flex items-center gap-2 border-b border-rd-line px-4 py-3">
          <h2 id="hoja-dir-t" className="m-0 flex-1 text-rd-16 font-semibold tracking-tight text-rd-ink">
            Filtrar y ordenar
          </h2>
          <Button nivel="terciario" tamano="md" aria-label="Cerrar" soloIcono onClick={onCerrar}>
            <X aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <section className="border-b border-rd-line-soft py-4">
            <h3 className={TITULO}>Lugar</h3>
            {/* El mismo selector que la Radar: Cerca de mí, Seleccionar todo, ciudades por departamento. */}
            <SelectorCiudad ciudades={q.ciudades} onCambiar={(ciudades) => onCambiar({ ...q, ciudades })} conteos={conteoPorCiudad(entidades)} ubicacion={UBICACION} onCercaDeMi={(ciudad) => onCambiar({ ...q, ciudades: [ciudad], orden: 'cercania' })} />
          </section>
          <section className="border-b border-rd-line-soft py-4">
            <h3 className={TITULO}>Qué recurso</h3>
            <div className="flex flex-wrap gap-2">
              {recursosDeVista(entidades, PUBLICACIONES).map((r) => (
                <Opcion key={r} tipo="checkbox" nombre="recurso" marcada={q.recursos.includes(r)} onChange={() => onCambiar({ ...q, recursos: alternar(q.recursos, r) })}>
                  {r}
                </Opcion>
              ))}
            </div>
          </section>
          <section className="border-b border-rd-line-soft py-4">
            <FilaSwitch id="dir-verificadas" rotulo={com ? 'Solo comunidades verificadas' : 'Solo organizaciones verificadas'} encendido={q.verificadas} onCambiar={(v) => onCambiar({ ...q, verificadas: v })} />
          </section>
          <section className="py-4">
            <h3 className={TITULO}>Ordenar por</h3>
            <div className="flex flex-wrap gap-2">
              <Opcion tipo="radio" nombre="orden" marcada={q.orden === 'cercania'} onChange={() => onCambiar({ ...q, orden: 'cercania' })}>
                Más cerca
              </Opcion>
              <Opcion tipo="radio" nombre="orden" marcada={q.orden === 'cifra'} onChange={() => onCambiar({ ...q, orden: 'cifra' })}>
                {com ? 'Más solicitudes' : 'Más entregas confirmadas'}
              </Opcion>
            </div>
          </section>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-rd-line bg-rd-surface px-4 py-3">
          <Button nivel="terciario" tamano="md" onClick={() => onCambiar({ ...consultaVacia(), orden: q.orden })} disabled={cuantosAplicados(q) === 0}>
            Quitar todos
          </Button>
          <Button nivel="primario" tamano="md" onClick={onCerrar}>
            Ver {resultados} {resultados === 1 ? 'resultado' : 'resultados'}
          </Button>
        </div>
      </aside>
    </>
  );
};
