import React from 'react';
import type { Publicacion } from '../../types/publicacion';
import { actorPublicacion, recursosPublicacion } from '../../utils/publicaciones';

import { BadgeCheck } from 'lucide-react';

/**
 * El título de una publicación **para pintar**: los recursos y el actor (organización o comunidad)
 * detrás de un divisor sutil del sistema de diseño (`h-3.5 w-px bg-rd-line`), con insignia de
 * verificación si la entidad está verificada.
 */
export const TituloPublicacion: React.FC<{
  publicacion: Publicacion;
  actor?: boolean;
  insignia?: boolean;
}> = ({ publicacion: p, actor = true, insignia = true }) => (
  <>
    {recursosPublicacion(p)}
    {actor && (
      <>
        <span aria-hidden="true" className="mx-2 inline-block h-3.5 w-px shrink-0 bg-rd-line align-middle" />
        <span className="inline-flex items-center gap-1 align-baseline">
          <span>{actorPublicacion(p)}</span>
          {insignia && p.verificada && (
            <BadgeCheck role="img" aria-label="Organización verificada" className="h-3.5 w-3.5 shrink-0 text-rd-navy inline-block" />
          )}
        </span>
      </>
    )}
  </>
);
