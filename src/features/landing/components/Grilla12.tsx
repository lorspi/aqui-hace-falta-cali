import React, { useEffect, useState } from 'react';

/**
 * La grilla de 12 columnas, para revisar si lo que hay en pantalla se apoya en ella o flota.
 * Se enciende y se apaga con la tecla G (Alejandro, 29 de septiembre de 2026).
 *
 * Solo existe en `npm run dev`: `LandingPage` la monta con `import.meta.env.DEV`, así que la build
 * de producción no la lleva (Alejandro, 6 de octubre de 2026: «Si, solo en desarrollo como en
 * sandbox»; hallazgo H18 de la revisión).
 *
 * Empieza apagada y no deja rastro cuando está apagada: no pinta nada y no intercepta el cursor
 * (`pointer-events: none` en `.rd-grilla`), así que no puede estorbar a nadie que la deje puesta.
 *
 * El contenedor es el de `Seccion` —`max-w-360` y márgenes 5 / 8 / 12— porque es el contenedor
 * real de la landing; si la grilla usara otro, mediría contra algo que no existe. El hueco de 24
 * entre columnas es lo único supuesto: el producto no declara una grilla en ningún archivo, así
 * que ese es el número que habría que confirmar con diseño.
 */
export const Grilla12: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'g' && e.key !== 'G') return;
      /* Con un modificador la G es un atajo del navegador o del sistema, no esta grilla. */
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      /* Y si alguien está escribiendo, la G es una letra. */
      const foco = document.activeElement as HTMLElement | null;
      if (foco && (foco.tagName === 'INPUT' || foco.tagName === 'TEXTAREA' || foco.isContentEditable)) return;
      setVisible((v) => !v);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className="rd-grilla">
      <div className="mx-auto grid h-full w-full max-w-360 grid-cols-12 gap-6 px-5 sm:px-8 lg:px-12">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="rd-grilla-col block h-full" />
        ))}
      </div>

      <p className="font-rd absolute right-3 bottom-3 m-0 rounded-rd-sm bg-rd-ink px-2 py-1 text-rd-11-5 font-medium text-white">
        12 columnas, G para apagar
      </p>
    </div>
  );
};
