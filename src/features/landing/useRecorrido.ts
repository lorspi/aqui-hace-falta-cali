import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * El recorrido fijado de la segunda sección de la landing (Alejandro, 6 de octubre de 2026: «al
 * hacer el scroll entre sección 1 y 2, el contenedor de la sección 2 inicia con un ancho de 8
 * columnas. Cuando entra completa la sección 2 en esa transición de scroll pasa a las 12»).
 *
 * El scroll se reparte en tres tramos, todos atados a la posición y no al tiempo:
 *
 *   1. ENTRADA. Desde donde el contenedor asoma bajo el hero hasta que llega a su sitio fijo, se
 *      abre de 8 a 12 columnas.
 *   2. VISTAS. El contenedor queda fijo (`position: sticky`) y el scroll recorre Radar,
 *      Directorio y Mi organización, un tramo igual para cada una.
 *   3. SALIDA. Se suelta, sube con la página y se cierra de 12 a 8 en espejo con la entrada, a la
 *      misma distancia (Alejandro confirmó el espejo el 6 de octubre de 2026).
 *
 * Nada de esto pasa por el estado de React: un solo `requestAnimationFrame` por evento de scroll
 * escribe cuatro propiedades CSS en el panel (`--rd-lado`, `--rd-arriba`, `--rd-abajo` y
 * `--rd-radio-menos`) y el CSS las usa en un `clip-path`, que no recalcula el diseño de la página
 * en cada cuadro. Están registradas sin herencia en `index.css`, así que escribirlas tampoco
 * recalcula el estilo de los nodos de dentro del panel (6 de octubre de 2026, H24). Ese cuadro
 * escribe además, en los propios nodos que las usan y también registradas sin herencia, `--rd-abre`
 * (cuánto se ven las pestañas y la línea de avance) y `--rd-empuje` (las pestañas con el foco del
 * teclado y el panel estrecho), y el `stroke-dashoffset` de la línea alrededor de la tarjeta. Lo
 * único que sube a React es el índice de la vista, que cambia dos veces en todo el recorrido.
 */

/** Cuánto scroll toma cada vista mientras el contenedor está fijo, en altos de ventana.
 *  0.3 permite un paso rápido, ligero y natural entre vistas sin trabar el scroll general. */
export const PASO_POR_VISTA = 0.35;

/** El hueco de la grilla de 12, el mismo `gap-6` de `Grilla12`. Con él salen las 8 columnas. */
const HUECO = 24;

/* El alto del panel crece con el ancho (Alejandro, 6 de octubre de 2026: «la altura del contenedor
   grande de la sección 2 debería iniciar con la misma distancia que el ancho y aumentar de manera
   progresiva. creo que quedó más alto porque anteriormente los tabs estaban arriba»). Con el panel
   estrecho, el color deja alrededor de la tarjeta el mismo margen arriba, abajo y a los lados: el
   que queda a los lados con 8 columnas (24 desde 1280; 0 entre 1024 y 1279, donde la tarjeta mide
   las 8 enteras). Mientras se abre, los dos márgenes crecen a la vez y con la misma curva, el de
   los lados hasta las 12 columnas y el de arriba y abajo hasta el alto entero del panel fijo, que
   es lo que cabe en la ventana sin cortar la tarjeta; al cerrar, el espejo. Arriba y abajo se
   recorta lo mismo porque la tarjeta va centrada.

   Hasta ese día el borde de arriba bajaba un máximo de 64 y el de abajo no se movía, a imitación
   de Calendly, que crece el panel hacia arriba: con las pestañas encima de la tarjeta eso dejaba
   aire para ellas, y sin ellas quedaba un panel estrecho con 114 arriba, 178 abajo y 24 a los
   lados (medido a 1440 por 900). La sección sube sobre el hero lo mismo que sin recorrido más este
   recogido, que `medir` escribe en `--rd-vertical`: así el borde visible sigue a 80 de los botones
   del hero a cualquier altura (H6). */

/** Dónde deja el scroll un clic en una pestaña: al principio del tramo de su vista, un 2 % dentro
 *  para que un temblor del desplazamiento suave no la deje en la vista de antes. Hasta el 6 de
 *  octubre de 2026 la dejaba a la mitad, y la línea alrededor de la tarjeta aparecía ya a medio
 *  llenar: quien llegaba a la segunda o la tercera vista con las pestañas nunca la veía empezar
 *  (Alejandro: «debería como reiniciarse por cada uno, actualmente se ve en el 1ro y para los otros
 *  2 no funciona»). Medido antes del cambio: a 1440 y a 1024, tras el clic, la línea quedaba quieta
 *  en el 50 % en la vista 2 y en la 3. */
const ARRANQUE_DEL_TRAMO = 0.02;

/** La parte final de la apertura en la que aparecen las pestañas y la línea de avance, y la
 *  primera del cierre en la que se van (Alejandro, 6 de octubre de 2026: «esos solo se visualizan
 *  cuando se amplía el fondo de esa sección. Antes no»). Un cuarto: aparecen cuando el color ya
 *  casi llegó a las 12 columnas, y a esa altura el recorte (a 1440, 57 de 228 por lado) queda
 *  lejos de ellas, así que nunca se ven a medio cortar. */
const TRAMO_PESTANAS = 0.25;

/** Cuánto entran las pestañas desde el borde recortado cuando las enfoca el teclado con el panel
 *  estrecho, como la X, que va a 24 de su esquina (H14). */
const AIRE_PESTANAS_ENFOCADAS = 8;

/** Si un clic en una pestaña o en la X lleva el scroll lejos, el índice se queda en la vista de
 *  partida o de llegada mientras el desplazamiento suave pasa por las de en medio; sin esto, ir
 *  de la 1 a la 3 hacía parpadear la 2. Este es el tope por si el desplazamiento se interrumpe y
 *  nunca llega. */
const ESPERA_MAX_MS = 1600;

/** Las teclas con las que el navegador desplaza la página. Con cualquiera de ellas quien lee toma
 *  el control y la vista vuelve a seguir al scroll, igual que con la rueda o el dedo: antes una
 *  flecha a medio camino dejaba la pestaña y el scroll en desacuerdo sin límite de tiempo
 *  (6 de octubre de 2026, H29). */
const TECLAS_QUE_DESPLAZAN = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/** El recorrido solo existe en escritorio con altura suficiente y sin movimiento reducido. En
 *  cualquier otro caso el contenedor va a 12 columnas, sin fijar, y las pestañas cambian con un
 *  toque (Alejandro, 6 de octubre de 2026, decisión «e»). 640 es el piso: debajo, la tarjeta no
 *  cabe en el panel. Encima, `useModoFijado` además la mide, porque con el espaciado de texto de
 *  WCAG 1.4.12 la tarjeta crece y el panel fijo, de alto fijo, la cortaba arriba y abajo (6 de
 *  octubre de 2026, H11). */
const CONSULTA_FIJADO = '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';

/** Lo que mide el panel fijo: es `--spacing-rd-accesos-panel` de `index.css` (`100svh - 6rem`).
 *  Si cambia uno, cambia el otro. */
function altoDelPanelFijo(): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return window.innerHeight - 6 * rem;
}

/** Si la tarjeta cabe en el panel fijo. Mide lo mismo con recorrido y sin él (su ancho no depende
 *  del modo), así que la cuenta no cambia al cambiar de modo y no hay vaivén entre uno y otro.
 *  Desde el 6 de octubre de 2026 las pestañas van a su izquierda, fuera de ella y sin sumarle
 *  alto (la caja `rd-accesos-ancho` mide lo que la tarjeta), así que basta con medirla. */
function cabeEnElPanel(p: HTMLElement | null): boolean {
  const tarjeta = p?.querySelector<HTMLElement>('.rd-accesos-ancho');
  if (!tarjeta) return true;
  return tarjeta.offsetHeight <= altoDelPanelFijo();
}

/** Si va el recorrido. `antesDeCambiar` corre justo antes de que el modo cambie con la página
 *  abierta, para que `useRecorrido` guarde dónde iba quien lee. */
export function useModoFijado(panel: RefObject<HTMLElement | null>, antesDeCambiar: () => void): boolean {
  const [si, setSi] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(CONSULTA_FIJADO).matches);
  const aviso = useRef(antesDeCambiar);

  useEffect(() => {
    aviso.current = antesDeCambiar;
  }, [antesDeCambiar]);

  /* `useLayoutEffect`: si al cargar la tarjeta no cabe, el cambio llega antes del primer pintado
     y no se ve el panel fijo un cuadro. Se vuelve a mirar al cambiar la consulta, el alto de la
     ventana o el de la tarjeta (fuentes que cargan, espaciado del usuario). */
  useLayoutEffect(() => {
    const mq = window.matchMedia?.(CONSULTA_FIJADO);
    if (!mq) return;
    let actual: boolean | null = null;
    const evaluar = () => {
      const nuevo = mq.matches && cabeEnElPanel(panel.current);
      if (nuevo === actual) return;
      if (actual !== null) aviso.current();
      actual = nuevo;
      setSi(nuevo);
    };
    evaluar();
    mq.addEventListener('change', evaluar);
    window.addEventListener('resize', evaluar);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(evaluar);
    const tarjeta = panel.current?.querySelector('.rd-accesos-ancho');
    if (tarjeta) ro?.observe(tarjeta);
    return () => {
      mq.removeEventListener('change', evaluar);
      window.removeEventListener('resize', evaluar);
      ro?.disconnect();
    };
  }, [panel]);

  return si;
}

interface Geometria {
  /** Donde empieza a abrir: el scroll en el que el panel asoma, o 0 si ya asoma al cargar. */
  s0: number;
  /** Donde termina de abrir y se fija. */
  s1: number;
  /** Donde se suelta. */
  s2: number;
  /** La distancia de la entrada, que es también la de la salida. */
  entrada: number;
  /** Lo que dura fijo: el alto de la sección menos el del panel. */
  recorrido: number;
  /** Cuánto se recorta de cada lado con el panel cerrado: la mitad de 12 columnas menos 8. */
  lado: number;
  /** Cuánto se recorta arriba, y lo mismo abajo, con el panel cerrado. */
  vertical: number;
  /** El margen entre la tarjeta y el borde del panel abierto, a los lados y arriba. */
  holgura: number;
  aire: number;
  /** El radio del panel leído del CSS. */
  radioPanel: number;
  /** El `top` del panel fijo, leído del CSS para no tener el número en dos sitios. */
  tope: number;
  /** El alto de la sección, para saber dónde queda su borde de abajo sin medir en cada cuadro. */
  altoSeccion: number;
  /** Dónde empiezan las pestañas desde el borde izquierdo del panel, sin transformaciones: con el
   *  recorte por encima de esto quedan fuera de lo que se ve. */
  pestanas: number;
  /** El perímetro del contorno de la tarjeta para la línea de avance. */
  contorno: number;
}

/** Dónde iba quien lee cuando el modo cambió con la página abierta (al cruzar 1024 de ancho o 640
 *  de alto, con zoom o al cambiar el movimiento reducido). La sección cambia de alto en unos 2400
 *  y, sin esto, el scroll se quedaba en el mismo píxel y caía en otra sección (6 de octubre de
 *  2026, H28). */
type Lugar =
  /** Con recorrido: en qué tramo iba y dónde quedaba en la ventana el borde de abajo de la sección. */
  | { modo: 'fijado'; tramo: 'antes' | 'dentro' | 'despues'; abajo: number; tope: number }
  /** Sin recorrido: dónde quedaban en la ventana los dos bordes de la sección. */
  | { modo: 'libre'; arriba: number; abajo: number };

const limitar = (x: number) => Math.min(1, Math.max(0, x));

/** La posición de un elemento en el documento por `offsetTop`, que no suma transformaciones: la
 *  sección 3 entra con `rd-revela`, que la baja 18 px hasta que aparece, y con
 *  `getBoundingClientRect` la X la dejaba 18 px corta. */
function topeEnDocumento(el: HTMLElement): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
}

/** Lo mismo en horizontal y hasta un ancestro: dónde queda un elemento dentro del panel sin contar
 *  el deslizamiento con el que entran las pestañas. */
function izquierdaEn(el: HTMLElement, ancestro: HTMLElement): number {
  let x = 0;
  for (let n: HTMLElement | null = el; n && n !== ancestro; n = n.offsetParent as HTMLElement | null) x += n.offsetLeft;
  return x;
}

/** El contorno de la tarjeta para la línea de avance, empezando en la mitad de la zona inferior. */
function contornoDesdeAbajo(w: number, h: number, radio: number): { d: string; largo: number } {
  const r = Math.max(0, Math.min(radio, w / 2, h / 2));
  const a = (x: number, y: number) => `A${r} ${r} 0 0 1 ${x} ${y}`;
  const d = `M${w / 2} ${h}H${r}${a(0, h - r)}V${r}${a(r, 0)}H${w - r}${a(w, r)}V${h - r}${a(w - r, h)}Z`;
  return { d, largo: 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r };
}

export function useRecorrido({
  seccion,
  fijo,
  panel,
  vistas,
  activa,
  alCambiar,
}: {
  seccion: RefObject<HTMLElement | null>;
  fijo: RefObject<HTMLElement | null>;
  panel: RefObject<HTMLElement | null>;
  vistas: number;
  activa: number;
  alCambiar: (indice: number) => void;
}) {
  const geo = useRef<Geometria | null>(null);
  const forzada = useRef<{ indice: number; objetivo: number; hasta: number } | null>(null);
  const ultimo = useRef(-1);
  const avisar = useRef(alCambiar);
  const vistaActiva = useRef(activa);
  /* Dónde va quien lee, al día en cada cuadro del recorrido (solo con recorrido), y la copia que
     se guarda justo antes de que el modo cambie. */
  const registro = useRef<Lugar | null>(null);
  const lugar = useRef<Lugar | null>(null);

  useEffect(() => {
    avisar.current = alCambiar;
    vistaActiva.current = activa;
  }, [alCambiar, activa]);

  /* Con recorrido vale el último cuadro pintado: a esta hora la ventana ya puede tener otro tamaño
     y medir ahora daría un tramo que nadie vio. Sin recorrido no hay cuadros: se mide la sección. */
  const recordar = useCallback(() => {
    if (registro.current) {
      lugar.current = registro.current;
      return;
    }
    const s = seccion.current;
    if (!s) return;
    const r = s.getBoundingClientRect();
    lugar.current = { modo: 'libre', arriba: r.top, abajo: r.bottom };
  }, [seccion]);

  const activo = useModoFijado(panel, recordar);

  /* `useLayoutEffect` y no `useEffect`: el primer recorte tiene que estar puesto antes de que el
     navegador pinte. Con `useEffect` la página cargaba con el panel a 12 columnas y en el cuadro
     siguiente saltaba a 8. */
  useLayoutEffect(() => {
    const s = seccion.current;

    /* Sin recorrido. Si se acaba de salir de él con quien lee dentro de la sección, se le deja
       donde iba: con el panel fijo, la sección arriba bajo el header; en la salida o más abajo,
       el borde de abajo de la sección donde estaba, que deja lo que sigue en su sitio (H28). */
    if (!activo) {
      const l = lugar.current;
      lugar.current = null;
      if (s && l?.modo === 'fijado' && l.tramo !== 'antes') {
        const r = s.getBoundingClientRect();
        const y = window.scrollY + (l.tramo === 'dentro' ? r.top - l.tope : r.bottom - l.abajo);
        window.scrollTo({ top: Math.round(y), behavior: 'instant' });
      }
      return;
    }

    const f = fijo.current;
    const p = panel.current;
    if (!s || !f || !p) return;

    let raf = 0;
    let vence = 0;
    /* Lo que se escribe además del recorte, cada cosa en el nodo que la usa (`LandingAccesos`): la
       columna de pestañas, la línea de avance alrededor de la tarjeta (`data-avance`, sobre su
       riel) y lo que aparece al abrirse el panel (`data-abre`, la línea y su riel; las pestañas
       también). Montados mientras hay recorrido, así los nodos no cambian mientras dura el
       efecto. */
    const pestanas = p.querySelector<HTMLElement>('[role="tablist"]');
    const modulo = p.querySelector<HTMLElement>('.rd-accesos-ancho');
    const avance = p.querySelector<SVGPathElement>('[data-avance]');
    const trazos = Array.from(avance?.ownerSVGElement?.querySelectorAll('path') ?? []);
    const abren: (HTMLElement | SVGElement)[] = Array.from(p.querySelectorAll<SVGElement>('[data-abre]'));
    if (pestanas) abren.push(pestanas);

    const medir = (): Geometria => {
      /* El recogido sale del aire alrededor de la tarjeta, que no depende de dónde esté la
         sección, y se escribe antes de medirla porque su margen depende de él (H6). La caja
         `rd-accesos-ancho` mide lo que la tarjeta y va centrada en el panel: el aire de arriba es
         el de abajo. */
      const caja = p.querySelector<HTMLElement>('.rd-accesos-ancho')?.getBoundingClientRect();
      const marco = p.getBoundingClientRect();
      const lado = p.offsetWidth / 6 + HUECO / 6;
      const holgura = caja ? (marco.width - caja.width) / 2 : 0;
      const aire = caja ? caja.top - marco.top : 0;
      const margenCerrado = Math.max(0, holgura - lado);
      const vertical = Math.max(0, aire - margenCerrado);
      s.style.setProperty('--rd-vertical', `${vertical.toFixed(1)}px`);

      /* El contorno de la tarjeta para la línea y su riel, en píxeles.
         IMPORTANTE: Usamos offsetWidth y offsetHeight (layout pixels) de la tarjeta y NO
         getBoundingClientRect(), porque getBoundingClientRect() mide las dimensiones
         escaladas por CSS transform scale(var(--rd-escala)) y desalinearía el trazo. */
      const tarjeta = avance?.ownerSVGElement?.parentElement;
      const radioTarjeta = tarjeta ? parseFloat(getComputedStyle(tarjeta).borderTopLeftRadius) || 0 : 0;
      let contorno = 0;
      if (tarjeta && avance) {
        const w = tarjeta.offsetWidth;
        const h = tarjeta.offsetHeight;
        if (w > 0 && h > 0) {
          const c = contornoDesdeAbajo(w, h, radioTarjeta);
          contorno = Math.round(c.largo * 100) / 100;
          trazos.forEach((t) => t.setAttribute('d', c.d));
          avance.style.setProperty('stroke-dasharray', `${contorno}px ${contorno}px`);
        }
      }

      const alto = window.innerHeight;
      const tope = parseFloat(getComputedStyle(f).top) || 0;
      const arriba = topeEnDocumento(s);
      const s1 = arriba - tope;
      const s0 = Math.max(0, arriba - alto);
      const recorrido = Math.max(1, s.offsetHeight - f.offsetHeight);
      return {
        s0,
        s1,
        s2: s1 + recorrido,
        entrada: Math.max(1, s1 - s0),
        recorrido,
        lado,
        vertical,
        holgura,
        aire,
        radioPanel: parseFloat(getComputedStyle(p).getPropertyValue('--rd-accesos-radio')) || 0,
        tope,
        altoSeccion: s.offsetHeight,
        pestanas: pestanas ? izquierdaEn(pestanas, p) : 0,
        contorno,
      };
    };

    /* El índice de la vista que toca a una altura de scroll. */
    const indiceEn = (g: Geometria, y: number) => Math.min(vistas - 1, Math.floor(limitar((y - g.s1) / g.recorrido) * vistas));

    const pintar = () => {
      raf = 0;
      if (!geo.current) geo.current = medir();
      const g = geo.current;
      const y = window.scrollY;

      const saliendo = y > g.s2;
      let cerrado = 0;
      if (y < g.s1) {
        // Entrada: de 1 (lejos abajo) a 0 (alcanza posición fija s1)
        cerrado = limitar(1 - (y - g.s0) / g.entrada);
      } else if (y > g.s2) {
        // Salida: de 0 a 1 alejándose hacia la sección siguiente
        cerrado = limitar((y - g.s2) / (window.innerHeight * 0.55));
      }

      // Curva sinusoidal de apertura
      const abierto = 1 - cerrado;
      const suave = Math.sin((abierto * Math.PI) / 2);

      // Micro-dinamismo de scroll entre vistas
      let enTramos = 0;
      let lleno = 0;
      if (y >= g.s1 && y <= g.s2) {
        enTramos = ((y - g.s1) / g.recorrido) * vistas;
        const indiceActual = indiceEn(g, y);
        lleno = forzada.current ? 0 : limitar(enTramos - indiceActual);
      }

      // Respiración de escala (+1.4% a medio tramo) para que el scroll tenga feedback reactivo constante
      const respiracion = y >= g.s1 && y <= g.s2 ? Math.sin(lleno * Math.PI) * 0.014 : 0;

      // El zoom y expansión del módulo: inicia compacto al 86% y se expande al 100% al llegar a su posición
      const escala = (0.86 + 0.14 * suave + respiracion).toFixed(3);
      const desplazamiento = `${(saliendo ? -28 * cerrado : 36 * cerrado).toFixed(1)}px`;
      const opacidad = (0.55 + 0.45 * suave).toFixed(2);

      if (modulo) {
        modulo.style.setProperty('--rd-escala', escala);
        modulo.style.setProperty('--rd-desplazamiento', desplazamiento);
        modulo.style.setProperty('--rd-opacidad', opacidad);
      }

      // La línea de avance alrededor de la tarjeta
      if (g.contorno > 0) {
        avance?.style.setProperty('stroke-dashoffset', `${(g.contorno * (1 - lleno)).toFixed(2)}px`);
      }

      p.style.setProperty('--rd-lado', '0px');
      p.style.setProperty('--rd-arriba', '0px');
      p.style.setProperty('--rd-abajo', '0px');
      p.style.setProperty('--rd-radio-menos', '0px');
      p.toggleAttribute('data-abierto', true);

      abren.forEach((el) => el.style.setProperty('--rd-abre', '1'));
      if (pestanas) {
        pestanas.style.setProperty('--rd-empuje', '0px');
        pestanas.removeAttribute('data-oculta');
      }

      registro.current = {
        modo: 'fijado',
        tramo: y < g.s1 ? 'antes' : saliendo ? 'despues' : 'dentro',
        abajo: g.s1 + g.tope + g.altoSeccion - y,
        tope: g.tope,
      };

      let indice = indiceEn(g, y);
      const fz = forzada.current;
      if (fz) {
        const ahora = performance.now();
        if (Math.abs(y - fz.objetivo) < 3 || ahora > fz.hasta) forzada.current = null;
        else {
          indice = fz.indice;
          /* El tope solo se mira aquí, que corre por evento de scroll: si el desplazamiento se
             corta y no llega otro, nunca se miraría. Un temporizador vuelve a pintar cuando vence
             (H29). */
          clearTimeout(vence);
          vence = window.setTimeout(pedir, fz.hasta - ahora + 50);
        }
      }
      if (indice !== ultimo.current) {
        ultimo.current = indice;
        avisar.current(indice);
      }
    };

    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(pintar);
    };
    const remedir = () => {
      geo.current = null;
      pedir();
    };
    /* La rueda, el dedo, un clic o una tecla de desplazamiento devuelven el control: si alguien
       hizo clic en una pestaña y a medio camino decide seguir por su cuenta, la vista vuelve a
       seguir al scroll. El clic y la tecla en fase de captura, antes que los de las pestañas y la
       X, que vuelven a fijar la vista enseguida (H29). */
    const soltar = () => {
      forzada.current = null;
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (TECLAS_QUE_DESPLAZAN.has(e.key)) soltar();
    };
    /* Cuando el desplazamiento termina, llegue o no, la vista vuelve a seguir al scroll (H29). */
    const alTerminar = () => {
      if (!forzada.current) return;
      forzada.current = null;
      pedir();
    };

    /* Si se acaba de entrar en el recorrido con el panel cruzando la mitad de la ventana y el
       scroll pide otra vista que la abierta, se lleva a quien lee a la mitad del tramo de la suya;
       si ya había pasado el panel, el borde de abajo de la sección queda donde estaba; si aún no
       llegaba, nada (H28). Antes de pintar, para no avisar de una vista que no toca. */
    const recolocar = (g: Geometria) => {
      const l = lugar.current;
      lugar.current = null;
      const medio = window.innerHeight / 2;
      if (l?.modo !== 'libre' || l.arriba >= medio) return;
      if (l.abajo >= medio && indiceEn(g, window.scrollY) === vistaActiva.current) return;
      const y =
        l.abajo >= medio
          ? g.s1 + ((vistaActiva.current + 0.5) * g.recorrido) / vistas
          : g.s1 + g.tope + g.altoSeccion - l.abajo;
      window.scrollTo({ top: Math.round(y), behavior: 'instant' });
    };

    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('scrollend', alTerminar);
    window.addEventListener('resize', remedir);
    window.addEventListener('wheel', soltar, { passive: true });
    window.addEventListener('touchstart', soltar, { passive: true });
    window.addEventListener('pointerdown', soltar, { capture: true, passive: true });
    window.addEventListener('keydown', alTeclear, { capture: true });
    /* El cuerpo cambia de alto cuando cargan las fuentes o las fotos del hero, y eso mueve la
       sección: hay que volver a medir aunque la ventana no cambie. */
    const ro = new ResizeObserver(remedir);
    ro.observe(s);
    ro.observe(document.body);
    const tarjeta = avance?.ownerSVGElement?.parentElement;
    if (tarjeta) ro.observe(tarjeta);
    geo.current = medir();
    recolocar(geo.current);
    pintar();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(vence);
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('scrollend', alTerminar);
      window.removeEventListener('resize', remedir);
      window.removeEventListener('wheel', soltar);
      window.removeEventListener('touchstart', soltar);
      window.removeEventListener('pointerdown', soltar, { capture: true });
      window.removeEventListener('keydown', alTeclear, { capture: true });
      ro.disconnect();
      geo.current = null;
      forzada.current = null;
      registro.current = null;
      ultimo.current = -1;
      p.style.removeProperty('--rd-lado');
      p.style.removeProperty('--rd-arriba');
      p.style.removeProperty('--rd-abajo');
      p.style.removeProperty('--rd-radio-menos');
      p.removeAttribute('data-abierto');
      abren.forEach((el) => el.style.removeProperty('--rd-abre'));
      pestanas?.style.removeProperty('--rd-empuje');
      pestanas?.removeAttribute('data-oculta');
      modulo?.style.removeProperty('--rd-escala');
      modulo?.style.removeProperty('--rd-desplazamiento');
      modulo?.style.removeProperty('--rd-opacidad');
      s.style.removeProperty('--rd-vertical');
      avance?.style.removeProperty('stroke-dashoffset');
      avance?.style.removeProperty('stroke-dasharray');
    };
  }, [activo, seccion, fijo, panel, vistas]);

  /** Cambia a la vista indicada manteniendo la vista seleccionada sin forzar scroll ni desfasar el cursor */
  const irA = useCallback(
    (indice: number): boolean => {
      ultimo.current = indice;
      forzada.current = { indice, objetivo: window.scrollY, hasta: performance.now() + 2000 };
      avisar.current(indice);
      return true;
    },
    [],
  );

  return { fijado: activo, irA };
}
