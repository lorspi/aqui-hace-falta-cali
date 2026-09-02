import React from 'react';
import { MapPin, Clock, CheckCircle2, AlertCircle, HelpCircle, HeartHandshake, ChevronRight, ShieldCheck } from 'lucide-react';
import { Need } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, VERIFICATION_CONFIG, getCategoryLabel, formatTimeAgo } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { getCityDisplayName, ALL_COLOMBIA_ID } from '../data/colombiaCities';

interface NeedCardProps {
  need: Need;
  onSelect: (need: Need) => void;
  onHelp: (need: Need) => void;
  onViewOnMap?: (need: Need) => void;
  userLat?: number | null;
  userLng?: number | null;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  layout?: 'card' | 'row';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
}

export const NeedCard: React.FC<NeedCardProps> = ({
  need,
  onSelect,
  onHelp,
  onViewOnMap,
  userLat,
  userLng,
  isSelected = false,
  isHighlighted = false,
  onHover,
  layout = 'card',
}) => {
  const { language, t } = useTranslation();
  const isCollectionCenter = need.placeType === 'CENTRO_ACOPIO';
  const priorityInfo = PRIORITY_CONFIG[need.priority] || PRIORITY_CONFIG.MEDIUM;
  const verificationInfo = VERIFICATION_CONFIG[need.verificationStatus] || VERIFICATION_CONFIG.PENDING_VERIFICATION;

  const cityName =
    need.cityId &&
    need.cityId !== ALL_COLOMBIA_ID &&
    need.cityId !== 'ALL_COLOMBIA' &&
    need.cityId !== 'todo-colombia'
      ? getCityDisplayName(need.cityId, need.departmentId)
      : null;

  const baseLocation = need.address || need.neighborhood;
  const fullLocationText = baseLocation
    ? cityName && !baseLocation.toLowerCase().includes(cityName.toLowerCase())
      ? `${baseLocation} • ${cityName}`
      : baseLocation
    : cityName || (language === 'en' ? 'Location pending' : 'Ubicación por confirmar');

  const distanceText =
    userLat && userLng && need.latitude && need.longitude
      ? calculateDistance(userLat, userLng, need.latitude, need.longitude)
      : null;

  if (layout === 'row') {
    return (
      <div
        onClick={() => onSelect(need)}
        onMouseEnter={() => onHover?.(need.id)}
        onMouseLeave={() => onHover?.(null)}
        className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 sm:p-6 hover:shadow-md hover:border-slate-300 ${
          isCollectionCenter ? 'border-l-4 border-l-purple-500 border-slate-200' : priorityInfo.borderClass
        } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 shadow-md' : isHighlighted ? 'ring-2 ring-indigo-400 shadow-lg' : 'border-slate-200'} flex flex-col md:flex-row md:items-center justify-between gap-6`}
        id={`need-card-${need.id}`}
      >
        {/* Left / Main Column: Status, Title, Description, Tags */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Top Status Bar: Priority & Verification & Time */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isCollectionCenter ? (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                {language === 'en' ? '📦 Collection Center' : '📦 Centro de Acopio'}
              </span>
            ) : (
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider italic ${priorityInfo.badgeClass}`}
              >
                {language === 'en' ? `📢 Needed • ${priorityInfo.label}` : `📢 Se necesita • ${priorityInfo.label}`}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${verificationInfo.badgeClass}`}
            >
              <span>
                {need.verificationStatus === 'VERIFIED'
                  ? `✓ ${t('cardVerifiedBy')}`
                  : need.verificationStatus === 'PENDING_VERIFICATION'
                  ? t('cardPendingVerification')
                  : need.verificationStatus === 'REPORTED'
                  ? t('cardReported')
                  : t('cardArchived')}
              </span>
            </span>

            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatTimeAgo(need.updatedAt, language)}</span>
              {need.lastUpdatedBy?.startsWith('[MOD]') && (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-1" />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug hover:text-indigo-600 transition-colors">
            {need.title}
          </h3>

          {/* Description */}
          {need.description && (
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {need.description}
            </p>
          )}

          {/* Dedicated Category Pills & Resources Row */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {need.categories.map((c) => {
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

            {/* Resources Needed summary */}
            {need.resources && need.resources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-0.5">
                {need.resources.map((r) => {
                  const requested = r.requestedQuantity || 0;
                  const fulfilled = r.fulfilledQuantity || 0;
                  const catLabel = getCategoryLabel(r.type, language)?.label || r.type;
                  return (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 text-xs bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg text-slate-600 font-medium"
                    >
                      <span>• {r.description || catLabel}</span>
                      {requested > 0 && (
                        <span className="text-slate-400 font-semibold text-[11px]">
                          ({fulfilled}/{requested} {r.unit || ''})
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location Context + Stacked Action Buttons */}
        <div className="shrink-0 flex flex-col md:items-end justify-between gap-3.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-52">
          {/* Location & Distance */}
          <div className="space-y-0.5 md:text-right w-full min-w-0">
            <div className="flex items-center md:justify-end gap-1.5 text-sm font-bold text-slate-900 leading-snug">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0 md:hidden" />
              <span className="truncate">{cityName || 'Colombia'}</span>
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0 hidden md:inline" />
            </div>
            {baseLocation && (
              <div className="text-xs text-slate-600 font-medium truncate" title={baseLocation}>
                {baseLocation}
              </div>
            )}
            {distanceText && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100/80 mt-0.5">
                A {distanceText}
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
                  onViewOnMap(need);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-xl text-xs border border-indigo-200/80 transition-colors cursor-pointer shadow-2xs"
                id={`btn-view-map-${need.id}`}
                title="Ver ubicación en el mapa"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ver en mapa</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHelp(need);
              }}
              className="w-full btn-primary-blue btn-sm font-bold flex items-center justify-center gap-1.5 px-4 py-2 text-xs shadow-2xs"
              id={`btn-help-${need.id}`}
            >
              <HeartHandshake className="w-4 h-4 text-indigo-200 shrink-0" />
              <span>{t('cardHowToHelp')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(need)}
      onMouseEnter={() => onHover?.(need.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-md ${
        isCollectionCenter ? 'border-l-4 border-l-purple-500 border-slate-200' : priorityInfo.borderClass
      } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 shadow-md' : isHighlighted ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.02]' : 'border-slate-200'}`}
      id={`need-card-${need.id}`}
    >
      {/* Card Header & Badges */}
      <div className="p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs mb-1">
          {isCollectionCenter ? (
            <span className="px-2.5 py-0.5 rounded text-[11px] sm:text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              {language === 'en' ? '📦 Collection Center' : '📦 Centro de Acopio'}
            </span>
          ) : (
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] sm:text-[10px] font-black uppercase tracking-wider italic ${priorityInfo.badgeClass}`}
            >
              {language === 'en'
                ? `📢 Needed • ${
                    need.priority === 'CRITICAL'
                      ? t('priorityCritical')
                      : need.priority === 'HIGH'
                      ? t('priorityHigh')
                      : need.priority === 'MEDIUM'
                      ? t('priorityMedium')
                      : t('priorityLow')
                  }`
                : `📢 Se necesita • ${priorityInfo.label}`}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] sm:text-[10px] font-bold uppercase tracking-wider border ${verificationInfo.badgeClass}`}
            >
              <span>
                {need.verificationStatus === 'VERIFIED'
                  ? `✓ ${t('cardVerifiedBy')}`
                  : need.verificationStatus === 'PENDING_VERIFICATION'
                  ? t('cardPendingVerification')
                  : need.verificationStatus === 'REPORTED'
                  ? t('cardReported')
                  : t('cardArchived')}
              </span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-indigo-600 transition-colors">
          {need.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {need.description}
        </p>

        {/* Resource Requirements & Progress Bars */}
        {need.resources && need.resources.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs mt-2">
            <div className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">
              {t('cardResourcesNeeded')}
            </div>
            <div className="space-y-1.5">
              {need.resources.slice(0, 3).map((r) => {
                const requested = r.requestedQuantity || 0;
                const fulfilled = r.fulfilledQuantity || 0;
                const percentage = requested > 0 ? Math.min(100, Math.round((fulfilled / requested) * 100)) : 0;
                const catLabel = getCategoryLabel(r.type, language)?.label || r.type;

                return (
                  <div key={r.id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs text-slate-800">
                      <span className="font-medium truncate max-w-[200px]">
                        • {r.description || catLabel}
                      </span>
                      {requested > 0 && fulfilled > 0 ? (
                        <span className="font-bold shrink-0 text-slate-900 text-[11px]">
                          {fulfilled} / {requested} {r.unit || ''}
                        </span>
                      ) : requested > 0 ? (
                        <span className="text-slate-500 font-semibold text-[11px]">
                          {requested} {r.unit || ''}
                        </span>
                      ) : (
                        <span className="text-indigo-600 font-bold text-[11px]">{t('priorityCritical')}</span>
                      )}
                    </div>
                    {requested > 0 && fulfilled > 0 && (
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {need.categories.map((c) => {
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
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 break-words">
              {fullLocationText}
              {distanceText && (
                <span className="text-slate-400 font-normal ml-1 shrink-0">({distanceText})</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase italic">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{formatTimeAgo(need.updatedAt, language)}</span>
            {need.lastUpdatedBy?.startsWith('[MOD]') && (
              <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onViewOnMap && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewOnMap(need);
              }}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-indigo-200/80 transition-colors shrink-0 cursor-pointer"
              id={`btn-view-map-${need.id}`}
              title="Ver ubicación en el mapa"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Ver en mapa</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHelp(need);
            }}
            className="btn-primary-blue btn-sm"
            id={`btn-help-${need.id}`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-indigo-200" />
            <span>{t('cardHowToHelp')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
