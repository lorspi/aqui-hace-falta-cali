import React, { useEffect, useRef, useState } from 'react';

/**
 * Los anillos del fondo del hero (Alejandro, 6 de octubre de 2026: «al hero le puedes poner sabes
 * como unas lineas asi como en el estilo del cursor. asi como con los anillos sabes? no sé... muy
 * sutil, que sea grande pero que se vea como no se, ejemplo con este negro 1E1E1E sobre el fondo
 * 000000», y luego: «está ok, pero le falta como el estilo sinuoso tipo hand draw. puede ser
 * sutilmente animado también»).
 *
 * Doce anillos concéntricos centrados en el hero, cada 110 px desde los 120 de radio, como las
 * ondas de un radar enorme detrás del titular: el mismo dibujo que el cursor, en grande y casi
 * invisible. Van en `rd-noche-anillo`, el #1E1E1E que pidió, sobre el negro de la página.
 *
 * EL TRAZO A PULSO
 * El borde ondula como el del panel de la sección 2, que es el «ligeramente sinuoso» que Alejandro
 * aprobó: olas de 80 a 130 px que lo apartan 2 o 3 px, y encima otras de 40 a 60 px de 1 px, que
 * le dan el temblor de la mano. Además cada anillo se deforma un poco entero —dos o tres jorobas
 * de menos del 0,5 % del radio—, así no son círculos perfectos uno dentro de otro. Las olas se
 * cuentan por largo y no por vuelta: un anillo grande tiene más olas que uno chico y todas miden
 * lo mismo, como un trazo hecho con la misma mano.
 * Sale del propio trazado, no de un filtro: un filtro sobre un SVG de 2.700 px costaría en cada
 * cuadro del giro, y un trazado no cuesta nada. El azar tiene semilla fija, así que el dibujo es
 * siempre el mismo.
 *
 * EL GIRO
 * Los anillos giran sobre el centro, muy despacio —una vuelta cada 15 minutos los pares y cada 19
 * los impares— y cada uno en sentido contrario al de al lado. No se ve girar: lo que se ve es que
 * las olas corren por la línea, como el agua, y que dos anillos vecinos se cruzan las ondas. En el
 * más grande la línea avanza unos 9 px por segundo, y en el más chico menos de uno.
 * Van en dos SVG superpuestos, los pares en uno y los impares en el otro, y lo que gira es cada SVG
 * entero con CSS (`rd-gira`): así el giro lo hace la tarjeta gráfica sobre una imagen ya pintada y
 * no se repinta nada en ningún cuadro. Una primera versión giraba cada anillo con una animación
 * del SVG y repintaba los doce en cada cuadro: costaba de 3 a 14 cuadros por segundo (Chrome sin
 * pantalla a 1440 × 900, 6 de octubre de 2026). Se pausa cuando el hero sale de la pantalla
 * (`data-quieto`) y no gira con movimiento reducido.
 *
 * Se desvanecen hacia los bordes del hero (`.rd-hero-anillos`) para no cortarse en seco donde el
 * hero termina. Solo desde 1024, como la gota con la foto: en el teléfono el hero es el fondo liso
 * (Alejandro, 6 de octubre de 2026).
 */

const RADIO_INICIAL = 120;
const PASO = 110;
const CUANTOS = 12;
const TRAZO = 1.5;
/* Un punto cada 5 px de línea: las olas cortas, de 40, llevan ocho. */
const CADA_PX = 5;
const RADIO_MAYOR = RADIO_INICIAL + PASO * (CUANTOS - 1);
/* El lado del SVG: el anillo mayor con aire para sus olas. */
const LADO = 2 * RADIO_MAYOR + 40;
const CENTRO = LADO / 2;

/* Un azar con semilla (Park–Miller): el mismo dibujo en cada carga y en cada navegador. */
const azar = (semilla: number) => {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/* Un anillo de radio `r` con el borde a pulso (ver EL TRAZO A PULSO). */
const trazado = (r: number, al: () => number) => {
  const largo = 2 * Math.PI * r;
  const jorobas = [2, 3].map((k) => ({ k, alto: r * (0.002 + al() * 0.003), fase: al() * Math.PI * 2 }));
  const olas = [
    { largoOla: 80 + al() * 50, alto: 2 + al() * 1 },
    { largoOla: 40 + al() * 20, alto: 0.8 + al() * 0.4 },
  ].map((o) => ({ k: Math.max(1, Math.round(largo / o.largoOla)), alto: o.alto, fase: al() * Math.PI * 2 }));
  const ondas = [...jorobas, ...olas];
  const puntos = Math.max(240, Math.round(largo / CADA_PX));
  let d = '';
  for (let i = 0; i < puntos; i++) {
    const t = (i / puntos) * Math.PI * 2;
    const radio = r + ondas.reduce((suma, o) => suma + o.alto * Math.sin(o.k * t + o.fase), 0);
    d += `${i === 0 ? 'M' : 'L'}${(CENTRO + radio * Math.cos(t)).toFixed(1)} ${(CENTRO + radio * Math.sin(t)).toFixed(1)}`;
  }
  return `${d}Z`;
};

const ANILLOS = (() => {
  const al = azar(11);
  return Array.from({ length: CUANTOS }, (_, i) => trazado(RADIO_INICIAL + PASO * i, al));
})();

/* Los dos juegos de anillos (ver EL GIRO): los pares giran a un lado y los impares al otro. */
const JUEGOS = [
  { anillos: ANILLOS.filter((_, i) => i % 2 === 0), giro: 'rd-gira' },
  { anillos: ANILLOS.filter((_, i) => i % 2 === 1), giro: 'rd-gira rd-gira-inverso' },
];

export const AnillosHero: React.FC = () => {
  const caja = useRef<HTMLDivElement>(null);
  const [fuera, setFuera] = useState(false);

  /* Fuera de la pantalla el giro se pausa. */
  useEffect(() => {
    const c = caja.current;
    if (!c || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setFuera(!e.isIntersecting));
    io.observe(c);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={caja}
      aria-hidden="true"
      data-quieto={fuera ? '' : undefined}
      className="rd-hero-anillos pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
    >
      {JUEGOS.map((j) => (
        <svg
          key={j.giro}
          className={`${j.giro} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
          width={LADO}
          height={LADO}
          viewBox={`0 0 ${LADO} ${LADO}`}
        >
          {j.anillos.map((d) => (
            <path key={d.slice(0, 24)} d={d} className="fill-none stroke-rd-noche-anillo" strokeWidth={TRAZO} />
          ))}
        </svg>
      ))}
    </div>
  );
};
