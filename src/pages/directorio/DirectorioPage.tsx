import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Flag, Funnel, Hand, HeartHandshake, Mail, MapPin, Map as MapIcon, Phone, Search, Share2, UserRound, Users, X } from 'lucide-react';
import { Donde } from '../../components/ui/Donde';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { DialogoCompromiso } from '../../components/ui/DialogoCompromiso';
import { avisoCompromiso, type Compromiso } from '../../utils/compromiso';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { Avatar, EtiquetaEstado, EtiquetaTipo } from '../../components/ui/Etiqueta';
import { CajaDatos } from '../../components/ui/CajaDatos';
import { Conteo } from '../../components/ui/Caja';
import { Opcion } from '../../components/ui/Opcion';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Pestanas } from '../../components/ui/Pestanas';
import { Recursos } from '../../components/ui/Recursos';
import { SelectorCiudad } from '../../components/ui/SelectorCiudad';
import { BotonMenu, Shell } from '../../components/ui/Shell';
import { FilaSwitch } from '../../components/ui/Switch';
import { Vacio } from '../../components/ui/Vacio';
import { AVISOS } from '../../mocks/avisosMock';
import { CUENTA_SESION as CUENTA, RUTAS, RUTAS_SHELL } from '../../mocks/cuentasMock';
import { ENTIDADES, ENTIDAD_PROPIA } from '../../mocks/directorioMock';
import { RECIBIDAS, SOLICITUDES } from '../../mocks/panelMock';
import { UBICACION, obtenerPublicaciones } from '../../mocks/publicacionesMock';

const PUBLICACIONES = obtenerPublicaciones();
import type { Aviso } from '../../types/aviso';
import type { ClaseEntidad, ConsultaDirectorio, Entidad } from '../../types/directorio';
import type { Publicacion } from '../../types/publicacion';
import { nombrePanel } from '../../utils/cuenta';
import { chipsDe, cifrasDe, consultaVacia, conteoTexto, cuantosAplicados, entidadesDe, filtrar, publicacionesDe, recursosDeVista, vacioDe } from '../../utils/directorio';
import { directorioDeParams, escribirUrl, paramsActuales, paramsDeDirectorio } from '../../utils/enlace';
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
/** El rótulo de una sección, uno solo en toda la maqueta (el mismo de la hoja de filtros). */
const ROTULO = 'font-rd mb-3 flex items-center text-rd-11-5 font-semibold tracking-wider text-rd-ink-meta uppercase';

const MOTIVOS_ENTIDAD = [
  { valor: 'falsa', texto: 'No existe o es falsa' },
  { valor: 'datos', texto: 'Los datos están mal' },
  { valor: 'conducta', texto: 'Se comportó mal con nosotros' },
];

function irA(ruta: string): void {
  window.location.href = ruta;
}


export const DirectorioPage: React.FC = () => (
  <AvisosProvider>
    <Directorio />
  </AvisosProvider>
);

const Directorio: React.FC = () => {
  const avisar = useAviso();
  /* Lo que se ve sale de la URL y vuelve a ella: una consulta armada se comparte por enlace
     (`utils/enlace.ts`), con el mismo vocabulario de la Radar. */
  const inicial = useMemo(() => directorioDeParams(paramsActuales()), []);
  const [clase, setClase] = useState<ClaseEntidad>(inicial.clase);
  const [q, setQ] = useState<ConsultaDirectorio>(inicial.consulta);
  const [hoja, setHoja] = useState(false);
  const [buscando, setBuscando] = useState(() => inicial.consulta.texto !== '');
  const [cajon, setCajon] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS);
  const [reporte, setReporte] = useState<Entidad | null>(null);
  const [detalle, setDetalle] = useState<Entidad | null>(null);
  const [compromiso, setCompromiso] = useState<Publicacion | null>(null);

  useEffect(() => {
    document.title = 'RaDAR · Directorio';
  }, []);

  /* La URL dice lo que se ve, para poder compartirlo. */
  useEffect(() => {
    escribirUrl(paramsDeDirectorio({ consulta: q, clase }));
  }, [q, clase]);

  const deVista = useMemo(() => entidadesDe(clase, ENTIDADES, ENTIDAD_PROPIA), [clase]);
  const lista = useMemo(() => filtrar(deVista, PUBLICACIONES, q, UBICACION), [deVista, q]);
  const pestanas = PESTANAS;
  const chips = chipsDe(q);
  const aplicados = cuantosAplicados(q);

  const cambiarVista = (id: string) => {
    setClase(id as ClaseEntidad);
    /* los recursos son de cada vista: al cambiar, ese filtro se limpia; el resto se queda */
    setQ((v) => ({ ...v, recursos: [] }));
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
    avisar(avisoCompromiso(p.org, p.tipo, c), { tipo: 'ok' });
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
  /* El vacío nombra el filtro que más acota y ofrece soltar ese, no «quita todo». */
  const vacio = vacioDe(q, clase);

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

        <Pestanas etiqueta="Qué quieres ver" pestanas={pestanas} actual={clase} onCambiar={cambiarVista} className="px-4 sm:px-6 lg:px-8" />

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
                titulo={vacio.titulo}
                texto={vacio.texto}
                accion={
                  <Button nivel="secundario" tamano="md" onClick={() => setQ(vacio.aflojar)}>
                    {vacio.accion}
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
              {/* Dos maquetaciones, una por ancho (regla 184 del DS): **hasta 1279** una cuadrícula
                  de tarjetas, **desde 1280** una tabla con su cabecera de columnas dentro de una
                  sola caja. `FilaEntidad` pinta la que corresponda; el contenedor cambia con ella. */}
              <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:flex xl:flex-col xl:gap-3">
                {/* Cabecera de columnas, solo en la tabla: rótulo suelto, sin caja, porque cada
                    fila es una tarjeta aparte (Alejandro, 22 de septiembre de 2026). */}
                <div className="hidden px-5 pb-1 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,3fr)_220px] xl:items-center xl:gap-6">
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">{clase === 'comunidad' ? 'Comunidad y zona' : 'Organización y zona'}</span>
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">Actividad y recursos</span>
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">Contacto</span>
                  <span className="text-rd-11 font-semibold tracking-wider text-rd-ink-meta uppercase">Acciones</span>
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
        <DialogoDetalleEntidad abierto={detalle !== null} entidad={detalle} onCerrar={() => setDetalle(null)} onCompromiso={(pub) => setCompromiso(pub)} onCompartir={detalle ? () => compartir(detalle) : undefined} onReportar={detalle ? () => setReporte(detalle) : undefined} />
        <DialogoCompromiso publicacion={compromiso} onCerrar={() => setCompromiso(null)} onEnviar={enviarCompromiso} />
      </div>
    </Shell>
  );
};

/* ---------- la fila ---------- */

/**
 * Una entidad en la lista, en dos maquetaciones que se mantienen aparte a propósito (Alejandro,
 * 22 de septiembre de 2026; es la regla 184 del DS): **hasta 1279 es una tarjeta** con la
 * gramática de la tarjeta de una publicación —quién con su insignia, dónde y a cuánto, lo que
 * publica en una caja, el contacto y el pie con las acciones—, y **desde 1280 es una fila de
 * tabla** con sus cuatro columnas. Los datos y las acciones son los mismos; solo cambia cómo se
 * reparten. Sin etiquetas de tipo arriba: una entidad no se necesita ni se ofrece; su tipo va
 * como texto bajo el nombre. «Ver detalle» solo muestra: terciario `md` (223, nivel 3).
 */
const FilaEntidad: React.FC<{ entidad: Entidad; onVerDetalle: () => void; onCompartir: () => void; onReportar: () => void }> = ({ entidad: e, onVerDetalle, onCompartir, onReportar }) => {
  const com = e.clase === 'comunidad';
  const km = distanciaKm(UBICACION, e);
  const datos = cifrasDe(e, PUBLICACIONES);
  const verEnMapa = () => irA(`${RUTAS.radar}?buscar=${encodeURIComponent(e.nombre)}`);
  const menu = [
    ...(e.wa ? [{ texto: 'Escribir por WhatsApp', icono: <IconoWhatsApp className="h-4 w-4" />, onElegir: () => window.open(`https://wa.me/${e.tel.replace(/\D/g, '')}`, '_blank', 'noopener') }] : []),
    { texto: 'Llamar', icono: <Phone className="h-4 w-4" />, onElegir: () => irA(`tel:${e.tel.replace(/\s/g, '')}`) },
    { texto: 'Compartir', icono: <Share2 className="h-4 w-4" />, onElegir: onCompartir },
    { texto: 'Reportar', icono: <Flag className="h-4 w-4" />, onElegir: onReportar },
  ];

  /* Las piezas que las dos maquetaciones comparten tal cual. */
  /* Tres anidamientos, para que el tipo cuelgue del nombre y no del borde de la tarjeta
     (Alejandro, 22 de septiembre de 2026): el nombre con su insignia en una línea; esa línea y el
     tipo en una columna; el avatar y esa columna, en fila. */
  const quien = (
    <div className="flex min-w-0 items-start gap-2.5">
      <Avatar iniciales={iniciales(e.nombre)} tamano="md" />
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="font-rd m-0 min-w-0 truncate text-rd-13-5 font-semibold text-rd-ink">{e.nombre}</h2>
          {e.verificada && <BadgeCheck role="img" aria-label={com ? 'Comunidad verificada' : 'Organización verificada'} className="h-4 w-4 shrink-0 text-rd-navy" />}
        </div>
        <span className="text-rd-12 text-rd-ink-2">{e.tipo}</span>
      </div>
    </div>
  );
  const contacto = (
    <div className="flex min-w-0 flex-col gap-1.5 text-rd-12-5 text-rd-ink-2">
      <div className="flex min-w-0 items-center gap-2">
        <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
        <a href={`tel:${e.tel.replace(/\s/g, '')}`} className="truncate font-medium text-rd-ink tabular-nums no-underline hover:underline">
          {e.tel}
        </a>
        {e.wa && <IconoWhatsApp titulo="También por WhatsApp" className="h-3.5 w-3.5 shrink-0 text-rd-green" />}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
        <span className="truncate" title={e.dir}>{e.dir}</span>
      </div>
      {e.correo && (
        <div className="flex min-w-0 items-center gap-2">
          <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
          <a href={`mailto:${e.correo}`} className="truncate no-underline hover:underline" title={e.correo}>
            {e.correo}
          </a>
        </div>
      )}
    </div>
  );
  const acciones = (
    <>
      <Button nivel="secundario" tamano="md" className="shadow-2xs" onClick={onVerDetalle}>
        Ver detalle
      </Button>
      <Button nivel="secundario" tamano="md" soloIcono aria-label="Ver en el mapa" className="shadow-2xs" onClick={verEnMapa}>
        <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
      </Button>
      <span className="ml-auto flex gap-1">
        <MenuAcciones items={menu} etiqueta={`Más acciones de ${e.nombre}`} tamano="md" nivel="secundario" className="shadow-2xs" flotante />
      </span>
    </>
  );

  return (
    <>
      {/* ---- hasta 1279: tarjeta ---- */}
      <article id={e.id} className="flex min-w-0 flex-col rounded-rd-xl border border-rd-line bg-rd-surface p-4 max-sm:p-3.5 transition duration-200 hover:border-rd-navy-line hover:shadow-xs xl:hidden">
        <div className="mb-3 max-sm:mb-2">{quien}</div>
        <Donde lugar={e.zona} distancia={distanciaTexto(km)} className="mb-3.5 max-sm:mb-2.5" />
        <CajaDatos titulo="En RaDAR" filas={datos} className="mb-3.5 max-sm:mb-2.5" />
        <div className="mb-3.5 max-sm:mb-2.5">{contacto}</div>
        <div className="mt-auto flex min-w-0 items-center gap-2 border-t border-rd-line-soft pt-3 max-sm:pt-2.5">{acciones}</div>
      </article>

      {/* ---- desde 1280: fila de tabla, las cuatro columnas de su cabecera ---- */}
      {/* Cada fila es una tarjeta horizontal independiente: su borde, su radio y su hover, los
          mismos de la tarjeta de bajo 1280; lo único que cambia es que reparte en columnas. */}
      <div id={`${e.id}-tabla`} className="hidden rounded-rd-xl border border-rd-line bg-rd-surface px-5 py-4 transition duration-200 hover:border-rd-navy-line hover:shadow-xs xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,3fr)_220px] xl:items-center xl:gap-6">
        <div className="min-w-0">
          {quien}
          <Donde lugar={e.zona} distancia={distanciaTexto(km)} className="mt-1" />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {datos.map(([k, v]) => (
            <div key={k} className="inline-flex items-center gap-1.5 rounded-rd-sm border border-rd-line-soft bg-rd-sunken px-2.5 py-1 text-rd-12 whitespace-nowrap">
              <span className="font-medium text-rd-ink-meta">{k}:</span>
              <span className="font-semibold text-rd-ink tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        {contacto}
        <div className="flex min-w-0 items-center gap-2">{acciones}</div>
      </div>
    </>
  );
};

const MIS_OFERTAS = PUBLICACIONES.filter((p) => (p.org === ENTIDAD_PROPIA || p.propia) && p.tipo === 'oferta');

/* ---------- el diálogo de detalle de entidad ---------- */

const DialogoDetalleEntidad: React.FC<{
  abierto: boolean;
  entidad: Entidad | null;
  onCerrar: () => void;
  onCompromiso?: (pub: Publicacion) => void;
  onCompartir?: () => void;
  onReportar?: () => void;
}> = ({ abierto, entidad: e, onCerrar, onCompromiso, onCompartir, onReportar }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
  }, [abierto]);

  if (!e) return null;

  const com = e.clase === 'comunidad';
  const km = distanciaKm(UBICACION, e);
  const publicaciones = publicacionesDe(e, PUBLICACIONES);
  const datos = cifrasDe(e, PUBLICACIONES);

  const verEnMapa = (puntoId?: string) => {
    irA(puntoId ? `${RUTAS.radar}?punto=${puntoId}` : `${RUTAS.radar}?buscar=${encodeURIComponent(e.nombre)}`);
  };
  const menuEntidad = [
    ...(e.wa ? [{ texto: 'Escribir por WhatsApp', icono: <IconoWhatsApp className="h-4 w-4" />, onElegir: () => window.open(`https://wa.me/${e.tel.replace(/\D/g, '')}`, '_blank', 'noopener') }] : []),
    { texto: 'Llamar', icono: <Phone className="h-4 w-4" />, onElegir: () => irA(`tel:${e.tel.replace(/\s/g, '')}`) },
    ...(onCompartir ? [{ texto: 'Compartir', icono: <Share2 className="h-4 w-4" />, onElegir: onCompartir }] : []),
    ...(onReportar ? [{ texto: 'Reportar', icono: <Flag className="h-4 w-4" />, onElegir: onReportar }] : []),
  ];

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(ev) => ev.target === ref.current && onCerrar()}
      aria-labelledby="detalle-entidad-titulo"
      className="font-rd m-auto max-h-dvh w-full max-w-145 overflow-hidden rounded-rd-xl bg-rd-surface p-0 text-rd-ink shadow-rd-2 backdrop:bg-rd-ink/30 max-sm:mx-4 max-sm:w-auto max-sm:max-w-full"
    >
      {abierto && (
        <div className="flex max-h-dvh flex-col" onClick={(ev) => ev.stopPropagation()}>
          {/* La cabecera es la cabecera del diálogo —qué ficha estás viendo y sus acciones—, no
              el perfil (Alejandro, 22 de septiembre de 2026). El perfil es el primer bloque del
              contenido, debajo de su línea. */}
          <div className="flex flex-none items-center gap-2 border-b border-rd-line px-5 py-3">
            <h2 id="detalle-entidad-titulo" className="font-rd m-0 flex-1 text-rd-13-5 font-semibold tracking-wider text-rd-ink-meta uppercase">
              {com ? 'Comunidad' : 'Organización'}
            </h2>
            <Button nivel="terciario" tamano="md" soloIcono aria-label="Ver en el mapa" onClick={() => verEnMapa()}>
              <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
            </Button>
            <MenuAcciones items={menuEntidad} etiqueta={`Más acciones de ${e.nombre}`} tamano="md" flotante />
            <Button nivel="terciario" tamano="md" soloIcono aria-label="Cerrar" onClick={onCerrar}>
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          </div>

          <div className="sin-barra min-h-0 flex-1 overflow-y-auto p-5">
            {/* 1. Quién: el mismo anidamiento de la tarjeta, con el avatar mayor. */}
            <div className="flex min-w-0 items-start gap-3">
              <Avatar iniciales={iniciales(e.nombre)} tamano="lg" />
              <div className="flex min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="font-rd m-0 min-w-0 text-rd-18 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{e.nombre}</p>
                  {e.verificada && <BadgeCheck role="img" aria-label={com ? 'Comunidad verificada' : 'Organización verificada'} className="h-4.5 w-4.5 shrink-0 text-rd-navy" />}
                </div>
                <span className="text-rd-12-5 text-rd-ink-2">{e.tipo}</span>
                <Donde lugar={e.zona} distancia={distanciaTexto(km)} className="mt-1.5" />
              </div>
            </div>

            {/* 2. Contacto en dos columnas, no en lista: cada dato ocupa su celda. */}
            <section className="mt-5 border-t border-rd-line-soft pt-5">
              <h3 className={ROTULO}>Contacto</h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-rd-12-5 text-rd-ink-2 sm:grid-cols-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
                  <a href={`tel:${e.tel.replace(/\s/g, '')}`} className="truncate font-medium text-rd-ink tabular-nums no-underline hover:underline">
                    {e.tel}
                  </a>
                  {e.wa && <IconoWhatsApp titulo="También por WhatsApp" className="h-3.5 w-3.5 shrink-0 text-rd-green" />}
                </div>
                {e.correo && (
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
                    <a href={`mailto:${e.correo}`} className="min-w-0 truncate no-underline hover:underline" title={e.correo}>
                      {e.correo}
                    </a>
                  </div>
                )}
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
                  <span className="min-w-0 truncate" title={e.dir}>
                    {e.dir}
                  </span>
                </div>
                {e.lider && (
                  <div className="flex min-w-0 items-center gap-2">
                    <UserRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
                    <span className="min-w-0 truncate" title={e.lider}>
                      {e.lider}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Las cifras, en la misma caja que la tarjeta de la lista. */}
            <section className="mt-5">
              <CajaDatos titulo="En RaDAR" filas={datos} />
            </section>

            <section className="mt-5 border-t border-rd-line-soft pt-5">
              <h3 className={ROTULO}>
                {com ? 'Lo que pide' : 'Lo que publica'}
                <Conteo n={publicaciones.length} />
              </h3>
              {publicaciones.length === 0 ? (
                <p className="m-0 text-rd-13 text-rd-ink-2">
                  Todavía no tiene publicaciones en la Radar. {com ? 'Cuando pida algo, aparece aquí.' : 'Cuando ofrezca algo, aparece aquí.'}
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {publicaciones.map((pub) => (
                    <PublicacionDeEntidad key={pub.id} publicacion={pub} entidad={e} onCompromiso={onCompromiso} onVerEnMapa={() => verEnMapa(pub.id)} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </dialog>
  );
};

/** Una publicación de la entidad, dentro de su detalle: qué es y en qué va (etiquetas), qué
 *  ofrece o pide con sus cantidades, y las acciones. Antes repetía el nombre de la entidad como
 *  título y no se entendía qué era (Alejandro, 22 de septiembre de 2026). */
const PublicacionDeEntidad: React.FC<{ publicacion: Publicacion; entidad: Entidad; onCompromiso?: (pub: Publicacion) => void; onVerEnMapa: () => void }> = ({ publicacion: pub, entidad: e, onCompromiso, onVerEnMapa }) => {
  const est = estadoPublicacion(pub);
  const esPropia = pub.propia || pub.org === ENTIDAD_PROPIA || e.nombre === ENTIDAD_PROPIA;
  const esOferta = pub.tipo === 'oferta';
  /* Solo se puede solicitar lo que queda; y solo se puede ayudar a lo que piden si yo ofrezco
     alguno de esos mismos recursos. */
  const puedeSolicitar = esOferta && !esPropia && pub.recursos.some((r) => restante(r) > 0);
  const puedeAyudar =
    !esOferta &&
    !esPropia &&
    pub.recursos.some((r) => restante(r) > 0 && MIS_OFERTAS.some((mo) => mo.recursos.some((mor) => mor.item.toLowerCase() === r.item.toLowerCase() && restante(mor) > 0)));

  return (
    <li className="flex flex-col gap-2.5 rounded-rd-lg border border-rd-line bg-rd-surface p-3">
      {/* Qué es y en qué va; el mapa va aquí, donde queda sitio, y no en una fila propia que se
          veía vacía cuando la publicación no admite acción. */}
      <div className="flex items-center gap-1.5">
        <EtiquetaTipo tipo={pub.tipo} />
        <EtiquetaEstado estado={est} />
        <span className="ml-auto flex">
          <Button nivel="terciario" tamano="md" soloIcono aria-label={`Ver ${pub.titulo} en el mapa`} onClick={onVerEnMapa}>
            <MapIcon aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
        </span>
      </div>
      {pub.descripcion && <p className="m-0 line-clamp-2 text-rd-12-5 leading-normal text-rd-ink-2">{pub.descripcion}</p>}
      {/* Los recursos con el icono de su categoría y su avance: `soloFilas` es la variante que
          el DS ya tenía prevista para el Directorio (`components/ui/Recursos.tsx`). No se usa la
          tarjeta entera porque repetiría en cada publicación el nombre y la ubicación de la
          entidad, que es de lo que trata este diálogo. */}
      <Recursos publicacion={pub} soloFilas />
      {(puedeSolicitar || puedeAyudar) && (
        <div className="flex items-center gap-2 border-t border-rd-line-soft pt-2.5">
          <Button nivel="primario" tamano="md" onClick={() => onCompromiso?.(pub)}>
            {esOferta ? 'Solicitar' : 'Ayudar'}
          </Button>
        </div>
      )}
    </li>
  );
};

/* ---------- la hoja de filtros del directorio: la misma hoja de la Radar, con sus secciones ---------- */


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
        <div className="sin-barra min-h-0 flex-1 overflow-y-auto px-4">
          <section className="border-b border-rd-line-soft py-4">
            <h3 className={ROTULO}>Lugar</h3>
            {/* El mismo selector que la Radar: Cerca de mí, Seleccionar todo, ciudades por departamento. */}
            <SelectorCiudad ciudades={q.ciudades} onCambiar={(ciudades) => onCambiar({ ...q, ciudades })} conteos={conteoPorCiudad(entidades)} ubicacion={UBICACION} onCercaDeMi={(ciudad) => onCambiar({ ...q, ciudades: [ciudad], orden: 'cercania' })} />
          </section>
          <section className="border-b border-rd-line-soft py-4">
            <h3 className={ROTULO}>Qué recurso</h3>
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
            <h3 className={ROTULO}>Ordenar por</h3>
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
