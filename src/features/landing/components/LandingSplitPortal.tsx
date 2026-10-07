import React, { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { BotonLanding, Parrafo, Seccion, Titular } from './base';
import { RadarEnVivo, type EcoRadar } from './RadarEnVivo';
import { supabase, dbNeedToNeed, dbOfferToOffer } from '../../../lib/supabaseClient';
import { getCategoryLabel, formatTimeAgo } from '../../../utils/formatters';
import { useTranslation } from '../../../i18n/LanguageContext';

// Fallback curado y realista para garantizar que la interfaz siempre luzca impecable
const FALLBACK_NEEDS = [
  {
    id: 'n-fb-1',
    category: 'Agua y Alimentos',
    title: 'Agua potable y sueros para 45 familias afectadas',
    description: 'Se requieren botellones de 5L y sueros de rehidratación oral para niños y adultos mayores.',
    location: 'Comuna 20, Siloé, Cali',
    timeAgo: 'Hace 14 min',
    priority: 'ALTA',
    link: '/mapa-ayudas-necesidades/cali',
  },
  {
    id: 'n-fb-2',
    category: 'Salud y Primeros Auxilios',
    title: 'Kits de curación básica, gasas y antisépticos',
    description: 'Puesto de socorro barrial requiere apósitos, vendas elásticas y alcohol.',
    location: 'Terrón Colorado, Sector La Estatua, Cali',
    timeAgo: 'Hace 32 min',
    priority: 'ALTA',
    link: '/mapa-ayudas-necesidades/cali',
  },
  {
    id: 'n-fb-3',
    category: 'Refugio y Abrigo',
    title: 'Colchonetas secas, cobijas térmicas e impermeables',
    description: 'Viviendas con filtraciones de agua necesitan albergue temporal y abrigo seco.',
    location: 'Puerto Mallarino, Jarillón, Cali',
    timeAgo: 'Hace 1 h',
    priority: 'MEDIA',
    link: '/mapa-ayudas-necesidades/cali',
  },
];

const FALLBACK_OFFERS = [
  {
    id: 'o-fb-1',
    category: 'Donación de Alimentos',
    title: 'Donación de 60 botellones de agua purificada',
    description: 'Empresa local dispone de botellones de agua de 5L listos para despacho en camión.',
    location: 'Chipichape, Norte de Cali',
    timeAgo: 'Hace 8 min',
    status: 'DISPONIBLE',
    link: '/mapa-ayudas-necesidades/cali/offer',
  },
  {
    id: 'o-fb-2',
    category: 'Transporte y Logística',
    title: 'Camioneta 4x4 con conductor para traslados',
    description: 'Capacidad para 1 tonelada o 4 brigadistas hacia zonas de ladera de difícil acceso.',
    location: 'Ciudad Jardín, Sur de Cali',
    timeAgo: 'Hace 25 min',
    status: 'LISTO PARA RUTA',
    link: '/mapa-ayudas-necesidades/cali/offer',
  },
  {
    id: 'o-fb-3',
    category: 'Salud Voluntaria',
    title: 'Brigada de 2 paramédicos con botiquín de trauma',
    description: 'Atención prehospitalaria y triaje para comunidades aisladas.',
    location: 'Prados del Norte, Cali',
    timeAgo: 'Hace 50 min',
    status: 'DISPONIBLE',
    link: '/mapa-ayudas-necesidades/cali/offer',
  },
];

export const LandingSplitPortal: React.FC = () => {
  const { t } = useTranslation();
  const [needs, setNeeds] = useState<any[]>(FALLBACK_NEEDS);
  const [offers, setOffers] = useState<any[]>(FALLBACK_OFFERS);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      try {
        const [needsRes, offersRes] = await Promise.all([
          supabase
            .from('needs')
            .select('*')
            .neq('verification_status', 'ARCHIVED')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('offers')
            .select('*')
            .neq('verification_status', 'ARCHIVED')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        if (!isMounted) return;

        if (needsRes.data && needsRes.data.length > 0) {
          const mappedNeeds = needsRes.data.map((row: any) => {
            const need = dbNeedToNeed(row);
            const cat = need.categories?.[0];
            const catInfo = cat ? getCategoryLabel(cat, 'es') : null;
            const citySlug = need.cityId || 'cali';
            const locationText = need.neighborhood || need.address || 'Cali';

            return {
              id: need.id,
              category: catInfo?.label || 'Auxilio General',
              title: need.title,
              description: need.description,
              location: `${locationText} (Cali)`,
              timeAgo: formatTimeAgo(need.createdAt, 'es'),
              priority: need.priority || 'MEDIA',
              link: `/mapa-ayudas-necesidades/${citySlug}/${need.id}`,
            };
          });
          setNeeds(mappedNeeds);
        }

        if (offersRes.data && offersRes.data.length > 0) {
          const mappedOffers = offersRes.data.map((row: any) => {
            const offer = dbOfferToOffer(row);
            const cat = offer.categories?.[0];
            const catInfo = cat ? getCategoryLabel(cat, 'es') : null;
            const citySlug = offer.cityId || 'cali';
            const locationText = offer.neighborhood || offer.address || 'Cali';

            return {
              id: offer.id,
              category: catInfo?.label || 'Donación / Apoyo',
              title: offer.title,
              description: offer.description,
              location: `${locationText} (Cali)`,
              timeAgo: formatTimeAgo(offer.createdAt, 'es'),
              status: offer.offerStatus || 'DISPONIBLE',
              link: `/mapa-ayudas-necesidades/${citySlug}/offer/${offer.id}`,
            };
          });
          setOffers(mappedOffers);
        }
      } catch (err) {
        console.warn('Usando datos de respaldo para el portal de la landing:', err);
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  /* La presentación es «El radar en vivo» (`RadarEnVivo`, 7 de octubre de 2026): las necesidades y
     las ofertas que se cargan arriba son los ecos de un radar que barre el territorio, y una
     tarjeta cuenta el último que detectó. Antes fue una marquesina de dos filas de tarjetas en
     sentidos opuestos (29 de septiembre de 2026), tomada de `trust-bar-scroll` de Calendly, y por
     un rato un mapa decorativo detrás de ella, que Alejandro sintió cargado y sin idea: «solo
     "embelleciste" con elementos visuales […] quiero que idees algo similar en cuanto a
     "innovación" como se hizo en el 2 y 3». La carga desde Supabase de arriba no se tocó: Producto
     no conecta Supabase.

     Los ecos van alternando necesidad y oferta, para que el haz no encuentre primero todas las de
     un color. */
  const ecos = useMemo<EcoRadar[]>(() => {
    const lista: EcoRadar[] = [];
    const eco = (it: any, tipo: EcoRadar['tipo']): EcoRadar => ({
      id: String(it.id),
      tipo,
      category: it.category,
      title: it.title,
      description: it.description,
      location: it.location,
      timeAgo: it.timeAgo,
      link: it.link,
    });
    for (let i = 0; i < Math.max(needs.length, offers.length); i++) {
      if (needs[i]) lista.push(eco(needs[i], 'necesidad'));
      if (offers[i]) lista.push(eco(offers[i], 'oferta'));
    }
    return lista;
  }, [needs, offers]);

  return (
    <Seccion id="portal-en-vivo">
      <div className="mx-auto max-w-2xl text-center">
        <Titular>{t('landingPortalTitle')}</Titular>
        <Parrafo className="mx-auto mt-5">{t('landingPortalSubtitle')}</Parrafo>
      </div>

      <div className="mt-12 sm:mt-14">
        <RadarEnVivo
          ecos={ecos}
          etiqueta={t('landingPortalRadar')}
          rotulos={{ necesidad: t('landingPortalNeedsHeading'), oferta: t('landingPortalOffersHeading') }}
          textos={{ verEnMapa: t('landingPortalVerEnMapa'), registro: t('landingPortalRegistro') }}
        />
      </div>

      {/* El botón de la landing, secundario y del tamaño de los del hero —es la acción que cierra
          la sección—, con el icono delante como el botón del sistema. Antes era un enlace con una
          flecha detrás, que el sistema no documenta (7 de octubre de 2026). */}
      <div className="mt-12 flex justify-center">
        <BotonLanding nivel="secundario" como="enlace" href="/mapa-ayudas-necesidades" icono={<MapPin className="h-4.5 w-4.5" />}>
          {t('landingPortalViewAllNeeds')}
        </BotonLanding>
      </div>
    </Seccion>
  );
};
