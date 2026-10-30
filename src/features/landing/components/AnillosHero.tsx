import React, { useEffect, useRef, useState } from 'react';
import { useConsulta } from '../useConsulta';

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
 * hero termina.
 *
 * EN EL TELÉFONO. Hasta el 7 de octubre de 2026 iban solo desde 1024, como la gota con la foto, y
 * en el teléfono el hero era el fondo liso (Alejandro, 6 de octubre de 2026). Ese 7, sobre el hero
 * del teléfono ya centrado: «el fondo se ve vacío». En escritorio los anillos le dan un centro al
 * texto centrado, y en el teléfono le faltaba: ahora van en todos los anchos. Debajo de 1024 van
 * los cinco de adentro (`JUEGOS_CHICOS`). La gota sigue solo en escritorio.
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
const juegos = (anillos: string[]) => [
  { anillos: anillos.filter((_, i) => i % 2 === 0), giro: 'rd-gira' },
  { anillos: anillos.filter((_, i) => i % 2 === 1), giro: 'rd-gira rd-gira-inverso' },
];
const JUEGOS = juegos(ANILLOS);

/* Debajo de 1024 (ver EN EL TELÉFONO), los seis de adentro, al 55 %: cada 60 en vez de cada 110,
   así caben cinco alrededor del texto antes de que la máscara los apague (a 110, en un teléfono
   se veía uno solo). Son los mismos trazos; el SVG recorta alrededor del centro (`viewBox`) y se
   pinta más chico, y la línea se queda en 1,5 (`non-scaling-stroke`). Mide 759 de lado y no
   2.700, que en una pantalla de 3× eran dos capas de 8.100 px girando. */
const CUANTOS_CHICO = 6;
const LADO_CHICO = 2 * (RADIO_INICIAL + PASO * (CUANTOS_CHICO - 1)) + 40;
const ESCALA_CHICA = 0.55;
const JUEGOS_CHICOS = juegos(ANILLOS.slice(0, CUANTOS_CHICO));

/**
 * Onda expansiva de sonar: una sola línea sutil trazada a mano con la misma fórmula
 * exacta (`trazado`) de los 12 anillos concéntricos del radar, garantizando 100% de
 * armonía geométrica, finura y sincronía concéntrica con el fondo.
 */
const ONDA_SONAR_A = trazado(RADIO_INICIAL, azar(101));
const ONDA_SONAR_B = trazado(RADIO_INICIAL, azar(202));

/**
 * Puntos aleatorios (blips) en el radar del hero:
 * Aparecen en posiciones variables exclusivamente con el paso de cada onda expansiva,
 * iluminándose y desvaneciéndose en armonía con el pulso del sonar.
 */
interface PuntoRadar {
  id: string;
  x: number;
  y: number;
  tipo: 'ayuda' | 'necesidad';
  delay: number;
}

const generarPuntos = (): PuntoRadar[] => {
  const rMin = 160;
  const rMax = 360;
  // 4 sectores diagonales (25°, 115°, 205°, 295°) para flanquear armónicamente el titular
  const sectores = [25, 115, 205, 295];

  return sectores.map((baseAngulo, idx) => {
    const angulo = baseAngulo + (Math.random() * 50 - 25);
    const rad = (angulo * Math.PI) / 180;
    const radio = rMin + Math.random() * (rMax - rMin);
    const x = Math.round(radio * Math.cos(rad));
    const y = Math.round(radio * Math.sin(rad));
    // Demora proporcional al radio para que coincida exactamente con la onda expansiva
    const fraccion = (radio - rMin) / (rMax - rMin);
    const delay = Number((0.6 + fraccion * 2.2).toFixed(2));
    const tipo: 'ayuda' | 'necesidad' = idx % 2 === 0 ? 'ayuda' : 'necesidad';

    return {
      id: `${idx}-${x}-${y}-${Date.now()}-${Math.random().toFixed(3)}`,
      x,
      y,
      tipo,
      delay,
    };
  });
};

export const AnillosHero: React.FC = () => {
  const caja = useRef<HTMLDivElement>(null);
  const [fuera, setFuera] = useState(false);
  const chico = useConsulta('(width < 64rem)', false);
  const lado = chico ? LADO_CHICO : LADO;
  const desde = CENTRO - lado / 2;
  const anchoPx = chico ? Math.round(lado * ESCALA_CHICA) : lado;

  const [puntosA, setPuntosA] = useState<PuntoRadar[]>([]);
  const [puntosB, setPuntosB] = useState<PuntoRadar[]>([]);
  const [claveA, setClaveA] = useState(0);
  const [claveB, setClaveB] = useState(0);

  /* Fuera de la pantalla las animaciones se pausan. */
  useEffect(() => {
    const c = caja.current;
    if (!c || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setFuera(!e.isIntersecting));
    io.observe(c);
    return () => io.disconnect();
  }, []);

  /* Sincronización de puntos aleatorios con cada nueva onda expansiva (solo en escritorio) */
  useEffect(() => {
    if (fuera || chico) {
      setPuntosA([]);
      setPuntosB([]);
      return;
    }

    // Onda A: lote inicial al arrancar
    setPuntosA(generarPuntos());
    setClaveA((c) => c + 1);

    // Onda B: primer lote desfasado 4 segundos
    const timerPrimerB = setTimeout(() => {
      setPuntosB(generarPuntos());
      setClaveB((c) => c + 1);
    }, 4000);

    // Cada 8s se renuevan los puntos de la Onda A
    const intervaloA = setInterval(() => {
      setPuntosA(generarPuntos());
      setClaveA((c) => c + 1);
    }, 8000);

    // Cada 8s se renuevan los puntos de la Onda B (desfasada 4s)
    let intervaloB: ReturnType<typeof setInterval>;
    const timerInicioCicloB = setTimeout(() => {
      intervaloB = setInterval(() => {
        setPuntosB(generarPuntos());
        setClaveB((c) => c + 1);
      }, 8000);
    }, 4000);

    return () => {
      clearTimeout(timerPrimerB);
      clearTimeout(timerInicioCicloB);
      clearInterval(intervaloA);
      if (intervaloB) clearInterval(intervaloB);
    };
  }, [fuera, chico]);

  return (
    <div
      ref={caja}
      aria-hidden="true"
      data-quieto={fuera ? '' : undefined}
      className="rd-hero-anillos pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* 1. Pulso de sonar: una sola línea sutil, fina y concéntrica con los anillos */}
      <svg
        aria-hidden="true"
        className="rd-hero-sonar pointer-events-none absolute top-1/2 left-1/2 overflow-visible"
        width={anchoPx}
        height={anchoPx}
        viewBox={`${desde} ${desde} ${lado} ${lado}`}
      >
        <path
          d={ONDA_SONAR_A}
          className="fill-none stroke-rd-ayuda"
          strokeOpacity={0.32}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <svg
        aria-hidden="true"
        className="rd-hero-sonar rd-hero-sonar-retraso pointer-events-none absolute top-1/2 left-1/2 overflow-visible"
        width={anchoPx}
        height={anchoPx}
        viewBox={`${desde} ${desde} ${lado} ${lado}`}
      >
        <path
          d={ONDA_SONAR_B}
          className="fill-none stroke-rd-ayuda"
          strokeOpacity={0.32}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* 2. Anillos concéntricos sinuosos dibujados a mano */}
      <div className="rd-hero-anillos-pulso pointer-events-none absolute inset-0">
        {(chico ? JUEGOS_CHICOS : JUEGOS).map((j) => (
          <svg
            key={j.giro}
            className={`${j.giro} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
            width={anchoPx}
            height={anchoPx}
            viewBox={`${desde} ${desde} ${lado} ${lado}`}
          >
            {j.anillos.map((d) => (
              <path key={d.slice(0, 24)} d={d} className="fill-none stroke-rd-noche-anillo" strokeWidth={TRAZO} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
        ))}
      </div>

      {/* 3. Puntos aleatorios del radar (solo en escritorio, con brillo sutil y suave) */}
      {!chico && (
        <>
          <div key={`lote-a-${claveA}`} className="pointer-events-none absolute inset-0">
            {puntosA.map((p) => {
              const esAyuda = p.tipo === 'ayuda';
              return (
                <div
                  key={p.id}
                  className="rd-blip-item pointer-events-none"
                  style={{
                    left: `calc(50% + ${p.x}px)`,
                    top: `calc(50% + ${p.y}px)`,
                    animationDelay: `${p.delay}s`,
                  }}
                >
                  <div
                    className={`rd-blip-ripple ${esAyuda ? 'border-rd-amber-claro/60' : 'border-rd-coral/60'}`}
                    style={{ animationDelay: `${p.delay}s` }}
                  />
                  <div
                    className={`rd-blip-glow ${esAyuda ? 'bg-rd-amber-claro/20' : 'bg-rd-coral/20'}`}
                  />
                  <div
                    className={`rd-blip-core ${esAyuda ? 'bg-rd-amber-claro shadow-[0_0_6px_rgba(251,176,0,0.5)]' : 'bg-rd-coral shadow-[0_0_6px_rgba(228,84,79,0.5)]'}`}
                  />
                </div>
              );
            })}
          </div>

          <div key={`lote-b-${claveB}`} className="pointer-events-none absolute inset-0">
            {puntosB.map((p) => {
              const esAyuda = p.tipo === 'ayuda';
              return (
                <div
                  key={p.id}
                  className="rd-blip-item pointer-events-none"
                  style={{
                    left: `calc(50% + ${p.x}px)`,
                    top: `calc(50% + ${p.y}px)`,
                    animationDelay: `${p.delay}s`,
                  }}
                >
                  <div
                    className={`rd-blip-ripple ${esAyuda ? 'border-rd-amber-claro/60' : 'border-rd-coral/60'}`}
                    style={{ animationDelay: `${p.delay}s` }}
                  />
                  <div
                    className={`rd-blip-glow ${esAyuda ? 'bg-rd-amber-claro/20' : 'bg-rd-coral/20'}`}
                  />
                  <div
                    className={`rd-blip-core ${esAyuda ? 'bg-rd-amber-claro shadow-[0_0_6px_rgba(251,176,0,0.5)]' : 'bg-rd-coral shadow-[0_0_6px_rgba(228,84,79,0.5)]'}`}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
