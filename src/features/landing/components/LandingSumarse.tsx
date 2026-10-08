import React, { useId, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BotonLanding, claseBotonIcono, claseConmutador, claseOpcion, Parrafo, Regla, Rotulo, Seccion, Titular } from './base';
import { destinosDe, RedSumarse, type NodoRed, type RolRed } from './RedSumarse';
import { useConsulta } from '../useConsulta';
import { useCarrusel } from '../useCarrusel';
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
 *   cursor por uno deja su línea al frente. Solo el cursor (7 de octubre de 2026, la lógica del
 *   teléfono): el dedo que tocaba un pilar dejaba la línea resaltada para siempre, y en el
 *   teléfono la red ya quedó arriba, fuera de la pantalla, cuando se leen los pilares.
 * - El botón dice solo el verbo, «Sumarme» (manual de estilo §4), y sigue abriendo lo mismo
 *   (`onOpenChat`).
 *
 * Antes estaba aquí la foto de voluntarios con la ficha de una fundación encima (`Composicion`,
 * 29 de septiembre de 2026) y los pilares en una lista numerada a todo el ancho.
 *
 * El orden en el teléfono es el de la lectura: el titular, la pregunta, la red y los pilares, así
 * al elegir se ve la red justo debajo. Desde 1280 la red pasa a la derecha, a lo alto de todo.
 *
 * EN EL TELÉFONO (por debajo de 1024) no hay conmutador. Alejandro, 7 de octubre de 2026: «el
 * segmented control de la ultima sección no funciona para nada. aparte no tiene mucho sentido como
 * componente acá porque lo que ven que varía es la animación pero el texto está perdido por allá
 * abajo. cómo se te ocurre que puede funcionar esa experiencia para que el usuario no se vea
 * trabado o conflictuado con esa interaccion?». En una columna se elegía arriba, la red cambiaba
 * en medio y lo que cambiaba de verdad, los pilares, quedaba una pantalla más abajo: se tocaba
 * algo y no se veía qué decía. La propuesta:
 * - Cada papel es una tarjeta con lo suyo: su nombre, sus tres pilares contados para él con a
 *   quién llega cada uno, y su botón. Van en un carrusel como los de las secciones 2 y 4
 *   (`useCarrusel`), así elegir es deslizar, y lo que se lee está en la mano.
 * - La red va justo encima, apaisada (`apaisado` en `RedSumarse`) para que quepan las dos en una
 *   pantalla, y dibuja las líneas de la tarjeta que se ve: deslizar a otro papel las vuelve a
 *   dibujar. Los números de las líneas son los de los pilares de la tarjeta.
 * - Hay papel desde el principio, el primero: no hay un estado vacío que pida tocar algo antes de
 *   ver qué pasa.
 * - Encima de las tarjetas, la pregunta y dos flechas, que dicen que el carrusel sigue (ver el
 *   encabezado del carrusel, abajo).
 * Desde 1024 todo sigue como estaba, con el conmutador.
 */

const ROLES: { id: RolRed; clave: 'Organizacion' | 'Lider' | 'Voluntario' }[] = [
  { id: 'organizacion', clave: 'Organizacion' },
  { id: 'lider', clave: 'Lider' },
  { id: 'voluntario', clave: 'Voluntario' },
];
const CONSULTA_COLUMNAS = '(min-width: 1024px)';
/* Los destinos de cada papel en la red apaisada del teléfono, en el orden de `ROLES`. */
const DESTINOS_MOVIL = ROLES.map((r) => destinosDe(r.id, true));

export const LandingSumarse: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  const { t } = useTranslation();
  const grupo = useId();
  const columnas = useConsulta(CONSULTA_COLUMNAS, true);
  const reducido = useConsulta('(prefers-reduced-motion: reduce)', false);
  const [rol, setRol] = useState<RolRed | null>(null);
  const [resaltado, setResaltado] = useState<number | null>(null);
  /* En el teléfono, la tarjeta de papel que se ve. */
  const [visto, setVisto] = useState(0);
  const { carrusel, tarjeta, ir } = useCarrusel(!columnas, setVisto);
  const idCarrusel = useId();
  const clave = ROLES.find((r) => r.id === rol)?.clave;
  /* Con quién trabaja el papel elegido, un nodo de la red por pilar (`destinosDe`). */
  const destinos = useMemo(() => (rol ? destinosDe(rol) : []), [rol]);
  const ids = useMemo(() => destinos.map((n) => n.id), [destinos]);
  const idsMovil = useMemo(() => DESTINOS_MOVIL[visto].map((n) => n.id), [visto]);

  const pilaresDe = (c: (typeof ROLES)[number]['clave'] | undefined, hacia: NodoRed[]) =>
    [1, 2, 3].map((n) => ({
      n,
      titulo: t(`landingOrgsPillar${n}Badge` as TranslationKey),
      texto: c ? t(`landingRed${c}${n}` as TranslationKey) : t(`landingOrgsPillar${n}DescMobile` as TranslationKey),
      destino: hacia[n - 1] as NodoRed | undefined,
    }));
  const pilares = pilaresDe(clave, destinos);

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
          {/* En el teléfono la pregunta baja a nombrar el carrusel de papeles, y el conmutador no
              va (ver EN EL TELÉFONO). */}
          {columnas && (
            <>
              <p id={grupo} className="font-rd m-0 mt-9 mb-3 text-rd-18 font-semibold text-rd-noche-tinta">
                {t('landingRedGrupo')}
              </p>
              <div role="group" aria-labelledby={grupo} className={claseConmutador}>
                {ROLES.map((r) => (
                  <button key={r.id} type="button" aria-pressed={rol === r.id} onClick={() => setRol(r.id)} className={claseOpcion(rol === r.id)}>
                    {t(`landingRed${r.clave}` as TranslationKey)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-center rounded-rd-lg bg-rd-noche-2 p-4 sm:p-8 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <RedSumarse
            rol={columnas ? rol : ROLES[visto].id}
            destinos={columnas ? ids : idsMovil}
            resaltado={columnas ? resaltado : null}
            onResaltar={setResaltado}
            textos={{ etiqueta: t('landingRedEtiqueta'), tu: t('landingRedTu'), tuLugar: t('landingRedTuLugar') }}
            apaisado={!columnas}
          />
        </div>

        {!columnas && (
          /* El encabezado del carrusel: la pregunta y las flechas (Alejandro, 7 de octubre de 2026:
             «las cards del carrusel de la ultima sección es dificil de entender porque es casi
             imposible saber que se puede hacer scroll lateral... al principio pensé que habías
             dejado para que fuera de unica vista»). La tarjeta que asoma no bastaba: dentro del
             contenedor gris se leía como el borde de otro bloque. Las flechas dicen que hay más y
             dónde se está (la de atrás se apaga en el primero, la de adelante en el último), y la
             pregunta, justo encima, dice que cada tarjeta es una respuesta. Son el botón de icono
             de la landing (`claseBotonIcono`), con su estado apagado. */
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-1 sm:px-8">
            <p id={grupo} className="font-rd m-0 min-w-0 text-rd-18 font-semibold text-rd-noche-tinta">
              {t('landingRedGrupo')}
            </p>
            <div className="flex shrink-0 gap-2">
              {[
                { paso: -1, Icono: ChevronLeft, nombre: t('landingRedAnterior'), apagada: visto === 0 },
                { paso: 1, Icono: ChevronRight, nombre: t('landingRedSiguiente'), apagada: visto === ROLES.length - 1 },
              ].map(({ paso, Icono, nombre, apagada }) => (
                <button
                  key={paso}
                  type="button"
                  aria-label={nombre}
                  aria-controls={idCarrusel}
                  disabled={apagada}
                  onClick={() => ir(visto + paso, reducido)}
                  className={`${claseBotonIcono()} disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:active:translate-y-0`}
                >
                  <Icono aria-hidden="true" className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {!columnas && (
          /* Los papeles del teléfono: una tarjeta por papel, en el carrusel. Sale hasta el borde del
             contenedor gris y lo devuelve como relleno; cada tarjeta mide tres columnas y media y
             tiene su alto. */
          <div
            ref={carrusel}
            id={idCarrusel}
            role="group"
            aria-labelledby={grupo}
            className="zona-rd-scroll relative -mx-2 flex snap-x snap-mandatory scroll-px-2 items-start gap-4 overflow-x-auto px-2 sm:-mx-4 sm:scroll-px-4 sm:px-4"
          >
            {ROLES.map((r, k) => (
              <div key={r.id} ref={tarjeta(k)} className="tarjeta-rd-carrusel snap-start rounded-rd-lg bg-rd-noche-2 p-5 sm:p-8">
                <h3 className="font-rd m-0 text-rd-22 leading-snug font-semibold text-rd-noche-tinta">{t(`landingRed${r.clave}` as TranslationKey)}</h3>
                <ol className="m-0 mt-5 list-none p-0">
                  {pilaresDe(r.clave, DESTINOS_MOVIL[k]).map((p, i) => (
                    <li key={p.n}>
                      {i > 0 && <Regla className="my-4" />}
                      <div className="flex gap-4">
                        <span className="font-rd text-rd-16 leading-snug font-semibold text-rd-ayuda tabular-nums">{String(p.n).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <h4 className="font-rd m-0 text-rd-16 leading-snug font-semibold text-rd-noche-tinta">{p.titulo}</h4>
                          <p className="font-rd m-0 mt-1 text-rd-14 leading-relaxed text-rd-noche-tinta-2">{p.texto}</p>
                          {p.destino && (
                            <p className="font-rd m-0 mt-1.5 truncate text-rd-13 text-rd-noche-meta">
                              {p.destino.nombre}, {p.destino.detalle}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-7">
                  <BotonLanding nivel="secundario" onClick={onOpenChat}>
                    {t('landingOrgsCta')}
                  </BotonLanding>
                </div>
              </div>
            ))}
          </div>
        )}

        {columnas && (
          <div className="rounded-rd-lg bg-rd-noche-2 p-5 sm:p-10 xl:col-start-1">
            {/* Los tres pilares: cada uno es una línea de la red. */}
            <ol className="m-0 list-none p-0">
              {pilares.map((p, i) => (
                <li
                  key={p.n}
                  onPointerEnter={(ev) => {
                    if (ev.pointerType === 'mouse') setResaltado(i);
                  }}
                  onPointerLeave={(ev) => {
                    if (ev.pointerType === 'mouse') setResaltado(null);
                  }}
                >
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
        )}
      </div>
    </Seccion>
  );
};
