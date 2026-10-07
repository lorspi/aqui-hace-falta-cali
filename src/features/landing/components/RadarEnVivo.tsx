import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Map as Mapa, MapPin } from 'lucide-react';
import { BotonLanding } from './base';
import { azar, curva, ovalo, trazar } from '../trazoAMano';
import { useConsulta } from '../useConsulta';

/**
 * «El radar en vivo», la sección 4 (Alejandro, 7 de octubre de 2026: sobre una primera versión
 * que solo le puso un mapa de fondo a la marquesina, «solo "embelleciste" con elementos visuales
 * que hicieron que se viera algo cargado. pero la idea es que sea una experiencia wow a lo largo
 * de toda la landing. quiero que idees algo similar en cuanto a "innovación" como se hizo en el 2
 * y 3»; y sobre la propuesta, «hagale radar en vivo»).
 *
 * La marca se llama Radar y la sección dice «minuto a minuto»: la sección es un radar barriendo el
 * territorio. Las necesidades (coral) y las ofertas (navy) que la sección ya carga son ecos; el haz
 * gira y, al pasar por encima de un eco, lo enciende, y el eco se va apagando despacio, como en una
 * pantalla de radar.
 *
 * - EL HAZ da una vuelta cada 10 s (`VUELTA_MS`). Lo mueve un cuadro de animación que gira una capa
 *   ya pintada (la tarjeta gráfica la rota sin repintar) y enciende los ecos; se detiene fuera de la
 *   pantalla.
 * - EL CURSOR. Al pasar el cursor por un eco —o al enfocarlo con el teclado, o al tocarlo—, el haz
 *   va hacia él y se queda, el eco se queda encendido con un anillo amarillo y la lectura lo
 *   muestra. Los ecos llevan `data-cursor-eco`, y el cursor líquido de la landing late mientras
 *   está sobre uno (ver `VentanaLiquida`): el cursor es otro radar que detecta.
 * - LA ENTRADA. Al llegar a la sección los anillos se dibujan a pulso de dentro hacia fuera, como
 *   el sello de la sección 3, y el haz arranca.
 * - En el centro, un punto amarillo que late: el lugar de quien mira.
 *
 * LA LECTURA
 * Al lado del radar va lo que el radar leyó. La primera versión era una tarjeta suelta con una
 * leyenda debajo, y Alejandro la vio «muy mediocre» (7 de octubre de 2026). Ahora son tres piezas:
 * - El eco leído: en el radar lleva el anillo amarillo que late, así se ve cuál es sin buscarlo. Un
 *   rato hubo además una línea a pulso del eco a la lectura, y a Alejandro le pareció «rarísimo
 *   como se hilan las cards y el dot del radar» (7 de octubre de 2026): se quitó.
 * - La lectura: el tipo con su señal, el título grande, su detalle, dónde y hace cuánto, la categoría y una
 *   acción, «Ver en el mapa», que lleva a esa necesidad u oferta. Cambia al eco que el haz acaba de
 *   pasar, pero no antes de 5 s (`PERMANENCIA_MS`): con seis ecos el haz pasa uno cada segundo y
 *   medio, y una lectura que cambiara a ese ritmo no se alcanzaría a leer. Una raya de su color se
 *   llena en su borde de abajo mientras espera; con un eco elegido no corre.
 * - El registro: las tres lecturas anteriores, la más reciente arriba, que se van corriendo hacia
 *   abajo con cada eco nuevo. Cada fila es un botón: al pasar el cursor, enfocarla o tocarla, el haz
 *   va a ese eco. Arranca lleno con los últimos ecos de la vuelta, para que no nazca vacío.
 *
 * Todo el dibujo es a pulso (`trazoAMano`). Los ecos se reparten en la vuelta por orden, alternando
 * necesidades y ofertas, con un poco de azar en el ángulo y en la distancia sacado de su `id`, así
 * cada eco cae siempre en el mismo sitio.
 *
 * El radar es un grupo con nombre (`etiqueta`), y cada eco es un botón con lo que dice su lectura,
 * así quien no lo ve oye los mismos datos. Con movimiento reducido el haz no gira: apunta al eco de
 * la lectura, y los ecos se eligen igual con el cursor, el dedo o el teclado.
 */

export type EcoRadar = {
  id: string;
  tipo: 'necesidad' | 'oferta';
  category: string;
  title: string;
  /** El detalle bajo el título, si lo hay. */
  description?: string;
  location: string;
  timeAgo: string;
  /** A dónde lleva «Ver en el mapa». */
  link: string;
};

const LADO = 600;
const C = LADO / 2;
const VUELTA_MS = 10000;
const PERMANENCIA_MS = 5000;
/* Cuánto dura el brillo de un eco tras pasar el haz: a los 110° de vuelta queda en un tercio. */
const RASTRO = 110;
/* El destello: los primeros 50° tras pasar el haz, el anillo del eco crece y se apaga. */
const DESTELLO = 50;
/* Las filas del registro, sin contar la lectura. */
const REGISTRO = 3;
const CONSULTA_REDUCIDO = '(prefers-reduced-motion: reduce)';

const al = azar(83);
/* El temblor de `ovalo` es una fracción del radio: igual en los cuatro, el de fuera salía
   deformado. Baja con la raíz del radio, así los cuatro tiemblan unos 2 o 3 px, como de una
   misma mano. */
const RADIOS = [70, 140, 210, 278];
const ANILLOS = RADIOS.map((r) => trazar(ovalo({ x: C, y: C }, r, r, al, 140, 0.7 * Math.sqrt(70 / r)), true));
const CRUZ = [
  trazar(curva({ x: C, y: C - 286 }, { x: C + 3, y: C - 100 }, { x: C - 3, y: C + 100 }, { x: C, y: C + 286 }, 50, 1.5, al)),
  trazar(curva({ x: C - 286, y: C }, { x: C - 100, y: C - 3 }, { x: C + 100, y: C + 3 }, { x: C + 286, y: C }, 50, 1.5, al)),
];
const NUCLEO = trazar(ovalo({ x: 0, y: 0 }, 7, 7, al, 28, 1.3), true);
const ONDA = trazar(ovalo({ x: 0, y: 0 }, 12, 12, al, 40, 1.5), true);
const ELEGIDO = trazar(ovalo({ x: 0, y: 0 }, 19, 19, al, 48, 1.4), true);
const CENTRO_ONDA = trazar(ovalo({ x: 0, y: 0 }, 8, 8, al, 32, 1.4), true);

const COLOR = {
  necesidad: {
    trazo: 'stroke-rd-coral',
    relleno: 'fill-rd-coral',
    fondo: 'bg-rd-coral',
    texto: 'text-rd-coral',
    etiqueta: 'bg-rd-coral/25 text-rd-coral-soft claro:bg-rd-coral-soft claro:text-rd-coral-ink',
  },
  oferta: {
    trazo: 'stroke-rd-navy-claro',
    relleno: 'fill-rd-navy-claro',
    fondo: 'bg-rd-navy-claro',
    texto: 'text-rd-navy-claro',
    etiqueta: 'bg-rd-navy-claro/25 text-rd-navy-soft claro:bg-rd-navy-soft claro:text-rd-navy',
  },
};

const huella = (s: string) => {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

/* Dónde cae cada eco: repartidos en la vuelta por orden, con algo de azar sacado de su `id`. */
const colocar = (ecos: EcoRadar[]) =>
  ecos.map((e, k) => {
    const h = huella(e.id);
    const angulo = ((((k * 360) / ecos.length + (h % 30) - 15) % 360) + 360) % 360;
    const radio = 105 + (Math.floor(h / 31) % 150);
    const a = (angulo * Math.PI) / 180;
    return { ...e, angulo, x: C + radio * Math.sin(a), y: C - radio * Math.cos(a) };
  });

/* La señal de un tipo: su punto de color y, salvo `quieta`, un radar a pulso que late. */
const SENAL_ONDA = trazar(ovalo({ x: 7, y: 7 }, 4, 4, azar(71), 24, 1.6), true);
export const Senal: React.FC<{ tipo: EcoRadar['tipo']; quieta?: boolean }> = ({ tipo, quieta = false }) => (
  <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5 shrink-0 overflow-visible">
    {!quieta && (
      <path
        d={SENAL_ONDA}
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
        className={`rd-encuentro-onda fill-none ${COLOR[tipo].trazo}`}
        style={{ animationDuration: '2.8s', animationDelay: tipo === 'necesidad' ? '0s' : '1.4s' }}
      />
    )}
    <circle cx={7} cy={7} r={3.5} className={COLOR[tipo].relleno} />
  </svg>
);

export const RadarEnVivo: React.FC<{
  ecos: EcoRadar[];
  /** El nombre del radar para el lector de pantalla. */
  etiqueta: string;
  /** El nombre de cada tipo, para la lectura y el registro. */
  rotulos: Record<EcoRadar['tipo'], string>;
  /** «Ver en el mapa» y el rótulo del registro. */
  textos: { verEnMapa: string; registro: string };
}> = ({ ecos, etiqueta, rotulos, textos }) => {
  const puestos = useMemo(() => colocar(ecos), [ecos]);
  const reducido = useConsulta(CONSULTA_REDUCIDO, false);
  const caja = useRef<HTMLDivElement>(null);
  const haz = useRef<HTMLDivElement>(null);
  const nucleos = useRef<(SVGPathElement | null)[]>([]);
  const ondas = useRef<(SVGPathElement | null)[]>([]);
  const [dibujado, setDibujado] = useState(false);
  /* La lectura y el registro: el eco leído primero y los anteriores detrás, sin repetir. Arranca
     con los últimos de la vuelta, así el registro no nace vacío. */
  const [historial, setHistorial] = useState<number[]>(() =>
    [0, ...Array.from({ length: REGISTRO }, (_, k) => ecos.length - 1 - k)].filter((i, k, a) => i >= 0 && a.indexOf(i) === k),
  );
  const [foco, setFoco] = useState<number | null>(null);

  /* El eco elegido, también para el cuadro de animación, que no pasa por React. */
  const focoVivo = useRef<number | null>(null);
  useEffect(() => {
    focoVivo.current = foco;
  }, [foco]);

  /* Si cambian los ecos (llegan los datos vivos), el registro vuelve a empezar con ellos. */
  useEffect(() => {
    setHistorial([0, ...Array.from({ length: REGISTRO }, (_, k) => puestos.length - 1 - k)].filter((i, k, a) => i >= 0 && a.indexOf(i) === k));
  }, [puestos]);

  const actual = Math.min(historial[0] ?? 0, Math.max(0, puestos.length - 1));
  const elegido = puestos[actual];

  const leer = (i: number) => setHistorial((h) => (h[0] === i ? h : [i, ...h.filter((x) => x !== i)].slice(0, REGISTRO + 1)));

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

      puestos.forEach((p, i) => {
        const pasado = (angulo - p.angulo + 360) % 360;
        const brillo = i === f ? 1 : Math.exp(-pasado / RASTRO);
        const n = nucleos.current[i];
        if (n) n.style.opacity = (0.3 + 0.7 * brillo).toFixed(3);
        const o = ondas.current[i];
        if (o) {
          const d = f === null && pasado < DESTELLO ? pasado / DESTELLO : 1;
          o.style.opacity = ((1 - d) * 0.9).toFixed(3);
          o.style.transform = `scale(${(1 + d * 1.6).toFixed(3)})`;
        }
        /* El haz acaba de pasar por este eco: la lectura lo cuenta, si la anterior ya se leyó. */
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

  /* Con movimiento reducido el haz no gira: apunta al eco de la lectura. */
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

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-7">
        <div ref={caja} className="relative mx-auto aspect-square w-full max-w-140">
          {/* Los anillos, la cruz y el centro, dibujados a pulso al llegar. */}
          <svg aria-hidden="true" viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 h-full w-full overflow-visible">
            <g className="fill-none stroke-rd-noche-linea" strokeWidth={1.5}>
              {CRUZ.map((d, i) => (
                <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={dibujado ? 0 : 1} className="rd-radar-trazo" style={{ transitionDelay: `${0.2 + i * 0.15}s` }} />
              ))}
              {ANILLOS.map((d, i) => (
                <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={dibujado ? 0 : 1} className="rd-radar-trazo" style={{ transitionDelay: `${i * 0.18}s` }} />
              ))}
            </g>
            <g transform={`translate(${C} ${C})`}>
              <path d={CENTRO_ONDA} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="rd-encuentro-onda fill-none stroke-rd-ayuda" style={{ animationDuration: '3s' }} />
              <circle r={5} className="fill-rd-ayuda" />
            </g>
          </svg>

          {/* El haz: una estela que se apaga detrás de su borde, girada por el cuadro de animación. */}
          <div aria-hidden="true" className="absolute inset-1/25 overflow-hidden rounded-full">
            <div ref={haz} className={`rd-radar-haz absolute inset-0 rounded-full transition-opacity duration-700 ${dibujado ? 'opacity-100' : 'opacity-0'}`}>
              <span className="absolute top-0 left-1/2 h-1/2 w-px -translate-x-1/2 bg-rd-ayuda/70" />
            </div>
          </div>

          {/* Los ecos, encima del haz: cada uno un botón con lo que dice su lectura. */}
          <svg role="group" aria-label={etiqueta} viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 h-full w-full overflow-visible">
            {puestos.map((p, i) => (
              <g
                key={p.id}
                transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
                role="button"
                tabIndex={0}
                aria-label={`${rotulos[p.tipo]}: ${p.title}, ${p.location}`}
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
                {/* El eco que la lectura muestra: un anillo quieto y otro que late desde él. */}
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
        {/* La lectura. */}
        {elegido && (
          <div className="relative overflow-hidden rounded-rd-xl border border-rd-noche-linea bg-rd-noche-2">
            <div key={elegido.id} className="rd-paso flex min-h-80 flex-col p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className={`font-rd m-0 flex items-center gap-2 text-rd-13-5 font-semibold ${COLOR[elegido.tipo].texto}`}>
                  <Senal tipo={elegido.tipo} />
                  {rotulos[elegido.tipo]}
                </p>
                <span className="font-rd inline-flex shrink-0 items-center gap-1.5 text-rd-12 text-rd-noche-meta">
                  <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  {elegido.timeAgo}
                </span>
              </div>
              <h3 className="font-rd m-0 mt-5 line-clamp-3 text-rd-24 leading-rd-titular font-medium tracking-rd-titulo text-balance text-rd-noche-tinta sm:text-rd-28">
                {elegido.title}
              </h3>
              {elegido.description && elegido.description.trim() !== elegido.title.trim() && (
                <p className="font-rd m-0 mt-3 line-clamp-3 text-rd-15 leading-relaxed text-rd-noche-tinta-2">{elegido.description}</p>
              )}
              <p className="font-rd m-0 mt-4 flex items-center gap-2 text-rd-14 text-rd-noche-meta">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-rd-noche-meta" />
                <span className="min-w-0 truncate">{elegido.location}</span>
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-7">
                <span className={`font-rd inline-flex rounded-full px-2.5 py-1 text-rd-11-5 font-semibold ${COLOR[elegido.tipo].etiqueta}`}>{elegido.category}</span>
                <BotonLanding nivel="secundario" tamano="md" como="enlace" href={elegido.link} icono={<Mapa className="h-4 w-4" />}>
                  {textos.verEnMapa}
                </BotonLanding>
              </div>
            </div>
            {/* La espera hasta el siguiente eco, en el borde de abajo. */}
            {foco === null && !reducido && (
              <span
                key={`${elegido.id}-espera`}
                aria-hidden="true"
                className={`rd-radar-espera absolute bottom-0 left-0 h-0.5 w-full origin-left ${COLOR[elegido.tipo].fondo}`}
                style={{ animationDuration: `${PERMANENCIA_MS}ms` }}
              />
            )}
          </div>
        )}

        {/* El registro: lo que el radar leyó antes, la más reciente arriba. */}
        {historial.length > 1 && (
          <div className="mt-6">
            <p className="font-rd m-0 mb-1 px-3 text-rd-12 font-semibold text-rd-noche-meta">{textos.registro}</p>
            <ol className="m-0 flex list-none flex-col p-0">
              {historial.slice(1).map((i) => {
                const p = puestos[i];
                if (!p) return null;
                return (
                  <li key={p.id} className="rd-paso">
                    <button
                      type="button"
                      onMouseEnter={() => elegir(i)}
                      onMouseLeave={soltar}
                      onFocus={() => elegir(i)}
                      onBlur={soltar}
                      onClick={() => elegir(i)}
                      className="font-rd flex w-full cursor-pointer items-center gap-3 rounded-rd-md px-3 py-2.5 text-left transition-colors duration-150 hover:bg-rd-noche-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-ayuda"
                    >
                      <Senal tipo={p.tipo} quieta />
                      <span className="min-w-0 flex-1 truncate text-rd-13-5 text-rd-noche-tinta-2">{p.title}</span>
                      <span className="shrink-0 text-rd-11-5 text-rd-noche-meta">{p.timeAgo}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
