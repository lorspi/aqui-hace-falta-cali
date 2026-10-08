import { useEffect, useState } from 'react';

/**
 * El modo de la landing: oscuro, que es el de arranque, o claro (Alejandro, 6 de octubre de 2026:
 * «pasar de darkmode a lightmode. y así tenemos ambos»). Lo elige quien visita desde la
 * configuración del header (`AjustesLanding`) y se recuerda en su navegador.
 *
 * El modo se aplica marcando el `html` con `data-tema-landing`, que es donde `index.css` cambia
 * los tokens de la landing a sus valores claros (ver EL MODO CLARO DE LA LANDING). En el `html` y
 * no en la raíz de la landing porque el cursor vive en `body`, fuera de ella. La marca se quita al
 * salir de la landing: la herramienta no tiene modo claro ni oscuro y no debe heredarla.
 *
 * La lectura y la escritura del navegador van en `try`: en una ventana privada o con los datos
 * bloqueados fallan, y entonces la landing arranca en oscuro y el cambio dura lo que la visita.
 */
export type TemaLanding = 'oscuro' | 'claro';

const CLAVE = 'rd_landing_tema';

const leer = (): TemaLanding => {
  try {
    return window.localStorage.getItem(CLAVE) === 'claro' ? 'claro' : 'oscuro';
  } catch {
    return 'oscuro';
  }
};

export function useTemaLanding(): [TemaLanding, (tema: TemaLanding) => void] {
  const [tema, setTema] = useState<TemaLanding>(leer);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.temaLanding = tema;
    try {
      window.localStorage.setItem(CLAVE, tema);
    } catch {
      /* Sin almacenamiento el modo dura lo que la visita. */
    }
    return () => {
      delete html.dataset.temaLanding;
    };
  }, [tema]);

  return [tema, setTema];
}
