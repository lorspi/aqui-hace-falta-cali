import React from 'react';
import { SeccionCaracteristica } from './SeccionCaracteristica';
import { LineaDeEntrega, NecesidadEnTerritorio, RutaEntreCiudades } from './Ilustraciones';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * Los tres pasos, cada uno en el bloque de la referencia y alternando el lado del visual.
 * El copy es el que ya existía en `translations.ts`: no se reescribió ninguna frase.
 *
 * Cada paso tiene su propia pieza, y ninguna se repite en otra sección: reportar es la
 * necesidad aterrizando en el territorio, conectar es el cruce entre lo que falta y lo que hay,
 * y monitorear es la línea por la que pasa la entrega hasta el acta. Viven en `Ilustraciones`.
 */
const VISTAS = [NecesidadEnTerritorio, RutaEntreCiudades, LineaDeEntrega];

export const LandingComoFunciona: React.FC = () => {
  const { t } = useTranslation();

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

  return (
    <>
      {pasos.map((p, i) => {
        const Vista = VISTAS[i];
        /* `visual` va sin recuadro gris detrás: la fotografía ya tiene su propio peso y el gris
           le robaba atención al contenido (Alejandro, 29 de septiembre de 2026). */
        return (
          <SeccionCaracteristica
            key={p.n}
            id={i === 0 ? 'como-funciona' : undefined}
            rotulo={p.rotulo}
            titulo={p.titulo}
            texto={p.texto}
            puntos={p.puntos}
            lado={i % 2 === 1 ? 'izquierda' : 'derecha'}
            visual={<Vista />}
          />
        );
      })}
    </>
  );
};
