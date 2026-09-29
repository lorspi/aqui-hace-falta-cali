import React from 'react';
import { Hand, HeartHandshake } from 'lucide-react';
import { BotonLanding, Titular } from './base';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * El primer pantallazo, rehecho el 28 de septiembre de 2026 sobre la referencia (x.ai) y con
 * las piezas de `base.tsx`, que salen de los tokens `rd-*`.
 *
 * De la referencia: fondo blanco sin nada detrás, una sola columna centrada, píldora de anuncio
 * arriba con marco fino, titular enorme de peso regular con punto final y una regla fina bajo
 * la última frase, subtítulo gris de una línea y dos píldoras de acción.
 *
 * Lo que se retiró del hero anterior: el fondo de mapa satelital animado, el radar partiendo la
 * pantalla en dos, el `font-black` del titular y las sombras de color bajo los botones.
 */
export const LandingHero: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  const { t } = useTranslation();

  return (
    <section id="hero" className="mx-auto w-full max-w-360 px-5 pt-16 pb-0 sm:px-8 sm:pt-24 lg:px-12 lg:pt-28">
      {/* Ancho del titular: 10 de 12 columnas desde 1024 (Alejandro, 28 de septiembre de 2026).
          Se pidió probar 8/12 primero, pero 8 de 12 de este contenedor —1344 de contenido— son
          896, que es el `max-w-4xl` que ya tenía y que se veía apretado; 10/12 son 1120. El
          subtítulo no sigue ese ancho: una línea gris de 1120 se vuelve ilegible. */}
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center lg:w-10/12 lg:max-w-none">
        {/* Aquí vivía la píldora «Conoce RaDAR». Se quitó el 29 de septiembre de 2026 porque no
            hacía nada más que desplazar la página hasta «Cómo funciona»: no anunciaba nada ni
            llevaba a ningún sitio nuevo, y ocupaba el punto más valioso de la página compitiendo
            con las dos acciones que sí importan. En las referencias ese sitio lleva contenido
            real —un anuncio en x.ai, la credibilidad en Superpower—; el día que haya algo así
            (una cifra en vivo, quién ya está adentro), este es su lugar. */}

        {/* Titular a dos tonos: la primera frase en tinta, la segunda en gris. Es la firma de las
            dos referencias que pasó Alejandro (Ramp y Superpower) y el recurso que más levanta un
            titular largo sin tocar el copy (29 de septiembre de 2026).
            Sin la regla ámbar bajo «ayuda en emergencias»: la quitó Alejandro el 29 de
            septiembre. El contraste entre las dos líneas ya hace el trabajo que hacía ella, y
            una tercera marca encima lo enturbiaba. */}
        <Titular
          como="h1"
          tamano="hero"
          className="mt-8 sm:mt-10"
          apagado={`${t('landingHeroTitlePart3')} ${t('landingHeroTitlePart4')}.`}
        >
          {t('landingHeroTitlePart1')} {t('landingHeroTitlePart2')}
        </Titular>

        <p className="font-rd m-0 mt-7 max-w-2xl text-rd-16 leading-relaxed text-rd-ink-2 text-balance sm:mt-8 sm:text-rd-18 lg:text-rd-22">
          {t('landingHeroSubtitle')}
        </p>

        {/* Coral pide, navy ofrece: el mismo par del menú «+» de la app (`Shell`), donde las dos
            acciones van llenas y valen lo mismo. Hasta el 29 de septiembre de 2026 «Ofrecer
            ayuda» era de contorno, lo que la dejaba por debajo de «Pedir ayuda» y rompía la
            pareja de color sobre la que está construido todo el producto: coral es lo que hace
            falta, navy es lo que hay. No son primaria y secundaria, son iguales y opuestas. */}
        <div className="mt-10 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-12 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
          <BotonLanding nivel="pedir" onClick={onOpenChat} icono={<Hand aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />}>
            {t('landingHeroCtaNeed')}
          </BotonLanding>
          <BotonLanding
            nivel="primario"
            como="enlace"
            href="/mapa-ayudas-necesidades?ofrecer=true"
            icono={<HeartHandshake aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />}
          >
            {t('landingHeroCtaOffer')}
          </BotonLanding>
        </div>
      </div>
    </section>
  );
};
