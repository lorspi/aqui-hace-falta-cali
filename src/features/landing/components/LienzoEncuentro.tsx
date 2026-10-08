import React, { useId } from 'react';
import { Check, MapPin } from 'lucide-react';
import { azar, curva, espiral, ovalo, pasarPor, temblar, trazar, type Punto } from '../trazoAMano';

/**
 * El lienzo de «El encuentro», la sección 3 (Alejandro, 6 de octubre de 2026: «como hacemos para
 * que la sección 3 quede chimba como la 1 y 2?», y sobre la propuesta: «desarrolla el encuentro a
 * ver qué»). Cuenta lo que dice el titular del hero —«el punto de encuentro de las ayudas»— con la
 * gramática que ya tiene la landing: gotas líquidas como la del cursor, anillos de radar, trazo a
 * pulso, grano y los colores de la landing: rojo pide, azul ofrece y el amarillo de la landing
 * para lo entregado (Alejandro, 7 de octubre de 2026: «Usa como colores el amarillo azul y rojo,
 * pero mantén este amarillo»; hasta ese día lo entregado era verde).
 *
 * Es una función del avance (`progreso`, de 0 a 3, un tramo por paso): no guarda estado ni
 * escucha nada. `LandingComoFunciona` le pasa el avance del scroll en escritorio, y en el teléfono
 * monta uno por paso, quieto en el final de su tramo.
 *
 * - 01, Reporta: sobre un mapa dibujado a pulso nace una gota coral, la necesidad, y late con
 *   anillos de radar. Asoma su tarjeta.
 * - 02, Conecta: en otro punto nace una gota navy, la oferta, con los suyos. RaDAR traza la ruta
 *   entre las dos —una línea a pulso que se dibuja— y las dos gotas corren por ella hasta
 *   encontrarse en la mitad y fundirse en una, como la gota del cursor (el mismo filtro de
 *   metabolas: desenfoque, onda y umbral).
 * - 03, Monitorea: la gota unida se vuelve amarilla, crece un poco, un círculo a pulso la sella, se
 *   dibuja un visto encima y asoma la tarjeta de la entrega confirmada.
 *
 * Las tarjetas son islas de la herramienta, como las maquetas: superficie blanca y tintas de la
 * herramienta, en los dos modos. Sus datos son los de las maquetas de la sección 2 (la necesidad
 * de Siloé y la oferta de los Bomberos de Usme de `MaquetaRadarLista`, el acta de `MaquetaPanel`),
 * así lo que se cuenta aquí es lo mismo que se ve allá.
 *
 * Todo el dibujo sale de trazados con temblor a pulso de semilla fija, no de filtros: solo las
 * gotas pasan por uno. El lienzo es decorativo (`aria-hidden`): los pasos los cuenta el texto.
 */

/* El lienzo es apaisado (10:7) desde el 7 de octubre de 2026: cuadrado medía 632 de alto al lado
   de un paso de 280, y sin el marco de la tarjeta se leía descuadrado (Alejandro: «se descuadro la
   alineación entre el mapa y los textos»). Así mide 440 y su centro y el del texto caen juntos. */
const ANCHO = 600;
const ALTO = 420;
type P = Punto;

/* La necesidad, la oferta y los dos puntos de control de la ruta entre ellas. */
const A: P = { x: 150, y: 290 };
const B: P = { x: 455, y: 118 };
const C1: P = { x: 222, y: 168 };
const C2: P = { x: 380, y: 250 };

/* El azar con semilla y el trazo a pulso viven en `trazoAMano`. */
const al = azar(23);

/* El mapa, en una sola línea (Alejandro, 7 de octubre de 2026: «las lineas del mapa son sueltas y
   eso genera que haya como elementos sueltos que dejan como un sinsabor... busquemos que con este
   estilo se llenen esos espacios de las ilustraciones pero de manera linda, armónica y
   complementaria»). Nace en la cima de un cerro arriba a la izquierda y sale de él en espiral, que
   son sus curvas de nivel; sigue como una vía por arriba, baja por la izquierda, cruza por abajo
   como una quebrada, sube por la derecha y entra en espiral al cerro de abajo a la derecha, donde
   termina. Rodea el lienzo y deja el centro a la ruta y a las gotas. Va en la línea de la página,
   apenas visible, y se dibuja mientras se lee el primer paso. */
const CERRO_1: P = { x: 92, y: 80 };
const CERRO_2: P = { x: 505, y: 318 };
const MAPA = trazar(
  temblar(
    pasarPor(
      [
        ...espiral(CERRO_1, 5, 62, 3.2, 258, 0.72, 36),
        { x: 192, y: 47 }, { x: 242, y: 40 }, { x: 290, y: 46 }, { x: 318, y: 64 }, { x: 300, y: 92 }, { x: 250, y: 104 },
        { x: 168, y: 136 }, { x: 92, y: 190 }, { x: 50, y: 258 }, { x: 42, y: 328 }, { x: 72, y: 384 }, { x: 142, y: 402 },
        { x: 232, y: 398 }, { x: 318, y: 388 }, { x: 410, y: 400 }, { x: 512, y: 406 }, { x: 576, y: 386 }, { x: 594, y: 322 },
        { x: 588, y: 262 }, { x: 568, y: 226 }, { x: 544, y: 228 },
        ...espiral(CERRO_2, 80, 6, 3, -70, 0.72, 36),
      ],
      6,
    ),
    1.6,
    al,
  ),
);

/* La ruta entre la necesidad y la oferta, y por dónde van las gotas. */
const RUTA = curva(A, C1, C2, B, 160, 2.5, al);
const RUTA_D = trazar(RUTA);
const enRuta = (t: number) => RUTA[Math.round(Math.min(1, Math.max(0, t)) * (RUTA.length - 1))];
const ENCUENTRO = enRuta(0.5);

/* El sello: un círculo a pulso alrededor del encuentro y un visto dibujado encima. */
const SELLO = trazar(ovalo(ENCUENTRO, 50, 48, al, 120), true);
const VISTO = trazar([
  { x: ENCUENTRO.x - 13, y: ENCUENTRO.y + 1 },
  { x: ENCUENTRO.x - 4, y: ENCUENTRO.y + 10 },
  { x: ENCUENTRO.x + 14, y: ENCUENTRO.y - 10 },
]);

/* El tramo de un paso: 0 antes de `a`, 1 después de `b`, y en medio una curva que arranca y llega
   despacio. */
const tramo = (e: number, a: number, b: number) => {
  const u = Math.min(1, Math.max(0, (e - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/* Los datos de las tarjetas, los de las maquetas de la sección 2. */
const TARJETAS = {
  necesidad: { rotulo: 'Necesidad', titulo: 'Agua potable para 45 familias', detalle: 'Siloé, Cali' },
  oferta: { rotulo: 'Oferta', titulo: 'Bomberos Voluntarios Usme', detalle: '900 L listos para salir' },
  entrega: { titulo: 'Entregada y confirmada', detalle: 'Acta firmada por las dos partes' },
};

const RADIO = 20;

/* Los anillos de radar, a pulso como el sello del paso 3 (Alejandro, 7 de octubre de 2026: «los
   circulos del mapa de conecta y reporta no son como el del 3. que tiene ese estilo hand draw»;
   hasta ese día eran círculos perfectos). Tres óvalos con temblor, distintos entre sí, del radio
   de la gota y alrededor del origen: cada grupo los lleva a su gota y los gira un ángulo propio,
   así los de la necesidad, la oferta y el encuentro no tiemblan igual. Su temblor es 1,4 veces el
   del sello porque nacen al 60 % de su tamaño; al abrirse se parecen a él. Su azar tiene su propia
   semilla, para no mover el dibujo del mapa ni de la ruta. */
const alOndas = azar(41);
const ONDAS = [0, 1, 2].map(() => trazar(ovalo({ x: 0, y: 0 }, RADIO, RADIO, alOndas, 72, 1.4), true));

/* Los anillos de radar de una gota: tres que salen desfasados, en su color. Crecen con la
   animación (`rd-encuentro-onda`, que escala el trazado desde su centro) y el trazo se queda en
   1,75 (`non-scaling-stroke`): al crecer siguen siendo una línea dibujada y no engordan. */
const Ondas: React.FC<{ centro: P; clase: string; opacidad: number; giro: number }> = ({ centro, clase, opacidad, giro }) =>
  opacidad > 0.01 ? (
    <g opacity={opacidad} transform={`translate(${centro.x} ${centro.y}) rotate(${giro})`}>
      {ONDAS.map((d, i) => (
        <path
          key={i}
          d={d}
          strokeWidth={1.75}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          className={`rd-encuentro-onda fill-none ${clase}`}
          style={{ animationDelay: `${i * 0.8}s` }}
        />
      ))}
    </g>
  ) : null;

export const LienzoEncuentro: React.FC<{ progreso: number }> = ({ progreso: e }) => {
  const id = useId();
  const gota = `encuentro-gota-${id}`;

  /* El mapa se dibuja entero en la primera mitad del primer paso, antes de que nazca la gota. */
  const mapa = tramo(e, 0, 0.5);
  const nace = tramo(e, 0.05, 0.35);
  const naceB = tramo(e, 1.05, 1.35);
  const ruta = tramo(e, 1.35, 1.7);
  const viaje = tramo(e, 1.65, 2.0);
  const entrega = tramo(e, 2.0, 2.3);
  const sello = tramo(e, 2.2, 2.6);
  const visto = tramo(e, 2.45, 2.7);

  const posA = enRuta(0.5 * viaje);
  const posB = enRuta(1 - 0.5 * viaje);
  const crece = 1 + 0.35 * entrega;
  /* Al entregarse, cada gota mezcla su color con el amarillo de lo entregado. */
  const color = (token: string) => `color-mix(in oklab, var(--color-rd-ayuda) ${(entrega * 100).toFixed(0)}%, var(${token}))`;

  const tarjeta = (aparece: number, sale = 0) => {
    const v = aparece * (1 - sale);
    return { opacity: v, transform: `translateY(${((1 - aparece) * 8).toFixed(1)}px)`, visibility: v < 0.01 ? ('hidden' as const) : undefined };
  };

  /* El mapa va directo sobre la página, sin fondo ni marco (Alejandro, 7 de octubre de 2026: «me
     gustó el mapa de la sección 3 sin color de fondo y sin stroke»): lo vio así un rato, blanco
     sobre la página blanca, y se quedó en los dos modos. Hasta ese día era una tarjeta en la
     superficie elevada con su grano; ahora el grano es el de la página. El recorte del lienzo se
     queda: la línea del mapa pasa por sus bordes. */
  return (
    <div aria-hidden="true" className="@container relative aspect-10/7 w-full overflow-hidden rounded-rd-xl">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="absolute inset-0 h-full w-full">
        <defs>
          {/* Las gotas: desenfoque, onda, alisado y umbral, como la gota del cursor. */}
          <filter id={gota} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={9} result="difuso" />
            <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={1} seed={5} result="ruido" />
            <feDisplacementMap in="difuso" in2="ruido" scale={7} xChannelSelector="R" yChannelSelector="G" result="ondulado" />
            <feGaussianBlur in="ondulado" stdDeviation={1.2} result="campo" />
            <feColorMatrix in="campo" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" />
          </filter>
        </defs>

        {/* El mapa, una sola línea que se dibuja al empezar a leer el primer paso. */}
        <path
          d={MAPA}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - mapa}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="fill-none stroke-rd-noche-linea"
        />

        {/* La ruta que traza RaDAR entre la necesidad y la oferta. */}
        <path
          d={RUTA_D}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - ruta}
          strokeLinecap="round"
          className="fill-none stroke-rd-noche-tinta"
          strokeWidth={1.75}
          opacity={0.55 * (1 - 0.6 * entrega)}
        />

        {/* Los radares: los de cada gota mientras espera, y los amarillos del encuentro. */}
        <Ondas centro={A} clase="stroke-rd-coral" opacidad={nace * (1 - viaje)} giro={0} />
        <Ondas centro={B} clase="stroke-rd-navy-claro" opacidad={naceB * (1 - viaje)} giro={120} />
        <Ondas centro={ENCUENTRO} clase="stroke-rd-ayuda" opacidad={entrega} giro={240} />

        {/* Las dos gotas, fundidas por el filtro cuando se encuentran. */}
        <g filter={`url(#${gota})`}>
          <circle cx={posA.x} cy={posA.y} r={RADIO * nace * crece} style={{ fill: color('--color-rd-coral') }} />
          <circle cx={posB.x} cy={posB.y} r={RADIO * naceB * crece} style={{ fill: color('--color-rd-navy-claro') }} />
        </g>

        {/* El sello y el visto de la entrega. El visto va en el fondo de la página y no en blanco:
            sobre el amarillo, el blanco no se leía. */}
        <path d={SELLO} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - sello} className="fill-none stroke-rd-ayuda" strokeWidth={2} strokeLinecap="round" />
        <path d={VISTO} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - visto} className="fill-none stroke-rd-noche" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Las tarjetas, islas de la herramienta. */}
      {/* Por fracciones del lienzo y no en píxeles: el lienzo mide de 350 a 630. */}
      {/* En un lienzo de teléfono (menos de 448 de ancho) las tarjetas, que no se encogen con él,
          tapaban las gotas: ahí van al 75 % y cada una al lado contrario de su gota (7 de octubre
          de 2026, la lógica del teléfono). */}
      <div className="absolute bottom-3/50 left-1/20 @max-md:right-1/20 @max-md:left-auto @max-md:origin-bottom-right @max-md:scale-75" style={tarjeta(tramo(e, 0.3, 0.6), tramo(e, 1.6, 1.85))}>
        <Tarjeta tono="necesidad" {...TARJETAS.necesidad} />
      </div>
      <div className="absolute top-3/50 right-1/20 @max-md:right-auto @max-md:left-1/20 @max-md:origin-top-left @max-md:scale-75" style={tarjeta(tramo(e, 1.25, 1.5), tramo(e, 1.6, 1.85))}>
        <Tarjeta tono="oferta" {...TARJETAS.oferta} />
      </div>
      <div className="absolute bottom-2/25 left-1/2 -translate-x-1/2 @max-md:right-1/20 @max-md:left-auto @max-md:translate-x-0 @max-md:origin-bottom-right @max-md:scale-75" style={tarjeta(tramo(e, 2.45, 2.75))}>
        <Tarjeta tono="entrega" rotulo="" {...TARJETAS.entrega} />
      </div>
    </div>
  );
};

const Tarjeta: React.FC<{ tono: 'necesidad' | 'oferta' | 'entrega'; rotulo: string; titulo: string; detalle: string }> = ({
  tono,
  rotulo,
  titulo,
  detalle,
}) => (
  <div className="font-rd flex max-w-56 items-start gap-2.5 rounded-rd-lg border border-rd-line bg-rd-surface px-3 py-2.5 shadow-rd-2">
    {tono === 'entrega' ? (
      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-rd-ayuda text-rd-noche">
        <Check className="h-3 w-3" />
      </span>
    ) : (
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tono === 'necesidad' ? 'bg-rd-coral' : 'bg-rd-navy'}`} />
    )}
    <span className="min-w-0">
      {rotulo && (
        <span className={`block text-rd-11 font-semibold ${tono === 'necesidad' ? 'text-rd-coral-ink' : 'text-rd-navy'}`}>{rotulo}</span>
      )}
      <span className="block text-rd-12-5 leading-snug font-semibold text-rd-ink">{titulo}</span>
      <span className="mt-0.5 flex items-center gap-1 text-rd-11-5 text-rd-ink-meta">
        {tono === 'necesidad' && <MapPin className="h-3 w-3 shrink-0" />}
        {detalle}
      </span>
    </span>
  </div>
);
