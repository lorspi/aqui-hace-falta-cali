import React from 'react';
import { BadgeCheck, Check } from 'lucide-react';
import { BotonLanding, Parrafo, Regla, Rotulo, Seccion, Titular } from './base';
import { Composicion } from './Ilustraciones';
import { useTranslation } from '../../../i18n/LanguageContext';

/**
 * «Súmate»: la sección para quien quiere ayudar, rehecha el 29 de septiembre de 2026.
 *
 * Qué tenía mal. **Un error mío**: usaba «organización» dos veces, como rótulo y otra vez dentro
 * del titular. Y era la única sección de la landing sin ninguna pieza visual: tres tarjetas de
 * puro texto, una al lado de la otra, que no daban ninguna razón para creerles.
 *
 * Qué cambia. Arriba, el bloque de dos columnas con la fotografía —la del equipo, de voluntarios
 * despejando escombros; no hizo falta generar ninguna— y encabalgada la ficha de una organización
 * verificada, que es lo que esta persona quiere ver: que del otro lado hay gente real y que su
 * trabajo queda registrado. Abajo, los tres pilares pasan de tarjetas a una lista numerada con
 * reglas finas, el patrón que la referencia usa para «Interview process» y que aquí se lee mucho
 * mejor: son pasos de un mismo argumento, no tres cosas sueltas.
 *
 * El copy es el que ya existía. El rótulo reusa `landingNavForOrgs` en vez de repetir una palabra
 * del titular.
 */
export const LandingSumarse: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  const { t } = useTranslation();

  const pilares = [1, 2, 3].map((n) => ({
    n,
    titulo: t(`landingOrgsPillar${n}Title` as 'landingOrgsPillar1Title'),
    insignia: t(`landingOrgsPillar${n}Badge` as 'landingOrgsPillar1Badge'),
    texto: t(`landingOrgsPillar${n}Desc` as 'landingOrgsPillar1Desc'),
  }));

  return (
    <Seccion id="organizaciones">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        <div>
          <Rotulo>{t('landingNavForOrgs')}</Rotulo>
          <Titular className="mt-3">
            {t('landingOrgsTitle')} {t('landingOrgsTitleOrg')}
            {t('landingOrgsTitleRest')}
          </Titular>
          <Parrafo className="mt-6 max-w-xl">{t('landingOrgsDescMobile')}</Parrafo>

          {/* Contorno, no navy (Alejandro, 29 de septiembre de 2026). En la landing el navy es de
              «Ofrecer ayuda» y el coral de «Pedir ayuda»: son la pareja sobre la que se lee todo
              el producto. Sumarse no es ninguna de las dos —es abrir la cuenta propia, que es
              reversible y solo cambia datos de uno— y en navy se disfrazaba de la tercera mitad
              de una pareja que solo tiene dos. */}
          <div className="mt-9">
            <BotonLanding nivel="secundario" onClick={onOpenChat}>
              {t('landingOrgsCta')}
              <span className="inline-block -scale-x-100">R</span>
            </BotonLanding>
          </div>
        </div>

        <div className="min-w-0">
          <Composicion
            foto="/images/landing/voluntarios-accion.jpg"
            alt="Voluntarios con casco y guantes retiran escombros y los cargan en un volco."
          >
            {/* Lo que esta persona quiere ver: que del otro lado hay organizaciones reales y que
                lo que hacen queda registrado. */}
            <div className="rounded-rd-lg border border-rd-line bg-rd-surface p-4 shadow-2xs">
              <p className="font-rd m-0 flex items-center gap-1.5 text-rd-14 font-semibold text-rd-ink">
                <span className="truncate">Fundación Manos Unidas</span>
                <BadgeCheck className="h-4 w-4 shrink-0 text-rd-navy" />
              </p>
              <p className="font-rd m-0 mt-1 text-rd-12-5 text-rd-ink-2">Fundación, Kennedy, Bogotá</p>

              <div className="mt-3.5 flex items-center gap-4 border-t border-rd-line-soft pt-3.5">
                <p className="font-rd m-0 text-rd-12-5 text-rd-ink-2">
                  <b className="text-rd-14 font-semibold text-rd-ink tabular-nums">12</b> entregas confirmadas
                </p>
                <p className="font-rd m-0 text-rd-12-5 text-rd-ink-2">
                  <b className="text-rd-14 font-semibold text-rd-ink tabular-nums">8</b> en el equipo
                </p>
              </div>
            </div>
          </Composicion>
        </div>
      </div>

      {/* Los tres pilares como lista numerada con reglas finas, no como tarjetas sueltas. */}
      <ol className="mt-16 list-none p-0 sm:mt-20">
        {pilares.map((p, i) => (
          <li key={p.n}>
            {i > 0 && <Regla className="my-7 sm:my-8" />}
            <div className="grid gap-3 sm:grid-cols-12 sm:gap-6">
              <span className="font-rd text-rd-18 font-normal text-rd-ink-3 tabular-nums sm:col-span-1">
                {String(p.n).padStart(2, '0')}
              </span>

              <div className="sm:col-span-4">
                <h3 className="font-rd m-0 text-rd-18 leading-snug font-semibold tracking-rd-titulo text-rd-ink">{p.titulo}</h3>
                <p className="font-rd m-0 mt-2 flex items-center gap-1.5 text-rd-12-5 font-semibold text-rd-ink-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-rd-navy" />
                  {p.insignia}
                </p>
              </div>

              <p className="font-rd m-0 text-rd-15 leading-relaxed text-rd-ink-2 sm:col-span-7">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Seccion>
  );
};
