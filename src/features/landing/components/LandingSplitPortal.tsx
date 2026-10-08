import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { BotonLanding, Parrafo, Seccion, Titular } from './base';
import { RadarEnVivo } from './RadarEnVivo';
import type { Publicacion } from '../../../types/publicacion';
import { useTranslation } from '../../../i18n/LanguageContext';
import { supabase, dbNeedToNeed, dbOfferToOffer } from '../../../lib/supabaseClient';
import { needToPublicacion, offerToPublicacion } from '../../../utils/supabaseMappers';

const CACHE_KEY = 'radar_live_publicaciones_cache';

function obtenerCacheInicial(): Publicacion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Si falla JSON o sesión, retorna vacío
  }
  return [];
}

function guardarEnCache(pubs: Publicacion[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(pubs));
  } catch {
    // ignorar quota o error
  }
}

/**
 * Intercala necesidades y ofertas para que el radar muestre una distribución equilibrada
 * de colores (rojo para necesidades, azul para ofertas).
 */
function intercalar(necesidades: Publicacion[], ofertas: Publicacion[]): Publicacion[] {
  const lista: Publicacion[] = [];
  const max = Math.max(necesidades.length, ofertas.length);
  for (let i = 0; i < max; i++) {
    if (i < necesidades.length) lista.push(necesidades[i]);
    if (i < ofertas.length) lista.push(ofertas[i]);
  }
  return lista;
}

/* Abrir la publicación seleccionada en el mapa oficial de RaDAR */
const abrir = (id: string) => window.location.assign(`/mapa-ayudas-necesidades?punto=${encodeURIComponent(id)}`);

export const LandingSplitPortal: React.FC = () => {
  const { t } = useTranslation();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(obtenerCacheInicial);

  useEffect(() => {
    let cancelado = false;

    async function cargarPublicacionesReales() {
      try {
        const [{ data: needsData, error: needsErr }, { data: offersData, error: offersErr }] = await Promise.all([
          supabase
            .from('needs')
            .select('*')
            .neq('verification_status', 'ARCHIVED')
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('offers')
            .select('*')
            .neq('verification_status', 'ARCHIVED')
            .order('created_at', { ascending: false })
            .limit(4),
        ]);

        if (cancelado) return;

        if (needsErr || offersErr) {
          console.warn('[LandingRadar] Advertencia al consultar publicaciones en vivo:', needsErr || offersErr);
        }

        const needsMapped = (needsData || []).map(dbNeedToNeed).map(needToPublicacion);
        const offersMapped = (offersData || []).map(dbOfferToOffer).map(offerToPublicacion);
        const combinadas = intercalar(needsMapped, offersMapped);

        if (combinadas.length > 0) {
          setPublicaciones(combinadas);
          guardarEnCache(combinadas);
        }
      } catch (err) {
        console.error('[LandingRadar] Error al cargar publicaciones reales de Supabase:', err);
      }
    }

    cargarPublicacionesReales();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <Seccion id="portal-en-vivo" className="rd-sobre-azul relative">
      <div className="relative mx-auto max-w-2xl text-center">
        <Titular>{t('landingPortalTitle')}</Titular>
        <Parrafo className="mx-auto mt-4">{t('landingPortalSubtitle')}</Parrafo>
      </div>

      <div className="relative mt-8 sm:mt-10">
        <RadarEnVivo
          publicaciones={publicaciones}
          etiqueta={t('landingPortalRadar')}
          rotulos={{ necesidad: t('landingPortalNeedsHeading'), oferta: t('landingPortalOffersHeading') }}
          onAbrir={abrir}
          pista={t('landingPortalDesliza')}
        />
      </div>

      {/* El botón de la landing, secundario y del tamaño de los del hero —es la acción que cierra
          la sección—, con el icono delante como el botón del sistema. Antes era un enlace con una
          flecha detrás, que el sistema no documenta (7 de octubre de 2026). */}
      <div className="relative mt-12 flex justify-center">
        <BotonLanding nivel="secundario" como="enlace" href="/mapa-ayudas-necesidades" icono={<MapPin className="h-4.5 w-4.5" />}>
          {t('landingPortalViewAllNeeds')}
        </BotonLanding>
      </div>
    </Seccion>
  );
};
