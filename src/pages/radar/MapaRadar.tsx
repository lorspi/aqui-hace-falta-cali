import React, { useEffect, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster, { type PointFeature } from 'supercluster';
import { BadgeCheck, Check, Hand, HeartHandshake, MapPin } from 'lucide-react';
import type { Publicacion, Ubicacion } from '../../types/publicacion';
import { actorPublicacion, distanciaKm, distanciaTexto, estadoPublicacion, recursosPublicacion, resumen, tituloPublicacion } from '../../utils/publicaciones';
import { EtiquetaEstado, EtiquetaTipo } from '../../components/ui/Etiqueta';
import { useTranslation } from '../../i18n/LanguageContext';
import { translateDistance, translateItem } from '../../i18n/catalogTranslations';
import type { Language } from '../../i18n/translations';

/**
 * El mapa de la Radar con los pines del prototipo (`mapa.js`): el núcleo dice el tipo (coral
 * pide, navy ofrece; verde con check cuando está completa), el anillo dice el avance (verde =
 * entregado y confirmado, ámbar = en camino) y el icono lo hace legible sobre cualquier tesela.
 * Cada pin es `role="img"` con el nombre completo. Tocar un pin selecciona su tarjeta, y al
 * revés; el seleccionado lleva un halo suave de su color (11 de septiembre). Al alejarse los
 * pines se agrupan (Supercluster, el mismo índice que usa `MapView`): un anillo partido por
 * color con el conteo, y al tocarlo acerca. El globo al pasar es solo de los pines sueltos
 * (Alejandro, 24 de septiembre de 2026): un grupo no tiene una tarjeta que resumir, y el
 * conteo ya se lee en el anillo. Lo que el grupo esconde sigue en su nombre accesible.
 *
 * Los marcadores persisten entre selecciones: cambiar el seleccionado o los resaltados solo
 * alterna clases en los pines que ya están, así el estado transiciona en vez de parpadear.
 * Los colores salen de los tokens `rd-*` como `var(--color-rd-*)`.
 */
export interface MapaRadarProps {
  publicaciones: Publicacion[];
  ubicacion: Ubicacion;
  seleccionada: string | null;
  onSeleccionar: (id: string) => void;
  /** Cuando cambia, el mapa vuela a ese punto (por ejemplo, «Ver en el mapa» o la hoja).
   *  Cada pedido lleva su `n` para poder repetir el mismo punto. */
  encuadrar?: { id: string; n: number } | null;
  /** Bajo 1024, cuánto tapa la hoja del pin desde abajo (px): el pin se centra en la franja
   *  que queda libre. */
  tapadoAbajo?: number;
  /** Pines resaltados (las sugerencias del cruce); al cambiar, el mapa los encuadra todos. */
  resaltadas?: { ids: string[]; n: number } | null;
  /** Cuando cambia, el mapa encuadra todo lo visible (al cambiar de ciudad). */
  encuadrarTodo?: { n: number } | null;
  onMiUbicacion?: (ubicacion: Ubicacion) => void;
  className?: string;
}

type Punto = PointFeature<{ p: Publicacion }>;

/* Las clases que se alternan sobre un pin o un grupo ya pintado. Van aquí, literales, para
   que Tailwind las genere. */
const CLASE_SELECCIONADO = ['after:absolute', 'after:-inset-2.5', 'after:-z-1', 'after:rounded-full', 'after:bg-current', 'after:opacity-15', 'scale-110'];
const CLASE_RESALTADO = ['ring-3', 'ring-rd-navy', 'ring-offset-2', 'scale-115'];

function nombrePunto(p: Publicacion): string {
  return `${p.tipo === 'necesidad' ? 'Necesidad' : 'Oferta'}: ${tituloPublicacion(p)}`;
}

function pinHTML(p: Publicacion): string {
  const { hecho, camino } = resumen(p);
  const completo = hecho >= 100;
  /* La clase de tipo le da al pin su color como currentColor: el halo de selección lo usa. */
  const tipo = completo ? 'text-rd-green' : p.tipo === 'necesidad' ? 'text-rd-coral' : 'text-rd-navy';
  /* El icono va dentro de un svg anidado de 13 con viewBox de 24: el de Lucide se pide a 24
     para que llene esa caja (a 13 quedaría a poco más de la mitad). */
  const icono = completo ? <Check color="white" size={24} strokeWidth={2.5} /> : p.tipo === 'necesidad' ? <Hand color="white" size={24} strokeWidth={2.5} /> : <HeartHandshake color="white" size={24} strokeWidth={2.5} />;
  return renderToStaticMarkup(
    <span role="img" aria-label={nombrePunto(p)} title={nombrePunto(p)} className={`rd-pin relative block rounded-full transition-transform duration-150 ease-out ${tipo}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" className="drop-shadow-rd-pin">
        <circle cx="20" cy="20" r="14" fill="var(--color-rd-surface)" stroke="var(--color-rd-surface)" strokeWidth="7" />
        {completo ? (
          <circle cx="20" cy="20" r="14" fill="none" stroke="var(--color-rd-green)" strokeWidth="4" />
        ) : (
          <>
            <circle cx="20" cy="20" r="14" fill="none" stroke="var(--color-rd-track)" strokeWidth="4" />
            {hecho > 0 && <circle cx="20" cy="20" r="14" fill="none" stroke="var(--color-rd-green)" strokeWidth="4" pathLength={100} strokeDasharray={`${hecho} 100`} transform="rotate(-90 20 20)" />}
            {camino > 0 && <circle cx="20" cy="20" r="14" fill="none" stroke="var(--color-rd-amber)" strokeWidth="4" pathLength={100} strokeDasharray={`${camino} 100`} strokeDashoffset={-hecho} transform="rotate(-90 20 20)" />}
          </>
        )}
        <circle cx="20" cy="20" r="10.5" fill="currentColor" />
        <svg x="13.5" y="13.5" width="13" height="13" viewBox="0 0 24 24">
          {icono}
        </svg>
      </svg>
    </span>,
  );
}

/**
 * El globo que se abre al pasar por encima de un pin: la tarjeta resumida a lo que decide si
 * vale la pena abrirla. Qué es (necesidad u oferta) y cómo va, qué recurso, quién lo pide o lo
 * da y si está verificado, y dónde queda con la distancia desde donde está quien mira. Lo
 * demás —descripción, fotos, el detalle recurso por recurso y las acciones— se queda en la
 * tarjeta y en el diálogo: un globo que hay que leer no sirve para barrer un mapa.
 * Reutiliza `EtiquetaTipo` y `EtiquetaEstado` tal cual, así el globo no se desalinea de la
 * tarjeta cuando alguna de las dos cambie.
 * Solo se cuelga donde hay hover (ver `pintar`): en el teléfono el pin abre la hoja, que ya
 * trae la tarjeta entera.
 */
function tipHTML(p: Publicacion, km: number | null, lang: Language = 'es'): string {
  const zona = p.zona || p.localidad || '';
  const dist = translateDistance(km, lang);
  const recs = (p.recursos || []).map((r) => translateItem(r.item, lang)).join(', ');
  const actor = actorPublicacion(p);
  const localizedActor =
    actor === 'Ciudadano'
      ? (lang === 'en' ? 'Citizen' : lang === 'pt' ? 'Cidadão' : lang === 'fr' ? 'Citoyen' : 'Ciudadano')
      : actor === 'Comunidad'
      ? (lang === 'en' ? 'Community' : lang === 'pt' ? 'Comunidade' : lang === 'fr' ? 'Communauté' : 'Comunidad')
      : actor;

  return renderToStaticMarkup(
    <div className="font-rd flex w-55 flex-col gap-2 p-0.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <EtiquetaTipo tipo={p.tipo} />
        <EtiquetaEstado estado={estadoPublicacion(p)} />
      </div>
      <div>
        <p className="m-0 text-rd-13-5 font-semibold leading-snug text-rd-ink">{recs || recursosPublicacion(p)}</p>
        <p className="m-0 mt-1 flex items-center gap-1 text-rd-12 font-medium text-rd-ink-2">
          <span className="truncate">{localizedActor}</span>
          {p.verificada && <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-navy" />}
        </p>
      </div>
      {(zona || dist) && (
        <p className="m-0 flex items-center gap-1 text-rd-11-5 text-rd-ink-meta">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{zona}</span>
          {zona && dist && <span aria-hidden="true" className="h-0.5 w-0.5 shrink-0 rounded-full bg-rd-ink-3" />}
          {dist && <span className="shrink-0">{dist}</span>}
        </p>
      )}
    </div>,
  );
}

/** Cuántas de cada tipo hay en un grupo, dicho como frase: «3 necesidades, 1 oferta». */
function textoGrupo(n: number, o: number, lang: Language = 'es'): string {
  const needSingular = lang === 'en' ? 'need' : lang === 'fr' ? 'besoin' : lang === 'pt' ? 'necessidade' : 'necesidad';
  const needPlural = lang === 'en' ? 'needs' : lang === 'fr' ? 'besoins' : lang === 'pt' ? 'necessidades' : 'necesidades';
  const offerSingular = lang === 'en' ? 'offer' : lang === 'fr' ? 'offre' : lang === 'pt' ? 'oferta' : 'oferta';
  const offerPlural = lang === 'en' ? 'offers' : lang === 'fr' ? 'offres' : lang === 'pt' ? 'ofertas' : 'ofertas';
  return [n ? `${n} ${n === 1 ? needSingular : needPlural}` : '', o ? `${o} ${o === 1 ? offerSingular : offerPlural}` : ''].filter(Boolean).join(', ');
}

/** El grupo: anillo partido por color (coral lo que se pide, navy lo que se ofrece) y el
 *  conteo en el centro. `--p` es el dato que parte el anillo; la regla `.rd-grupo` vive en
 *  `index.css` junto a las del mapa. */
function grupoHTML(n: number, o: number, lang: Language = 'es'): string {
  const total = n + o;
  const pct = total ? Math.round((n / total) * 100) : 0;
  const labelGroup = lang === 'en' ? 'Group of' : lang === 'fr' ? 'Groupe de' : lang === 'pt' ? 'Grupo de' : 'Grupo de';
  const labelPubs = lang === 'en' ? 'publications' : lang === 'fr' ? 'publications' : lang === 'pt' ? 'publicações' : 'publicaciones';
  const labelZoom = lang === 'en' ? 'Zoom in' : lang === 'fr' ? 'Zoomer' : lang === 'pt' ? 'Aproximar' : 'Acercar';
  const nombre = `${labelGroup} ${total} ${labelPubs}: ${textoGrupo(n, o, lang)}. ${labelZoom}`;
  return renderToStaticMarkup(
    <span role="img" aria-label={nombre} title={nombre} className="rd-grupo" style={{ ['--p' as string]: `${pct}%` }}>
      <b className="font-rd flex h-7.5 w-7.5 items-center justify-center rounded-full bg-rd-surface text-rd-12-5 font-bold text-rd-ink tabular-nums">{total}</b>
    </span>,
  );
}

function esMovil(): boolean {
  return window.matchMedia('(max-width: 1023px)').matches;
}

/** Si el puntero puede posarse. Con dedo no hay «pasar por encima»: el toque abre la hoja del
 *  pin, y un globo colgado ahí se abriría encima de ella al tocar. */
function hayHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Distribuye un conjunto de marcadores superpuestos en círculos concéntricos de distintos
 * niveles alrededor de su centro común, evitando que se tapen entre sí.
 * - 2 a 6 elementos: 1 solo nivel (círculo simple, radio 40-52px).
 * - 7 a 14 elementos: 2 niveles concéntricos (interior 44px, exterior 92px con desfase angular).
 * - 15 a 24 elementos: 3 niveles concéntricos (44px, 92px, 140px).
 * - 25+ elementos: 4 niveles concéntricos (44px, 92px, 140px, 188px).
 */
function calcularDistribucionNiveles<T>(
  items: T[]
): { item: T; radius: number; angle: number }[] {
  const n = items.length;
  if (n <= 1) return items.map((item) => ({ item, radius: 0, angle: 0 }));

  if (n <= 6) {
    const radius = n <= 2 ? 42 : n <= 3 ? 46 : n <= 4 ? 50 : n <= 5 ? 54 : 58;
    const angleStep = (2 * Math.PI) / n;
    return items.map((item, idx) => ({
      item,
      radius,
      angle: angleStep * idx - Math.PI / 2,
    }));
  }

  const niveles: { radius: number; count: number; angleOffset: number }[] = [];

  if (n <= 14) {
    const innerCount = Math.min(4, Math.max(3, Math.floor(n / 2.5)));
    const outerCount = n - innerCount;
    niveles.push(
      { radius: 48, count: innerCount, angleOffset: -Math.PI / 2 },
      { radius: 98, count: outerCount, angleOffset: -Math.PI / 2 + Math.PI / outerCount }
    );
  } else if (n <= 24) {
    const level1 = 4;
    const level2 = Math.min(8, Math.floor((n - 4) * 0.45));
    const level3 = n - level1 - level2;
    niveles.push(
      { radius: 48, count: level1, angleOffset: -Math.PI / 2 },
      { radius: 98, count: level2, angleOffset: -Math.PI / 2 + Math.PI / level2 },
      { radius: 148, count: level3, angleOffset: -Math.PI / 2 + Math.PI / (2 * level3) }
    );
  } else {
    const level1 = 4;
    const level2 = 7;
    const level3 = 10;
    const level4 = n - level1 - level2 - level3;
    niveles.push(
      { radius: 48, count: level1, angleOffset: -Math.PI / 2 },
      { radius: 98, count: level2, angleOffset: -Math.PI / 2 + Math.PI / level2 },
      { radius: 148, count: level3, angleOffset: -Math.PI / 2 + Math.PI / (2 * level3) },
      { radius: 198, count: level4, angleOffset: -Math.PI / 2 + Math.PI / (3 * level4) }
    );
  }

  const res: { item: T; radius: number; angle: number }[] = [];
  let itemIdx = 0;

  for (const niv of niveles) {
    const angleStep = (2 * Math.PI) / niv.count;
    for (let i = 0; i < niv.count && itemIdx < n; i++) {
      res.push({
        item: items[itemIdx],
        radius: niv.radius,
        angle: niv.angleOffset + angleStep * i,
      });
      itemIdx++;
    }
  }

  return res;
}

export const MapaRadar: React.FC<MapaRadarProps> = ({
  publicaciones,
  ubicacion,
  seleccionada,
  onSeleccionar,
  encuadrar,
  tapadoAbajo = 0,
  resaltadas,
  encuadrarTodo,
  onMiUbicacion,
  className = '',
}) => {
  const { language } = useTranslation();
  const nodo = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const capaLineas = useRef<L.LayerGroup | null>(null);
  const alSeleccionar = useRef(onSeleccionar);
  alSeleccionar.current = onSeleccionar;
  const onMiUbicacionRef = useRef(onMiUbicacion);
  onMiUbicacionRef.current = onMiUbicacion;
  const marcadorUbicacion = useRef<L.Marker | null>(null);
  const botonUbicacionRef = useRef<HTMLAnchorElement | null>(null);
  /* Lo pintado: por id de publicación, y por grupo con las publicaciones que esconde. */
  const pines = useRef<Map<string, L.Marker>>(new Map());
  const grupos = useRef<{ marker: L.Marker; ids: string[] }[]>([]);
  const estado = useRef({ seleccionada, resaltadas: resaltadas?.ids ?? [] });
  estado.current = { seleccionada, resaltadas: resaltadas?.ids ?? [] };

  /* El índice se rehace cuando cambian las publicaciones filtradas, preservando coordenadas genuinas. */
  const indice = useMemo(() => {
    const puntos: Punto[] = publicaciones
      .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng))
      .map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { p },
      }));
    /* `extent` 256 = la tesela de Leaflet; radio 48 y maxZoom 15 para reducir capas y hacer la navegación fluida. */
    return new Supercluster<{ p: Publicacion }, { n: number; o: number }>({
      radius: 48,
      extent: 256,
      maxZoom: 15,
      map: (props) => ({ n: props.p.tipo === 'necesidad' ? 1 : 0, o: props.p.tipo === 'oferta' ? 1 : 0 }),
      reduce: (acc, props) => {
        acc.n += props.n;
        acc.o += props.o;
      },
    }).load(puntos);
  }, [publicaciones]);
  const indiceRef = useRef(indice);
  indiceRef.current = indice;

  /* Alterna las clases de selección y resaltado sobre lo que ya está pintado. */
  const marcar = () => {
    const { seleccionada: sel, resaltadas: res } = estado.current;
    const poner = (el: Element | null, clases: string[], si: boolean) => el && clases.forEach((c) => el.classList.toggle(c, si));
    pines.current.forEach((marker, id) => {
      const el = marker.getElement()?.firstElementChild ?? null;
      poner(el, CLASE_SELECCIONADO, id === sel);
      poner(el, CLASE_RESALTADO, res.includes(id));
      marker.setZIndexOffset(id === sel ? 1000 : res.includes(id) ? 500 : 0);
    });
    grupos.current.forEach(({ marker, ids }) => {
      const el = marker.getElement()?.firstElementChild ?? null;
      poner(el, CLASE_RESALTADO, ids.some((id) => id === sel || res.includes(id)));
    });
  };

  /* Desplaza en círculos concéntricos de distintos niveles los marcadores que coinciden o se amontonan
     en el mismo punto de pantalla, conectándolos con líneas discontinuas hacia el epicentro. */
  const desplazarMarcadoresSolapados = (m: L.Map) => {
    const cLineas = capaLineas.current;
    if (!cLineas) return;
    cLineas.clearLayers();

    // Marcadores visibles en pantalla (pines individuales y clusters)
    const todos: { marker: L.Marker; originalLatLng: L.LatLng }[] = [];
    pines.current.forEach((marker) => {
      const orig = (marker as any)._posOriginal || marker.getLatLng();
      todos.push({ marker, originalLatLng: orig });
    });
    grupos.current.forEach(({ marker }) => {
      const orig = (marker as any)._posOriginal || marker.getLatLng();
      todos.push({ marker, originalLatLng: orig });
    });

    if (todos.length < 2) return;

    // Distancia de solapamiento en píxeles de pantalla (íconos son de 40px + halo; 50px garantiza que ningún pin se pise)
    const nearbyDistance = 50;
    const puntosContenedor = todos.map((item) => m.latLngToContainerPoint(item.originalLatLng));
    const procesados = new Set<number>();

    for (let i = 0; i < todos.length; i++) {
      if (procesados.has(i)) continue;

      // Agrupación exhaustiva por componentes conexos (BFS) para no dejar marcadores vecinos sin incluir
      const cola = [i];
      procesados.add(i);
      const grupoIndices: number[] = [];

      while (cola.length > 0) {
        const curr = cola.pop()!;
        grupoIndices.push(curr);
        const ptCurr = puntosContenedor[curr];

        for (let j = 0; j < todos.length; j++) {
          if (!procesados.has(j)) {
            if (ptCurr.distanceTo(puntosContenedor[j]) < nearbyDistance) {
              procesados.add(j);
              cola.push(j);
            }
          }
        }
      }

      if (grupoIndices.length <= 1) continue;

      // Centroide visual de la agrupación
      const grupoPts = grupoIndices.map((idx) => puntosContenedor[idx]);
      const centroPx = grupoPts.reduce(
        (acc, p) => L.point(acc.x + p.x / grupoPts.length, acc.y + p.y / grupoPts.length),
        L.point(0, 0)
      );
      const centroLatLng = m.containerPointToLatLng(centroPx);

      // Ordenamos radialmente desde el centroide para que las líneas conectoras no se crucen
      const itemsConAngulo = grupoIndices.map((idx) => {
        const pt = puntosContenedor[idx];
        const angle = Math.atan2(pt.y - centroPx.y, pt.x - centroPx.x);
        return { item: todos[idx], angle };
      });
      itemsConAngulo.sort((a, b) => a.angle - b.angle);
      const grupoItems = itemsConAngulo.map((i) => i.item);

      // Color del epicentro y líneas según tipos presentes (necesidades, ofertas o mixtos)
      const tipos = grupoItems.map((item) => (item.marker as any)._pubTipo);
      const tieneNecesidad = tipos.includes('necesidad');
      const tieneOferta = tipos.includes('oferta');
      const colorTema = tieneNecesidad && tieneOferta ? '#64748B' : tieneNecesidad ? '#E0533C' : '#1B3A93';

      // Epicentro común: punto central discreto con borde nítido
      L.circleMarker(centroLatLng, {
        radius: 4.5,
        fillColor: colorTema,
        fillOpacity: 0.95,
        color: '#FFFFFF',
        weight: 1.5,
        interactive: false,
      }).addTo(cLineas);

      // Asignación de niveles concéntricos
      const distribuidos = calcularDistribucionNiveles(grupoItems);

      distribuidos.forEach(({ item, radius, angle }) => {
        const nuevoPx = L.point(
          centroPx.x + radius * Math.cos(angle),
          centroPx.y + radius * Math.sin(angle)
        );
        const nuevoLatLng = m.containerPointToLatLng(nuevoPx);

        item.marker.setLatLng(nuevoLatLng);

        // Línea conectora discontinua
        L.polyline([centroLatLng, nuevoLatLng], {
          color: colorTema,
          weight: 1.5,
          opacity: 0.75,
          dashArray: '3 3',
          interactive: false,
        }).addTo(cLineas);
      });
    }
  };

  /* Pinta lo que cabe en la vista: pines sueltos o grupos, según el zoom. */
  const pintar = () => {
    const m = mapa.current;
    const c = capa.current;
    const cLineas = capaLineas.current;
    if (!m || !c) return;
    if (cLineas) cLineas.clearLayers();
    c.clearLayers();
    pines.current.clear();
    grupos.current = [];
    const b = m.getBounds();
    const zoom = Math.round(m.getZoom());
    const conHover = hayHover();
    indiceRef.current.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom).forEach((f) => {
      const [lng, lat] = f.geometry.coordinates;
      if ('cluster' in f.properties && f.properties.cluster) {
        const { n, o } = f.properties;
        const idGrupo = f.properties.cluster_id;
        const grupo = L.marker([lat, lng], { icon: L.divIcon({ html: grupoHTML(n, o, language), className: '', iconSize: [44, 44], iconAnchor: [22, 22] }), keyboard: true, title: `Grupo de ${n + o} publicaciones` });
        (grupo as any)._posOriginal = L.latLng(lat, lng);
        (grupo as any)._pubTipo = n > 0 && o > 0 ? 'mixto' : n > 0 ? 'necesidad' : 'oferta';

        // Navegación ágil del cluster: encuadra directamente todos sus elementos en lugar de avanzar capa por capa
        grupo.on('click', () => {
          const leaves = indiceRef.current.getLeaves(idGrupo, Infinity);
          if (!leaves || leaves.length === 0) {
            m.flyTo([lat, lng], Math.min(m.getZoom() + 3, 17), { duration: 0.45 });
            return;
          }

          const coords = leaves.map(
            (h) => [h.geometry.coordinates[1], h.geometry.coordinates[0]] as [number, number]
          );
          const limites = L.latLngBounds(coords);

          // Si todos los puntos están prácticamente en el mismo lugar (menos de 35 metros entre sí)
          const sonMismoPunto = limites.getNorthEast().distanceTo(limites.getSouthWest()) < 35;

          if (sonMismoPunto) {
            // Vuela directamente a zoom 16 donde el Supercluster entrega los puntos individuales y se despliegan en círculos concéntricos con líneas
            const targetZoom = Math.min(Math.max(m.getZoom() + 2, 16), 17);
            m.flyTo([lat, lng], targetZoom, { duration: 0.45 });
          } else {
            // Encuadra todos los puntos del cluster, avanzando al menos 2 niveles de zoom para evitar pasos mínimos
            const boundsZoom = m.getBoundsZoom(limites.pad(0.25));
            const targetZoom = Math.min(Math.max(boundsZoom, m.getZoom() + 2), 17);
            m.flyTo(limites.getCenter(), targetZoom, { duration: 0.45 });
          }
        });

        grupo.addTo(c);
        grupos.current.push({ marker: grupo, ids: indiceRef.current.getLeaves(idGrupo, Infinity).map((h) => h.properties.p.id) });
        return;
      }
      const p = (f.properties as { p: Publicacion }).p;
      const marker = L.marker([lat, lng], { icon: L.divIcon({ html: pinHTML(p), className: '', iconSize: [40, 40], iconAnchor: [20, 20] }), keyboard: true, title: nombrePunto(p) });
      (marker as any)._posOriginal = L.latLng(lat, lng);
      (marker as any)._pubTipo = p.tipo;
      /* El globo con el resumen solo donde hay puntero: el `title` nativo sigue ahí para el
         resto y para los lectores de pantalla, que leen el `aria-label` del pin. */
      if (conHover) marker.bindTooltip(tipHTML(p, distanciaKm(ubicacion, p), language), { direction: 'top', offset: [0, -20], className: 'rd-tip-pin', opacity: 1 });
      marker.on('click', () => alSeleccionar.current(p.id));
      marker.addTo(c);
      pines.current.set(p.id, marker);
    });

    // Desplaza y conecta con líneas marcadores solapados en pantalla
    desplazarMarcadoresSolapados(m);
    marcar();
  };
  const pintarRef = useRef(pintar);
  pintarRef.current = pintar;

  /* Bajo 1024 el encuadre inicial contiene los pines visibles (40 de relleno = la geometría
     del icono; el zoom por defecto es el tope). Con el contenedor sin medida (la página abrió
     en vista Lista) espera: lo hace al volver a Mapa. Una sola vez; con `?punto=` manda el
     encuadre de ese punto. */
  const encuadrado = useRef(false);
  const pubsRef = useRef(publicaciones);
  pubsRef.current = publicaciones;
  const encuadrarRef = useRef(encuadrar);
  encuadrarRef.current = encuadrar;
  const encuadrarVisibles = (m: L.Map) => {
    if (encuadrado.current || encuadrarRef.current) return;
    const tam = m.getSize();
    if (tam.x === 0 || tam.y === 0) return;
    if (pubsRef.current.length === 0) return;
    const limites = L.latLngBounds(pubsRef.current.map((p) => [p.lat, p.lng] as [number, number]));
    if (limites.isValid()) {
      encuadrado.current = true;
      m.fitBounds(limites.pad(0.15), { maxZoom: 13, animate: false });
    }
  };

  const irAMiUbicacion = () => {
    const m = mapa.current;
    if (!m) return;

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    if (botonUbicacionRef.current) {
      botonUbicacionRef.current.classList.add('animate-pulse');
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (botonUbicacionRef.current) {
          botonUbicacionRef.current.classList.remove('animate-pulse');
        }
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const nuevaUbicacion: Ubicacion = {
          lat,
          lng,
          zona: 'Tu ubicación',
          simulada: false,
        };

        if (marcadorUbicacion.current) {
          marcadorUbicacion.current.setLatLng([lat, lng]);
        } else {
          const userIcon = L.divIcon({
            className: 'user-location-pin',
            html: '<div style="width: 18px; height: 18px; border-radius: 50%; background-color: #2563eb; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          marcadorUbicacion.current = L.marker([lat, lng], {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(m);
          marcadorUbicacion.current.bindPopup(
            '<div style="font-family: inherit; font-size: 12px; font-weight: 600; text-align: center;">📍 Tu ubicación</div>'
          );
        }

        m.flyTo([lat, lng], Math.max(m.getZoom(), 15), { duration: 0.5 });
        onMiUbicacionRef.current?.(nuevaUbicacion);
      },
      (error) => {
        if (botonUbicacionRef.current) {
          botonUbicacionRef.current.classList.remove('animate-pulse');
        }
        console.warn('Error al obtener ubicación:', error);
        alert('No pudimos acceder a tu ubicación. Verifica que los permisos de ubicación estén habilitados en tu navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (!nodo.current) return;
    // Centro geográfico por defecto en Colombia (Zoom 6 para ver el país si está vacio)
    const centroInicial: [number, number] = ubicacion ? [ubicacion.lat, ubicacion.lng] : [4.5709, -74.2973];
    const m = L.map(nodo.current, { zoomControl: false, attributionControl: true }).setView(centroInicial, 6);

    // 1. Control de ubicación ("felchita") justo arriba del zoom
    const LocationControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-location');
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const a = L.DomUtil.create('a', '', container);
        a.href = '#';
        a.title = 'Ir a mi ubicación';
        a.setAttribute('role', 'button');
        a.setAttribute('aria-label', 'Ir a mi ubicación');
        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;

        L.DomEvent.on(a, 'click', (ev) => {
          L.DomEvent.preventDefault(ev);
          irAMiUbicacion();
        });

        botonUbicacionRef.current = a;
        return container;
      },
    });

    new LocationControl().addTo(m);

    // 2. Control de Zoom de Leaflet debajo del botón de ubicación
    L.control.zoom({ position: 'bottomright' }).addTo(m);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    capaLineas.current = L.layerGroup().addTo(m);
    capa.current = L.layerGroup().addTo(m);
    mapa.current = m;
    m.on('moveend zoomend', () => pintarRef.current());
    /* El primer pintado espera un cuadro a que el contenedor mida. Se cancela al desmontar:
       en desarrollo React monta el efecto dos veces y el cuadro del primer mapa, ya quitado,
       reventaba en Leaflet (`_leaflet_pos` de un panel que no existe). */
    const cuadro = requestAnimationFrame(() => {
      if (mapa.current !== m) return;
      m.invalidateSize();
      encuadrarVisibles(m);
      pintarRef.current();
    });
    const ro = new ResizeObserver(() => {
      if (mapa.current !== m) return;
      m.invalidateSize();
      encuadrarVisibles(m);
    });
    ro.observe(nodo.current);
    return () => {
      cancelAnimationFrame(cuadro);
      ro.disconnect();
      m.remove();
      mapa.current = null;
      marcadorUbicacion.current = null;
      botonUbicacionRef.current = null;
    };
    // El mapa se crea una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Si la ubicación del usuario se detecta o actualiza, sincronizar su pin en el mapa */
  useEffect(() => {
    const m = mapa.current;
    if (!m || !ubicacion || ubicacion.simulada) return;
    if (marcadorUbicacion.current) {
      marcadorUbicacion.current.setLatLng([ubicacion.lat, ubicacion.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: '<div style="width: 18px; height: 18px; border-radius: 50%; background-color: #2563eb; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      marcadorUbicacion.current = L.marker([ubicacion.lat, ubicacion.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(m);
      marcadorUbicacion.current.bindPopup(
        '<div style="font-family: inherit; font-size: 12px; font-weight: 600; text-align: center;">📍 Tu ubicación</div>'
      );
    }
  }, [ubicacion]);

  /* Los pines siguen a las publicaciones filtradas; encuadra si no lo ha hecho aun. */
  useEffect(() => {
    const m = mapa.current;
    if (m && !encuadrado.current && publicaciones.length > 0) {
      encuadrarVisibles(m);
    }
    pintar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, language]);
  useEffect(() => {
    marcar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada, resaltadas]);

  /* Volar a un punto. Bajo 1024 el destino deja el pin en el centro de la franja que la hoja
     no tapa: se proyecta al zoom de llegada y se corre el centro esa diferencia, así el vuelo
     es uno solo y termina donde debe. Si el mapa venía oculto (vista Lista) se remide antes. */
  useEffect(() => {
    const m = mapa.current;
    if (!encuadrar || !m) return;
    const p = publicaciones.find((x) => x.id === encuadrar.id);
    if (!p) return;
    /* Un cuadro después: si el pedido llega con la página (`?punto=`), el primer pintado de
       los pines ya pasó y el vuelo no coincide con un `clearLayers` a mitad de animación. */
    const cuadro = requestAnimationFrame(() => {
      if (mapa.current !== m) return;
      m.invalidateSize(false);
      const zoom = Math.max(m.getZoom(), 15);
      let centro: L.LatLngExpression = [p.lat, p.lng];
      if (esMovil() && tapadoAbajo > 0) {
        const rm = m.getContainer().getBoundingClientRect();
        const abajo = Math.min(rm.height, window.innerHeight - tapadoAbajo - rm.top);
        const corrimiento = rm.height / 2 - abajo / 2;
        centro = m.unproject(m.project([p.lat, p.lng], zoom).add([0, corrimiento]), zoom);
      }
      m.flyTo(centro, zoom, { duration: 0.45, easeLinearity: 0.3 });
    });
    return () => cancelAnimationFrame(cuadro);
    // Solo cuando llega un pedido nuevo (su `n`), no con cada cambio de la hoja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadrar?.n]);

  /* Al resaltar las sugerencias, el mapa las encuadra junto con la publicación. Si el mapa no
     mide nada (vista Lista bajo 1024), no se mueve: cuando se vea, seguirá donde estaba. */
  useEffect(() => {
    const m = mapa.current;
    if (!resaltadas || !m) return;
    const tam = m.getSize();
    if (tam.x === 0 || tam.y === 0) return;
    const puntos = publicaciones.filter((p) => resaltadas.ids.includes(p.id) || p.id === seleccionada).map((p) => [p.lat, p.lng] as [number, number]);
    if (puntos.length) m.flyToBounds(L.latLngBounds(puntos).pad(0.2), { maxZoom: 14, duration: 0.5 });
    // Solo cuando cambia el pedido de resaltar (su `n`), no con cada selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resaltadas?.n]);

  /* Al cambiar de ciudad, el mapa encuadra lo que queda visible (Toda Colombia: todo el país
     con sus grupos; una ciudad: sus pines). Si no hay nada, se queda donde estaba. */
  useEffect(() => {
    const m = mapa.current;
    if (!encuadrarTodo || !m) return;
    const tam = m.getSize();
    if (tam.x === 0 || tam.y === 0) return;
    const puntos = pubsRef.current.map((p) => [p.lat, p.lng] as [number, number]);
    if (puntos.length) m.flyToBounds(L.latLngBounds(puntos).pad(0.2), { maxZoom: 12, duration: 0.5 });
    // Solo cuando cambia el pedido (su `n`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadrarTodo?.n]);

  return <div ref={nodo} aria-label="Mapa de necesidades y ofertas" className={`rd-mapa bg-rd-mapa ${className}`} />;
};
