import React from 'react';
import { MapPin } from 'lucide-react';
import { BotonLanding, Parrafo, Seccion, Titular } from './base';
import { RadarEnVivo } from './RadarEnVivo';
import { PUBLICACIONES } from '../../../mocks/publicacionesMock';
import { RUTAS } from '../../../mocks/cuentasMock';
import type { Publicacion } from '../../../types/publicacion';
import { useTranslation } from '../../../i18n/LanguageContext';

/* Las publicaciones que barre el radar, de las de la herramienta (`PUBLICACIONES`, las mismas de
   la Radar), alternando necesidad y oferta para que el haz no encuentre primero todas las de un
   color. Van las de Cali y las que tienen fotos y descripción: son las que mejor muestran la
   tarjeta. */
const EN_EL_RADAR = ['necesidad-bosa', 'oferta-usme', 'c1', 'c2', 'necesidad-sanfrancisco', 'm7'];
const PUBLICACIONES_RADAR = EN_EL_RADAR.map((id) => PUBLICACIONES.find((p) => p.id === id)).filter((p): p is Publicacion => Boolean(p));

/* Las acciones de una tarjeta llevan a esa publicación en la Radar (`?punto=`), donde se ayuda,
   se solicita, se comparte o se reporta de verdad. */
const abrir = (id: string) => window.location.assign(`${RUTAS.radar}?punto=${encodeURIComponent(id)}`);

export const LandingSplitPortal: React.FC = () => {
  const { t } = useTranslation();

  /* La presentación es «El radar en vivo» (`RadarEnVivo`, 7 de octubre de 2026): las
     publicaciones son los ecos de un radar que barre el territorio, y al lado van como una baraja
     de tarjetas de la herramienta. Antes fue una marquesina de dos filas de tarjetas en sentidos
     opuestos (29 de septiembre de 2026), tomada de `trust-bar-scroll` de Calendly, y por un rato
     un mapa decorativo detrás de ella, que Alejandro sintió cargado y sin idea: «solo
     "embelleciste" con elementos visuales […] quiero que idees algo similar en cuanto a
     "innovación" como se hizo en el 2 y 3».

     Hasta la baraja, la sección leía las tres últimas necesidades y ofertas de Supabase, con unas
     de respaldo en el código. Las tarjetas de la herramienta piden publicaciones de la herramienta
     (Alejandro: «me parece importante que las cards sean las que se usan en la herramienta app
     v.2»), y la herramienta todavía lee los mocks: la sección los lee también. Cuando Frontend
     conecte la herramienta, esta sección viene con ella. */
  /* Va sobre el azul de la malla (ver LAS CAPAS DE LA PÁGINA en `index.css`): `rd-sobre-azul`
     pone en blanco lo que se lee encima. El halo que hubo un rato detrás del radar salió con la
     malla: dejaba una franja donde terminaba. El titular queda cerca de su contenido (Alejandro, 7
     de octubre de 2026: «Los títulos de cada sección estén mas cerca del contenido de su
     sección»). */
  return (
    <Seccion id="portal-en-vivo" className="rd-sobre-azul relative">
      <div className="relative mx-auto max-w-2xl text-center">
        <Titular>{t('landingPortalTitle')}</Titular>
        <Parrafo className="mx-auto mt-4">{t('landingPortalSubtitle')}</Parrafo>
      </div>

      <div className="relative mt-8 sm:mt-10">
        <RadarEnVivo
          publicaciones={PUBLICACIONES_RADAR}
          etiqueta={t('landingPortalRadar')}
          rotulos={{ necesidad: t('landingPortalNeedsHeading'), oferta: t('landingPortalOffersHeading') }}
          onAbrir={abrir}
          pista={t('landingPortalDesliza')}
        />
      </div>

      {/* El botón de la landing, secundario y del tamaño de los del hero —es la acción que cierra
          la sección—, con el icono delante como el botón del sistema. Antes era un enlace con una
          flecha detrás, que el sistema no documenta (7 de octubre de 2026). */}
      <div className="relative mt-12 flex justify-center">
        <BotonLanding nivel="secundario" como="enlace" href="/mapa-ayudas-necesidades" icono={<MapPin className="h-4.5 w-4.5" />}>
          {t('landingPortalViewAllNeeds')}
        </BotonLanding>
      </div>
    </Seccion>
  );
};
