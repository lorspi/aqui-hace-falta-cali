import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Tarjeta } from '../../../components/ui/Tarjeta';
import type { Publicacion, TipoPublicacion } from '../../../types/publicacion';
import { azar, espiral, ovalo, pasarPor, temblar, trazar } from '../trazoAMano';
import { useConsulta } from '../useConsulta';
import { useCarrusel } from '../useCarrusel';

/**
 * «El radar en vivo», la sección 4 (Alejandro, 7 de octubre de 2026: sobre una primera versión
 * que solo le puso un mapa de fondo a la marquesina, «solo "embelleciste" con elementos visuales
 * que hicieron que se viera algo cargado. pero la idea es que sea una experiencia wow a lo largo
 * de toda la landing. quiero que idees algo similar en cuanto a "innovación" como se hizo en el 2
 * y 3»; y sobre la propuesta, «hagale radar en vivo»).
 *
 * La marca se llama Radar y la sección dice «minuto a minuto»: la sección es un radar barriendo el
 * territorio. Las necesidades (coral) y las ofertas (navy) son ecos; el haz gira y, al pasar por
 * encima de un eco, lo enciende, y el eco se va apagando despacio, como en una pantalla de radar.
 *
 * - EL HAZ da una vuelta cada 10 s (`VUELTA_MS`). Lo mueve un cuadro de animación que gira una capa
 *   ya pintada (la tarjeta gráfica la rota sin repintar) y enciende los ecos; se detiene fuera de la
 *   pantalla.
 * - EL CURSOR. Al pasar el cursor por un eco —o al enfocarlo con el teclado, o al tocarlo—, el haz
 *   va hacia él y se queda, y la baraja lo trae al frente. Los ecos llevan `data-cursor-eco`, y el
 *   cursor líquido de la landing late mientras está sobre uno (ver `VentanaLiquida`): el cursor es
 *   otro radar que detecta.
 * - LA ENTRADA. Al llegar a la sección los anillos se dibujan a pulso de dentro hacia fuera, como
 *   el sello de la sección 3, y el haz arranca.
 * - En el centro, un punto amarillo que late: el lugar de quien mira.
 * - El eco que está al frente de la baraja lleva en el radar un anillo amarillo quieto y otro que
 *   late desde él, así se ve cuál es sin buscarlo. Un rato hubo además una línea a pulso del eco a
 *   la tarjeta, y a Alejandro le pareció «rarísimo como se hilan las cards y el dot del radar»
 *   (7 de octubre de 2026): se quitó.
 *
 * LA BARAJA
 * Al lado del radar van las publicaciones como una baraja de tarjetas físicas (Alejandro, 7 de
 * octubre de 2026: «dejaría es como las cards colapsadas como en una baraja, y que cuando se
 * muestra en el radar una nueva, esa que estaba al frente pasa para detrás […] que sean como cards
 * más físicas. también me parece importante que las cards sean las que se usan en la herramienta
 * app v.2»). Antes fue una lectura propia con su registro, que vio «muy mediocre».
 * - Cada tarjeta es la `Tarjeta` de la herramienta, tal cual, en su tipografía (Inter: la envuelve
 *   `.rd-herramienta`). Sus acciones llevan a esa publicación en la Radar (`onAbrir`).
 * - Detrás de la del frente asoman tres hojas, cada una un poco más arriba, más pequeña, más
 *   oscura y algo girada (`.rd-mazo-hoja-*`). Asoman solo su margen de arriba, que en la tarjeta es
 *   papel en blanco, así que no hace falta saber qué tarjeta es cada una.
 * - Cuando el haz trae un eco nuevo, la tarjeta del frente se levanta, se mete detrás de la baraja
 *   y baja hasta el fondo (`.rd-mazo-sale`), mientras la nueva avanza desde la primera hoja
 *   (`.rd-mazo-entra`). El cambio llega con el eco que el haz acaba de pasar, pero no antes de 5 s
 *   (`PERMANENCIA_MS`): con seis ecos el haz pasa uno cada segundo y medio, y una tarjeta que
 *   cambiara a ese ritmo no se alcanzaría a leer.
 * - Con el cursor o el foco sobre la baraja, la del frente se queda: no se baraja algo que alguien
 *   está a punto de tocar.
 * - Todas las tarjetas están montadas en la misma celda, solo la del frente visible: la baraja
 *   mide lo que la más alta y no salta al cambiar.
 * - Solo la baraja: debajo hubo un rato un registro con las tres anteriores, y Alejandro lo quitó
 *   (7 de octubre de 2026: «quitalo. deja solo las cards»).
 *
 * CON EL DEDO (7 de octubre de 2026, la lógica del teléfono: Alejandro, «muchas de las
 * animaciones y comportamientos con componentes solo sirven en la logica desktop»). Hasta ese día
 * todo colgaba del cursor: el dedo que tocaba un eco dejaba el haz clavado ahí hasta tocar otra
 * cosa, y en el teléfono la tarjeta mide casi una pantalla, así que el radar y la baraja no se
 * ven juntos y la tarjeta cambiaba mientras se leía.
 * - El cursor y el dedo van por separado (`pointerType`). El cursor hace lo de siempre; el dedo que
 *   toca un eco trae su tarjeta y el haz se queda en él un rato (`TOQUE_MS`), luego sigue girando.
 *   El foco del teclado elige el eco solo cuando es del teclado (`:focus-visible`): el del toque
 *   no cuenta.
 * - La baraja se arrastra con el dedo: la del frente va de lado y, pasado el umbral, se va al
 *   fondo por ese lado y trae la siguiente, y el haz va a su eco. El eje y el umbral son los del
 *   carrusel de la hoja del pin de la herramienta (`HojaPin`: 8 y 48 px, `touch-pan-y`). Debajo,
 *   una pista lo dice a quien usa el dedo (`pointer-coarse`). Con el dedo, la baraja sigue al haz
 *   como con el cursor; tocarla la deja quieta un rato (`SOSTEN_MS`).
 *
 * EL CARRUSEL. Con una sola columna (menos de 1024) no hay baraja: es un carrusel de las mismas
 * tarjetas, como el de la sección 2 (`useCarrusel`, tres columnas y media por tarjeta). La baraja
 * se probó esa tarde en el teléfono —arrastrada a mano, cada tarjeta con su alto— y Alejandro: «las
 * cards compiladas tampoco funcionan bien. carrusel mejor».
 * - La tarjeta que se ve es la del frente: el haz va a su eco un rato (`TOQUE_MS`) y su eco lleva el
 *   anillo amarillo. Tocar un eco desliza el carrusel hasta su tarjeta. El haz no la cambia solo:
 *   la tarjeta mide casi una pantalla, y cambiaría mientras se lee.
 * - Todas del alto de la más alta, con las acciones abajo. Un rato cada una tuvo su alto, para no
 *   dejar blanco dentro de las cortas, y Alejandro: «dejalas de la misma altura, como la 1ra. asi
 *   queden espacios en blanco pero ese salto de tamaños afecta dado que el botón queda flotando
 *   debajo» (el «Ver en el mapa» de la sección quedaba lejos de las cortas).
 *
 * EL CONTRASTE. La línea del radar va en la tinta de encima del azul, blanco entero (Alejandro, 7
 * de octubre de 2026: «en la sección del radar las lineas no hacen buen contraste»). Era la línea de
 * la página (`rd-noche-linea`), blanco al 26 %: 1,45:1 sobre el azul claro de la malla (#6A86DA);
 * en blanco, 3,5:1, por encima del 3:1 de un gráfico. En el teléfono va además más gruesa
 * (`max-sm:stroke-3`): el dibujo se encoge con el radar, y a 350 px la línea de 1,5 quedaba en 0,9.
 *
 * Todo el dibujo es a pulso (`trazoAMano`). Los ecos se reparten en la vuelta por orden, con un
 * poco de azar en el ángulo y en la distancia sacado de su `id`, así cada eco cae siempre en el
 * mismo sitio.
 *
 * El radar es un grupo con nombre (`etiqueta`), y cada eco es un botón con el tipo, el título y el
 * lugar de su publicación. Con movimiento reducido el haz no gira: apunta al eco del frente, la
 * baraja cambia sin moverse, y los ecos se eligen igual con el cursor, el dedo o el teclado.
 */

const LADO = 600;
const C = LADO / 2;
const VUELTA_MS = 10000;
const PERMANENCIA_MS = 5000;
/* Cuánto dura el brillo de un eco tras pasar el haz: a los 110° de vuelta queda en un tercio. */
const RASTRO = 110;
/* El destello: los primeros 50° tras pasar el haz, el anillo del eco crece y se apaga. */
const DESTELLO = 50;
/* Las hojas que asoman detrás de la tarjeta del frente. */
const HOJAS = [1, 2, 3];
const CONSULTA_REDUCIDO = '(prefers-reduced-motion: reduce)';
const CONSULTA_COLUMNAS = '(min-width: 1024px)';
/* Con el dedo (ver CON EL DEDO): lo que el haz se queda en el eco tocado y lo que se queda la del
   frente al tocar la baraja; y el eje y el umbral del arrastre, los de `HojaPin`. */
const TOQUE_MS = 2500;
const SOSTEN_MS = 8000;
const UMBRAL_EJE = 8;
const UMBRAL_CAMBIO = 48;

const al = azar(83);
/* El radar, en una sola línea (Alejandro, 7 de octubre de 2026: «lo mismo con el mapa del radar
   posterior... siento que tiene mucha oportunidad»; antes eran cuatro anillos y una cruz sueltos).
   Nace en el centro y sale en espiral, tres vueltas y media, que se leen como los anillos; al
   llegar al borde da una vuelta entera a la misma distancia, que cierra el anillo de afuera; y de
   ahí cruza por el centro de arriba abajo, sigue un cuarto de vuelta por el borde y cruza de lado a
   lado. El temblor es uno solo para toda la línea.
   El anillo de afuera también recorta el haz (`BORDE`, normalizado al lienzo): sale de los mismos
   puntos ya temblados, así el haz termina justo en la línea dibujada y no en un círculo perfecto
   (Alejandro: «el halo de luz del radar que da el giro es "limpio" y no sigue como la linea de
   bordeador real del dibujo del radar»). */
const R_AFUERA = 278;
const ESPIRAL = espiral({ x: C, y: C }, 26, R_AFUERA, 3.5, 90, 1, 64);
const ANILLO = espiral({ x: C, y: C }, R_AFUERA, R_AFUERA, 1, 90 + 3.5 * 360, 1, 96).slice(1);
const CRUCES = pasarPor(
  [
    { x: C, y: C - R_AFUERA },
    { x: C + 2, y: C - 120 },
    { x: C - 2, y: C + 120 },
    { x: C, y: C + R_AFUERA },
    ...[100, 120, 140, 160].map((g) => ({ x: C + R_AFUERA * Math.cos((g * Math.PI) / 180), y: C + R_AFUERA * Math.sin((g * Math.PI) / 180) })),
    { x: C - R_AFUERA, y: C },
    { x: C - 120, y: C + 2 },
    { x: C + 120, y: C - 2 },
    { x: C + R_AFUERA, y: C },
  ],
  10,
).slice(1);
const RADAR_PUNTOS = temblar([...ESPIRAL, ...ANILLO, ...CRUCES], 1.6, al);
const RADAR = trazar(RADAR_PUNTOS);
const BORDE = RADAR_PUNTOS.slice(ESPIRAL.length, ESPIRAL.length + ANILLO.length)
  .map((p) => `${(p.x / LADO).toFixed(4)},${(p.y / LADO).toFixed(4)}`)
  .join(' ');
/* El borde del haz: una raya a pulso del centro hacia arriba, más larga que el radio; el recorte
   la corta en el anillo dibujado. */
const RAYA = trazar(temblar(pasarPor([{ x: C, y: C }, { x: C, y: C - 150 }, { x: C, y: -10 }], 20), 1.2, azar(61)));
const NUCLEO = trazar(ovalo({ x: 0, y: 0 }, 7, 7, al, 28, 1.3), true);
const ONDA = trazar(ovalo({ x: 0, y: 0 }, 12, 12, al, 40, 1.5), true);
const ELEGIDO = trazar(ovalo({ x: 0, y: 0 }, 19, 19, al, 48, 1.4), true);
const CENTRO_ONDA = trazar(ovalo({ x: 0, y: 0 }, 8, 8, al, 32, 1.4), true);

const COLOR = {
  necesidad: { trazo: 'stroke-rd-coral', relleno: 'fill-rd-coral' },
  oferta: { trazo: 'stroke-rd-navy-claro', relleno: 'fill-rd-navy-claro' },
};

const huella = (s: string) => {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

/* Dónde cae cada eco: repartidos en la vuelta por orden, con algo de azar sacado de su `id`. */
const colocar = (publicaciones: Publicacion[]) =>
  publicaciones.map((p, k) => {
    const h = huella(p.id);
    const angulo = ((((k * 360) / publicaciones.length + (h % 30) - 15) % 360) + 360) % 360;
    const radio = 105 + (Math.floor(h / 31) % 150);
    const a = (angulo * Math.PI) / 180;
    return { p, angulo, x: C + radio * Math.sin(a), y: C - radio * Math.cos(a) };
  });

export const RadarEnVivo: React.FC<{
  publicaciones: Publicacion[];
  /** El nombre del radar para el lector de pantalla. */
  etiqueta: string;
  /** El nombre de cada tipo, para el nombre de cada eco. */
  rotulos: Record<TipoPublicacion, string>;
  /** Lo que hacen las acciones de una tarjeta: abrir esa publicación en la herramienta. */
  onAbrir: (id: string) => void;
  /** La pista de debajo de la baraja, para quien usa el dedo: que se pasa arrastrándola. */
  pista: string;
}> = ({ publicaciones, etiqueta, rotulos, onAbrir, pista }) => {
  const puestos = useMemo(() => colocar(publicaciones), [publicaciones]);
  const reducido = useConsulta(CONSULTA_REDUCIDO, false);
  /* Con dos columnas la baraja sigue al haz; con una se pasa a mano. También para el cuadro. */
  const columnas = useConsulta(CONSULTA_COLUMNAS, true);
  const sigue = useRef(columnas);
  useEffect(() => {
    sigue.current = columnas;
  }, [columnas]);
  const caja = useRef<HTMLDivElement>(null);
  /* El recorte del haz: un id por radar, que `useId` trae con dos puntos y `url()` los acepta. */
  const borde = `radar-borde-${useId().replace(/:/g, '')}`;
  const haz = useRef<HTMLDivElement>(null);
  const nucleos = useRef<(SVGPathElement | null)[]>([]);
  const ondas = useRef<(SVGPathElement | null)[]>([]);
  const [dibujado, setDibujado] = useState(false);
  /* La publicación al frente de la baraja. */
  const [indice, setIndice] = useState(0);
  const [foco, setFoco] = useState<number | null>(null);
  /* Las tarjetas que van saliendo del frente hacia el fondo, cada una con su vuelta. */
  const [saliendo, setSaliendo] = useState<{ i: number; n: number; dx: number | null }[]>([]);

  /* El eco elegido, también para el cuadro de animación, que no pasa por React. */
  const focoVivo = useRef<number | null>(null);
  useEffect(() => {
    focoVivo.current = foco;
  }, [foco]);

  const actual = Math.min(indice, Math.max(0, puestos.length - 1));
  const elegido = puestos[actual];

  const leer = (i: number) => setIndice(i);

  /* Cuando cambia la del frente, la que estaba se va al fondo. Antes de pintar, para que no haya
     un cuadro sin ella. Si la mandó el dedo, sale desde donde la soltó (`lanzada`). */
  const frente = useRef<number | null>(null);
  const vueltas = useRef(0);
  const lanzada = useRef<number | null>(null);
  useLayoutEffect(() => {
    const antes = frente.current;
    frente.current = actual;
    const dx = lanzada.current;
    lanzada.current = null;
    /* Sin baraja (el carrusel del teléfono) no hay nada que mandar al fondo. */
    if (antes === null || antes === actual || reducido || !columnas) return;
    vueltas.current += 1;
    const n = vueltas.current;
    setSaliendo((s) => [...s, { i: antes, n, dx }]);
  }, [actual, reducido, columnas]);

  /* La entrada y el haz: se dibuja al llegar y gira mientras se ve. */
  useEffect(() => {
    const el = caja.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDibujado(true);
      return;
    }
    let raf = 0;
    let ultimo = 0;
    let angulo = 0;
    let cambio = 0;
    const antes = puestos.map(() => 360);

    const cuadro = (ahora: number) => {
      const dt = ultimo ? Math.min(50, ahora - ultimo) : 16;
      ultimo = ahora;
      const f = focoVivo.current;
      if (f === null || !puestos[f]) {
        angulo = (angulo + (360 * dt) / VUELTA_MS) % 360;
      } else {
        /* Hacia el eco elegido por el camino más corto, sin pasarse. */
        const falta = ((puestos[f].angulo - angulo + 540) % 360) - 180;
        angulo = (angulo + falta * (1 - Math.pow(0.88, dt / 16.7)) + 360) % 360;
        cambio = ahora;
      }
      if (haz.current) haz.current.style.transform = `rotate(${angulo.toFixed(2)}deg)`;

      puestos.forEach((e, i) => {
        const pasado = (angulo - e.angulo + 360) % 360;
        const brillo = i === f ? 1 : Math.exp(-pasado / RASTRO);
        const n = nucleos.current[i];
        if (n) n.style.opacity = (0.3 + 0.7 * brillo).toFixed(3);
        const o = ondas.current[i];
        if (o) {
          const d = f === null && pasado < DESTELLO ? pasado / DESTELLO : 1;
          o.style.opacity = ((1 - d) * 0.9).toFixed(3);
          o.style.transform = `scale(${(1 + d * 1.6).toFixed(3)})`;
        }
        /* El haz acaba de pasar por este eco: pasa al frente, si la anterior ya se leyó. Con una
           columna no: la baraja se pasa a mano. */
        if (sigue.current && f === null && antes[i] > 180 && pasado < 180 && ahora - cambio > PERMANENCIA_MS) {
          cambio = ahora;
          leer(i);
        }
        antes[i] = pasado;
      });
      raf = requestAnimationFrame(cuadro);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDibujado(true);
          if (!reducido && !raf) {
            ultimo = 0;
            cambio = performance.now();
            raf = requestAnimationFrame(cuadro);
          }
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [puestos, reducido]);

  /* Con movimiento reducido el haz no gira: apunta al eco del frente. */
  useEffect(() => {
    if (!reducido || !haz.current || !elegido) return;
    haz.current.style.transform = `rotate(${elegido.angulo}deg)`;
    nucleos.current.forEach((n) => n && (n.style.opacity = '0.85'));
  }, [reducido, elegido]);

  /* El haz se queda en un eco mientras el cursor o el foco están ahí; con el dedo, un rato
     (`ms`) y luego sigue. */
  const suelta = useRef(0);
  useEffect(() => () => window.clearTimeout(suelta.current), []);
  const fijar = (i: number, ms: number) => {
    window.clearTimeout(suelta.current);
    setFoco(i);
    if (ms) suelta.current = window.setTimeout(() => setFoco(null), ms);
  };
  const elegir = (i: number, ms = 0) => {
    fijar(i, ms);
    leer(i);
  };
  const soltar = () => {
    window.clearTimeout(suelta.current);
    setFoco(null);
  };
  /* La del frente se queda mientras el cursor o el foco están en la baraja, o un rato al tocarla. */
  const quedarse = (ms = 0) => fijar(actual, ms);
  /* Con qué se tocó el último eco: el clic del cursor y el toque del dedo hacen cosas distintas. */
  const puntero = useRef('mouse');

  /* El carrusel del teléfono (ver EL CARRUSEL): la tarjeta que se ve pasa a ser la del frente y el
     haz va a su eco un rato. */
  const { carrusel, tarjeta, ir: llevar } = useCarrusel(!columnas, (i) => {
    if (i !== frente.current) elegir(i, TOQUE_MS);
  });

  /* El arrastre de la del frente con el dedo (ver CON EL DEDO). Mueve la tarjeta con `translate` y
     `rotate`, que no pisan el `transform` de su animación de entrada. */
  const cartas = useRef<(HTMLDivElement | null)[]>([]);
  const arrastre = useRef<{ id: number; x: number; y: number; dx: number; lateral: boolean } | null>(null);
  const arrastro = useRef(false);
  const mover = (c: HTMLDivElement | null | undefined, dx: number) => {
    if (!c) return;
    c.style.translate = dx ? `${dx}px 0` : '';
    c.style.rotate = dx ? `${(dx * 0.04).toFixed(2)}deg` : '';
  };
  const empezar = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerType === 'mouse' || puestos.length < 2) return;
    arrastre.current = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, dx: 0, lateral: false };
    arrastro.current = false;
    if (columnas) quedarse(SOSTEN_MS);
  };
  const arrastrar = (ev: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== ev.pointerId) return;
    const dx = ev.clientX - a.x;
    const dy = ev.clientY - a.y;
    if (!a.lateral) {
      if (Math.abs(dx) < UMBRAL_EJE && Math.abs(dy) < UMBRAL_EJE) return;
      /* Hacia arriba o abajo es la página que se mueve: el gesto ya no es de la baraja. */
      if (Math.abs(dy) >= Math.abs(dx)) {
        arrastre.current = null;
        return;
      }
      a.lateral = true;
      arrastro.current = true;
      ev.currentTarget.setPointerCapture(ev.pointerId);
      const c = cartas.current[actual];
      if (c) c.style.transition = 'none';
    }
    a.dx = dx;
    mover(cartas.current[actual], dx);
  };
  const terminar = (ev: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== ev.pointerId) return;
    arrastre.current = null;
    if (!a.lateral) return;
    const c = cartas.current[actual];
    if (ev.type !== 'pointercancel' && Math.abs(a.dx) >= UMBRAL_CAMBIO) {
      /* Se va: la que sale es otra capa que arranca donde quedó esta, que ya vuelve a su sitio sin
         verse. */
      mover(c, 0);
      lanzada.current = a.dx;
      elegir((actual + 1) % puestos.length, TOQUE_MS);
      return;
    }
    /* No llegó: vuelve a su sitio. */
    if (c) c.style.transition = '';
    mover(c, 0);
  };

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-7">
        <div ref={caja} className="relative mx-auto aspect-square w-full max-w-140">
          {/* El radar en una sola línea, que se dibuja al llegar; y el recorte del haz. */}
          <svg aria-hidden="true" viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <clipPath id={borde} clipPathUnits="objectBoundingBox">
                <polygon points={BORDE} />
              </clipPath>
            </defs>
            <path
              d={RADAR}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={dibujado ? 0 : 1}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rd-radar-trazo fill-none stroke-rd-noche-tinta max-sm:stroke-3"
              style={{ transitionDuration: '2.8s' }}
            />
            <g transform={`translate(${C} ${C})`}>
              <path d={CENTRO_ONDA} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="rd-encuentro-onda fill-none stroke-rd-ayuda" style={{ animationDuration: '3s' }} />
              <circle r={5} className="fill-rd-ayuda" />
            </g>
          </svg>

          {/* El haz: una estela que se apaga detrás de su borde, girada por el cuadro de animación.
              La caja que la recorta no gira y lleva el anillo dibujado (`borde`): así el haz llega
              justo hasta la línea. Su borde es una raya a pulso que gira con él. */}
          <div aria-hidden="true" className="absolute inset-0" style={{ clipPath: `url(#${borde})` }}>
            <div ref={haz} className={`rd-radar-haz absolute inset-0 rounded-full transition-opacity duration-700 ${dibujado ? 'opacity-100' : 'opacity-0'}`}>
              <svg viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 h-full w-full overflow-visible">
                <path d={RAYA} strokeWidth={1.75} strokeLinecap="round" className="fill-none stroke-rd-ayuda" />
              </svg>
            </div>
          </div>

          {/* Los ecos, encima del haz: cada uno un botón con lo que dice su publicación. */}
          <svg role="group" aria-label={etiqueta} viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 h-full w-full overflow-visible">
            {puestos.map(({ p, x, y }, i) => (
              <g
                key={p.id}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
                role="button"
                tabIndex={0}
                aria-label={`${rotulos[p.tipo]}: ${p.titulo}, ${p.zona}`}
                aria-pressed={i === actual}
                data-cursor-eco=""
                className="cursor-pointer outline-none"
                onPointerDown={(ev) => {
                  puntero.current = ev.pointerType;
                }}
                onPointerEnter={(ev) => {
                  if (ev.pointerType === 'mouse') elegir(i);
                }}
                onPointerLeave={(ev) => {
                  if (ev.pointerType === 'mouse') soltar();
                }}
                onFocus={(ev) => {
                  if (ev.currentTarget.matches(':focus-visible')) elegir(i);
                }}
                onBlur={soltar}
                onClick={() => {
                  elegir(i, puntero.current === 'mouse' ? 0 : TOQUE_MS);
                  if (!columnas) llevar(i, reducido);
                }}
              >
                <circle r={24} fill="transparent" />
                <path
                  ref={(o) => {
                    ondas.current[i] = o;
                  }}
                  d={ONDA}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  className={`rd-radar-onda fill-none ${COLOR[p.tipo].trazo}`}
                  style={{ opacity: 0 }}
                />
                <path
                  ref={(n) => {
                    nucleos.current[i] = n;
                  }}
                  d={NUCLEO}
                  className={COLOR[p.tipo].relleno}
                  style={{ opacity: dibujado ? 0.85 : 0, transition: dibujado ? undefined : 'opacity 0.6s' }}
                />
                {/* El eco del frente de la baraja: un anillo quieto y otro que late desde él. */}
                {i === actual && (
                  <>
                    <path d={ELEGIDO} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="fill-none stroke-rd-ayuda" />
                    <path d={ELEGIDO} strokeWidth={1.75} vectorEffect="non-scaling-stroke" className="rd-encuentro-onda fill-none stroke-rd-ayuda" style={{ animationDuration: '1.6s' }} />
                  </>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="lg:col-span-5 lg:col-start-8">
        {columnas ? (
          <>
            {/* La baraja: las hojas que asoman, todas las tarjetas en la misma celda (solo la del
                frente visible) y las que van saliendo hacia el fondo. */}
            <div
              className="rd-mazo rd-herramienta grid touch-pan-y touch-pinch-zoom pt-8"
              onPointerEnter={(ev) => {
                if (ev.pointerType === 'mouse') quedarse();
              }}
              onPointerLeave={(ev) => {
                if (ev.pointerType === 'mouse') soltar();
              }}
              onFocus={() => quedarse()}
              onBlur={soltar}
              onPointerDown={empezar}
              onPointerMove={arrastrar}
              onPointerUp={terminar}
              onPointerCancel={terminar}
              onClickCapture={(ev) => {
                /* Lo que se soltó tras arrastrar no es un toque a un botón de la tarjeta. */
                if (!arrastro.current) return;
                arrastro.current = false;
                ev.preventDefault();
                ev.stopPropagation();
              }}
            >
              {HOJAS.map((k) => (
                <div key={k} aria-hidden="true" className={`rd-mazo-hoja rd-mazo-hoja-${k} col-start-1 row-start-1 rounded-rd-xl border border-rd-line bg-rd-surface`} />
              ))}
              {puestos.length === 0 ? (
                <div className="rd-mazo-carta col-start-1 row-start-1 z-4 flex min-h-[380px] flex-col items-center justify-center rounded-rd-xl border border-rd-line bg-rd-surface p-8 text-center shadow-rd-1">
                  <div className="mb-4 h-7 w-7 animate-spin rounded-full border-2 border-rd-coral border-t-transparent" />
                  <p className="font-rd m-0 text-rd-14 font-semibold text-rd-ink">Sincronizando con el radar...</p>
                  <p className="font-rd mt-1.5 max-w-xs text-rd-12 text-rd-ink-2">Conectando con las necesidades y ofertas en vivo reportadas por la comunidad</p>
                </div>
              ) : (
                puestos.map(({ p }, i) => (
                  <div
                    key={p.id}
                    ref={(c) => {
                      cartas.current[i] = c;
                    }}
                    className={`rd-mazo-carta col-start-1 row-start-1 rounded-rd-xl ${i === actual ? `z-4 ${saliendo.length > 0 ? 'rd-mazo-entra' : ''}` : 'invisible'}`}
                  >
                    <Tarjeta publicacion={p} className="h-full" onPrimaria={onAbrir} onVerEnMapa={onAbrir} onCompartir={onAbrir} onReportar={onAbrir} />
                  </div>
                ))
              )}
              {saliendo.map(({ i, n, dx }) => {
                const e = puestos[i];
                if (!e) return null;
                /* La que mandó el dedo sale por su lado, desde donde la soltó. */
                const lado = dx === null ? undefined : ({ '--rd-arrastre': `${dx}px`, '--rd-giro': `${(dx * 0.04).toFixed(2)}deg` } as React.CSSProperties);
                return (
                  <div
                    key={`sale-${n}`}
                    inert
                    aria-hidden="true"
                    className={`rd-mazo-carta col-start-1 row-start-1 rounded-rd-xl ${dx === null ? 'rd-mazo-sale' : `rd-mazo-sale-lado ${dx < 0 ? 'rd-mazo-sale-izquierda' : ''}`}`}
                    style={lado}
                    onAnimationEnd={(ev) => {
                      if (ev.target === ev.currentTarget) setSaliendo((s) => s.filter((x) => x.n !== n));
                    }}
                  >
                    <Tarjeta publicacion={e.p} className="h-full" />
                  </div>
                );
              })}
            </div>
            {/* La pista, solo para quien usa el dedo (una tableta acostada: la baraja también se
                arrastra). */}
            {puestos.length > 0 && <p className="font-rd mt-4 mb-0 hidden text-center text-rd-13 text-rd-noche-meta pointer-coarse:block">{pista}</p>}
          </>
        ) : (
          /* El carrusel del teléfono (ver EL CARRUSEL): sale del margen de la página hasta el
             borde de la pantalla y lo devuelve como relleno, y cada tarjeta mide tres columnas y
             media. Todas del alto de la más alta, con las acciones abajo (`h-full`; la `Tarjeta`
             las empuja con `mt-auto`). */
          <div
            ref={carrusel}
            className="rd-herramienta zona-rd-scroll relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 sm:-mx-8 sm:scroll-px-8 sm:px-8"
          >
            {puestos.length === 0 ? (
              <div className="flex w-full min-h-[300px] flex-col items-center justify-center rounded-rd-xl border border-rd-line bg-rd-surface p-6 text-center">
                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-rd-coral border-t-transparent" />
                <p className="font-rd m-0 text-rd-14 font-semibold text-rd-ink">Sincronizando con el radar...</p>
                <p className="font-rd mt-1 text-rd-12 text-rd-ink-2">Conectando con publicaciones en vivo</p>
              </div>
            ) : (
              puestos.map(({ p }, i) => (
                <div key={p.id} ref={tarjeta(i)} className="tarjeta-rd-carrusel snap-start">
                  <Tarjeta publicacion={p} className="h-full" onPrimaria={onAbrir} onVerEnMapa={onAbrir} onCompartir={onAbrir} onReportar={onAbrir} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
