import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { LienzoEncuentro } from './LienzoEncuentro';
import { Parrafo, Seccion, Titular } from './base';
import { useTranslation } from '../../../i18n/LanguageContext';
import { useConsulta } from '../useConsulta';

/**
 * «Cómo funciona», rehecho el 6 de octubre de 2026 como «El encuentro» (Alejandro: «como hacemos
 * para que la sección 3 quede chimba como la 1 y 2?», y sobre la propuesta: «desarrolla el
 * encuentro a ver qué»).
 *
 * Hasta ese día era el acordeón de la sección 3 de Calendly: los tres pasos plegados a la
 * izquierda, avanzando solos cada 7 segundos, y a la derecha una foto con una pantalla que
 * cambiaba con el paso. Funcionaba, pero no hablaba el idioma que el hero y la sección 2 le dieron
 * a la landing —lo líquido, el radar, el trazo a pulso, el grano, los colores de cada vista— y el
 * visual no contaba el recorrido: eran tres fotos que se reemplazaban.
 *
 * Ahora el puente sigue igual, y debajo:
 * - A la izquierda, los tres pasos, uno debajo de otro. Los une una línea a pulso que se llena en
 *   el color de su paso mientras se lee: rojo el que reporta (la necesidad), azul el que conecta
 *   (la oferta) y el amarillo de la landing el que monitorea (lo entregado). Hasta el 7 de octubre
 *   de 2026 este último era verde; ese día la landing quedó en amarillo, azul y rojo (Alejandro:
 *   «Usa como colores el amarillo azul y rojo, pero mantén este amarillo»).
 * - A la derecha, el lienzo (`LienzoEncuentro`), contando con el scroll cómo se encuentran una
 *   necesidad y una oferta.
 * No se fija la página como en la sección 2: dos recorridos fijados seguidos cansan. Aquí se quedan
 * quietos el lienzo y el paso que se está leyendo, y el scroll es el de siempre.
 *
 * EL PASO QUE SE LEE
 * Cada paso se queda fijo en el centro de lo que se ve de la ventana (`top` de su texto, que
 * escribe `colocar`) mientras el scroll recorre el aire de debajo (`rd-paso-encuentro`, 70 % del
 * alto de la ventana): ahí su línea se llena y el lienzo cuenta su tramo. La línea se llena en el
 * 85 % de ese recorrido (`LLENO_EN`) y el resto se queda llena, para terminar de leer; después el
 * paso sube mientras entra el siguiente (Alejandro, 6 de octubre de 2026: «la lineas de progreso
 * no han terminado cuando el bloque ya desapareció del lienzo. deberías dejar que al subir se
 * quedaran un momento en el centro para poder ser leidas y ahí si que suban mientras sale la
 * siguiente»). La primera versión medía el avance por el bloque entero respecto de la mitad de la
 * ventana, y el texto se iba antes de que su línea terminara. El lienzo se centra a la misma
 * altura.
 *
 * EL RELEVO
 * Al soltarse, un paso subía pegado al siguiente, y parecía que el que entraba lo empujaba
 * (Alejandro, 7 de octubre de 2026: «parece que la sección que sale es porque la empuja la otra,
 * eso hace que no se vea tan limpio. debe verse más organico y suavizado»). Ahora:
 * - Entre un paso y el siguiente hay aire (`rd-aire-encuentro`, el relleno de arriba de cada paso
 *   desde el segundo), así nunca van pegados.
 * - El que se va sube al 60 % de la velocidad del scroll (`SUBE_A`) y se apaga en el 28 % del
 *   alto de la ventana (`SE_APAGA_EN`): se despega despacio y se desvanece, no sale empujado.
 * - El que llega se enciende mientras se acerca a su sitio, en el 40 % del alto
 *   (`SE_ENCIENDE_EN`), con una curva suave en los dos extremos.
 * Reemplaza el 40 % de opacidad fijo que llevaban los pasos que no se leían. Lo escribe el mismo
 * cuadro de animación que mide el avance; con movimiento reducido el que se va no se corre, solo
 * se apaga.
 *
 * EL CIERRE
 * La sección se va cuando termina la última línea, no antes (Alejandro, 7 de octubre de 2026: «en
 * la s3 cuando la ultima linea de progreso termine, ahí si subes la sección 3 para que cierre»).
 * El lienzo es más alto que el texto de un paso y los dos están centrados, así que el pie del
 * lienzo queda más abajo que el del texto: el lienzo se soltaba cuando su pie llegaba al final de
 * la columna, unos 150 px de scroll antes de que el último paso terminara, y la sección subía con
 * la línea a medias. Al final de la columna va un aire (`cola`) de lo que el pie del lienzo
 * sobresale del pie del último texto: así los dos se sueltan en el mismo cuadro, cuando la última
 * línea ya se llenó y se sostuvo, y la sección sube entera.
 *
 * El avance (`progreso`, de 0 a 3) se mide en un cuadro de animación por evento de scroll. Con
 * movimiento reducido el lienzo salta al final de cada paso en vez de recorrerlo, y los radares no
 * laten.
 *
 * Por debajo de 1280 no cabe un lienzo fijo al lado: los pasos no se fijan, cada uno lleva su
 * lienzo debajo, quieto en el final de su tramo, y la línea se ve llena.
 *
 * El texto de los pasos es el de siempre, de las traducciones.
 */
/* El número del nodo va en tinta sobre el rojo y el azul, y en el fondo de la página sobre el
   amarillo: en claro el amarillo baja a ámbar tinta, y la tinta no se leía encima. */
const COLORES = [
  { linea: 'stroke-rd-coral', nodo: 'border-rd-coral bg-rd-coral text-rd-ink', rotulo: 'text-rd-coral' },
  { linea: 'stroke-rd-navy-claro', nodo: 'border-rd-navy-claro bg-rd-navy-claro text-rd-ink', rotulo: 'text-rd-navy-claro' },
  { linea: 'stroke-rd-ayuda', nodo: 'border-rd-ayuda bg-rd-ayuda text-rd-noche', rotulo: 'text-rd-ayuda' },
];

const CONSULTA_ANCHO = '(min-width: 1280px)';
const CONSULTA_REDUCIDO = '(prefers-reduced-motion: reduce)';
/* El alto del header, que tapa la ventana por arriba: el centro de lo que se ve está 32 más abajo
   que el de la ventana. */
const ALTO_HEADER = 64;
/* La parte del recorrido de un paso en la que se llena su línea; el resto se queda llena. */
const LLENO_EN = 0.85;
/* El relevo entre pasos (ver EL RELEVO), en fracciones del alto de la ventana: en cuánto se apaga
   el que sale, en cuánto se enciende el que entra, y a qué parte de la velocidad del scroll sube el
   que sale. */
const SE_APAGA_EN = 0.28;
const SE_ENCIENDE_EN = 0.4;
const SUBE_A = 0.6;
/* Una curva suave entre 0 y 1: arranca y llega despacio. */
const suave = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/* La línea de cada paso: vertical, con un temblor a pulso de ±1,5 px. Va en un SVG estirado al
   alto del texto del paso (`preserveAspectRatio="none"`) con el trazo de grosor fijo, así el
   temblor de lado se queda y solo se estira el alto. */
const LINEA = (() => {
  let d = '';
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * 100;
    const x = 10 + 1.5 * Math.sin(i * 0.9) + 0.6 * Math.sin(i * 2.3 + 1);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
})();

export const LandingComoFunciona: React.FC = () => {
  const { t } = useTranslation();
  const lista = useRef<HTMLOListElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const cola = useRef<HTMLDivElement>(null);
  const [progreso, setProgreso] = useState(0);
  /* Con el lienzo fijo (desde 1280) los pasos siguen al scroll; sin él se ven todos completos. */
  const fijo = useConsulta(CONSULTA_ANCHO, true);

  const pasos = [1, 2, 3].map((n) => ({
    n,
    rotulo: t(`landingHowStep${n}Pill` as 'landingHowStep1Pill'),
    titulo: t(`landingHowStep${n}Title` as 'landingHowStep1Title'),
    texto: t(`landingHowStep${n}Desc` as 'landingHowStep1Desc'),
    puntos: [
      t(`landingHowStep${n}H1` as 'landingHowStep1H1'),
      t(`landingHowStep${n}H2` as 'landingHowStep1H2'),
      t(`landingHowStep${n}H3` as 'landingHowStep1H3'),
    ],
  }));

  /* El avance con el scroll y dónde se quedan fijos el texto de cada paso y el lienzo, solo con
     el lienzo fijo (desde 1280; ver EL PASO QUE SE LEE). */
  useEffect(() => {
    const ol = lista.current;
    const ancho = window.matchMedia?.(CONSULTA_ANCHO);
    const reducido = window.matchMedia?.(CONSULTA_REDUCIDO);
    if (!ol || !ancho) return;
    let raf = 0;
    /* Fija una caja centrada en lo que se ve de la ventana, debajo del header. Solo escribe si
       cambia, así en el scroll no vuelve a calcular el diseño. */
    const centrar = (el: HTMLElement | null) => {
      if (!el) return;
      const centro = (window.innerHeight + ALTO_HEADER) / 2;
      const tope = `${Math.round(Math.max(ALTO_HEADER + 16, centro - el.offsetHeight / 2))}px`;
      if (el.style.top !== tope) el.style.top = tope;
    };
    /* Lo que este efecto escribe a mano, borrado: por debajo de 1280 los pasos no se fijan, y lo
       escrito se quedaba si la ventana se achicaba sin recargar. */
    const limpiar = () => {
      ol.querySelectorAll<HTMLElement>('[data-paso]').forEach((texto) => {
        texto.style.top = '';
        texto.style.opacity = '';
        texto.style.transform = '';
      });
      if (lienzo.current) lienzo.current.style.top = '';
      if (cola.current) cola.current.style.height = '';
    };
    const medir = () => {
      raf = 0;
      if (!ancho.matches) {
        limpiar();
        return;
      }
      centrar(lienzo.current);
      let e = 0;
      const pasos = Array.from(ol.children);
      pasos.forEach((paso, i) => {
        const texto = paso.querySelector<HTMLElement>('[data-paso]');
        if (!texto) return;
        centrar(texto);
        /* Fijo desde que el borde de arriba del paso (pasado su aire, ver EL RELEVO) llega al tope
           de su texto hasta que el de abajo llega al pie del texto: ese es el recorrido en que se
           lee. */
        const r = paso.getBoundingClientRect();
        const aire = parseFloat(getComputedStyle(paso).paddingTop) || 0;
        const tope = parseFloat(texto.style.top);
        const recorrido = Math.max(1, r.height - aire - texto.offsetHeight);
        const leido = (tope - r.top - aire) / recorrido;
        if (leido >= 0) e = i + Math.min(1, leido / LLENO_EN);

        /* EL RELEVO: dónde está el texto respecto de su sitio fijo (sin contar lo que se le
           mueve aquí): por debajo, todavía no llega; por encima, ya se suelta. El que llega se
           enciende al acercarse; el que se va sube más despacio que el scroll y se apaga. El
           último no se apaga: sube con la sección (ver EL CIERRE). */
        const natural = r.top + aire;
        const fin = r.bottom - texto.offsetHeight;
        const desvio = natural > tope ? natural - tope : fin < tope ? fin - tope : 0;
        const alto = window.innerHeight;
        const ultimo = i === pasos.length - 1;
        /* El primero no se enciende al llegar: está ahí desde que asoma, debajo del puente. */
        const opacidad = desvio > 0 ? (i === 0 ? 1 : 1 - suave(desvio / (alto * SE_ENCIENDE_EN))) : ultimo ? 1 : 1 - suave(-desvio / (alto * SE_APAGA_EN));
        const corrido = desvio < 0 && !ultimo && !reducido?.matches ? -desvio * (1 - SUBE_A) : 0;
        const o = opacidad.toFixed(3);
        const tr = corrido ? `translateY(${corrido.toFixed(1)}px)` : '';
        if (texto.style.opacity !== o) texto.style.opacity = o;
        if (texto.style.transform !== tr) texto.style.transform = tr;
      });
      /* El cierre (ver EL CIERRE): el aire que hace falta al final para que el lienzo, que es más
         alto que el texto, no se vaya antes que el último paso. */
      const ultimo = ol.lastElementChild?.querySelector<HTMLElement>('[data-paso]');
      const l = lienzo.current;
      if (ultimo && l && cola.current) {
        const falta = `${Math.max(0, Math.round(parseFloat(l.style.top) + l.offsetHeight - (parseFloat(ultimo.style.top) + ultimo.offsetHeight)))}px`;
        if (cola.current.style.height !== falta) cola.current.style.height = falta;
      }
      if (reducido?.matches) e = e <= 0 ? 0 : Math.min(3, Math.floor(e) + 1);
      setProgreso((antes) => (Math.abs(antes - e) > 0.001 ? e : antes));
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    /* El texto de un paso cambia de alto con el idioma o al cargar la fuente. */
    const ro = new ResizeObserver(pedir);
    ro.observe(ol);
    medir();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    ancho.addEventListener('change', pedir);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      ancho.removeEventListener('change', pedir);
    };
  }, []);

  return (
    <>
      {/* El puente va dentro de la sección, encima de los pasos: enmarca lo que viene y no vende
          nada. Hasta el 7 de octubre de 2026 era una sección aparte, y entre su párrafo y el primer
          paso quedaban 236 px (Alejandro: «Los títulos de cada sección estén mas cerca del
          contenido de su sección porque se ven muy distantes»). */}
      <Seccion id="como-funciona">
        <div className="mx-auto max-w-2xl text-center">
          <Titular>
            {t('landingHowTitleBefore')}RaDAR{t('landingHowTitleAfter')}
          </Titular>
          <Parrafo className="mx-auto mt-4">
            Tres pasos: alguien dice qué le hace falta, RaDAR lo cruza con quien lo tiene, y la
            entrega queda registrada.
          </Parrafo>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-10 sm:mt-14 xl:grid-cols-2 xl:gap-20">
          <div>
          <ol ref={lista} className="m-0 list-none p-0">
            {pasos.map((p, i) => {
              const lleno = fijo ? Math.min(1, Math.max(0, progreso - i)) : 1;
              const alcanzado = !fijo || progreso > i;
              return (
                /* El paso: su texto y, debajo, el aire que el scroll recorre mientras el texto se
                   queda fijo (el espaciador del final, solo desde 1280). Desde el segundo, arriba,
                   el aire del relevo (ver EL RELEVO). La opacidad y el corrimiento del texto los
                   escribe el efecto de arriba; por debajo de 1280 todos se ven enteros. */
                <li key={p.n} className={`pb-16 xl:pb-0 ${i > 0 ? 'xl:pt-rd-aire-encuentro' : ''}`}>
                  <div data-paso="" className="relative pl-16 will-change-transform xl:sticky">
                    {/* El nodo del paso, en su color desde que se llega a él. */}
                    <span
                      className={`font-rd absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full border text-rd-13-5 font-semibold tabular-nums transition-colors duration-300 ${
                        alcanzado ? COLORES[i].nodo : 'border-rd-noche-linea text-rd-noche-meta'
                      }`}
                    >
                      {String(p.n).padStart(2, '0')}
                    </span>

                    {/* La línea del paso, a lo largo de su texto: el riel y, encima, lo leído en su
                        color. Sin el lienzo fijo se ve llena. El SVG va dentro de una caja que se
                        estira entre `top` y `bottom`: un SVG suelto no se estira así, toma el alto
                        de su proporción (la primera versión salía de 100 px). Lo leído es la línea
                        de color entera recortada por un rectángulo del alto de lo leído, y no un
                        trazo discontinuo que avanza: con el grosor fijo (`non-scaling-stroke`)
                        Chrome mide los guiones en píxeles y la línea salía punteada. */}
                    <span aria-hidden="true" className="absolute top-12 bottom-0 left-2.5 w-5">
                      <svg viewBox="0 0 20 100" preserveAspectRatio="none" className="block h-full w-full overflow-visible">
                        <defs>
                          <clipPath id={`encuentro-leido-${p.n}`}>
                            <rect x={-10} y={-1} width={40} height={lleno * 102} />
                          </clipPath>
                        </defs>
                        <path d={LINEA} className="fill-none stroke-rd-noche-linea" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                        <path
                          d={LINEA}
                          clipPath={`url(#encuentro-leido-${p.n})`}
                          className={`fill-none ${COLORES[i].linea}`}
                          strokeWidth={2}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </span>

                    <p className={`font-rd m-0 pt-2 text-rd-13-5 font-semibold ${COLORES[i].rotulo}`}>{p.rotulo}</p>
                    <h3 className="font-rd m-0 mt-2 text-rd-24 leading-rd-titular font-medium tracking-rd-titulo text-balance text-rd-noche-tinta sm:text-rd-28">
                      {p.titulo}
                    </h3>
                    <p className="font-rd m-0 mt-4 max-w-lg text-rd-15 leading-relaxed text-rd-noche-tinta-2 sm:text-rd-16">{p.texto}</p>
                    <ul className="m-0 mt-5 flex list-none flex-col gap-2.5 p-0">
                      {p.puntos.map((x) => (
                        <li key={x} className="flex items-start gap-2.5">
                          <Check aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${COLORES[i].rotulo}`} />
                          <span className="font-rd text-rd-14 leading-relaxed text-rd-noche-tinta">{x}</span>
                        </li>
                      ))}
                    </ul>

                    {/* El lienzo de este paso, solo donde no cabe el fijo. */}
                    <div className="mt-8 max-w-145 xl:hidden">
                      <LienzoEncuentro progreso={i + 1} />
                    </div>
                  </div>

                  {/* El recorrido del paso: un espaciador y no un relleno del `li`, porque lo fijo
                      solo se mueve dentro de la caja de contenido de su padre, y el relleno queda
                      fuera de ella (con relleno, la primera versión no se quedaba fija). */}
                  <div aria-hidden="true" className="hidden xl:block xl:h-rd-paso-encuentro" />
                </li>
              );
            })}
          </ol>
          {/* El aire del cierre, solo desde 1280: su alto lo escribe el efecto de arriba (ver EL
              CIERRE). */}
          <div ref={cola} aria-hidden="true" className="hidden xl:block" />
          </div>

          {/* El lienzo fijo, como el visual de 580 de la referencia, centrado a la altura del paso
              que se lee (su `top` lo escribe el efecto de arriba). */}
          <div ref={lienzo} className="sticky hidden min-w-0 xl:block">
            <LienzoEncuentro progreso={progreso} />
          </div>
        </div>
      </Seccion>
    </>
  );
};
