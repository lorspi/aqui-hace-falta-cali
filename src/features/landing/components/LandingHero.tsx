import React, { useRef } from 'react';
import { Hand, HeartHandshake } from 'lucide-react';
import { BotonLanding, Parrafo, Titular } from './base';
import { VentanaLiquida } from './VentanaLiquida';
import { AnillosHero } from './AnillosHero';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * El hero, reducido a texto el 29 de septiembre de 2026 al cambiar el discurso.
 *
 * Lo que había —el teléfono con el Radar, la malla de color a la deriva, los pines cayendo, el
 * barrido, las tarjetas flotando— salió entero por decisión de Alejandro. El motivo no es que
 * estuviera mal hecho: es que contaba otra cosa. Mostrar el producto en la portada dice «esta es
 * la herramienta»; el discurso nuevo es aspiracional y habla de crear conexiones y del mundo de
 * oportunidades que eso abre para reconstruir —no solo edificios: la confianza, la economía, las
 * relaciones, la empatía—. Una captura de pantalla no sostiene eso, y compitiendo con la frase le
 * quitaba sitio.
 *
 * Así que la portada es una afirmación, quién la hace posible y las dos maneras de entrar. Nada
 * más, y sin panel: el encuadre de Calendly —rectángulo gris de radio grande, metido de los
 * bordes— pasó por 25 %, por 80 % y salió del todo el 29 de septiembre de 2026.
 *
 * Al quitar el fondo, el hero toma los mismos márgenes laterales que `Seccion` (5 / 8 / 12) en
 * vez de los del panel. Si conservara el encuadre del panel, el titular quedaría 12 px más
 * adentro que todas las secciones de abajo: una sangría que solo tenía sentido cuando había un
 * rectángulo que separar del borde de la página.
 *
 * `MaquetaRadar` se quedó sin quien la use y se borró el 6 de octubre de 2026 (Alejandro: «borre
 * lo que ya no se usa»).
 */
export const LandingHero: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  const { t } = useTranslation();
  const hero = useRef<HTMLElement>(null);
  const texto = useRef<HTMLDivElement>(null);

  return (
    /* La sección va a todo el ancho de la ventana por la gota: si se quedara en los 1440 del
       contenedor, en una pantalla de 1920 la gota se cortaría en seco al llegar a los 240 de cada
       lado. `isolate` encierra el orden de capas, de abajo arriba: el anillo, el contenido, la
       gota con la copia del texto en crema y el punto blanco de su centro (`z-10`, en
       `VentanaLiquida`) y los botones (`z-20`). La gota pasa por detrás del texto y lo vuelve
       crema donde pasa (Alejandro, 6 de octubre de 2026); `texto` es el bloque que se copia. */
    <section ref={hero} id="hero" className="relative isolate">
      {/* El fondo del hero, lo primero de todo (ver LAS CAPAS DE LA PÁGINA en `index.css`): del
          ancho de las 12 columnas, desde el pie del header hasta la mitad del panel de la sección 2
          (`rd-fondo-hero`), que sube encima de él; ahí se desvanece. Lleva su grano. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -bottom-rd-fondo-hero">
        <div className="mx-auto h-full w-full max-w-360 px-5 sm:px-8 lg:px-12">
          <div className="rd-fondo-hero rd-grano h-full rounded-rd-xl bg-rd-noche-lamina" />
        </div>
      </div>
      {/* Los anillos del fondo, encima del fondo y debajo de todo lo demás del hero. El 7 de
          octubre de 2026 el hero pasó un rato a la distribución de Biograph, con una ilustración
          de dos manos en una sola línea a la derecha y tres datos abajo; volvió a esta versión
          (Alejandro: «nah. hero a la versión 1. quedó feo así»). */}
      <AnillosHero />
      <VentanaLiquida anfitrion={hero} texto={texto} />

      <div ref={texto} className="relative mx-auto w-full max-w-360 px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
        {/* La grilla real de 12, la misma que dibuja `Grilla12`: el bloque ocupa de la columna 2 a
            la 11 por posición en la grilla y no por un ancho máximo a mano. A 1440 eso da 1116 px
            —10 columnas de 90 más 9 huecos de 24— pero el número no está escrito en ninguna parte,
            así que sigue siendo cierto en cualquier ancho.

            Debajo de 768 no hay grilla: con 12 columnas y huecos de 24 en un ancho de 320, los
            huecos se comen 264 y cada columna queda en menos de 5 px. Ahí el bloque va a todo lo
            que hay. */}
        <div className="md:grid md:grid-cols-12 md:gap-6">
          <div className="flex flex-col items-center text-center md:col-span-10 md:col-start-2">
            {/* El cierre baja a jerarquía 2. Va como hijo en línea y no por la propiedad `apagado`
                de `Titular`, porque esa mete un `<br />` y forzaría el quiebre siempre: así el
                `text-balance` sigue decidiendo dónde parte según el ancho. */}
            <Titular como="h1" tamano="hero">
              {/* El primer renglón en negrita, a prueba (Alejandro, 7 de octubre de 2026: «en el
                  titulo principal prueba en la linea 1 un bold»): es lo primero que se lee de la
                  página, y el segundo, en amarillo y en 400, lo completa. */}
              <span className="font-bold">{t('landingHeroTitle')}</span>
            {/* «ayudas» cierra el primer renglón y el segundo va entero en el amarillo del logo
                (Alejandro, 6 de octubre de 2026). El salto es fijo; la escala del titular está
                medida para que el primer renglón quepa de una (ver `Titular`). El amarillo es
                `rd-amber-claro` y no `rd-ayuda`, que en el modo claro baja a ámbar tinta: aquí va
                el mismo amarillo en los dos modos (Alejandro, ese mismo día: «el amarillo de la
                tipo del hero debe ser la misma que en dark»). Sobre la crema da 1,9:1. */}
            <br />
            <span className="text-rd-amber-claro">{t('landingHeroTitleSoft')}</span>
            </Titular>

            {/* Titular y bajada separados por 24 exactos, sin salto por punto de quiebre: es el
                mismo 24 del hueco de la grilla, así que el ritmo vertical y el horizontal miden lo
                mismo (Alejandro, 29 de septiembre de 2026). Entre la bajada y los botones, 40
                desde que van en fila (ver abajo).

                Sin `max-w-2xl`: esos 672 px eran lo que partía la bajada en dos. La frase mide
                764,5 px a 18 px en Inter 300 —medido en Chrome con la fuente real el 6 de octubre
                de 2026—, así que cabe en un renglón en cuanto la caja pasa de eso, y la caja de las
                columnas 2 a 11 da 769 a 1024, 983 a 1280 y 1116 a 1440. Debajo de 1024 no cabe:
                a 768 la caja mide 583 y haría falta bajar a 13,5 px, por debajo del cuerpo. */}
            <Parrafo className="mt-6 font-light text-balance">{t('landingHeroSubtitle')}</Parrafo>

            {/* Los dos accesos, del mismo ancho. `inline-grid` con dos columnas `1fr` se encoge al
                contenido y reparte ese ancho en dos partes iguales, así que las dos toman la medida
                de la etiqueta más larga sin que haya que fijarles un ancho. En teléfono se apilan a
                todo lo ancho. Entre los dos, el 24 de la grilla.

                Los botones bajan a 40 de la bajada desde que van en fila (Alejandro, 6 de octubre
                de 2026: primero 160, «la distancia entre los dos botones y el texto de la bajada»,
                luego «reduce a la mitad» y por último «reducelo a 40px»). En teléfono, apilados, se
                quedan a 24: ahí el aire de más los mandaría fuera de la primera pantalla.

                `relative z-20` los sube sobre la capa de la gota (`z-10`): tienen fondo propio y
                la gota pasa por debajo de ellos sin cambiarlos (6 de octubre de 2026). */}
            <div className="relative z-20 mt-6 grid w-full max-w-xs grid-cols-1 gap-6 sm:mt-10 sm:inline-grid sm:w-auto sm:max-w-none sm:grid-cols-2">
              <BotonLanding nivel="pedir" ancho onClick={onOpenChat} icono={<Hand className="h-4.5 w-4.5" />}>
                {t('landingHeroCtaNeed')}
              </BotonLanding>
              <BotonLanding
                nivel="primario"
                como="enlace"
                ancho
                href="/mapa-ayudas-necesidades?ofrecer=true"
                icono={<HeartHandshake className="h-4.5 w-4.5" />}
              >
                {t('landingHeroCtaOffer')}
              </BotonLanding>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
