import React, { useId, useMemo, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, HeartHandshake, Users } from 'lucide-react';
import { BotonLanding, Parrafo, Regla, Seccion, Titular } from './base';
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
 * - A la izquierda, el titular y los 3 botones principales de selección de rol (organización,
 *   líder comunitario, voluntario) con alto contraste e icono distintivo.
 * - A la derecha, la red (`RedSumarse`): al elegir, «tú» cae en el centro y salen tres líneas a
 *   los nodos con los que trabajarías en una proporción compacta que cabe en un solo pantallazo.
 * - Los tres pilares dejan de ser una lista general: cada uno es una de esas líneas, con su número,
 *   contado para el papel elegido de forma limpia y directa.
 */

const ROLES: { id: RolRed; clave: 'Organizacion' | 'Lider' | 'Voluntario'; icono: React.ComponentType<{ className?: string }> }[] = [
  { id: 'organizacion', clave: 'Organizacion', icono: Building2 },
  { id: 'lider', clave: 'Lider', icono: Users },
  { id: 'voluntario', clave: 'Voluntario', icono: HeartHandshake },
];
const CONSULTA_COLUMNAS = '(min-width: 1024px)';
/* Los destinos de cada papel en la red apaisada del teléfono, en el orden de `ROLES`. */
const DESTINOS_MOVIL = ROLES.map((r) => destinosDe(r.id, true));

export const LandingSumarse: React.FC<{ onOpenChat?: () => void }> = () => {
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
    <Seccion id="organizaciones" separacion="apretada" className="!py-3 sm:!py-4 lg:!py-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:gap-6 items-start claro:items-stretch claro:lg:rounded-rd-xl claro:lg:bg-rd-noche-contenedor claro:lg:p-3 claro:lg:rd-grano">
        {columnas ? (
          /* En escritorio: Columna Izquierda con Card 1 y Card 2 juntas (sin espacio muerto) */
          <>
            <div className="flex flex-col gap-3 lg:col-start-1 lg:pl-6 xl:pl-10 2xl:pl-16">
              {/* Módulo de Titular, párrafo y CTAs de rol (directamente sobre el fondo en oscuro) */}
              <div className="p-1 sm:p-2 pb-3 sm:pb-4 claro:rounded-rd-lg claro:bg-rd-noche-2 claro:p-4 sm:claro:p-5 lg:claro:p-6 claro:pb-6 sm:claro:pb-7 lg:claro:pb-8 claro:border claro:border-transparent">
                <Titular className="text-rd-24 sm:text-rd-28 xl:text-rd-30 leading-snug">
                  {t('landingOrgsTitle')}
                </Titular>
                <Parrafo className="mt-2.5 max-w-xl text-rd-14 sm:text-rd-14.5 leading-relaxed text-rd-noche-tinta-2">
                  {t('landingOrgsDescMobile')}
                </Parrafo>

                {/* Roles */}
                <p id={grupo} className="font-rd m-0 mt-4 mb-2 text-rd-12 font-medium text-rd-noche-meta">
                  Elige tu rol
                </p>
                <div role="group" aria-labelledby={grupo} className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => {
                    const Icono = r.icono;
                    const activo = rol === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => setRol(r.id)}
                        className={`group font-rd flex items-center justify-center gap-1.5 rounded-rd-md py-2 px-2.5 text-rd-13 font-medium transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-rd-ayuda active:scale-[0.98] ${
                          activo
                            ? 'bg-rd-ayuda text-rd-noche font-semibold shadow-md shadow-rd-ayuda/20 border border-rd-ayuda'
                            : 'bg-rd-noche-2/80 hover:bg-rd-noche-2 text-rd-noche-tinta-2 hover:text-rd-noche-tinta border border-rd-noche-linea/60 hover:border-rd-noche-meta/50'
                        }`}
                      >
                        <Icono className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${activo ? 'text-rd-noche' : 'text-rd-ayuda'}`} />
                        <span className="truncate">{t(`landingRed${r.clave}` as TranslationKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Los tres pilares y botón Sumarme (compacto y liviano) */}
              <div className="rounded-rd-lg bg-rd-noche-2/60 backdrop-blur-xs p-4 sm:p-5 lg:p-5 flex flex-col border border-rd-noche-linea/35 claro:bg-rd-noche-2 claro:border-transparent">
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
                      className="group cursor-default py-0.5"
                    >
                      {i > 0 && <Regla className="my-2.5 sm:my-3" />}
                      <div className="flex gap-3 items-start">
                        <span className={`font-rd text-rd-14 sm:text-rd-15 leading-snug font-semibold tabular-nums transition-colors duration-200 ${rol ? 'text-rd-ayuda' : 'text-rd-noche-meta'}`}>
                          {String(p.n).padStart(2, '0')}
                        </span>
                        <div key={rol ?? 'sin-rol'} className="rd-paso min-w-0">
                          <h3 className="font-rd m-0 text-rd-14 sm:text-rd-15 leading-snug font-semibold text-rd-noche-tinta">{p.titulo}</h3>
                          <p className="font-rd m-0 mt-0.5 text-rd-13 leading-relaxed text-rd-noche-tinta-2">{p.texto}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 pt-1">
                  <BotonLanding nivel="secundario" tamano="md" como="enlace" href="/registro">
                    {t('landingOrgsCta')}
                  </BotonLanding>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Red animada directamente sobre el fondo */}
            <div className="flex min-w-0 items-center justify-center lg:items-start lg:-mt-6 xl:-mt-10 p-2 sm:p-4 lg:col-start-2 overflow-hidden claro:rounded-rd-lg claro:bg-rd-noche-2 claro:p-3 sm:claro:p-6 claro:border claro:border-transparent">
              <RedSumarse
                rol={rol}
                destinos={ids}
                resaltado={resaltado}
                onResaltar={setResaltado}
                textos={{ etiqueta: t('landingRedEtiqueta'), tu: t('landingRedTu'), tuLugar: t('landingRedTuLugar') }}
                apaisado={false}
              />
            </div>
          </>
        ) : (
          /* En móvil: 1) Título y descripción, 2) Tarjetas de roles, 3) Red animada */
          <>
            {/* 1. Módulo de título y descripción: directamente sobre el fondo */}
            <div className="px-2 pt-2 pb-1 sm:px-4">
              <Titular className="text-rd-24 sm:text-rd-28 leading-tight">
                {t('landingOrgsTitle')}
              </Titular>
              <Parrafo className="mt-2.5 max-w-xl text-rd-14 leading-relaxed text-rd-noche-tinta-2">
                {t('landingOrgsDescMobile')}
              </Parrafo>
            </div>

            {/* 2. Módulo de tarjetas: controles sleek (sin título repetido) y carrusel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 pt-2 pb-1">
                {/* Indicador de posición / rol */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {ROLES.map((r, k) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => ir(k, reducido)}
                        aria-label={t(`landingRed${r.clave}` as TranslationKey)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          visto === k ? 'w-6 bg-rd-ayuda' : 'w-1.5 bg-rd-noche-linea'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-rd text-rd-12 font-medium text-rd-noche-meta tabular-nums">
                    {String(visto + 1).padStart(2, '0')} / 03
                  </span>
                </div>

                {/* Flechas compactas y sleek */}
                <div className="flex shrink-0 gap-1.5">
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
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-rd-noche-linea/60 bg-rd-noche-2/80 text-rd-noche-tinta-2 hover:text-rd-noche-tinta hover:border-rd-noche-meta/50 transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <Icono aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Carrusel de tarjetas de roles con altura unificada */}
              <div
                ref={carrusel}
                id={idCarrusel}
                role="group"
                aria-label="Roles para sumarse"
                className="zona-rd-scroll relative -mx-2 flex snap-x snap-mandatory scroll-px-2 items-stretch gap-4 overflow-x-auto px-2 sm:-mx-4 sm:scroll-px-4 sm:px-4"
              >
                {ROLES.map((r, k) => (
                  <div key={r.id} ref={tarjeta(k)} className="tarjeta-rd-carrusel snap-start flex flex-col justify-between rounded-rd-lg bg-rd-noche-contenedor rd-grano border border-rd-noche-linea/40 p-5 sm:p-8 shadow-sm">
                    <div className="flex flex-col">
                      <h3 className="font-rd m-0 text-rd-22 leading-snug font-semibold text-rd-noche-tinta">{t(`landingRed${r.clave}` as TranslationKey)}</h3>
                      <ol className="m-0 mt-5 list-none p-0">
                        {pilaresDe(r.clave, DESTINOS_MOVIL[k]).map((p, i) => (
                          <li key={p.n}>
                            {i > 0 && <Regla className="my-3" />}
                            <div className="flex gap-4">
                              <span className="font-rd text-rd-16 leading-snug font-semibold text-rd-ayuda tabular-nums">{String(p.n).padStart(2, '0')}</span>
                              <div className="min-w-0">
                                <h4 className="font-rd m-0 text-rd-16 leading-snug font-semibold text-rd-noche-tinta">{p.titulo}</h4>
                                <p className="font-rd m-0 mt-1 text-rd-14 leading-relaxed text-rd-noche-tinta-2">{p.texto}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="mt-6 pt-2">
                      <BotonLanding nivel="secundario" como="enlace" href="/registro">
                        {t('landingOrgsCta')}
                      </BotonLanding>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. De último: la animación de la red directamente sobre el fondo con buen respiro vertical */}
            <div className="flex min-w-0 items-center justify-center my-3 py-6 sm:py-8 px-1 overflow-hidden">
              <RedSumarse
                rol={ROLES[visto].id}
                destinos={idsMovil}
                resaltado={null}
                onResaltar={setResaltado}
                textos={{ etiqueta: t('landingRedEtiqueta'), tu: t('landingRedTu'), tuLugar: t('landingRedTuLugar') }}
                apaisado={true}
              />
            </div>
          </>
        )}
      </div>
    </Seccion>
  );
};
