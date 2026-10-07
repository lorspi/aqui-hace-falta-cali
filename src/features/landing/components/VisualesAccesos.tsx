import React from 'react';
import { MapPin } from 'lucide-react';
import { MaquetaDirectorio, MaquetaPanel, MaquetaRadarLista } from './Maquetas';

/**
 * El visual de la derecha de cada vista de la segunda sección: un contenedor redondeado en el
 * color sólido de su vista, la maqueta de la pantalla en el centro y, detrás, algo que se mueve
 * (Alejandro, 6 de octubre de 2026: «la imagen de la derecha tiene un fondo (como contenedor), ese
 * fondo es animado, los elementos se mueven»).
 *
 * En Calendly lo de detrás son píldoras desenfocadas que se deslizan a los lados del calendario y,
 * en la tercera pestaña, barras como de onda de audio. Aquí cada fondo cuenta lo suyo en vez de
 * repetir el mismo adorno tres veces:
 *
 * - **Radar**: anillos de sonar que salen del centro y pines que flotan a los lados. Es lo que
 *   hace el Radar: escuchar alrededor de un punto.
 * - **Directorio**: columnas de fichas con iniciales que suben sin parar. Son las organizaciones
 *   que van apareciendo.
 * - **Mi organización**: barras que se llenan y se vacían. Son las entregas avanzando.
 *
 * Los colores son los de la herramienta (Alejandro, 6 de octubre de 2026: «semántica de la app»,
 * en vez de los pasteles que «parece Calendly y no RaDAR»): navy para el Radar, ámbar para el
 * Directorio y verde para Mi organización, los mismos de `TONOS` en `LandingAccesos`.
 *
 * Solo se mueve el de la vista activa (las otras están ocultas y en pausa) y solo con `transform`
 * y `opacity`. Con movimiento reducido todo queda quieto en su sitio, visible: ninguna pieza
 * parte de `opacity: 0` en su estado base.
 */

export type VistaAcceso = 'radar' | 'directorio' | 'panel';

/* El trazo a mano (Alejandro, 6 de octubre de 2026: «las animaciones dentro de los
   contenedores/fondo tuvieran como este mismo estilo visual de handraw […] algo clean, sutil»).
   Cada pieza que se mueve en un fondo es una forma rellena que un filtro de `LandingAccesos` deja
   con el borde a pulso: `rd-mano-trazo` para un círculo dibujado, `rd-mano-relleno` para una mancha
   de tinta. Las piezas iguales van giradas distinto (`GIROS`): el filtro tiene un solo ruido, y sin
   el giro todas temblarían igual, como sellos. En un círculo el giro no se ve, solo cambia dónde
   caen las ondas. Desde ese día no llevan sombra: una sombra redonda debajo de un borde a pulso lo
   desmentía. */
const GIROS = ['rotate-0', 'rotate-72', 'rotate-144', 'rotate-216', 'rotate-288'];

/** Las variables del mecanismo `.rd-bucle` de `index.css`: recorrido, duración, retraso y curva. */
const bucle = (mov: string, dur: string, esp = '0s', curva = 'ease-in-out'): React.CSSProperties => ({
  ['--rd-mov' as string]: mov,
  ['--rd-dur' as string]: dur,
  ['--rd-esp' as string]: esp,
  ['--rd-curva' as string]: curva,
});

/* ------------------------------------------------------------------ Radar ---- */

/* Un pin va entero fuera de la ventana o no se pinta: medio pin asomando se lee como un glifo
   recortado (H31, 6 de octubre de 2026; a 1440 asomaban dos, uno junto a la ventana abajo a la
   izquierda y otro detrás de la ficha). Mide 32 y flota 9 hacia arriba, así que solo cabe en los
   costados, y solo cuando quedan unos 47 libres por lado o más: desde `@sm` (384 de visual, la
   maqueta al 90 %; a 1440 el visual mide 400 y quedan 56). Arriba y abajo de la ventana quedan
   unos 42 y no caben. Por eso van de 4 a 8 del borde y el de arriba a la derecha baja bajo la
   ficha. Más estrecho, el Radar se mueve con los anillos.

   Hasta el 6 de octubre de 2026 también salían desde `xl:` (1280 de ventana), porque a 1280 y a
   1366 el visual medía 366 o más con la maqueta al 85 %. Ese día la columna del texto se ensanchó
   desde 768 de tarjeta para que los puntos no partieran (H30): a 1366 el visual baja a 351 y
   quedan 39 por lado, así que con `xl:` los pines volvían a quedar a medias detrás de la ventana.
   Ahora solo los pide el ancho del propio visual. */
const PINES = [
  { lugar: 'top-7 left-1.5', dur: '4.6s', esp: '-0.8s' },
  { lugar: 'bottom-10 left-2', dur: '5.4s', esp: '-2.6s' },
  { lugar: 'top-1/2 left-1', dur: '6s', esp: '-4s' },
  { lugar: 'top-20 right-2', dur: '5s', esp: '-1.7s' },
  { lugar: 'bottom-8 right-1', dur: '4.2s', esp: '-3.1s' },
];

const FondoRadar: React.FC = () => (
  <>
    {/* Tres anillos desfasados se leen como uno que se repite. Es el recurso del pin en foco de
        `MaquetaRadar`, aquí en grande y detrás de la pantalla; esa maqueta se borró sin uso el 6
        de octubre de 2026 y el barrido quedó solo aquí. */}
    {/* Cada anillo es un disco blanco que `rd-mano-trazo` deja en su borde a pulso, girado
        distinto que los otros dos. */}
    <span className="absolute top-1/2 left-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2">
      {['0s', '1.4s', '2.8s'].map((esp, i) => (
        <span
          key={esp}
          className={`rd-bucle rd-mano-trazo absolute inset-0 rounded-full bg-rd-surface ${GIROS[i * 2]}`}
          style={bucle('rd-onda', '4.2s', esp, 'ease-out')}
        />
      ))}
    </span>
    {/* Los pines: el disco blanco es una mancha a pulso (`rd-mano-relleno`) y el icono va encima,
        nítido. */}
    {PINES.map((p, i) => (
      <span
        key={p.lugar}
        className={`rd-bucle absolute ${p.lugar} hidden h-8 w-8 items-center justify-center @sm:flex`}
        style={bucle('rd-flota', p.dur, p.esp)}
      >
        <span aria-hidden="true" className={`rd-mano-relleno absolute inset-0 rounded-full bg-rd-surface ${GIROS[i % GIROS.length]}`} />
        <MapPin className="relative h-4 w-4 text-rd-navy" />
      </span>
    ))}
  </>
);

/* ------------------------------------------------------------- Directorio ---- */

/* Las iniciales son las de las organizaciones de `MaquetaDirectorio` y unas pocas más del mismo
   tipo, para que lo de detrás y lo de delante cuenten lo mismo. */
/* Una columna entera a cada lado y otra que asoma por detrás de la ventana: con la maqueta al 90 %
   a 1440 quedan 59 px libres por lado, y dos columnas completas no caben. La de detrás da la
   profundidad que en la referencia dan las píldoras que se meten bajo el calendario.
   En el teléfono (visual de menos de 288, `@2xs`) la de fuera se pega al borde: con la maqueta al
   70 % quedan 16 libres a 360 y 31 a 390, y a 8 del borde la tapaba casi entera (H7, 6 de
   octubre de 2026). La de detrás se queda donde estaba: a esos anchos solo asoma arriba y abajo
   de la ventana, ya desvanecida. */
const COLUMNAS = [
  { lado: 'left-0 @2xs:left-2', fichas: ['BV', 'CR', 'FM', 'BS', 'AC'], dur: '18s', esp: '0s' },
  { lado: 'left-12', fichas: ['JA', 'DC', 'RS', 'BU'], dur: '24s', esp: '-9s' },
  { lado: 'right-12', fichas: ['MU', 'CS', 'BV', 'TC'], dur: '21s', esp: '-4s' },
  { lado: 'right-0 @2xs:right-2', fichas: ['AC', 'JS', 'CR', 'BS', 'FM'], dur: '16s', esp: '-11s' },
];

const FondoDirectorio: React.FC = () => (
  <>
    {COLUMNAS.map((c) => (
      /* La columna se desvanece arriba y abajo (`rd-acc-columna`), así las fichas nacen y se van
         en vez de cortarse contra el borde del contenedor. */
      <div key={c.lado} className={`rd-acc-columna absolute inset-y-0 ${c.lado} w-9 overflow-hidden`}>
        {/* La lista va dos veces y sube la mitad: ahí la copia queda justo donde estaba el
            original y el salto no se ve, como la marquesina del portal. Cada ficha lleva su aire
            abajo en vez de un `gap`, para que la mitad sea exacta.

            A pulso sobre el amarillo sólido del fondo (6 de octubre de 2026): dos de cada tres son
            manchas en la tinta de la herramienta con las iniciales en el amarillo, y una de cada
            tres es solo un círculo dibujado en esa tinta con las iniciales en tinta. Las dos en
            9,2:1. Tinta y no el negro de la página, que en el modo claro pasa a crema: el visual
            se ve igual en los dos modos. El fondo de la ficha va en
            su propia capa, debajo de las letras, para que el filtro no las toque. */}
        <div className="rd-bucle" style={bucle('rd-acc-sube', c.dur, c.esp, 'linear')}>
          {[...c.fichas, ...c.fichas].map((f, i) => {
            const dibujada = i % 3 === 1;
            return (
              <div key={i} className="pb-3">
                <span className="relative flex h-9 w-9 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 rounded-full bg-rd-ink ${dibujada ? 'rd-mano-trazo' : 'rd-mano-relleno'} ${GIROS[i % GIROS.length]}`}
                  />
                  <span className={`font-rd relative text-rd-10-5 font-semibold ${dibujada ? 'text-rd-ink' : 'text-rd-amber-claro'}`}>{f}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </>
);

/* -------------------------------------------------------- Mi organización ---- */

/* Tres barras por lado en los 59 px que deja la maqueta a 1440: 14 de ancho y 4 de aire, como las
   de la referencia. A 1280 la de dentro se mete un poco bajo la ventana, y está bien.
   En el teléfono (visual de menos de 288, `@2xs`) las tres se corren 6 hacia fuera con el mismo
   ritmo: a 8 del borde, con 16 libres a 360, la ventana las tapaba todas y el visual se veía
   quieto (H7, 6 de octubre de 2026). Así a 360 se ve entera la de fuera y a 390 casi toda la del
   medio. */
const BARRAS = [
  { lugar: 'left-0.5 @2xs:left-2', alto: 'h-20', dur: '2.8s', esp: '-0.3s' },
  { lugar: 'left-5 @2xs:left-6.5', alto: 'h-36', dur: '3.4s', esp: '-1.6s' },
  { lugar: 'left-9.5 @2xs:left-11', alto: 'h-26', dur: '3s', esp: '-2.2s' },
  { lugar: 'right-9.5 @2xs:right-11', alto: 'h-28', dur: '3.2s', esp: '-0.9s' },
  { lugar: 'right-5 @2xs:right-6.5', alto: 'h-40', dur: '2.6s', esp: '-2.5s' },
  { lugar: 'right-0.5 @2xs:right-2', alto: 'h-22', dur: '3.6s', esp: '-1.2s' },
];

const FondoOrganizacion: React.FC = () => (
  <>
    {BARRAS.map((b, i) => (
      /* El riel es fijo y lo que se mueve es el relleno, de abajo hacia arriba: se lee como algo
         que avanza hasta completarse, no como un ecualizador. A pulso sobre el verde sólido del
         fondo (6 de octubre de 2026): el riel es el contorno de la píldora dibujado en la tinta de
         la herramienta, y el relleno, una mancha de esa tinta 4 px por dentro que sube y baja con
         el borde también a pulso.
         El filtro del relleno va en su caja y no en la barra que se escala: así la onda no se
         estira con ella. El contorno de una barra sí va girado media vuelta de cada dos; el
         relleno no, que subiría desde arriba. */
      <span key={b.lugar} className={`absolute top-1/2 ${b.lugar} ${b.alto} w-3.5 -translate-y-1/2`}>
        <span aria-hidden="true" className={`rd-mano-trazo absolute inset-0 rounded-full bg-rd-ink ${i % 2 ? 'rotate-180' : ''}`} />
        <span className="rd-mano-relleno absolute inset-1 overflow-hidden rounded-full">
          <span className="rd-bucle absolute inset-0 origin-bottom bg-rd-ink" style={bucle('rd-acc-llena', b.dur, b.esp)} />
        </span>
      </span>
    ))}
  </>
);

/* ---------------------------------------------------------------- el marco ---- */

/* El fondo de cada visual va en el color sólido de su familia (Alejandro, 6 de octubre de 2026:
   «usemos colores sólidos para el fondo de la imagen pero sin quitar las animaciones que tiene»).
   Es el claro del tema oscuro, el mismo del icono de su pestaña, así pestaña y visual dicen el
   mismo color; en el Directorio es además el amarillo del logo y de los botones del hero, y no el
   ámbar de la herramienta, que al lado se vería como otro amarillo. Lo que se mueve encima va en
   blanco (`rd-surface`) o en la tinta de la herramienta (`rd-ink`), que no cambian con el modo
   claro: el visual es una ilustración y se ve igual en los dos. Las maquetas siguen claras: son
   pantallas de la herramienta, que es clara, y quedan como islas. */
const PIEZAS: Record<VistaAcceso, { Fondo: React.FC; Pieza: React.FC; fondo: string }> = {
  radar: { Fondo: FondoRadar, Pieza: MaquetaRadarLista, fondo: 'bg-rd-navy-claro' },
  directorio: { Fondo: FondoDirectorio, Pieza: MaquetaDirectorio, fondo: 'bg-rd-amber-claro' },
  panel: { Fondo: FondoOrganizacion, Pieza: MaquetaPanel, fondo: 'bg-rd-green-claro' },
};

export const VisualAcceso: React.FC<{ vista: VistaAcceso; className?: string }> = ({ vista, className = '' }) => {
  const { Fondo, Pieza, fondo } = PIEZAS[vista];
  return (
    /* El tamaño de la maqueta lo decide el ancho de este contenedor y no el de la ventana: a 1024
       el visual mide 300 y a 1440 mide 400, aunque los dos caen en la misma tarjeta de 8
       columnas. Por eso es un `@container`. La maqueta mide 320 más la ficha que se sale, así
       que solo desde 448 va a su tamaño; por debajo se encoge para no salirse por los lados.
       Bajo 288 (`@2xs`, el teléfono hasta 390) va al 70 % y no al 75: a 360 el visual mide 256,
       al 75 % la ventana medía 240 y las fichas, que se salen 15, quedaban cortadas 7 por el
       borde (H8, 6 de octubre de 2026). Al 70 % mide 224 y caben con 2 de aire. Entre 288 y 320
       (412 y el escritorio a 1024) sigue al 75 %, donde ya cabían. En pantallas de menos de 360
       (visual de menos de 252) todavía se salen: 320 no es un ancho de los que se revisan. */
    <div className={`@container min-w-0 ${className}`}>
      {/* El alto acompaña a la escala: la maqueta más alta (Directorio, cinco filas y su ficha)
          mide unos 360 y tiene que caber con aire arriba y abajo en cada escalón. A 1440 el
          visual mide 400 (406 hasta que la columna del texto se ensanchó para los puntos, H30,
          6 de octubre de 2026) y la maqueta va al 90 %, como el calendario de la referencia,
          que tampoco llena su contenedor. */}
      {/* La esquina es `rd-lg` (12), un escalón por dentro de la tarjeta (`rd-xl`, 16) que a su
          vez lleva la del panel y la de los botones (Alejandro, 6 de octubre de 2026: «el border
          radius de la card […] coherente con el radius del contenedor grande»). Era 26, más
          redondo que la tarjeta que lo contiene. */}
      <div
        aria-hidden="true"
        className={`relative flex h-76 items-center justify-center overflow-hidden rounded-rd-lg ${fondo} @xs:h-84 @sm:h-88 @md:h-96`}
      >
        <Fondo />
        {/* El grano del fondo ilustrado, como el del hero (`rd-grano`; Alejandro, 6 de octubre de
            2026: «lo lleva el fondo animado del contenedor de la parte "ilustrada"»): sobre el
            color y lo que se mueve, debajo de la maqueta, que va lisa como la tarjeta. */}
        <span className="rd-grano pointer-events-none absolute inset-0" />
        <div className="relative scale-70 @2xs:scale-75 @xs:scale-85 @sm:scale-90 @md:scale-100">
          <Pieza />
        </div>
      </div>
    </div>
  );
};
