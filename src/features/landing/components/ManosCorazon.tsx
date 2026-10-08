import React, { useId } from 'react';
import { azar, pasarPor, temblar, trazar, type Punto } from '../trazoAMano';

/**
 * La ilustración del hero: dos manos que hacen un corazón, en una sola línea (Alejandro, 7 de
 * octubre de 2026: «que en vez de una fotografía sea una ilustración de dos manos haciendo la forma
 * de un corazón (similar a la del botón) pero que sea como una ilustración de una sola linea, o sea
 * una sola linea hace toda la ilustración completa como si "no se despegara el lapiz del papel"»).
 *
 * El gesto de las dos manos que se juntan en corazón, vistas de frente. Una sola línea, sin
 * levantar el lápiz, con este recorrido:
 * 1. Sube por el borde de afuera del antebrazo izquierdo y de la mano (el lado del meñique).
 * 2. Pasa por los tres dedos doblados (meñique, anular, medio), uno por bulto.
 * 3. Llega al índice, que se curva hasta tocar el otro en el centro. Las dos puntas quedan como
 *    dos rayas que se tocan.
 * 4. Por dentro dibuja el corazón que dejan los índices y los pulgares y llega a la punta de abajo,
 *    donde se tocan los pulgares.
 * 5. Baja por el borde del pulgar y de la palma hasta la muñeca, y cruza por debajo hacia la otra.
 * 6. Hace lo mismo al revés con la mano derecha y sale por su antebrazo.
 * El cruce de abajo queda fuera de la vista: el dibujo se desvanece antes, como si la línea siguiera
 * fuera del papel (`mascara`).
 *
 * Es simétrica: se dibuja la mitad izquierda y la derecha es su espejo, así no queda torcida. Las
 * dos versiones anteriores salieron feas: el icono del apretón de manos en un trazo y un corazón
 * con dos tallos (Alejandro: «quedó horrible el hero»).
 *
 * Se dibuja al cargar, como si alguien la trazara (`.rd-trazo-continuo`); con movimiento reducido
 * aparece hecha. Es decorativa (`aria-hidden`).
 */

const ANCHO = 600;
const ALTO = 620;

type Par = [number, number];

/* La mitad izquierda, en el orden del recorrido. */
const AFUERA: Par[] = [
  [165, 690], [168, 600], [166, 540], [150, 480], [135, 422], [128, 372], [130, 332],
  /* Los tres dedos doblados. */
  [126, 306], [132, 283], [150, 271], [148, 254], [160, 237], [180, 229], [183, 213], [201, 198], [224, 194],
  /* El índice, hasta tocar el otro en el centro. */
  [234, 181], [256, 172], [279, 176], [294, 190], [299, 208],
];
const PUNTA: Par[] = [[298, 234]];
const ADENTRO: Par[] = [
  [284, 223], [262, 217], [240, 223], [224, 241], [217, 265], [220, 291], [232, 319], [250, 347], [271, 373],
  [290, 395], [300, 410],
];
/* El pulgar se abre hacia la palma enseguida: bajando derecho, los dos pulgares hacían un reloj de
   arena. */
const PULGAR: Par[] = [[284, 424], [262, 437], [241, 455], [226, 482], [219, 516], [219, 556], [222, 610], [226, 690]];
/* El cruce de una muñeca a la otra, fuera de la vista. */
const CRUCE: Par[] = [[270, 730], [300, 738]];

const espejo = ([x, y]: Par): Par => [ANCHO - x, y];
const alReves = (pts: Par[]) => [...pts].reverse();

const RECORRIDO: Punto[] = [
  ...AFUERA,
  ...PUNTA,
  ...ADENTRO,
  ...PULGAR,
  ...CRUCE,
  ...alReves(CRUCE).slice(1).map(espejo),
  ...alReves(PULGAR).map(espejo),
  ...alReves(ADENTRO).slice(1).map(espejo),
  ...PUNTA.map(espejo),
  ...alReves(AFUERA).map(espejo),
].map(([x, y]) => ({ x, y }));

const TRAZO = trazar(temblar(pasarPor(RECORRIDO, 12), 1.1, azar(17)));

export const ManosCorazon: React.FC<{ className?: string }> = ({ className = '' }) => {
  const id = useId();
  const mascara = `manos-${id}`;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${ANCHO} ${ALTO}`} className={className}>
      <defs>
        {/* Los antebrazos se desvanecen antes del borde de abajo: la línea sigue fuera del papel. */}
        <linearGradient id={`${mascara}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.78" stopColor="#fff" />
          <stop offset="0.97" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={mascara} maskUnits="userSpaceOnUse" x={0} y={0} width={ANCHO} height={ALTO}>
          <rect width={ANCHO} height={ALTO} fill={`url(#${mascara}-g)`} />
        </mask>
      </defs>
      <path
        d={TRAZO}
        mask={`url(#${mascara})`}
        pathLength={1}
        strokeDasharray="1 1"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rd-trazo-continuo fill-none stroke-rd-noche-tinta"
      />
    </svg>
  );
};
