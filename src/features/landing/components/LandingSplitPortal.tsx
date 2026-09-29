import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Segmented } from '../../../components/ui/Segmented';
import { BotonLanding, Parrafo, Seccion, Titular } from './base';
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
  const [mobileTab, setMobileTab] = useState<'needs' | 'offers'>('needs');
  const [needs, setNeeds] = useState<any[]>(FALLBACK_NEEDS);
  const [offers, setOffers] = useState<any[]>(FALLBACK_OFFERS);

  // Soporte de gesto swipe en móvil para alternar entre Necesidades y Ofertas
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Solo activar si el desplazamiento horizontal es al menos 40px y predomina sobre el vertical
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0 && mobileTab === 'needs') {
        // Swipe izquierda -> cambiar a Ofertas
        setMobileTab('offers');
      } else if (deltaX > 0 && mobileTab === 'offers') {
        // Swipe derecha -> cambiar a Necesidades
        setMobileTab('needs');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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

  /* Presentación rehecha el 28 de septiembre de 2026 sobre la referencia. La carga desde
     Supabase de arriba no se tocó: Producto no conecta Supabase (protocolo del equipo).
     Antes: tarjeta con marco y sombra, dos auras desenfocadas de 384, dos columnas en paralelo
     y pestañas propias. Ahora: el patrón de la referencia —texto a la izquierda, panel de
     producto a la derecha— con el conmutador real de la app (`Segmented`). */
  const esNecesidad = mobileTab === 'needs';
  const lista = esNecesidad ? needs : offers;

  return (
    <Seccion id="portal-en-vivo">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        <div>
          <Titular>{t('landingPortalTitle')}</Titular>
          <Parrafo className="mt-6 max-w-xl">{t('landingPortalSubtitle')}</Parrafo>

          <p className="font-rd m-0 mt-6 text-rd-14 text-rd-ink-meta">
            {esNecesidad ? t('landingPortalNeedsSubtitle') : t('landingPortalOffersSubtitle')}
          </p>

          <div className="mt-8">
            <BotonLanding
              nivel="terciario"
              como="enlace"
              href={esNecesidad ? '/mapa-ayudas-necesidades' : '/mapa-ayudas-necesidades?ofrecer=true'}
              iconoDespues={<ArrowRight aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />}
            >
              {esNecesidad ? t('landingPortalViewAllNeeds') : t('landingPortalViewAllOffers')}
            </BotonLanding>
          </div>
        </div>

        {/* El panel, con el conmutador encima (Alejandro, 29 de septiembre de 2026): manda sobre
            lo que se ve en el recuadro, así que va pegado a él y no en la columna del texto.
            Se sigue deslizando con el dedo entre las dos caras. */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="min-w-0 rounded-rd-xl bg-rd-fondo p-5 sm:p-7"
        >
          <div className="mb-4 flex justify-center lg:justify-start">
            <Segmented
              etiquetaGrupo={t('landingPortalTitle')}
              valor={mobileTab}
              onChange={(v) => setMobileTab(v)}
              opciones={[
                { id: 'needs', etiqueta: t('landingPortalNeedsTab'), n: needs.length, pip: 'necesidad' },
                { id: 'offers', etiqueta: t('landingPortalOffersTab'), n: offers.length, pip: 'oferta' },
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-rd-lg border border-rd-line bg-rd-surface shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-rd-line bg-rd-fondo px-4 py-2.5">
              <span className="font-rd text-rd-12 font-semibold text-rd-ink-2">
                {esNecesidad ? t('landingPortalNeedsHeading') : t('landingPortalOffersHeading')}
              </span>
              <span className="font-rd inline-flex items-center gap-1.5 text-rd-11-5 text-rd-ink-meta">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${esNecesidad ? 'bg-rd-coral' : 'bg-rd-navy'}`} />
                {lista.length}
              </span>
            </div>

            <div className="flex flex-col">
              {lista.slice(0, 4).map((item: any, i: number) => (
                <article key={item.id} className={`flex flex-col gap-2 p-4 ${i ? 'border-t border-rd-line-soft' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`font-rd shrink-0 rounded-full px-2 py-0.5 text-rd-11 font-semibold ${
                        esNecesidad ? 'bg-rd-coral-soft text-rd-coral-ink' : 'bg-rd-navy-soft text-rd-navy'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="font-rd inline-flex shrink-0 items-center gap-1 text-rd-11-5 text-rd-ink-meta">
                      <Clock aria-hidden="true" className="h-3 w-3" />
                      {item.timeAgo}
                    </span>
                  </div>

                  <h3 className="font-rd m-0 text-rd-14 leading-snug font-semibold text-rd-ink">{item.title}</h3>

                  <p className="font-rd m-0 flex items-center gap-1.5 text-rd-12 text-rd-ink-2">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-rd-ink-3" />
                    <span className="truncate">{item.location}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Seccion>
  );
};
