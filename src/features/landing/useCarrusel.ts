import { useCallback, useEffect, useRef } from 'react';

/**
 * Los carruseles del teléfono de la landing (7 de octubre de 2026): las tres vistas de la sección
 * 2, las publicaciones de la 4 y los papeles de la 5. Nació en `LandingAccesos` y salió aquí cuando
 * Alejandro pidió el mismo carrusel en las otras dos («las cards compiladas tampoco funcionan
 * bien. carrusel mejor»).
 *
 * El carrusel es una caja que se desliza de lado con sus tarjetas detenidas en su borde
 * (`snap-start`); el gancho dice cuál se ve y lleva la caja a una.
 * - `alVer(i)` avisa de la tarjeta que se ve: la que pasa del 60 % a la vista dentro de la caja.
 *   Por la proporción y no por `isIntersecting`, que sigue en verdadero cuando la tarjeta que se
 *   va baja del 60 % y la daría por vista. Avisa también al montar, con la primera.
 * - `ir(i)` desliza la caja hasta la tarjeta `i`, sin mover la página. Mientras viaja, las que
 *   pasan por el camino no cuentan; si en un segundo no llegó (ya estaba a la vista), deja de
 *   esperarla.
 * - `activo` lo apaga donde no hay carrusel (desde 1024 las secciones tienen otra forma).
 *
 * La caja tiene que ser `relative`: `offsetLeft` de las tarjetas se mide desde ella.
 */
export function useCarrusel(activo: boolean, alVer: (i: number) => void) {
  const carrusel = useRef<HTMLDivElement>(null);
  const tarjetas = useRef<(HTMLElement | null)[]>([]);
  const destino = useRef<number | null>(null);
  const espera = useRef(0);
  const avisar = useRef(alVer);
  useEffect(() => {
    avisar.current = alVer;
  });

  useEffect(() => {
    const c = carrusel.current;
    if (!activo || !c || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.intersectionRatio < 0.6) return;
          const i = tarjetas.current.indexOf(e.target as HTMLElement);
          if (i < 0 || (destino.current !== null && i !== destino.current)) return;
          destino.current = null;
          avisar.current(i);
        });
      },
      { root: c, threshold: 0.6 },
    );
    tarjetas.current.forEach((t) => t && io.observe(t));
    return () => io.disconnect();
  }, [activo]);

  useEffect(() => () => window.clearTimeout(espera.current), []);

  const tarjeta = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      tarjetas.current[i] = el;
    },
    [],
  );

  const ir = useCallback((i: number, reducido: boolean) => {
    const c = carrusel.current;
    const t = tarjetas.current[i];
    if (!c || !t) return;
    destino.current = i;
    window.clearTimeout(espera.current);
    espera.current = window.setTimeout(() => {
      destino.current = null;
    }, 1000);
    const borde = parseFloat(getComputedStyle(c).scrollPaddingLeft) || 0;
    c.scrollTo({ left: t.offsetLeft - borde, behavior: reducido ? 'auto' : 'smooth' });
  }, []);

  return { carrusel, tarjeta, ir };
}
