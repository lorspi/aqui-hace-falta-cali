import { useEffect, useRef, useState } from 'react';

/**
 * Avisa cuando un elemento entra en pantalla, para que las piezas de la landing aparezcan al
 * llegar a ellas en vez de estar ya puestas cuando se baja (Alejandro, 29 de septiembre de 2026:
 * «está muy básico, plano… parte integral de la identidad de RaDAR es evocar emociones»).
 *
 * Dispara una sola vez: lo que ya apareció se queda. Una pieza que se rearma cada vez que se pasa
 * por encima cansa y, peor, hace dudar de si algo se rompió.
 *
 * El margen negativo abajo hace que la entrada empiece cuando el elemento asoma un poco, no
 * cuando ya está a la mitad de la pantalla: así el movimiento acompaña al desplazamiento en vez
 * de ir por detrás.
 */
export function useEnVista<T extends HTMLElement>(margen = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    /* Sin `IntersectionObserver` (o con movimiento reducido) todo aparece de una vez: nunca se
       queda contenido escondido por culpa de la animación. */
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: margen, threshold: 0.05 },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [margen]);

  return { ref, visible };
}
