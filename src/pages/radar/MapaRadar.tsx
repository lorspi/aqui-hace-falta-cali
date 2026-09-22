import React, { useEffect, useMemo, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster, { type PointFeature } from 'supercluster';
import { Check, Hand, HeartHandshake } from 'lucide-react';
import type { Publicacion, Ubicacion } from '../../types/publicacion';
import { resumen } from '../../utils/publicaciones';

/**
 * El mapa de la Radar con los pines del prototipo (`mapa.js`): el núcleo dice el tipo (coral
 * pide, navy ofrece; verde con check cuando está completa), el anillo dice el avance (verde =
 * entregado y confirmado, ámbar = en camino) y el icono lo hace legible sobre cualquier tesela.
 * Cada pin es `role="img"` con el nombre completo. Tocar un pin selecciona su tarjeta, y al
 * revés; el seleccionado lleva un halo suave de su color (11 de septiembre). Al alejarse los
 * pines se agrupan (Supercluster, el mismo índice que usa `MapView`): un anillo partido por
 * color con el conteo; al pasar, cuántos de cada tipo; al tocarlo, acerca.
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
  className?: string;
}

type Punto = PointFeature<{ p: Publicacion }>;

/* Las clases que se alternan sobre un pin o un grupo ya pintado. Van aquí, literales, para
   que Tailwind las genere. */
const CLASE_SELECCIONADO = ['after:absolute', 'after:-inset-2.5', 'after:-z-1', 'after:rounded-full', 'after:bg-current', 'after:opacity-15', 'scale-110'];
const CLASE_RESALTADO = ['ring-3', 'ring-rd-navy', 'ring-offset-2', 'scale-115'];

function nombrePunto(p: Publicacion): string {
  return `${p.tipo === 'necesidad' ? 'Necesidad' : 'Oferta'}: ${p.titulo}${p.org !== p.titulo ? ` · ${p.org}` : ''}`;
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

/** Cuántas de cada tipo hay en un grupo, dicho como frase: «3 necesidades, 1 oferta». */
function textoGrupo(n: number, o: number): string {
  return [n ? `${n} ${n === 1 ? 'necesidad' : 'necesidades'}` : '', o ? `${o} ${o === 1 ? 'oferta' : 'ofertas'}` : ''].filter(Boolean).join(', ');
}

/** El grupo: anillo partido por color (coral lo que se pide, navy lo que se ofrece) y el
 *  conteo en el centro. `--p` es el dato que parte el anillo; la regla `.rd-grupo` vive en
 *  `index.css` junto a las del mapa. */
function grupoHTML(n: number, o: number): string {
  const total = n + o;
  const pct = total ? Math.round((n / total) * 100) : 0;
  const nombre = `Grupo de ${total} publicaciones: ${textoGrupo(n, o)}. Acercar`;
  return renderToStaticMarkup(
    <span role="img" aria-label={nombre} title={nombre} className="rd-grupo" style={{ ['--p' as string]: `${pct}%` }}>
      <b className="font-rd flex h-7.5 w-7.5 items-center justify-center rounded-full bg-rd-surface text-rd-12-5 font-bold text-rd-ink tabular-nums">{total}</b>
    </span>,
  );
}

function esMovil(): boolean {
  return window.matchMedia('(max-width: 1023px)').matches;
}

export const MapaRadar: React.FC<MapaRadarProps> = ({ publicaciones, ubicacion, seleccionada, onSeleccionar, encuadrar, tapadoAbajo = 0, resaltadas, encuadrarTodo, className = '' }) => {
  const nodo = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const alSeleccionar = useRef(onSeleccionar);
  alSeleccionar.current = onSeleccionar;
  /* Lo pintado: por id de publicación, y por grupo con las publicaciones que esconde. */
  const pines = useRef<Map<string, L.Marker>>(new Map());
  const grupos = useRef<{ marker: L.Marker; ids: string[] }[]>([]);
  const estado = useRef({ seleccionada, resaltadas: resaltadas?.ids ?? [] });
  estado.current = { seleccionada, resaltadas: resaltadas?.ids ?? [] };

  /* El índice se rehace cuando cambian las publicaciones filtradas. */
  const indice = useMemo(() => {
    const puntos: Punto[] = publicaciones.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: { p } }));
    /* `extent` 256 = la tesela de Leaflet: así el radio de 48 son 48 px en pantalla. */
    return new Supercluster<{ p: Publicacion }, { n: number; o: number }>({
      radius: 48,
      extent: 256,
      maxZoom: 16,
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

  /* Pinta lo que cabe en la vista: pines sueltos o grupos, según el zoom. */
  const pintar = () => {
    const m = mapa.current;
    const c = capa.current;
    if (!m || !c) return;
    c.clearLayers();
    pines.current.clear();
    grupos.current = [];
    const b = m.getBounds();
    const zoom = Math.round(m.getZoom());
    indiceRef.current.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom).forEach((f) => {
      const [lng, lat] = f.geometry.coordinates;
      if ('cluster' in f.properties && f.properties.cluster) {
        const { n, o } = f.properties;
        const idGrupo = f.properties.cluster_id;
        const grupo = L.marker([lat, lng], { icon: L.divIcon({ html: grupoHTML(n, o), className: '', iconSize: [44, 44], iconAnchor: [22, 22] }), keyboard: true, title: `Grupo de ${n + o} publicaciones` });
        grupo.bindTooltip(textoGrupo(n, o), { direction: 'top', offset: [0, -22], className: 'rd-tip-mapa' });
        grupo.on('click', () => m.flyTo([lat, lng], Math.min(indiceRef.current.getClusterExpansionZoom(idGrupo), 18), { duration: 0.4 }));
        grupo.addTo(c);
        grupos.current.push({ marker: grupo, ids: indiceRef.current.getLeaves(idGrupo, Infinity).map((h) => h.properties.p.id) });
        return;
      }
      const p = (f.properties as { p: Publicacion }).p;
      const marker = L.marker([lat, lng], { icon: L.divIcon({ html: pinHTML(p), className: '', iconSize: [40, 40], iconAnchor: [20, 20] }), keyboard: true, title: nombrePunto(p) });
      marker.on('click', () => alSeleccionar.current(p.id));
      marker.addTo(c);
      pines.current.set(p.id, marker);
    });
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
    if (encuadrado.current || encuadrarRef.current || !esMovil()) return;
    const tam = m.getSize();
    if (tam.x === 0 || tam.y === 0) return;
    const limites = L.latLngBounds(pubsRef.current.map((p) => [p.lat, p.lng] as [number, number]));
    encuadrado.current = true;
    if (limites.isValid()) m.fitBounds(limites, { padding: [40, 40], maxZoom: 12, animate: false });
  };

  useEffect(() => {
    if (!nodo.current) return;
    const m = L.map(nodo.current, { zoomControl: true, attributionControl: true }).setView([ubicacion.lat, ubicacion.lng], 12);
    m.zoomControl.setPosition('bottomright');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
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
    };
    // El mapa se crea una vez; la ubicación simulada no cambia en la maqueta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Los pines siguen a las publicaciones filtradas; la selección y el resaltado solo marcan. */
  useEffect(() => {
    pintar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);
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
