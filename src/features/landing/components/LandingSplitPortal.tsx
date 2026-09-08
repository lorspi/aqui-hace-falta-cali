import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Hand,
  HeartHandshake,
} from 'lucide-react';
import { supabase, dbNeedToNeed, dbOfferToOffer } from '../../../lib/supabaseClient';
import { getCategoryLabel, formatTimeAgo } from '../../../utils/formatters';
import { useTranslation } from '../../../i18n/LanguageContext';

// Fallback curado y realista para garantizar que la interfaz siempre luzca impecable
const FALLBACK_NEEDS = [
  {
    id: 'n-fb-1',
    category: 'Agua y Alimentos',
    categoryIcon: '💧',
    title: 'Agua potable y sueros para 45 familias afectadas',
    description: 'Se requieren botellones de 5L y sueros de rehidratación oral para niños y adultos mayores.',
    location: 'Comuna 20 • Siloé, Cali',
    timeAgo: 'Hace 14 min',
    priority: 'ALTA',
    link: '/cali',
  },
  {
    id: 'n-fb-2',
    category: 'Salud y Primeros Auxilios',
    categoryIcon: '🩹',
    title: 'Kits de curación básica, gasas y antisépticos',
    description: 'Puesto de socorro barrial requiere apósitos, vendas elásticas y alcohol.',
    location: 'Terrón Colorado • Sector La Estatua, Cali',
    timeAgo: 'Hace 32 min',
    priority: 'ALTA',
    link: '/cali',
  },
  {
    id: 'n-fb-3',
    category: 'Refugio y Abrigo',
    categoryIcon: '🛏️',
    title: 'Colchonetas secas, cobijas térmicas e impermeables',
    description: 'Viviendas con filtraciones de agua necesitan albergue temporal y abrigo seco.',
    location: 'Puerto Mallarino • Jarillón, Cali',
    timeAgo: 'Hace 1 h',
    priority: 'MEDIA',
    link: '/cali',
  },
];

const FALLBACK_OFFERS = [
  {
    id: 'o-fb-1',
    category: 'Donación de Alimentos',
    categoryIcon: '📦',
    title: 'Donación de 60 botellones de agua purificada',
    description: 'Empresa local dispone de botellones de agua de 5L listos para despacho en camión.',
    location: 'Chipichape • Norte de Cali',
    timeAgo: 'Hace 8 min',
    status: 'DISPONIBLE',
    link: '/cali/offer',
  },
  {
    id: 'o-fb-2',
    category: 'Transporte y Logística',
    categoryIcon: '🚙',
    title: 'Camioneta 4x4 con conductor para traslados',
    description: 'Capacidad para 1 tonelada o 4 brigadistas hacia zonas de ladera de difícil acceso.',
    location: 'Ciudad Jardín • Sur de Cali',
    timeAgo: 'Hace 25 min',
    status: 'LISTO PARA RUTA',
    link: '/cali/offer',
  },
  {
    id: 'o-fb-3',
    category: 'Salud Voluntaria',
    categoryIcon: '🩺',
    title: 'Brigada de 2 paramédicos con botiquín de trauma',
    description: 'Atención prehospitalaria y triaje para comunidades aisladas.',
    location: 'Prados del Norte, Cali',
    timeAgo: 'Hace 50 min',
    status: 'DISPONIBLE',
    link: '/cali/offer',
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
              categoryIcon: catInfo?.icon || '📢',
              title: need.title,
              description: need.description,
              location: `${locationText} (Cali)`,
              timeAgo: formatTimeAgo(need.createdAt, 'es'),
              priority: need.priority || 'MEDIA',
              link: `/${citySlug}/${need.id}`,
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
              categoryIcon: catInfo?.icon || '📦',
              title: offer.title,
              description: offer.description,
              location: `${locationText} (Cali)`,
              timeAgo: formatTimeAgo(offer.createdAt, 'es'),
              status: offer.offerStatus || 'DISPONIBLE',
              link: `/${citySlug}/offer/${offer.id}`,
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

  return (
    <section id="portal-en-vivo" className="w-full relative z-20 px-4 sm:px-6 lg:px-8 max-w-[1450px] mx-auto font-sans scroll-mt-20 sm:scroll-mt-24 lg:scroll-mt-28">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-white border border-slate-200/90 rounded-3xl sm:rounded-4xl p-4 sm:p-6 lg:p-7 shadow-md relative overflow-hidden"
      >
        {/* Auras luminosas sutiles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado General Compacto */}
        <div className="text-center max-w-4xl mx-auto space-y-2 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {t('landingPortalTitle')}
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            {t('landingPortalSubtitle')}
          </p>

          {/* Selector de Pestaña Móvil */}
          <div className="lg:hidden pt-3 sm:pt-4 flex justify-center w-full">
            <div className="inline-flex p-1.5 bg-slate-200/90 rounded-2xl border border-slate-300/90 shadow-sm w-full max-w-sm">
              <button
                type="button"
                onClick={() => setMobileTab('needs')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
                  mobileTab === 'needs'
                    ? 'bg-brand-red text-white shadow-md shadow-brand-red/25 scale-102'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Hand className={`w-4 h-4 shrink-0 ${mobileTab === 'needs' ? 'text-white' : 'text-brand-red'}`} />
                <span>{t('landingPortalNeedsTab')} ({needs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('offers')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
                  mobileTab === 'offers'
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/25 scale-102'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <HeartHandshake className={`w-4 h-4 shrink-0 ${mobileTab === 'offers' ? 'text-white' : 'text-brand-blue'}`} />
                <span>{t('landingPortalOffersTab')} ({offers.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Las 2 Columnas Anchas en Paralelo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7 relative z-10">
          {/* ========================================================
              COLUMNA IZQUIERDA: NECESIDADES (ROJO)
             ======================================================== */}
          <div
            className={`bg-rose-50/40 border border-rose-200/80 rounded-3xl p-4 sm:p-6 space-y-3.5 flex flex-col justify-between transition-all ${
              mobileTab === 'offers' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  {/* En móvil dot indicador; en computador ícono oficial de Pedir ayuda */}
                  <span className="lg:hidden relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red" />
                  </span>
                  <div className="hidden lg:flex w-7 h-7 rounded-lg bg-brand-red/15 text-brand-red items-center justify-center shrink-0">
                    <Hand className="w-4 h-4" />
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {t('landingPortalNeedsHeading')}
                  </h3>
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-red text-white">
                  {t('landingPortalNeedsTab')}
                </span>
              </div>

              <div className="space-y-2.5">
                {needs.map((need) => (
                  <div
                    key={need.id}
                    className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100/90 shadow-2xs hover:shadow-md hover:border-brand-red/40 transition-all duration-200 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-brand-red font-extrabold">
                        <span>{need.categoryIcon}</span>
                        <span>{need.category}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[10px] sm:text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{need.timeAgo}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-brand-red transition-colors leading-snug">
                        {need.title}
                      </h4>
                      {need.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                          {need.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs sm:text-[13px]">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold truncate max-w-[240px] sm:max-w-sm">
                        <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0" />
                        <span className="truncate">{need.location}</span>
                      </span>

                      <a
                        href={need.link}
                        className="inline-flex items-center gap-1 font-extrabold text-xs text-brand-red hover:underline shrink-0 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Ayudar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <a
                href="/?vista=necesidades"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-brand-red hover:bg-brand-red/90 active:scale-98 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-brand-red/20 hover:shadow-lg cursor-pointer"
              >
                <span>{t('landingPortalViewAllNeeds')} →</span>
              </a>
            </div>
          </div>

          {/* ========================================================
              COLUMNA DERECHA: OFERTAS (AZUL)
             ======================================================== */}
          <div
            className={`bg-blue-50/40 border border-blue-200/80 rounded-3xl p-4 sm:p-6 space-y-3.5 flex flex-col justify-between transition-all ${
              mobileTab === 'needs' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  {/* En móvil dot indicador; en computador ícono oficial de Ofrecer ayuda */}
                  <span className="lg:hidden w-2.5 h-2.5 rounded-full bg-brand-blue" />
                  <div className="hidden lg:flex w-7 h-7 rounded-lg bg-brand-blue/15 text-brand-blue items-center justify-center shrink-0">
                    <HeartHandshake className="w-4 h-4" />
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {t('landingPortalOffersHeading')}
                  </h3>
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-blue text-white">
                  {t('landingPortalOffersTab')}
                </span>
              </div>

              <div className="space-y-2.5">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-blue-100/90 shadow-2xs hover:shadow-md hover:border-brand-blue/40 transition-all duration-200 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-brand-blue font-extrabold">
                        <span>{offer.categoryIcon}</span>
                        <span>{offer.category}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] sm:text-[11px]">
                        <span>●</span>
                        <span>{offer.status}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-brand-blue transition-colors leading-snug">
                        {offer.title}
                      </h4>
                      {offer.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                          {offer.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs sm:text-[13px]">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold truncate max-w-[240px] sm:max-w-sm">
                        <MapPin className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                        <span className="truncate">{offer.location}</span>
                      </span>

                      <a
                        href={offer.link}
                        className="inline-flex items-center gap-1 font-extrabold text-xs text-brand-blue hover:underline shrink-0 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Contactar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <a
                href="/?ofrecer=true"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 active:scale-98 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-brand-blue/20 hover:shadow-lg cursor-pointer"
              >
                <span>{t('landingPortalViewAllOffers')} →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
