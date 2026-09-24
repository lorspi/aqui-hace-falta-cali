import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * Dónde está algo, en un renglón (Alejandro, 16 de septiembre de 2026): pin, el barrio o la
 * ciudad, un divisor vertical y la distancia. Si no cabe, el lugar termina en «…» y la
 * distancia se queda entera. La usan la tarjeta de Radar y el Directorio, sin rótulo encima:
 * el pin ya lo dice (Alejandro, 16 de septiembre de 2026).
 */
export const Donde: React.FC<{ lugar: string; distancia?: string; className?: string }> = ({ lugar, distancia, className = '' }) => (
  <p className={`m-0 flex min-w-0 items-center gap-2 text-rd-13 text-rd-ink ${className}`}>
    <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
    <span className="min-w-0 truncate" title={lugar}>
      {lugar}
    </span>
    {distancia && (
      <>
        <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-rd-line" />
        <span className="shrink-0 text-rd-12-5 text-rd-ink-2 tabular-nums">{distancia}</span>
      </>
    )}
  </p>
);
