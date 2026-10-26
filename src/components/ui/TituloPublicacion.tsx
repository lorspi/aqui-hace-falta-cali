import React from 'react';
import type { Publicacion } from '../../types/publicacion';
import { actorPublicacion } from '../../utils/publicaciones';
import { useTranslation } from '../../i18n/LanguageContext';
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
}> = ({ publicacion: p, actor = true, insignia = true }) => {
  const { language, t, tResourcesTitle } = useTranslation();
  const rawActor = actorPublicacion(p, language);
  const actorTraducido =
    rawActor === 'Ciudadano' || rawActor === 'Citizen'
      ? t('citizen')
      : rawActor === 'Comunidad' || rawActor === 'Community'
      ? t('community')
      : rawActor === 'Organización' || rawActor === 'Organization'
      ? t('organization')
      : rawActor;

  return (
    <>
      {tResourcesTitle(p.recursos, p.tipo)}
      {actor && (
        <>
          <span aria-hidden="true" className="mx-2 inline-block h-3.5 w-px shrink-0 bg-rd-line align-middle" />
          <span className="inline-flex items-center gap-1 align-baseline">
            <span>{actorTraducido}</span>
            {insignia && p.verificada && p.perfil !== 'individual' && rawActor !== 'Ciudadano' && rawActor !== 'Citizen' && (
              <BadgeCheck role="img" aria-label={t('verifiedOrg')} className="h-3.5 w-3.5 shrink-0 text-rd-navy inline-block" />
            )}
          </span>
        </>
      )}
    </>
  );
};
