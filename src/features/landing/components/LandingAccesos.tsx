import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { House, MapPin, Users, X } from 'lucide-react';
import { VisualAcceso, type VistaAcceso } from './VisualesAccesos';
import { BotonLanding, claseBotonIcono } from './base';
import { PASO_POR_VISTA, useRecorrido } from '../useRecorrido';
import { useConsulta } from '../useConsulta';

/**
 * Las tres puertas del producto, rehechas el 6 de octubre de 2026 con el contenedor de la segunda
 * sección de Calendly: un panel de color que se monta sobre el final del hero, con las pestañas de
 * icono por fuera de una tarjeta blanca que lleva el texto a la izquierda y el visual a la
 * derecha. Lo que pidió Alejandro, en sus palabras:
 *
 * - «ese contenedor de la sección lo ideal es que se viera sobrepuesta», sin el degradado crema
 *   que había detrás de las tres tarjetas.
 * - «inicia con un ancho de 8 columnas. Cuando entra completa la sección 2 […] pasa a las 12».
 * - «los 3 contenidos de información […] se divida internamente en 3 visualizaciones
 *   independientes», que cambian con las pestañas o con el scroll.
 * - «darle x al botón de la superior derecha y él te cierra el contenedor principal y te lleva a
 *   la sección 3».
 *
 * Ese mismo día, sobre esa primera versión, que llevaba las pestañas en fila encima de la tarjeta
 * unidas a ella por un pico blanco: la unión «queda muy muy literal como Calendly», y luego «los
 * tabs que iban en el header pasan a la izquierda en una versión vertical. Pero se mantienen solo
 * como iconos. Los tabs están por fuera del contenedor principal como estaba antes pero en el lado
 * izquierdo y esos solo se visualizan cuando se amplía el fondo de esa sección», «la distribución
 * interna de la card debe ser igual que como la teníamos antes porque funcionaba muy bien», y
 * «la línea que muestra el tiempo que se demora en cambiar a la siguiente subsección […] que sea
 * alrededor de la card y así mostramos el progreso». Por eso:
 *
 * - Las pestañas son una columna de baldosas a la izquierda de la tarjeta, sobre el color, sin
 *   pico. Con el recorrido aparecen al terminar de abrirse el panel y se van al empezar a
 *   cerrarse (`--rd-abre`, que escribe `useRecorrido`).
 * - La tarjeta es la de la primera versión, igual por dentro.
 * - Una línea recorre el contorno de la tarjeta mientras dura cada vista.
 *
 * Y sobre el color: los pasteles de tres tonos «son muy muy parecidos a los de Calendly, o sea
 * literal parece Calendly y no RaDAR». Cada vista lleva el color que ya significa algo en la
 * herramienta («semántica de la app»): el Radar en navy, el Directorio en ámbar y Mi organización
 * en verde. Desde la tarde del 6 de octubre de 2026 ese color vive solo en las pestañas y en el
 * fondo del visual, que va en sólido: el panel no lleva relleno, solo un trazo blanco con el borde
 * líquido de la gota del hero, y la línea de avance de la tarjeta es igual (Alejandro: «el
 * contenedor principal no tenga color. solo el stroke en blanco pero con el mismo estilo
 * ligeramente sinuoso del liquid. no puede ser exagerado con la animación. igual el stroke del
 * progreso en la card interna»). La esquina del panel es la de los botones, 16 (`rd-xl`).
 *
 * Lo que no cambia de tamaño es la tarjeta: crece el panel a su alrededor, igual que en la
 * referencia (en sus dos capturas la tarjeta mide lo mismo con el panel estrecho y abierto).
 *
 * El texto de cada vista es el que ya tenían las tres tarjetas —nombre, frase y las tres líneas
 * de detalle—, sin afirmaciones nuevas.
 */

type Tono = 'navy' | 'ambar' | 'verde';

const VISTAS: {
  id: VistaAcceso;
  nombre: string;
  texto: string;
  detalle: string[];
  href: string;
  enlace: string;
  Icono: typeof MapPin;
  tono: Tono;
}[] = [
  {
    id: 'radar',
    nombre: 'Radar',
    texto: 'Lo que hace falta y lo que hay para dar, sobre el mapa de tu ciudad.',
    detalle: ['Necesidades y ofertas en el mismo mapa', 'Filtros por recurso, zona y distancia', 'Aviso cuando algo encaja con lo tuyo'],
    href: '/mapa-ayudas-necesidades',
    enlace: 'Ir al Radar',
    Icono: MapPin,
    tono: 'navy',
  },
  {
    id: 'directorio',
    nombre: 'Directorio',
    texto: 'Quién está respondiendo, en qué zona y desde cuándo.',
    detalle: ['Organizaciones y comunidades verificadas', 'Qué atiende cada una y dónde', 'Contacto directo, sin intermediarios'],
    href: '/directorio',
    enlace: 'Ir al Directorio',
    Icono: Users,
    tono: 'ambar',
  },
  {
    id: 'panel',
    nombre: 'Mi organización',
    texto: 'Tus publicaciones, tu equipo y la constancia de cada entrega.',
    detalle: ['Tablero de lo que entregas y recibes', 'Acta firmada por las dos partes', 'Tu equipo y lo que puede hacer cada uno'],
    href: '/panel',
    enlace: 'Ir a Mi organización',
    Icono: House,
    tono: 'verde',
  },
];

/* Cada vista en el color que ya significa algo en la herramienta (Alejandro, 6 de octubre de 2026:
   «semántica de la app»): el navy de la marca y del Radar, el ámbar de los avisos del Directorio y
   el verde de lo entregado. Dos escalones de cada familia en el tema oscuro: el claro (`icono`,
   que es también el fondo sólido del visual en `VisualesAccesos`) y la línea oscura (`relleno`).

   Los iconos de las pestañas van pintados en su tono: es la excepción aprobada a la regla de
   iconos sin color (Alejandro, 6 de octubre de 2026: «hazlo pintado el icono»). Desde el tema
   oscuro de ese mismo día, la activa se rellena de la línea oscura de su familia y lleva el icono
   en el tono claro. Contraste del icono sobre su relleno, medido: navy 3,4:1, ámbar 5,9:1, verde
   5,0:1, por encima del 3:1 que pide un gráfico. Las inactivas van sin fondo, con el borde y el
   icono en la tinta de la página (Alejandro, 6 de octubre de 2026: «los tabs de icono podemos
   dejarlo sin fondo cuando no estén seleccionados. y dejar solo el borde y el icono en blanco»).
   La línea de avance va en el claro de su vista (`avance`; ese mismo día: «la linea de progreso
   ponga en el color que corresponde a la subsección»), sobre un riel en la tinta de la página. */
const TONOS: Record<Tono, { relleno: string; icono: string; avance: string }> = {
  navy: { relleno: 'bg-rd-navy-noche-linea', icono: 'text-rd-navy-claro', avance: 'fill-rd-navy-claro' },
  ambar: { relleno: 'bg-rd-amber-noche-linea', icono: 'text-rd-amber-claro', avance: 'fill-rd-amber-claro' },
  verde: { relleno: 'bg-rd-green-noche-linea', icono: 'text-rd-green-claro', avance: 'fill-rd-green-claro' },
};

/* El borde líquido del panel y de la línea de avance: la receta del anillo de la gota del hero
   (`VentanaLiquida`). No se ondula un trazo sino la forma rellena: el panel o la tarjeta en
   blanco se desenfocan, una onda de ruido desplaza ese campo, se alisa, y dos umbrales lo cortan
   —uno da el borde por fuera y otro, un poco más alto, el mismo borde 2 px más adentro—; lo que
   queda entre los dos es el trazo. Chrome desplaza tomando el píxel más cercano: una primera
   versión ondulaba un trazo de 2 casi sin desenfocar y el borde salía en escalera, dentado como a
   mano alzada (captura del 6 de octubre de 2026). Sobre un campo ancho, el salto de un píxel
   apenas cambia su valor y el alisado lo borra. La onda es larga y baja —olas de unos 80 px que
   mueven el borde 1 o 2 px, 3 como mucho— porque Alejandro la quiere «ligeramente sinuoso» y «no
   puede ser exagerado con la animación»: la fuerza es 6 y no los 8 de la gota, porque en una recta
   de 1300 px la misma onda se lee más que alrededor de un círculo.

   Se mueve trasladando el ruido, no cambiándole la frecuencia como en la gota: en un trazo de 1300
   px de largo, cambiar la frecuencia agita poco el borde cerca del origen y mucho en la otra
   punta. Trasladado, las olas corren despacio a lo largo de todo el borde a la misma velocidad,
   como agua que se mueve en el vaso: 24 px de ida y vuelta en 17 s en horizontal y en 23 s en
   vertical, que no coinciden nunca y no dejan ver el ciclo. El ruido llena la región del filtro,
   que pasa un 10 % el borde del elemento, y la traslación no vacía más que esos 24 de su orilla,
   lejos del trazo.

   La traslación la escribe un reloj 15 veces por segundo (`CADA_MS`), no la animación del SVG a 60:
   cada paso rehace el filtro sobre todo el panel, y a 60 la sección bajaba a 20 cuadros por
   segundo (medido en Chrome sin pantalla a 1440 × 900 el 6 de octubre de 2026; con el borde
   quieto, 57). El borde se mueve unos 3 px por segundo, así que cada paso es de 0,2 px y no se ve
   el salto. El borde y la línea de avance van además en su propia capa (`will-change`), para que
   su repintado no arrastre a la tarjeta y a los fondos de los visuales.

   Los números, con la misma cuenta que la gota: desenfoque de 4 y alisado de 1,5, que suman 4,27;
   ahí el borde de una forma recta cambia 0,093 de campo por píxel. El umbral de fuera es el de la
   gota, 0,46, que deja el borde a 0,4 px de donde estaba; el de dentro está 2 px de campo más
   arriba (0,46 + 2 × 0,093), y la pendiente de 11 hace que cada borde pase de 0 a 1 en un píxel.
   Desenfoque de 4 y no de 9 como la gota: el filtro cubre el panel entero, unos 1300 × 800, y
   un desenfoque más ancho cuesta más en cada cuadro sin que se note en un borde casi recto. */
const LIQUIDO = 'rd-accesos-liquido';
const CADA_MS = 1000 / 15;
const CAMPO_POR_PX = 0.093;
const PENDIENTE = 11;
const NIVEL = 0.46;
const TRAZO = 2;
const umbral = (nivel: number, pendiente = PENDIENTE) =>
  `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${pendiente} ${(0.5 - pendiente * nivel).toFixed(3)}`;

/* El trazo a mano de lo que se mueve en los fondos de los visuales (`VisualesAccesos`): la misma
   receta que el borde del panel, a la escala de una ficha de 36 px (Alejandro, 6 de octubre de
   2026: «me gustaría que las animaciones dentro de los contenedores/fondo tuvieran como este mismo
   estilo visual de handraw […] Quiero en ambos algo clean, sutil. pero que le de más taste a ese
   estilo porque aún lo siento muy plano»). Dos filtros: `trazo` deja solo el borde, de 1,75 px,
   como un círculo dibujado a pulso; `relleno` deja la forma entera con el borde ondulado, como una
   mancha de tinta. Los dos quietos: el movimiento ya lo ponen las animaciones de cada fondo.

   Ondas más cortas y más bajas que las del panel —unos 22 px y 1 px, 2 como mucho—, porque en una
   ficha de 36 una ola de 80 no se vería. Desenfoque de 2 y alisado de 0,8, que suman 2,15: ahí el
   borde cambia 0,185 de campo por píxel, y la pendiente de 5,4 lo pasa de 0 a 1 en un píxel.
   Con un solo ruido todas las fichas saldrían con el mismo temblor, como sellos: cada pieza va
   girada un ángulo distinto (`GIROS` en `VisualesAccesos`), y en un círculo el giro solo se nota
   en dónde caen las ondas.

   La región pasa del 10 % de siempre a un 60 % a los lados y un 30 % arriba y abajo: el
   desenfoque y la onda salen hasta 8 px de la pieza, y en una barra de 14 de ancho el 10 % se
   comía el borde. */
const MANO_CAMPO_POR_PX = 0.185;
const MANO_PENDIENTE = 5.4;
const MANO_TRAZO = 1.75;

/* Desde 1024 las pestañas son una columna a la izquierda de la tarjeta; por debajo, una fila
   encima de ella. Es el mismo `lg:` de las clases: el lector de pantalla tiene que oír la
   orientación que se ve. */
const CONSULTA_COLUMNA = '(min-width: 1024px)';
/* Con movimiento reducido el borde líquido se queda con su forma, sin correr. */
const CONSULTA_REDUCIDO = '(prefers-reduced-motion: reduce)';

export const LandingAccesos: React.FC = () => {
  const [activa, setActiva] = useState(0);
  const [quieto, setQuieto] = useState(false);
  const columna = useConsulta(CONSULTA_COLUMNA, true);
  const reducido = useConsulta(CONSULTA_REDUCIDO, false);

  const seccion = useRef<HTMLElement>(null);
  const fijo = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const deriva = useRef<SVGFEOffsetElement>(null);

  const { fijado, irA, cerrar } = useRecorrido({ seccion, fijo, panel, vistas: VISTAS.length, activa, alCambiar: setActiva });

  /* Si el scroll cambia de vista con el foco en el enlace de la que se va, ese enlace pasa a
     `invisible`, el navegador manda el foco a `body` y se pierden el anillo y el sitio del lector
     de pantalla (6 de octubre de 2026, H12). El foco pasa al enlace de la vista que llega, sin
     desplazar. `useLayoutEffect` para moverlo antes de que el navegador lo suelte. */
  useLayoutEffect(() => {
    const p = panel.current;
    const enfocado = document.activeElement;
    if (!p || !(enfocado instanceof HTMLElement) || !p.contains(enfocado)) return;
    const suyo = enfocado.closest('[role="tabpanel"]');
    if (!suyo || suyo.getAttribute('data-activa') === 'si') return;
    p.querySelector<HTMLElement>(`#acceso-panel-${VISTAS[activa].id} a`)?.focus({ preventScroll: true });
  }, [activa]);

  /* Fuera de pantalla los fondos de los visuales y el borde líquido se detienen: el filtro del
     borde recorre todo el panel en cada cuadro y no tiene sentido que siga pintando mientras
     alguien lee el pie de la página. */
  useEffect(() => {
    const s = seccion.current;
    if (!s || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setQuieto(!e.isIntersecting), { rootMargin: '120px 0px' });
    io.observe(s);
    return () => io.disconnect();
  }, []);

  /* La deriva del borde (ver `LIQUIDO`): 24 px de ida y vuelta en 17 s en horizontal y en 23 s en
     vertical, con la curva del coseno, que arranca y llega despacio. Corre a 15 pasos por segundo
     (`CADA_MS`) y solo con la sección a la vista y sin movimiento reducido; quieta, el borde se
     queda con la forma que tenía. */
  useEffect(() => {
    const o = deriva.current;
    if (!o || quieto || reducido) return;
    const vaiven = (t: number, periodo: number) => (12 - 12 * Math.cos((2 * Math.PI * t) / periodo)).toFixed(2);
    const reloj = window.setInterval(() => {
      const t = performance.now() / 1000;
      o.setAttribute('dx', vaiven(t, 17));
      o.setAttribute('dy', vaiven(t, 23));
    }, CADA_MS);
    return () => window.clearInterval(reloj);
  }, [quieto, reducido]);

  /* Clic, toque o tecla en una pestaña. En el recorrido además lleva el scroll al tramo de esa
     vista, para que pestañas y scroll digan siempre lo mismo; sin recorrido solo cambia. */
  const cambiar = useCallback(
    (i: number) => {
      setActiva(i);
      irA(i);
    },
    [irA],
  );

  /* El teclado de `Pestanas.tsx` (flechas, Inicio y Fin, con el foco detrás), con las flechas de
     arriba y abajo de la columna. Las de los lados también valen, en las dos orientaciones, para
     quien ya las traía aprendidas de la fila. `preventScroll` porque la pestaña ya está a la vista
     y el desplazamiento lo decide `irA`. */
  const alTeclear = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = VISTAS.length;
    const k =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1) % n
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : -1;
    if (k === -1) return;
    e.preventDefault();
    cambiar(k);
    (e.currentTarget.parentElement?.children[k] as HTMLElement | undefined)?.focus({ preventScroll: true });
  };

  const tono = VISTAS[activa].tono;

  return (
    /* La sección sube sobre el hero y queda por encima de él (`z-10`): es el «sobrepuesta» que
       pidió Alejandro. En la referencia el borde del panel asoma a unos 80 de sus botones.

       Las cuentas, corregidas el 6 de octubre de 2026 (H16 y H6). El margen negativo colapsa con
       los 48 de `space-y-12` que separan el hero de la sección, así que la caja sube 48 menos que
       su margen. Sin recorrido no hay recorte y la caja es el borde: `lg:-mt-28` la sube 112 (64
       netos) y queda a 80 de los botones, montada sobre los últimos 64 del hero. En el recorrido
       lo que se ve no es la caja sino el recorte, que con el panel cerrado baja además el borde
       de arriba hasta dejar sobre la tarjeta el mismo margen que a sus lados (`--rd-vertical`,
       que escribe `useRecorrido`; 6 de octubre de 2026). `.rd-accesos-recorrido` sube la caja
       esos 112 más el recogido, así el borde visible queda a 80 de los botones y sobre los
       últimos 64 del hero a cualquier altura de ventana. Solo
       desde 1024; en teléfono no hay nada que solapar. En pantallas táctiles de 1024 o más
       también se monta, aunque ahí el hero no tiene la ventana líquida (pide puntero fino) y lo
       que queda debajo es su relleno.

       En el recorrido la sección mide el panel más un tramo por vista, y el panel va fijo dentro.
       El header (z-40) y la grilla de revisión (z-950) siguen por encima.

       `pointer-events-none` en la sección y `auto` en el panel: la caja de la sección cubre el
       final del hero aunque ahí no se pinte nada, y sin esto se tragaba el cursor de la ventana
       líquida y los clics de esa franja. El recorte del panel (`clip-path`) también recorta dónde
       recibe el cursor, así que lo que queda fuera del panel estrecho deja pasar al hero. */
    <section
      ref={seccion}
      aria-labelledby="accesos-titulo"
      data-quieto={quieto ? '' : undefined}
      className={`pointer-events-none relative z-10 ${fijado ? 'rd-accesos-recorrido' : 'lg:-mt-22'}`}
      style={fijado ? ({ ['--rd-recorrido' as string]: `${VISTAS.length * PASO_POR_VISTA * 100}svh` } as React.CSSProperties) : undefined}
    >
      {/* El titular de la sección se queda para quien navega por encabezados; en pantalla el
          panel habla por sí solo, como en la referencia, que no lleva titular encima. */}
      <h2 id="accesos-titulo" className="sr-only">
        Todo lo que hace falta, en un solo sitio
      </h2>

      {/* El filtro del borde líquido (ver `LIQUIDO`), que usan el trazo del panel y la línea de
          avance. Sin tamaño pero sin `display: none`, que en algunos navegadores apaga el filtro. */}
      <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <defs>
          <filter id={LIQUIDO}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={4} result="difuso" />
            <feTurbulence type="fractalNoise" baseFrequency={0.012} numOctaves={1} seed={7} result="ruido" />
            {/* La deriva la escribe el reloj de arriba, no React: `dx` y `dy` arrancan en 0 y React
                no los vuelve a tocar porque sus valores no cambian. */}
            <feOffset ref={deriva} in="ruido" dx={0} dy={0} result="deriva" />
            <feDisplacementMap in="difuso" in2="deriva" scale={6} xChannelSelector="R" yChannelSelector="G" result="ondulado" />
            <feGaussianBlur in="ondulado" stdDeviation={1.5} result="campo" />
            <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL)} result="fuera" />
            <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL + TRAZO * CAMPO_POR_PX)} result="dentro" />
            <feComposite in="fuera" in2="dentro" operator="out" />
          </filter>
          {(['trazo', 'relleno'] as const).map((tipo) => (
            <filter key={tipo} id={`rd-mano-${tipo}`} x="-0.6" y="-0.3" width="2.2" height="1.6" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} result="difuso" />
              <feTurbulence type="fractalNoise" baseFrequency={0.045} numOctaves={1} seed={3} result="ruido" />
              <feDisplacementMap in="difuso" in2="ruido" scale={4} xChannelSelector="R" yChannelSelector="G" result="ondulado" />
              <feGaussianBlur in="ondulado" stdDeviation={0.8} result="campo" />
              <feColorMatrix in="campo" type="matrix" values={umbral(NIVEL, MANO_PENDIENTE)} result="fuera" />
              {tipo === 'trazo' && (
                <>
                  <feColorMatrix
                    in="campo"
                    type="matrix"
                    values={umbral(NIVEL + MANO_TRAZO * MANO_CAMPO_POR_PX, MANO_PENDIENTE)}
                    result="dentro"
                  />
                  <feComposite in="fuera" in2="dentro" operator="out" />
                </>
              )}
            </filter>
          ))}
        </defs>
      </svg>

      <div ref={fijo} className={fijado ? 'sticky top-20 h-rd-accesos-panel' : ''}>
        <div className={`mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12 ${fijado ? 'h-full' : ''}`}>
          {/* El panel. En el recorrido mide 12 columnas siempre y lo que se anima es su recorte
              (`--rd-lado`, `--rd-arriba`, `--rd-abajo`, escritos por `useRecorrido`): de 8 a 12
              columnas sin recalcular el diseño en cada cuadro. */}
          {/* `data-cursor-punto`: con la flecha dentro del panel el cursor de la landing deja solo
              su punto, sin los anillos (Alejandro, 6 de octubre de 2026; ver LOS ANILLOS en
              `VentanaLiquida`). El recorte del panel también recorta dónde recibe la flecha, así
              que fuera del panel estrecho el cursor vuelve a tener sus anillos. */}
          <div
            ref={panel}
            data-cursor-punto=""
            className={`rd-accesos pointer-events-auto relative flex flex-col items-center ${
              fijado ? 'h-full justify-center' : 'px-3 py-8 sm:px-6 sm:py-12 lg:px-0 lg:py-16'
            }`}
          >
            {/* El borde del panel: un trazo blanco líquido, sin relleno (6 de octubre de 2026). Va
                sobre el recorte y viaja con él (`rd-accesos-borde`). */}
            <div aria-hidden="true" className="rd-accesos-borde rd-liquido pointer-events-none absolute" />

            {/* La X, arriba a la derecha como en la referencia. Viaja con el borde recortado del
                panel (`rd-accesos-x`) y solo se ve con el panel abierto, como en la referencia;
                con el foco del teclado se ve siempre (6 de octubre de 2026, H14). Solo en el
                recorrido: sin él no hay nada que cerrar ni que saltarse, la sección es un bloque
                más de la página y una X que solo baja confundiría.

                Va antes de las pestañas en el código porque en pantalla está arriba, en la
                esquina del panel, y así con el teclado es lo primero que se encuentra al entrar:
                quien navega con tabulador puede saltarse los tres tramos del recorrido de un solo
                golpe, y el foco sigue en la sección 3 (`cerrar`). `scroll-mt-20`, como las
                pestañas: al volver con Mayúsculas+Tab el navegador la dejaba bajo el header, que
                mide 64 (H2). Es el botón de icono de la landing (`claseBotonIcono`), el mismo del
                header y de las pestañas (6 de octubre de 2026). */}
            {fijado && (
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar y seguir"
                className={`rd-accesos-x absolute top-6 right-6 z-10 scroll-mt-20 ${claseBotonIcono()}`}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            )}

            {/* La tarjeta y sus pestañas. Esta caja mide lo que la tarjeta (8 columnas desde 1024,
                `rd-accesos-ancho`) y es lo que `useRecorrido` mide para saber si cabe en el panel
                fijo: desde 1024 las pestañas van fuera de ella, a su izquierda, y no le suman alto. */}
            <div className="rd-accesos-ancho relative w-full">
              {/* Las pestañas, solo iconos (6 de octubre de 2026). Desde 1024, una columna fuera de
                  la tarjeta, sobre el color, a 24 de su borde (el hueco de la grilla) y centrada
                  en su alto (Alejandro, ese mismo día: «los iconos tabs que queden justificados al
                  medio de la altura de la card»; antes iban alineadas con su borde de arriba). El
                  centrado va con `translate` y el deslizamiento con `transform`, que se suman. Con
                  el recorrido entra deslizándose desde la tarjeta mientras el panel termina de
                  abrirse y sale al empezar a cerrarse, atada al scroll (`rd-accesos-pestanas`);
                  con el foco del teclado se ve siempre, como la X (H14). `z-10` para que el
                  nombre de la pestaña, que se asoma sobre la tarjeta, no quede debajo de ella.

                  Por debajo de 1024 la columna no cabe: a 768 al panel le sobran 24 a cada lado
                  de la tarjeta y a 390, 12. Ahí va como fila encima de la tarjeta, siempre a la
                  vista (sin recorrido no hay apertura que esperar), con botones de 48, por encima
                  del mínimo táctil de 44 (`rd-tactil`). 16 entre una y otra, el mismo aire que se
                  veía entre las baldosas de 56 con su marco. */}
              <div
                role="tablist"
                aria-label="Las tres pantallas de RaDAR"
                aria-orientation={columna ? 'vertical' : 'horizontal'}
                className="rd-accesos-pestanas mx-auto mb-4 flex w-fit gap-4 lg:absolute lg:top-1/2 lg:right-full lg:z-10 lg:mr-6 lg:mb-0 lg:-translate-y-1/2 lg:flex-col"
              >
                {VISTAS.map((v, i) => {
                  const sel = i === activa;
                  return (
                    /* El botón de icono de la landing (`claseBotonIcono`), el mismo del header y de
                       la X (Alejandro, 6 de octubre de 2026: «unifica para consistencia»). Sin
                       elegir, solo el borde y el icono en la tinta de la página; elegida, el
                       relleno de su tono sin borde. El nombre va
                       en `aria-label` y, para quien ve, en una etiqueta que asoma a la derecha al
                       pasar el cursor o con el foco del teclado, solo en la columna; en la fila
                       del teléfono lo dice el rótulo de la tarjeta, justo debajo. `scroll-mt-20`:
                       al enfocarla con el teclado el navegador no la deja bajo el header (H2). */
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      id={`acceso-pestana-${v.id}`}
                      aria-selected={sel}
                      aria-controls={`acceso-panel-${v.id}`}
                      aria-label={v.nombre}
                      tabIndex={sel ? 0 : -1}
                      onClick={() => cambiar(i)}
                      onKeyDown={(e) => alTeclear(e, i)}
                      className={`group relative scroll-mt-20 ${claseBotonIcono(
                        sel ? `border-transparent ${TONOS[v.tono].relleno} ${TONOS[v.tono].icono}` : undefined,
                      )}`}
                    >
                      <v.Icono aria-hidden="true" className="h-6 w-6" />
                      <span
                        aria-hidden="true"
                        className="font-rd pointer-events-none absolute top-1/2 left-full ml-3 hidden -translate-y-1/2 rounded-rd-md bg-rd-noche-tinta px-2 py-1 text-rd-12 font-medium whitespace-nowrap text-rd-noche opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block"
                      >
                        {v.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* La tarjeta. Las tres vistas van apiladas en la misma celda y solo se ve la activa:
                  así la tarjeta mide lo que la más alta y no cambia de alto al pasar de una a
                  otra.

                  Es un `@container` porque lo que decide su interior es su propio ancho y no el
                  de la ventana: mide 611 a 1024, 733 a 1280 y 840 a 1440, y 1280 y 1440 caen en
                  el mismo punto de quiebre (`xl`). Con `xl:` a 1280 el titular salía en 28 dentro
                  de una columna de 261 y la tarjeta crecía a 508 de alto en una ventana de 800.
                  Los escalones: desde 576 el texto va al lado del visual, desde 672 sube a 24 y
                  desde 768 llega al 28 y al relleno de 48 de la referencia.

                  La columna del texto, de 2/5 como en la primera versión y desde 768 ancha lo
                  justo para que cada punto vaya en un renglón (6 de octubre de 2026, H30): el más
                  largo, «Organizaciones y comunidades verificadas», mide 285 a 14 y con su marca
                  pide 299. Con 304 fijos caben a 1366 y a 1440, y el visual se queda en 351 y 400,
                  en el mismo escalón de su maqueta que con 2/5 (85 y 90 %). Por debajo de 768 la
                  columna no se ensancha: a 1280 mide 261 y para que cupieran el visual bajaba de
                  368 a 324, y las fichas del Directorio y los pines del Radar se metían detrás de
                  la ventana (H7 y H31). Ahí, y a 1024, los puntos parten porque no caben.

                  La esquina es la del panel que la contiene y la de los botones, 16 (`rd-xl`;
                  Alejandro, 6 de octubre de 2026: «el border radius de la card con el contenido
                  de la sección 2 también debe verse coherente con el radius del contenedor
                  grande»). Era 34. */}
              <div className="@container relative grid w-full rounded-rd-xl bg-rd-noche-2">
                {VISTAS.map((v, i) => {
                  const sel = i === activa;
                  return (
                    <div
                      key={v.id}
                      id={`acceso-panel-${v.id}`}
                      role="tabpanel"
                      aria-labelledby={`acceso-pestana-${v.id}`}
                      data-activa={sel ? 'si' : 'no'}
                      className={`col-start-1 row-start-1 flex flex-col gap-6 p-5 sm:p-8 @xl:flex-row @xl:items-center @2xl:p-10 @3xl:gap-10 @3xl:p-12 ${
                        sel ? 'rd-acc-entra' : 'invisible'
                      }`}
                    >
                      <div className="flex min-w-0 flex-col @xl:w-2/5 @xl:shrink-0 @3xl:w-76">
                        <p className="font-rd m-0 flex items-center gap-2.5 text-rd-15 font-medium text-rd-noche-tinta">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-rd-md ${TONOS[v.tono].relleno}`}>
                            <v.Icono aria-hidden="true" className={`h-4 w-4 ${TONOS[v.tono].icono}`} />
                          </span>
                          {v.nombre}
                        </p>

                        <h3 className="font-rd m-0 mt-5 text-rd-24 leading-rd-titular font-medium tracking-rd-titulo text-balance text-rd-noche-tinta @xl:text-rd-22 @2xl:text-rd-24 @3xl:text-rd-28">
                          {v.texto}
                        </h3>

                        {/* Sin `text-pretty`: adelantaba el corte de un punto que cabía entero
                            para no dejar una palabra sola, y «Necesidades y ofertas en el mismo
                            mapa» partía en dos aunque el renglón de al lado, del mismo largo,
                            cupiera en uno. Y a 14 en todos los anchos: a 15 desde 768 de tarjeta
                            pedían una columna de 319, que solo cabía bajando el visual de escalón
                            (6 de octubre de 2026, H30). */}
                        <ul className="m-0 mt-5 flex list-none flex-col gap-2 p-0">
                          {v.detalle.map((d) => (
                            <li key={d} className="font-rd flex items-start gap-2.5 text-rd-14 leading-relaxed text-rd-noche-tinta-2">
                              <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-rd-noche-meta" />
                              {d}
                            </li>
                          ))}
                        </ul>

                        {/* La acción de cada vista es el botón de la landing, el mismo de los dos del
                            hero, en su nivel secundario (Alejandro, 6 de octubre de 2026: «esos
                            botones dentro de la card en cada subsección te los inventaste porque así
                            no son nuestros botones. ojo con eso. consistencia»). Hasta ese día era
                            un enlace con una raya debajo, copiado del «Learn more →» de la
                            referencia. Sigue siendo un `<a>`: lleva a otra pantalla.

                            En `md` (40) y no en `lg`: el tamaño es el peso del momento, y dentro de
                            una tarjeta va `md` (decisión 223 C1); en `lg` se leía como de primera
                            jerarquía (Alejandro, ese mismo día). El icono va antes del texto, como
                            lo documenta el botón del sistema, y es el de su vista; la flecha
                            después del texto no está documentada y salió. Con el dedo sube a 44,
                            el mínimo táctil, como el `md` del sistema. */}
                        <div className="mt-7">
                          <BotonLanding nivel="secundario" tamano="md" como="enlace" href={v.href} icono={<v.Icono className="h-4 w-4" />}>
                            {v.enlace}
                          </BotonLanding>
                        </div>
                      </div>

                      <VisualAcceso vista={v.id} className="@xl:flex-1" />
                    </div>
                  );
                })}

                {/* El avance de la vista, alrededor de la tarjeta (Alejandro, 6 de octubre de
                    2026: «la línea que muestra el tiempo que se demora en cambiar a la siguiente
                    subsección […] que sea alrededor de la card»). Con el borde líquido del panel
                    (`rd-liquido`; 6 de octubre de 2026): el contorno de la tarjeta, relleno en
                    blanco, pasa por el filtro y sale como su anillo ondulado. El riel es ese anillo
                    en la tinta de la página al 20 %, y el avance, el mismo anillo en el claro de
                    la vista (`TONOS`), recortado por una máscara: un
                    trazo ancho por el contorno, con el largo y lo recorrido que escribe
                    `useRecorrido` (`data-avance`). La máscara se aplica después del filtro, así
                    que el avance es exactamente el trozo del anillo que ya se ve. El 20 % va como
                    opacidad y no en el color por lo mismo: un blanco translúcido no pasaría el
                    umbral. Nace en la mitad del borde de abajo y va
                    hacia la izquierda, sube por el lado izquierdo, cruza el de arriba de izquierda
                    a derecha y baja por el derecho hasta volver al punto de partida (Alejandro, 6
                    de octubre de 2026: «la línea de progreso inicia en la mitad de la zona
                    inferior de la card. y avanza hacia la izquierda a derecha»; antes nacía en la
                    mitad del borde de arriba). Da la vuelta entera mientras dura el tramo de la
                    vista y en la siguiente vuelve a empezar. El contorno y el avance los escribe
                    `useRecorrido`, que mide la tarjeta. Aparece y se va con las pestañas
                    (`data-abre`). Solo con el recorrido: sin él no hay tramo que contar. No
                    recibe el cursor. */}
                {fijado && (
                  <svg aria-hidden="true" data-abre="" className="rd-accesos-progreso pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    {/* La máscara deja ver por la luz de su trazo: va en blanco fijo
                        (`rd-surface`) y no en la tinta de la página, que en el modo claro es
                        oscura y escondería el avance entero. */}
                    <defs>
                      <mask id="rd-accesos-avance">
                        <path data-avance="" className="fill-none stroke-rd-surface stroke-16" />
                      </mask>
                    </defs>
                    <path className="rd-liquido fill-rd-noche-tinta opacity-20" />
                    <path className={`rd-liquido transition-colors duration-500 ${TONOS[tono].avance}`} mask="url(#rd-accesos-avance)" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
