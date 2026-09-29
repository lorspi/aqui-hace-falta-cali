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

/** Escalona la entrada de los hijos de una rejilla: cada uno entra un pelo después del anterior. */
export const retraso = (i: number, paso = 90): React.CSSProperties =>
  ({ '--rd-retraso': `${i * paso}ms` }) as React.CSSProperties;

/** El rótulo gris que va encima de un titular de sección («Offices», «For developers» en la
 *  referencia). Sentence case y sin altas, como manda la escala del sistema. */
export const Rotulo: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-rd m-0 text-rd-15 font-normal text-rd-ink-meta ${className}`}>{children}</p>
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
  className?: string;
}> = ({ children, apagado, como = 'h2', tamano = 'seccion', className = '' }) => {
  const Etiqueta = como;
  /* El hero topa en 56, no en 72: a 72 la línea larga del titular («para articular la ayuda en
     emergencias.») pide ~1460px y no cabe ni usando las doce columnas, así que `lg:block`
     terminaba dando cuatro líneas en vez de dos. A 56 sobre 10/12 (1120px) caben las dos
     (Alejandro, 28 de septiembre de 2026). El rd-72 se queda para cuando el copy sea más corto. */
  const escala =
    tamano === 'hero'
      ? 'text-rd-40 sm:text-rd-48 lg:text-rd-56'
      : 'text-rd-32 sm:text-rd-40 lg:text-rd-48';
  return (
    <Etiqueta
      className={`font-rd m-0 font-normal tracking-tight text-rd-ink ${escala} leading-[1.07] text-balance ${className}`}
    >
      {children}
      {apagado && (
        <>
          <br />
          <span className="text-rd-ink-3">{apagado}</span>
        </>
      )}
    </Etiqueta>
  );
};

/** El párrafo que acompaña a un titular. */
export const Parrafo: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-rd m-0 text-rd-16 leading-relaxed text-rd-ink-2 sm:text-rd-18 ${className}`}>{children}</p>
);

/** La tarjeta de la referencia: relleno gris muy tenue, sin marco, radio grande. */
export const TarjetaSuave: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-rd-xl bg-rd-sunken p-6 sm:p-8 ${className}`}>{children}</div>
);

/**
 * El botón de la landing: píldora, más alto y más grande que el de la herramienta, con los
 * mismos tres niveles de consecuencia (decisión 223) y los mismos colores. `primario` es navy,
 * `pedir` es coral —la única acción en coral, decisión 139— y `secundario` es blanco con marco.
 */
export const BotonLanding: React.FC<{
  nivel?: 'primario' | 'pedir' | 'secundario' | 'terciario';
  /** `lg` en el cuerpo de la página; `md` en la barra superior, que mide 64 de alto. */
  tamano?: 'lg' | 'md';
  como?: 'boton' | 'enlace';
  href?: string;
  onClick?: () => void;
  icono?: React.ReactNode;
  iconoDespues?: React.ReactNode;
  ancho?: boolean;
  children: React.ReactNode;
}> = ({ nivel = 'secundario', tamano = 'lg', como = 'boton', href, onClick, icono, iconoDespues, ancho = false, children }) => {
  const clase = `font-rd inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
    tamano === 'lg' ? 'h-13 px-7 text-rd-15 sm:text-rd-16' : 'h-10 px-4.5 text-rd-13-5'
  } ${
    ancho ? 'w-full' : ''
  } ${
    {
      primario: 'border-rd-navy bg-rd-navy text-white hover:bg-rd-navy-hover focus-visible:outline-rd-navy',
      pedir: 'border-rd-coral bg-rd-coral text-white hover:brightness-95 focus-visible:outline-rd-coral',
      secundario: 'border-rd-line bg-rd-surface text-rd-ink shadow-2xs hover:bg-rd-sunken focus-visible:outline-rd-navy',
      /* Ver no cambia nada, así que no lleva marco ni relleno (decisión 223). En la landing se
         lee como el enlace con flecha que usan Ramp y Superpower para «Learn more». */
      terciario: 'border-transparent bg-transparent px-0 text-rd-ink-2 hover:text-rd-ink focus-visible:outline-rd-navy',
    }[nivel]
  }`;

  if (como === 'enlace') {
    return (
      <a href={href} className={clase}>
        {icono}
        {children}
        {iconoDespues}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={clase}>
      {icono}
      {children}
      {iconoDespues}
    </button>
  );
};

/** La regla de un píxel que separa bloques en la referencia. */
export const Regla: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`m-0 border-0 border-t border-rd-line ${className}`} />
);
