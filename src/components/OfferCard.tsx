import React from 'react';
import { MapPin, Clock, ChevronRight, ShieldCheck } from 'lucide-react';
import { Offer, OfferStatus, VerificationStatus } from '../types';
import { CATEGORY_LABELS, VERIFICATION_CONFIG, getCategoryLabel, formatTimeAgo } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { getCityDisplayName, ALL_COLOMBIA_ID } from '../data/colombiaCities';

interface OfferCardProps {
  offer: Offer;
  onClick: () => void;
  onViewOnMap?: (offer: Offer) => void;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  distanceKm?: number;
  layout?: 'card' | 'row';
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onClick,
  onViewOnMap,
  isHighlighted = false,
  onHover,
  distanceKm,
  layout = 'card',
}) => {
  const { language, t } = useTranslation();

  const cityName =
    offer.cityId &&
    offer.cityId !== ALL_COLOMBIA_ID &&
    offer.cityId !== 'ALL_COLOMBIA' &&
    offer.cityId !== 'todo-colombia'
      ? getCityDisplayName(offer.cityId, offer.departmentId)
      : null;

  const baseLocation = offer.address || offer.neighborhood;
  const fullLocationText = baseLocation
    ? cityName && !baseLocation.toLowerCase().includes(cityName.toLowerCase())
      ? `${baseLocation} • ${cityName}`
      : baseLocation
    : cityName || (language === 'en' ? 'Location pending' : 'Ubicación por confirmar');

  const offerStatusLabels: Record<OfferStatus, string> = {
    AVAILABLE: t('statusAvailable'),
    PARTIALLY_AVAILABLE: t('statusPartiallyAvailable'),
    EXHAUSTED: t('statusExhausted'),
    CLOSED: t('statusClosed'),
  };

  const isInactive = offer.offerStatus === 'EXHAUSTED' || offer.offerStatus === 'CLOSED';

  if (layout === 'row') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => onHover?.(offer.id)}
        onMouseLeave={() => onHover?.(null)}
        className={`bg-white rounded-2xl border border-l-4 border-l-emerald-600 border-slate-200 transition-all duration-200 cursor-pointer overflow-hidden p-5 sm:p-6 hover:shadow-md hover:border-slate-300 ${
          isInactive ? 'opacity-50' : ''
        } ${isHighlighted ? 'ring-2 ring-indigo-400 shadow-lg' : ''} flex flex-col md:flex-row md:items-center justify-between gap-6`}
        id={`offer-card-${offer.id}`}
      >
        {/* Left / Main Column: Status, Title, Categories */}
        <div className={`flex-1 min-w-0 space-y-2.5 ${isInactive ? 'line-through decoration-slate-400' : ''}`}>
          {/* Top Status Bar: Status & Verification & Time */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                isInactive ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              {language === 'en'
                ? `🤝 Offering • ${offerStatusLabels[offer.offerStatus] || offerStatusLabels.AVAILABLE}`
                : `🤝 Se ofrece • ${offerStatusLabels[offer.offerStatus] || offerStatusLabels.AVAILABLE}`}
            </span>

            {offer.verificationStatus === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border text-indigo-600 bg-indigo-50/80 border-indigo-200">
                <span>✓ {t('cardVerifiedBy')}</span>
              </span>
            )}

            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatTimeAgo(offer.updatedAt, language)}</span>
              {offer.verificationStatus === 'VERIFIED' && (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-1" />
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <h3
              className="font-bold text-slate-900 text-base sm:text-lg leading-snug hover:text-emerald-700 transition-colors no-underline"
              style={{ textDecoration: 'none' }}
            >
              {offer.title}
            </h3>
          </div>

          {/* Dedicated Category Pills Row */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {offer.categories.map((c) => {
              const item = getCategoryLabel(c, language);
              return (
                <span
                  key={c}
                  className="category-pill text-xs py-0.5 px-2.5"
                >
                  <span>{item?.icon || '🔹'}</span>
                  <span>{item?.label || c}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Right Column: Location Context + Stacked Action Buttons */}
        <div className="shrink-0 flex flex-col md:items-end justify-between gap-3.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-52">
          {/* Location & Distance */}
          <div className="space-y-0.5 md:text-right w-full min-w-0">
            <div className="flex items-center md:justify-end gap-1.5 text-sm font-bold text-slate-900 leading-snug">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 md:hidden" />
              <span className="truncate">{cityName || 'Colombia'}</span>
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 hidden md:inline" />
            </div>
            {baseLocation && (
              <div className="text-xs text-slate-600 font-medium truncate" title={baseLocation}>
                {baseLocation}
              </div>
            )}
            {distanceKm != null && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100/80 mt-0.5">
                A {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
              </div>
            )}
          </div>

          {/* Stacked Action buttons */}
          <div className="flex flex-col gap-2 w-full">
            {onViewOnMap && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOnMap(offer);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded-xl text-xs border border-blue-200/80 transition-colors cursor-pointer shadow-2xs"
                id={`btn-view-offer-map-${offer.id}`}
                title="Ver ubicación en el mapa"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver en mapa</span>
              </button>
            )}
            <button
              type="button"
              className="w-full btn-sm font-bold flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors cursor-pointer text-xs shadow-2xs"
            >
              <span>Ver oferta</span>
              <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.(offer.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`bg-white rounded-xl border border-l-4 border-l-emerald-600 border-slate-200 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-md ${
        isInactive ? 'opacity-50' : ''
      } ${isHighlighted ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.02]' : ''}`}
      id={`offer-card-${offer.id}`}
    >
      {/* Card Header & Badges */}
      <div className={`p-5 space-y-2.5 ${isInactive ? 'line-through decoration-slate-400' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs mb-1">
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] sm:text-[10px] font-bold uppercase tracking-wider border ${
              isInactive ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {language === 'en'
              ? `🤝 Offering • ${offerStatusLabels[offer.offerStatus] || offerStatusLabels.AVAILABLE}`
              : `🤝 Se ofrece • ${offerStatusLabels[offer.offerStatus] || offerStatusLabels.AVAILABLE}`}
          </span>

          <div className="flex items-center gap-1.5">
            {offer.verificationStatus === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] sm:text-[10px] font-bold uppercase tracking-wider border text-indigo-600 bg-indigo-50/80 border-indigo-200">
                <span>✓ {t('cardVerifiedBy')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition-colors no-underline" style={{ textDecoration: 'none' }}>
          {offer.title}
        </h3>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {offer.categories.map((c) => {
            const item = getCategoryLabel(c, language);
            return (
              <span
                key={c}
                className="category-pill"
              >
                <span>{item?.icon || '🔹'}</span>
                <span>{item?.label || c}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-slate-50/60 border-t border-slate-200 p-3.5 flex items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-start gap-1 font-semibold text-slate-900 text-xs leading-snug">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 break-words">
              {fullLocationText}
              {distanceKm != null && (
                <span className="text-indigo-600 font-normal text-xs ml-1 shrink-0">
                  ({distanceKm < 1 ? `a ${Math.round(distanceKm * 1000)} m` : `a ${distanceKm.toFixed(1)} km`})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase italic">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{formatTimeAgo(offer.updatedAt, language)}</span>
            {offer.verificationStatus === 'VERIFIED' && (
              <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewOnMap && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewOnMap(offer);
              }}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-200/80 transition-colors shrink-0 cursor-pointer"
              id={`btn-view-offer-map-${offer.id}`}
              title="Ver ubicación en el mapa"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Ver en mapa</span>
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
        </div>
      </div>
    </div>
  );
};
