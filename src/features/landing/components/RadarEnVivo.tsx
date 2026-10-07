import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Tarjeta } from '../../../components/ui/Tarjeta';
import type { Publicacion, TipoPublicacion } from '../../../types/publicacion';
import { azar, espiral, ovalo, pasarPor, temblar, trazar } from '../trazoAMano';
import { useConsulta } from '../useConsulta';

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
}> = ({ publicaciones, etiqueta, rotulos, onAbrir }) => {
  const puestos = useMemo(() => colocar(publicaciones), [publicaciones]);
  const reducido = useConsulta(CONSULTA_REDUCIDO, false);
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
  const [saliendo, setSaliendo] = useState<{ i: number; n: number }[]>([]);

  /* El eco elegido, también para el cuadro de animación, que no pasa por React. */
  const focoVivo = useRef<number | null>(null);
  useEffect(() => {
    focoVivo.current = foco;
  }, [foco]);

  const actual = Math.min(indice, Math.max(0, puestos.length - 1));
  const elegido = puestos[actual];

  const leer = (i: number) => setIndice(i);

  /* Cuando cambia la del frente, la que estaba se va al fondo. Antes de pintar, para que no haya
     un cuadro sin ella. */
  const frente = useRef<number | null>(null);
  const vueltas = useRef(0);
  useLayoutEffect(() => {
    const antes = frente.current;
    frente.current = actual;
    if (antes === null || antes === actual || reducido) return;
    vueltas.current += 1;
    const n = vueltas.current;
    setSaliendo((s) => [...s, { i: antes, n }]);
  }, [actual, reducido]);

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
        /* El haz acaba de pasar por este eco: pasa al frente, si la anterior ya se leyó. */
        if (f === null && antes[i] > 180 && pasado < 180 && ahora - cambio > PERMANENCIA_MS) {
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

  const elegir = (i: number) => {
    setFoco(i);
    leer(i);
  };
  const soltar = () => setFoco(null);
  /* La del frente se queda mientras el cursor o el foco están en la baraja. */
  const quedarse = () => setFoco(actual);

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
              className="rd-radar-trazo fill-none stroke-rd-noche-linea"
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
                onMouseEnter={() => elegir(i)}
                onMouseLeave={soltar}
                onFocus={() => elegir(i)}
                onBlur={soltar}
                onClick={() => elegir(i)}
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
        {/* La baraja: las hojas que asoman, todas las tarjetas en la misma celda (solo la del
            frente visible) y las que van saliendo hacia el fondo. */}
        <div className="rd-mazo rd-herramienta grid pt-8" onMouseEnter={quedarse} onMouseLeave={soltar} onFocus={quedarse} onBlur={soltar}>
          {HOJAS.map((k) => (
            <div key={k} aria-hidden="true" className={`rd-mazo-hoja rd-mazo-hoja-${k} col-start-1 row-start-1 rounded-rd-xl border border-rd-line bg-rd-surface`} />
          ))}
          {puestos.map(({ p }, i) => (
            <div
              key={p.id}
              className={`rd-mazo-carta col-start-1 row-start-1 rounded-rd-xl ${i === actual ? `z-4 ${saliendo.length > 0 ? 'rd-mazo-entra' : ''}` : 'invisible'}`}
            >
              <Tarjeta publicacion={p} className="h-full" onPrimaria={onAbrir} onVerEnMapa={onAbrir} onCompartir={onAbrir} onReportar={onAbrir} />
            </div>
          ))}
          {saliendo.map(({ i, n }) => {
            const e = puestos[i];
            if (!e) return null;
            return (
              <div
                key={`sale-${n}`}
                inert
                aria-hidden="true"
                className="rd-mazo-carta rd-mazo-sale col-start-1 row-start-1 rounded-rd-xl"
                onAnimationEnd={(ev) => {
                  if (ev.target === ev.currentTarget) setSaliendo((s) => s.filter((x) => x.n !== n));
                }}
              >
                <Tarjeta publicacion={e.p} className="h-full" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
