import React from 'react';
import { useEnVista } from '../useEnVista';

/**
 * Las piezas con las que se arma la landing, todas sobre los tokens `rd-*` del sistema.
 *
 * Por qué existen, si ya hay un `Button` y una `Caja` en `components/ui`: el sistema de la
 * herramienta está hecho para densidad —el botón más grande mide 48 con esquina `rd-md`, el
 * título de pantalla mide 22— y una página de marca necesita otra escala y la esquina redonda.
 * En vez de escribir Tailwind suelto en cada sección, la landing tiene su propio juego de
 * piezas, pero **no sus propios colores**: todo sale de `rd-ink`, `rd-ink-2`, `rd-ink-meta`,
 * `rd-line`, `rd-surface`, `rd-sunken`, `rd-navy` y `rd-coral` (Alejandro, 28 de septiembre de
 * 2026: «no tiene estilos ni componentes de lo que está hoy en la app»).
 *
 * El encuadre viene de la referencia que pidió: fondo blanco, mucho aire vertical, rótulo
 * pequeño en gris sobre el titular, titular grande de peso regular cuya segunda línea baja a
 * gris, reglas de un píxel y tarjetas de relleno gris muy tenue sin marco.
 *
 * Esa tarjeta gris (`TarjetaSuave`) y `retraso()`, que escalonaba la entrada de los hijos de una
 * rejilla, se borraron el 6 de octubre de 2026: ya no las usaba nadie, desde que la página pasó a
 * crema con tarjetas blancas (Alejandro: «borre lo que ya no se usa»).
 */

/** El ancho y el aire de toda sección de la landing. `separacion` la aprieta donde dos bloques
 *  se leen como uno solo. La sección aparece al llegar a ella, no está ya puesta. */
export const Seccion: React.FC<{
  id?: string;
  separacion?: 'normal' | 'apretada';
  className?: string;
  children: React.ReactNode;
}> = ({ id, separacion = 'normal', className = '', children }) => {
  const { ref, visible } = useEnVista<HTMLElement>();
  return (
    <section
      ref={ref}
      id={id}
      className={`rd-revela mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12 ${visible ? 'es-visible' : ''} ${
        separacion === 'apretada' ? 'py-10 sm:py-14' : 'py-16 sm:py-20 lg:py-24'
      } ${className}`}
    >
      {children}
    </section>
  );
};

/** El rótulo gris que va encima de un titular de sección («Offices», «For developers» en la
 *  referencia). Sentence case y sin altas, como manda la escala del sistema. */
export const Rotulo: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-rd m-0 text-rd-15 font-normal text-rd-noche-meta ${className}`}>{children}</p>
);

/**
 * El titular de display. `apagado` es la segunda línea en gris, el recurso que la referencia usa
 * en cada sección («One API.» negro, «Every modality.» gris). `como` deja elegir el nivel real
 * de encabezado: el tamaño lo fija el contenedor, no el nivel (decisión 242).
 */
export const Titular: React.FC<{
  children: React.ReactNode;
  apagado?: React.ReactNode;
  como?: 'h1' | 'h2';
  tamano?: 'hero' | 'seccion';
  /** `claro` para cuando el titular va sobre fotografía. */
  tono?: 'tinta' | 'claro';
  /** Para la sección que se nombra con él (`aria-labelledby`). */
  id?: string;
  className?: string;
}> = ({ children, apagado, como = 'h2', tamano = 'seccion', tono = 'tinta', id, className = '' }) => {
  const Etiqueta = como;
  /* La escala del hero está medida ancho por ancho en el navegador, no elegida a ojo: es el
     tamaño más grande que deja el titular en DOS líneas en cada punto de quiebre (Alejandro, 29
     de septiembre de 2026: «no quiero ver textos colapsados en ese hero en H1»).

     Esa tarde bajó al escalón H2 (28 / 36 / 40 / 48), volvió a subir al H1 (32 / 48 / 56 / 72) y
     se volvió a medir el 30 de septiembre, ya con la caja fija en las columnas 2 a 11 y la copia
     en 70 caracteres, porque a 72 salían tres renglones. Barrido los ocho tamaños de la escala en
     diez anchos; este es el mayor que deja DOS renglones en cada tramo:

         768 → 32     1024 → 40     1280 → 56     1536 → 64

     A 1440 le toca el 56 del tramo `xl` aunque el 64 también daría dos: entre 1280 y 1536 no hay
     punto de quiebre, y a 1280 el 64 se parte en tres. Poner 64 ahí pediría un `--breakpoint`
     nuevo, que es una decisión de sistema, no un ajuste de esta pantalla.

     En teléfono no hay tamaño que dé dos renglones: a 320 de caja ni el 28 baja de tres, y para
     dos haría falta bajar a unos 18, por debajo del cuerpo. Ahí se queda en 32 y cuatro renglones;
     el único resorte que falta es acortar la copia a unos 40 caracteres.

     Medida otra vez el 6 de octubre de 2026, con Noto Sans y un salto fijo: Alejandro pidió subir
     «ayudas» al primer renglón y el segundo en amarillo, así que el primero es entero «Somos el
     punto de encuentro de las ayudas» y tiene que caber de una. Mide 533 a 28, 685 a 36, 913 a 48
     y 1065 a 56, contra cajas de 576 (640), 769 (1024), 983 (1280) y 1116 (1536). El 40 entraba a
     1024 con 8 de holgura y una barra de desplazamiento visible lo partía: por eso 36. */
  /* El 7 de octubre de 2026 el primer renglón pasó a negrita (a prueba, ver `LandingHero`), que es
     más ancha: a 56 ya no cabía de una desde 1536, así que el escalón `2xl` salió y el hero se
     queda en 48 desde 1280. */
  const escala =
    tamano === 'hero'
      ? 'text-rd-28 lg:text-rd-36 xl:text-rd-48'
      : /* Un solo tamaño para todos los titulares de sección desde 768: 40, un escalón claro por
           encima de los títulos de dentro de cada sección (28) y por debajo del hero (48 y 56)
           (Alejandro, 7 de octubre de 2026: «revisa el tamaño del titulo de las secciones para que
           sean consistentes»). Hasta ese día iban a 36 en `md` y bajaban a 32 en `xl` por la caja
           de dos columnas de la sección 5, y a 1440 quedaban a 4 px de los de dentro (28): no se
           leía cuál mandaba. En la columna de la sección 5 el titular parte en cuatro renglones. */
        'text-rd-28 md:text-rd-40';
  return (
    /* El titular del hero va en 400 y los de sección se quedan en 500 (Alejandro, 29 de
       septiembre de 2026: pasó por 700, 600, 300 y acabó en 400). `tamano` es el interruptor
       porque `hero` solo lo usa la portada: así el cambio no se derrama a las otras cinco
       secciones. */
    <Etiqueta
      id={id}
      className={`font-rd m-0 ${tamano === 'hero' ? 'font-normal' : 'font-medium'} tracking-rd-titular ${
        tono === 'claro' ? 'text-white' : 'text-rd-noche-tinta'
      } ${escala} leading-rd-display text-balance ${className}`}
    >
      {children}
      {apagado && (
        <>
          <br />
          <span className={tono === 'claro' ? 'text-white/70' : 'text-rd-noche-meta'}>{apagado}</span>
        </>
      )}
    </Etiqueta>
  );
};

/** El párrafo que acompaña a un titular. */
export const Parrafo: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-rd m-0 text-rd-16 leading-relaxed text-rd-noche-tinta-2 sm:text-rd-18 ${className}`}>{children}</p>
);

/**
 * La receta de los botones de icono de la landing: el de configuración del header, la X del panel
 * de la sección 2 y las pestañas de ese panel. Un solo cuadrado de 48 con la esquina de los
 * botones (16), el borde y el icono en la tinta de la página y sin fondo; al pasar el cursor, la
 * superficie elevada (Alejandro, 6 de octubre de 2026: «el botón del header, el botón de la x de
 * la sección 2 y los tabs son diferentes. unifica para consistencia»; y para las pestañas, «sin
 * fondo cuando no estén seleccionados. y dejar solo el borde y el icono en blanco»). Hasta ese día
 * medían 40, 44 y 56, con tres esquinas, tres marcos y tres fondos distintos.
 *
 * `elegido` son las clases del estado elegido —la pestaña de la vista que se ve, en el relleno de
 * su tono—, que reemplazan al borde y al color de reposo. 48 está por encima del mínimo táctil del
 * sistema (`rd-tactil`, 44).
 */
export const claseBotonIcono = (elegido?: string) =>
  `inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-rd-xl border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-ayuda active:translate-y-px ${
    elegido ?? 'border-rd-noche-tinta bg-transparent text-rd-noche-tinta hover:bg-rd-noche-2'
  }`;

/**
 * El `Segmented` de la herramienta (`components/ui/Segmented.tsx`) en los tokens de la landing:
 * la pista (`claseConmutador`) con marco y `p-1`, y cada opción (`claseOpcion`) de 30 sobre la
 * pista de 40, la elegida en píldora de tinta. Las opciones son botones con `aria-pressed` dentro
 * de un `role="group"` con nombre. Nació dentro del menú de ajustes (el tema) y salió aquí el 7 de
 * octubre de 2026, cuando la sección 5 lo necesitó para elegir cómo sumarse.
 */
export const claseConmutador = 'inline-flex max-w-full items-center gap-0.5 rounded-full border border-rd-noche-linea p-1';
export const claseOpcion = (activa: boolean) =>
  `font-rd inline-flex h-7.5 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-rd-13-5 whitespace-nowrap transition-colors duration-150 pointer-coarse:h-8.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-ayuda active:translate-y-px ${
    activa ? 'bg-rd-noche-tinta font-semibold text-rd-noche' : 'font-medium text-rd-noche-tinta-2 hover:bg-rd-noche-3 hover:text-rd-noche-tinta'
  }`;

/**
 * El botón de la landing: más alto y más grande que el de la herramienta, con los mismos tres
 * niveles de consecuencia (decisión 223) y los mismos colores. `primario` es navy, `pedir` es
 * coral —la única acción en coral, decisión 139— y `secundario` es la superficie con marco.
 */
export const BotonLanding: React.FC<{
  nivel?: 'primario' | 'pedir' | 'secundario' | 'terciario';
  /** El peso del momento, como en el botón del sistema (decisión 223 C1): `lg` para las acciones
   *  principales de la página (las del hero); `md` dentro de tarjetas, filas, cabeceras y pies
   *  (40, 44 con el dedo). */
  tamano?: 'lg' | 'md';
  como?: 'boton' | 'enlace';
  href?: string;
  onClick?: () => void;
  icono?: React.ReactNode;
  iconoDespues?: React.ReactNode;
  ancho?: boolean;
  /** Solo el icono: el botón de icono de la landing (`claseBotonIcono`), sea cual sea `nivel` o
   *  `tamano`. Pide `etiqueta`, que es lo que oye el lector de pantalla. */
  soloIcono?: boolean;
  etiqueta?: string;
  /** Para un botón que abre algo: `aria-expanded` y `aria-controls`. */
  expandido?: boolean;
  controla?: string;
  ref?: React.Ref<HTMLButtonElement>;
  children?: React.ReactNode;
}> = ({
  nivel = 'secundario',
  tamano = 'lg',
  como = 'boton',
  href,
  onClick,
  icono,
  iconoDespues,
  ancho = false,
  soloIcono = false,
  etiqueta,
  expandido,
  controla,
  ref,
  children,
}) => {
  /* `max-w-full` y sin `whitespace-nowrap` en terciario: «Explorar todas las necesidades en el
     mapa» no cabe en 390 y empujaba la página 22 px de lado. Medido en el navegador el 29 de
     septiembre de 2026; a simple vista no se veía. */
  /* El trato tipográfico es el del `Button` de la herramienta: `gap-1.75`, `tracking-rd-btn`,
     `leading-none` y el hundimiento de un píxel al pulsar. Lo que cambia es la escala y la
     esquina, que es lo que separa una página de marca de una pantalla densa. `leading-none` solo
     donde el texto no parte: terciario sí parte y ahí apretaría las dos líneas. */
  const clase = soloIcono ? claseBotonIcono() : `font-rd inline-flex max-w-full cursor-pointer items-center justify-center gap-1.75 rounded-rd-xl border text-center font-medium tracking-rd-btn transition-colors duration-150 ease-in-out active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 ${
    nivel === 'terciario' ? '' : 'whitespace-nowrap leading-none'
  } ${
    tamano === 'lg' ? 'h-13 px-7 text-rd-15 sm:text-rd-16' : 'h-10 px-4.5 text-rd-13-5 pointer-coarse:h-rd-tactil'
  } ${
    ancho ? 'w-full' : ''
  } ${
    {
      /* Los colores son los del `Button` de la herramienta (Alejandro, 7 de octubre de 2026:
         «había que colocar el color de los botones como funciona en la app»): primario navy con
         texto blanco, pedir coral con texto blanco (decisión 139: la única acción en coral) y
         secundario en la superficie con el marco de línea. El secundario va en los tokens de la
         landing, que en el modo claro valen lo mismo que la herramienta (superficie blanca, marco
         `rd-line`, tinta, hundido al pasar) y en el oscuro son su par sobre negro. Del 6 al 7 de
         octubre los del hero fueron amarillo (pedir) y blanco (primario), y el secundario, sin
         fondo y con marco blanco.

         El foco va en el amarillo de la landing (`rd-ayuda`): el navy no se vería sobre el
         fondo oscuro. */
      primario: 'border-rd-navy bg-rd-navy text-white hover:border-rd-navy-hover hover:bg-rd-navy-hover focus-visible:outline-rd-ayuda',
      pedir: 'border-rd-coral bg-rd-coral text-white hover:brightness-95 focus-visible:outline-rd-ayuda',
      secundario: 'border-rd-noche-linea bg-rd-noche-2 text-rd-noche-tinta hover:bg-rd-noche-3 focus-visible:outline-rd-ayuda',
      /* Ver no cambia nada, así que no lleva marco ni relleno (decisión 223). En la landing se
         lee como el enlace con flecha que usan Ramp y Superpower para «Learn more». */
      terciario: 'border-transparent bg-transparent px-0 text-rd-noche-tinta-2 hover:text-rd-noche-tinta focus-visible:outline-rd-ayuda',
    }[nivel]
  }`;

  /* El icono va en su propia envoltura decorativa, como en el `Button` de la herramienta: el
     texto ya nombra la acción, así que el icono no se anuncia, y `shrink-0` evita que se
     comprima cuando el texto es largo. */
  const contenido = (
    <>
      {icono && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icono}
        </span>
      )}
      {children}
      {iconoDespues && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {iconoDespues}
        </span>
      )}
    </>
  );

  if (como === 'enlace') {
    return (
      <a href={href} aria-label={etiqueta} className={clase}>
        {contenido}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-expanded={expandido}
      aria-controls={controla}
      className={clase}
    >
      {contenido}
    </button>
  );
};

/** La regla de un píxel que separa bloques en la referencia. */
export const Regla: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`m-0 border-0 border-t border-rd-noche-linea ${className}`} />
);
