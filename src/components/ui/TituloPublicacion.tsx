import React from 'react';
import type { Publicacion } from '../../types/publicacion';
import { actorPublicacion, recursosPublicacion } from '../../utils/publicaciones';

/**
 * El título de una publicación **para pintar**: los recursos y, cuando hace falta decir de
 * quién es, el actor detrás de un divisor vertical sutil. El divisor es el mismo de `Donde`
 * (`h-3.5 w-px bg-rd-line`), no uno nuevo.
 *
 * Antes los unía un punto medio dentro de `tituloPublicacion`. Se va por dos razones
 * (Alejandro, 16 y 24 de septiembre de 2026): el punto medio está prohibido en toda la
 * herramienta, y en la tarjeta el actor salía dos veces —dentro del título y otra vez debajo,
 * con su avatar y su insignia—. Por eso `actor` es opcional: se enciende solo donde el título
 * viaja sin nadie que diga de quién es.
 *
 * Para texto plano —el nombre accesible del pin, la etiqueta del ⋮, el campo `titulo` del
 * dato— sigue estando `tituloPublicacion`, que une con «, de».
 */
export const TituloPublicacion: React.FC<{ publicacion: Publicacion; actor?: boolean }> = ({ publicacion: p, actor = false }) => (
  <>
    {recursosPublicacion(p)}
    {actor && (
      <>
        <span aria-hidden="true" className="mx-2 inline-block h-3.5 w-px shrink-0 bg-rd-line align-middle" />
        {actorPublicacion(p)}
      </>
    )}
  </>
);
