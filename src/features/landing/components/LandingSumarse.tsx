import React, { useId, useMemo, useState } from 'react';
import { BotonLanding, claseConmutador, claseOpcion, Parrafo, Regla, Rotulo, Seccion, Titular } from './base';
import { destinosDe, RedSumarse, type RolRed } from './RedSumarse';
import { useTranslation } from '../../../i18n/LanguageContext';
import type { TranslationKey } from '../../../i18n/translations';

/**
 * «Súmate», la sección 5, como «Tu punto en la red» (7 de octubre de 2026). Alejandro: «no solo
 * una mejora visual, sino busca una iteración como se hicieron en las otras secciones»; y sobre la
 * propuesta, «ok».
 *
 * Las secciones 2 y 3 avanzan con el scroll y la 4 corre sola; esta avanza porque la persona
 * elige. Y cierra el relato: la 3 cuenta un encuentro, la 4 muestra el territorio en vivo, y aquí
 * quien lee aparece en él.
 * - A la izquierda, el titular de siempre y debajo la pregunta: ¿cómo quieres sumarte? Tres
 *   opciones (organización, líder comunitario, voluntario) en el `Segmented` de la herramienta,
 *   traducido a la landing (`claseConmutador`, `claseOpcion`). Sin elegir, ninguna.
 * - A la derecha, la red (`RedSumarse`): al elegir, «tú» cae en el centro y salen tres líneas a
 *   los nodos con los que trabajarías.
 * - Los tres pilares dejan de ser una lista general: cada uno es una de esas líneas, con su número,
 *   contado para el papel elegido, y debajo a quién llega. Sin papel, dicen lo de siempre. Pasar el
 *   cursor por uno deja su línea al frente.
 * - El botón dice solo el verbo, «Sumarme» (manual de estilo §4), y sigue abriendo lo mismo
 *   (`onOpenChat`).
 *
 * Antes estaba aquí la foto de voluntarios con la ficha de una fundación encima (`Composicion`,
 * 29 de septiembre de 2026) y los pilares en una lista numerada a todo el ancho.
 *
 * El orden en el teléfono es el de la lectura: el titular, la pregunta, la red y los pilares, así
 * al elegir se ve la red justo debajo. Desde 1280 la red pasa a la derecha, a lo alto de todo.
 */

const ROLES: { id: RolRed; clave: 'Organizacion' | 'Lider' | 'Voluntario' }[] = [
  { id: 'organizacion', clave: 'Organizacion' },
  { id: 'lider', clave: 'Lider' },
  { id: 'voluntario', clave: 'Voluntario' },
];

export const LandingSumarse: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  const { t } = useTranslation();
  const grupo = useId();
  const [rol, setRol] = useState<RolRed | null>(null);
  const [resaltado, setResaltado] = useState<number | null>(null);
  const clave = ROLES.find((r) => r.id === rol)?.clave;
  /* Con quién trabaja el papel elegido, un nodo de la red por pilar (`destinosDe`). */
  const destinos = useMemo(() => (rol ? destinosDe(rol) : []), [rol]);
  const ids = useMemo(() => destinos.map((n) => n.id), [destinos]);

  const pilares = [1, 2, 3].map((n) => ({
    n,
    titulo: t(`landingOrgsPillar${n}Badge` as TranslationKey),
    texto: clave ? t(`landingRed${clave}${n}` as TranslationKey) : t(`landingOrgsPillar${n}DescMobile` as TranslationKey),
    destino: destinos[n - 1],
  }));

  return (
    <Seccion id="organizaciones">
      {/* El contenedor (Alejandro, 7 de octubre de 2026: «en la sección 5 va a haber una contenedor
          como el de la sección 1. pero con fill de otro color gris (se puede usar por ejempo el
          color del fondo de la app y el blanco de los bloques de contenido). ese contenedor ya está
          desplegado completamente. y no tiene x como el otro»): del ancho de las 12 columnas, en el
          gris del contenedor (`rd-noche-contenedor`, el fondo de la app en claro) con su grano, y
          dentro tres bloques en la superficie (blanco en claro), como las tarjetas de la
          herramienta sobre su fondo: el título con la pregunta, la red y los pilares con el
          botón. Va abierto, sin la X ni el recorrido del panel de la sección 2. En el teléfono los
          bloques siguen el orden de lectura (la pregunta, la red justo debajo y los pilares); desde
          1280 la red pasa a la derecha, a lo alto de los otros dos. */}
      <div className="rd-grano grid grid-cols-1 gap-2 rounded-rd-xl bg-rd-noche-contenedor p-2 sm:gap-4 sm:p-4 xl:grid-cols-2">
        <div className="rounded-rd-lg bg-rd-noche-2 p-5 sm:p-10 xl:col-start-1">
          <Rotulo>{t('landingNavForOrgs')}</Rotulo>
          <Titular className="mt-3">
            {t('landingOrgsTitle')} {t('landingOrgsTitleOrg')}
            {t('landingOrgsTitleRest')}
          </Titular>
          <Parrafo className="mt-6 max-w-xl">{t('landingOrgsDescMobile')}</Parrafo>

          {/* ¿Cómo quieres sumarte? */}
          {/* La pregunta es lo que pone a la persona a elegir: va a 18, por encima del cuerpo, para
              que la mirada baje del titular a ella (7 de octubre de 2026, «guiémoslo visualmente»). */}
          <p id={grupo} className="font-rd m-0 mt-9 mb-3 text-rd-18 font-semibold text-rd-noche-tinta">
            {t('landingRedGrupo')}
          </p>
          {/* En el teléfono la pista va a lo ancho, en tres partes iguales, y una opción puede partir
              en dos renglones: dentro del contenedor y del bloque quedan unos 290 px, y las tres en
              un renglón piden 320 («Líder comunitario» es la que parte). */}
          <div role="group" aria-labelledby={grupo} className={`${claseConmutador} max-sm:grid max-sm:w-full max-sm:grid-cols-3`}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={rol === r.id}
                onClick={() => setRol(r.id)}
                className={`${claseOpcion(rol === r.id)} max-sm:h-auto max-sm:min-h-8.5 max-sm:px-2 max-sm:py-1.5 max-sm:text-center max-sm:leading-tight max-sm:whitespace-normal`}
              >
                {t(`landingRed${r.clave}` as TranslationKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center rounded-rd-lg bg-rd-noche-2 p-4 sm:p-8 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <RedSumarse
            rol={rol}
            destinos={ids}
            resaltado={resaltado}
            onResaltar={setResaltado}
            textos={{ etiqueta: t('landingRedEtiqueta'), tu: t('landingRedTu'), tuLugar: t('landingRedTuLugar') }}
          />
        </div>

        <div className="rounded-rd-lg bg-rd-noche-2 p-5 sm:p-10 xl:col-start-1">
          {/* Los tres pilares: cada uno es una línea de la red. */}
          <ol className="m-0 list-none p-0">
            {pilares.map((p, i) => (
              <li key={p.n} onMouseEnter={() => setResaltado(i)} onMouseLeave={() => setResaltado(null)}>
                {i > 0 && <Regla className="my-5" />}
                <div className="flex gap-5">
                  <span className={`font-rd text-rd-18 leading-snug font-semibold tabular-nums transition-colors duration-300 ${rol ? 'text-rd-ayuda' : 'text-rd-noche-meta'}`}>
                    {String(p.n).padStart(2, '0')}
                  </span>
                  <div key={rol ?? 'sin-rol'} className="rd-paso min-w-0">
                    <h3 className="font-rd m-0 text-rd-18 leading-snug font-semibold text-rd-noche-tinta">{p.titulo}</h3>
                    <p className="font-rd m-0 mt-1.5 text-rd-15 leading-relaxed text-rd-noche-tinta-2">{p.texto}</p>
                    {p.destino && (
                      <p className="font-rd m-0 mt-2 truncate text-rd-13 text-rd-noche-meta">
                        {p.destino.nombre}, {p.destino.detalle}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Contorno, no navy (Alejandro, 29 de septiembre de 2026). En la landing el navy es de
              «Ofrecer ayuda» y el coral de «Pedir ayuda»: son la pareja sobre la que se lee todo
              el producto. Sumarse no es ninguna de las dos —es abrir la cuenta propia, que es
              reversible y solo cambia datos de uno— y en navy se disfrazaba de la tercera mitad
              de una pareja que solo tiene dos.

              El texto es solo el verbo, «Sumarme», como pide el manual de estilo (§4: solo el
              verbo cuando lo demás ya lo dice el contexto): el papel está elegido justo encima.
              Hasta el 7 de octubre de 2026 decía «Sumarme a raDAЯ», con la marca estilizada dentro
              del texto, y por un rato «Sumarme como voluntario» según el papel. */}
          <div className="mt-9">
            <BotonLanding nivel="secundario" onClick={onOpenChat}>
              {t('landingOrgsCta')}
            </BotonLanding>
          </div>
        </div>
      </div>
    </Seccion>
  );
};
