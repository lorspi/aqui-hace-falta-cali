import { useEffect, useState } from 'react';

/**
 * Una consulta de medios, al día: `true` mientras se cumple. `sinVentana` es lo que devuelve antes
 * de que haya ventana. Nació en `LandingAccesos` para la orientación de las pestañas y el
 * movimiento reducido, y salió a su propio archivo el 6 de octubre de 2026 cuando
 * `LandingComoFunciona` la necesitó para saber si cabe el lienzo fijo.
 */
export function useConsulta(consulta: string, sinVentana: boolean): boolean {
  const [si, setSi] = useState(() => (typeof window === 'undefined' ? sinVentana : !!window.matchMedia?.(consulta).matches));
  useEffect(() => {
    const mq = window.matchMedia?.(consulta);
    if (!mq) return;
    const mirar = () => setSi(mq.matches);
    mirar();
    mq.addEventListener('change', mirar);
    return () => mq.removeEventListener('change', mirar);
  }, [consulta]);
  return si;
}
