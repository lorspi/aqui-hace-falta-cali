import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Flag, Funnel, Hand, HeartHandshake, Map as MapIcon, Phone, Search, Share2, Users, X } from 'lucide-react';
import { Donde } from '../../components/ui/Donde';
import { IconoWhatsApp } from '../../components/ui/IconoMarca';
import { AvisosProvider, useAviso } from '../../components/ui/AvisoCorto';
import { CampanaAvisos } from '../../components/ui/Avisos';
import { Button } from '../../components/ui/Button';
import { BotonFiltros, CampoBuscar, ChipAplicado, QuitarTodos, ZonaChips } from '../../components/ui/Consulta';
import { DialogoReporte } from '../../components/ui/DialogoReporte';
import { Avatar } from '../../components/ui/Etiqueta';
import { Opcion } from '../../components/ui/HojaFiltros';
import { MenuAcciones } from '../../components/ui/MenuAcciones';
import { Pestanas } from '../../components/ui/Pestanas';
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
import { nombrePanel } from '../../utils/cuenta';
import { chipsDe, cifraDe, consultaVacia, conteoTexto, cuantosAplicados, entidadesDe, filtrar, recursosDeVista, resumenPublica, zonasDe } from '../../utils/directorio';
import { modulosGuardados, pendientesCuenta } from '../../utils/panel';
import { cifra, distanciaKm, distanciaTexto, iniciales } from '../../utils/publicaciones';

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

  useEffect(() => {
    document.title = 'RaDAR · Directorio';
  }, []);

  const deVista = useMemo(() => entidadesDe(clase, ENTIDADES, ENTIDAD_PROPIA), [clase]);
  const lista = useMemo(() => filtrar(deVista, PUBLICACIONES, q, UBICACION), [deVista, q]);
  const chips = chipsDe(q);
  const aplicados = cuantosAplicados(q);
  const conteos = useMemo(() => ({ organizacion: entidadesDe('organizacion', ENTIDADES, ENTIDAD_PROPIA).length, comunidad: entidadesDe('comunidad', ENTIDADES, ENTIDAD_PROPIA).length }), []);

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
  const orden = q.orden === 'cifra' ? (clase === 'comunidad' ? 'Ordenadas por solicitudes' : 'Ordenadas por entregas confirmadas') : 'Ordenadas por cercanía';

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
          <Pestanas etiqueta="Qué quieres ver" pestanas={PESTANAS.map((p) => ({ ...p, n: conteos[p.id] }))} actual={clase} onCambiar={cambiarVista} />
        </div>

        {/* ---- consulta ---- */}
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-rd-line bg-rd-surface px-4 py-2 max-lg:gap-2 sm:px-6 lg:px-8">
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
        <main id={`panel-${clase}`} role="tabpanel" aria-labelledby={`pestana-${clase}`} className="min-h-0 flex-1 overflow-y-auto bg-rd-fondo px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
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
              <p className="m-0 mb-3 flex flex-wrap items-baseline gap-x-2 text-rd-12-5 text-rd-ink-meta">
                <b className="font-semibold text-rd-ink">{estado}</b>
                <span>{orden}</span>
              </p>
              {/* La cuadrícula de la vista Lista de la Radar: 2 columnas desde 1024, 3 desde 1280,
                  tarjetas de la altura de su fila con las acciones abajo. */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch lg:gap-4 xl:grid-cols-3 xl:gap-6">
                {lista.map((e) => (
                  <FilaEntidad key={e.id} entidad={e} onCompartir={() => compartir(e)} onReportar={() => setReporte(e)} />
                ))}
              </div>
            </>
          )}
        </main>

        <HojaDirectorio abierta={hoja} clase={clase} consulta={q} entidades={deVista} onCambiar={setQ} onCerrar={() => setHoja(false)} resultados={lista.length} />
        <DialogoReporte abierto={reporte !== null} titulo={reporte ? `Reportar a ${reporte.nombre}` : 'Reportar'} motivos={MOTIVOS_ENTIDAD} onCerrar={() => setReporte(null)} onEnviar={enviarReporte} />
      </div>
    </Shell>
  );
};

/* ---------- la fila ---------- */


/** Una entidad, con la anatomía de la tarjeta de Radar y de consulta, no de acción (Alejandro,
 *  16 de septiembre de 2026): quién, dónde está, lo que publica en números (cuántos recursos
 *  ofrece y pide), los datos que comparan, el contacto, y en el pie «Ver en el mapa» —la Radar
 *  filtrada por su nombre— y el ⋮ con WhatsApp, Llamar, Compartir y Reportar. Solicitar y
 *  Quiero ayudar viven en la Radar. */
const FilaEntidad: React.FC<{ entidad: Entidad; onCompartir: () => void; onReportar: () => void }> = ({ entidad: e, onCompartir, onReportar }) => {
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
    { texto: 'Reportar un problema', icono: <Flag className="h-4 w-4" />, onElegir: onReportar },
  ];

  return (
    <article id={e.id} className="flex min-w-0 flex-col rounded-rd-xl border border-rd-line bg-rd-surface p-4">
      {/* quién: como la cabecera de la tarjeta de Radar */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Avatar iniciales={iniciales(e.nombre)} />
          <span className="flex min-w-0 flex-col">
            <span className="flex min-w-0 items-center gap-1.5">
              <h2 className="font-rd m-0 line-clamp-2 text-rd-13-5 leading-snug font-semibold text-rd-ink">{e.nombre}</h2>
              {e.verificada && <BadgeCheck role="img" aria-label={com ? 'Comunidad verificada' : 'Organización verificada'} className="h-4 w-4 shrink-0 text-rd-navy" />}
            </span>
            <span className="text-rd-12-5 text-rd-ink-2">{e.tipo}</span>
          </span>
        </div>
      </div>

      <Donde lugar={e.zona} distancia={distanciaTexto(km)} className="mb-4" />

      {/* Sin rótulos de bloque (Alejandro, 16 de septiembre de 2026: competían con los rótulos de
          ficha): el pin ya dice dónde, y «Teléfono · Dirección · Correo» ya dicen contacto. Los
          bloques se separan con la línea suave. */}
      {/* lo que publica y los datos que comparan, en números, con la ficha de rótulo y valor */}
      <dl className="m-0 flex flex-wrap gap-3 border-t border-rd-line-soft pt-3">
        {datos.map(([k, v]) => (
          <div key={k} className="min-w-31 flex-1 basis-31">
            <dt className="mb-0.5 text-rd-11 leading-snug font-medium text-rd-ink-meta">{k}</dt>
            <dd className="m-0 text-rd-12-5 leading-snug font-semibold text-rd-ink tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {/* contacto: teléfono (con WhatsApp pegado al número), dirección y correo */}
      <div className="mt-3 mb-4 min-w-0 border-t border-rd-line-soft pt-3">
        <dl className="m-0 flex flex-wrap gap-3">
          <div className="min-w-31 flex-1 basis-31">
            <dt className="mb-0.5 text-rd-11 leading-snug font-medium text-rd-ink-meta">Teléfono</dt>
            <dd className="m-0 flex items-center gap-1.5 text-rd-12-5 leading-snug font-semibold text-rd-ink tabular-nums">
              <a href={`tel:${e.tel.replace(/\s/g, '')}`} className="text-rd-ink no-underline hover:underline">
                {e.tel}
              </a>
              {e.wa && <IconoWhatsApp titulo="También por WhatsApp" className="h-4 w-4 shrink-0 text-rd-green" />}
            </dd>
          </div>
          <div className="min-w-31 flex-1 basis-31">
            <dt className="mb-0.5 text-rd-11 leading-snug font-medium text-rd-ink-meta">Dirección</dt>
            <dd className="m-0 text-rd-12-5 leading-snug font-semibold text-rd-ink">{e.dir}</dd>
          </div>
          {e.correo && (
            <div className="min-w-31 flex-1 basis-31">
              <dt className="mb-0.5 text-rd-11 leading-snug font-medium text-rd-ink-meta">Correo</dt>
              <dd className="m-0 text-rd-12-5 leading-snug font-semibold break-all text-rd-ink">
                <a href={`mailto:${e.correo}`} className="text-rd-ink no-underline hover:underline">
                  {e.correo}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* el pie de la tarjeta de Radar: línea arriba, la acción a la izquierda, ⋮ solo a la derecha */}
      <div className="mt-auto flex items-center gap-2 border-t border-rd-line-soft pt-3">
        <Button nivel="secundario" tamano="md" icono={<MapIcon className="h-4 w-4" />} onClick={verEnMapa} disabled={publica.ofrece + publica.pide === 0}>
          Ver en el mapa
        </Button>
        <span className="ml-auto">
          <MenuAcciones items={menu} etiqueta={`Más acciones de ${e.nombre}`} tamano="md" flotante />
        </span>
      </div>
    </article>
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
    hoja.current?.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierta, onCerrar]);
  if (!abierta) return null;
  const alternar = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  const com = clase === 'comunidad';
  return (
    <>
      <button type="button" aria-label="Cerrar los filtros" onClick={onCerrar} className="fixed inset-0 z-900 cursor-default bg-rd-ink/32" />
      <aside ref={hoja} role="dialog" aria-modal="true" aria-labelledby="hoja-dir-t" className="font-rd fixed top-0 right-0 bottom-0 z-901 flex w-full max-w-110 flex-col bg-rd-surface shadow-rd-2">
        <div className="flex items-center gap-2 border-b border-rd-line px-4 py-3">
          <h2 id="hoja-dir-t" className="m-0 flex-1 text-rd-16 font-semibold tracking-tight text-rd-ink">
            Filtros
          </h2>
          <Button nivel="terciario" tamano="sm" aria-label="Cerrar" soloIcono onClick={onCerrar}>
            <X aria-hidden="true" className="h-4.5 w-4.5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <section className="border-b border-rd-line-soft py-4">
            <h3 className={TITULO}>Lugar</h3>
            <div className="flex flex-wrap gap-2">
              {zonasDe(entidades).map((z) => (
                <Opcion key={z} tipo="checkbox" nombre="lugar" marcada={q.lugares.includes(z)} onChange={() => onCambiar({ ...q, lugares: alternar(q.lugares, z) })}>
                  {z === UBICACION.zona ? `Tu zona · ${z}` : z}
                </Opcion>
              ))}
            </div>
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
