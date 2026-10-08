import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Moon, Settings, Sun } from 'lucide-react';
import { BotonLanding, claseOpcion as opcion } from './base';
import { LANGUAGES } from '../../../components/LanguageSelector';
import { useTranslation } from '../../../i18n/LanguageContext';
import type { TemaLanding } from '../useTemaLanding';

/**
 * La configuración de la landing, a la derecha del header (Alejandro, 6 de octubre de 2026: «en el
 * header pon a la derecha un botón de configuración que despliegue un menu flotante que permita
 * modifar el idioma y pasar de darkmode a lightmode. y así tenemos ambos»). Reemplaza al selector
 * de idioma suelto que había ahí.
 *
 * El botón es el botón de icono de la landing (`BotonLanding` con `soloIcono`), el mismo de la X y
 * de las pestañas de la sección 2.
 *
 * El panel está hecho con las piezas de RaDAR, no con unas nuevas (Alejandro, el mismo día, sobre
 * la primera versión: «se ve con un estilo mega diferente al de radar. o sea, mejoralo, está
 * horrible»; aquella llevaba botones grandes con la opción elegida rellena de blanco):
 * - La caja y las filas son las del ⋮ de la herramienta (`MenuAcciones`): caja de esquina `rd-lg`
 *   con marco y sombra y 4 de relleno, filas de 13,5 con 8 de relleno y esquina `rd-md`, y el
 *   hundido al pasar el cursor. El idioma elegido va en negrita con una marca al final, como en el
 *   selector de idioma de la herramienta.
 * - El tema es el conmutador de la herramienta (`Segmented`): un riel redondo con marco y la
 *   opción elegida en píldora de tinta.
 * - Un rótulo pequeño en gris sobre cada grupo y una línea entre los dos.
 * Traducidas a los tokens de la landing, así que el panel cambia con el modo como el resto de la
 * página.
 *
 * Se comporta como el ⋮: se cierra al tocar fuera o con Escape, y con Escape el foco vuelve al
 * botón. Pero no es un `role="menu"`: lleva dos grupos de opciones que se quedan elegidas, así que
 * es un desplegable (botón con `aria-expanded` y `aria-controls`) con botones que se marcan con
 * `aria-pressed`, como `Segmented`. No se cierra al elegir: así se ve el cambio y se puede elegir
 * lo otro sin volver a abrir.
 *
 * Los idiomas y sus banderas son los del selector del equipo (`LANGUAGES` de `LanguageSelector`),
 * con su mismo `setLanguage`.
 */
export const AjustesLanding: React.FC<{ tema: TemaLanding; alCambiarTema: (tema: TemaLanding) => void }> = ({ tema, alCambiarTema }) => {
  const { language, setLanguage, t } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const panel = `ajustes-${id}`;

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (raiz.current?.contains(e.target as Node)) return;
      setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener('mousedown', alTocar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alTocar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const rotulo = 'font-rd m-0 px-2 pt-1.5 pb-1 text-rd-11-5 font-semibold text-rd-noche-meta';
  /* La fila del ⋮ de la herramienta, en los tokens de la landing. */
  const fila =
    'font-rd flex w-full cursor-pointer items-center gap-3 rounded-rd-md p-2 text-left text-rd-13-5 text-rd-noche-tinta transition-colors duration-150 hover:bg-rd-noche-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rd-ayuda';

  return (
    <div ref={raiz} className="relative">
      <BotonLanding
        ref={boton}
        soloIcono
        etiqueta={t('landingAjustes')}
        expandido={abierto}
        controla={panel}
        onClick={() => setAbierto((a) => !a)}
        icono={<Settings className="h-5 w-5" />}
      />

      {/* Colgado del borde derecho del botón, 8 por debajo. */}
      {abierto && (
        <div
          id={panel}
          className="absolute top-full right-0 z-50 mt-2 flex w-56 flex-col gap-0.5 rounded-rd-lg border border-rd-noche-linea bg-rd-noche-2 p-1 shadow-rd-2"
        >
          <p id={`${panel}-idioma`} className={rotulo}>
            {t('landingAjustesIdioma')}
          </p>
          <div role="group" aria-labelledby={`${panel}-idioma`} className="flex flex-col gap-0.5">
            {LANGUAGES.map((l) => {
              const elegido = l.code === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  aria-pressed={elegido}
                  onClick={() => setLanguage(l.code)}
                  className={`${fila} ${elegido ? 'font-semibold' : 'font-normal'}`}
                >
                  <img src={l.flag} alt="" className="h-4.5 w-4.5 shrink-0 rounded-rd-sm object-cover" />
                  {l.label}
                  {elegido && <Check aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div aria-hidden="true" className="mx-2 my-1 h-px bg-rd-noche-linea" />

          <p id={`${panel}-tema`} className={rotulo}>
            {t('landingAjustesTema')}
          </p>
          <div className="px-1 pb-1">
            <div role="group" aria-labelledby={`${panel}-tema`} className="grid grid-cols-2 gap-0.5 rounded-full border border-rd-noche-linea p-1">
              <button type="button" aria-pressed={tema === 'oscuro'} onClick={() => alCambiarTema('oscuro')} className={opcion(tema === 'oscuro')}>
                <Moon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {t('landingTemaOscuro')}
              </button>
              <button type="button" aria-pressed={tema === 'claro'} onClick={() => alCambiarTema('claro')} className={opcion(tema === 'claro')}>
                <Sun aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {t('landingTemaClaro')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
