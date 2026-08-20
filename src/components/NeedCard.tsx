import React from 'react';
import { MapPin, Clock, CheckCircle2, AlertCircle, HelpCircle, HeartHandshake, ChevronRight, ShieldCheck } from 'lucide-react';
import { Need } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, VERIFICATION_CONFIG, formatTimeAgo } from '../utils/formatters';

interface NeedCardProps {
  need: Need;
  onSelect: (need: Need) => void;
  onHelp: (need: Need) => void;
  userLat?: number | null;
  userLng?: number | null;
  isSelected?: boolean;
}

// Calculate distance in km
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
  userLat,
  userLng,
  isSelected = false,
}) => {
  const isCollectionCenter = need.placeType === 'CENTRO_ACOPIO';
  const priorityInfo = PRIORITY_CONFIG[need.priority] || PRIORITY_CONFIG.MEDIUM;
  const verificationInfo = VERIFICATION_CONFIG[need.verificationStatus] || VERIFICATION_CONFIG.PENDING_VERIFICATION;
  const placeTypeLabel = PLACE_TYPE_LABELS[need.placeType] || 'Lugar de ayuda';

  const distanceText =
    userLat && userLng && need.latitude && need.longitude
      ? calculateDistance(userLat, userLng, need.latitude, need.longitude)
      : null;

  return (
    <div
      onClick={() => onSelect(need)}
      className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-md ${
        isCollectionCenter ? 'border-l-4 border-l-purple-500 border-slate-200' : priorityInfo.borderClass
      } ${isSelected ? 'ring-2 ring-slate-900 border-slate-900 shadow-md' : 'border-slate-200'}`}
      id={`need-card-${need.id}`}
    >
      {/* Card Header & Badges */}
      <div className="p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs mb-1">
          {isCollectionCenter ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Centro de Acopio
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider italic ${priorityInfo.badgeClass}`}
            >
              {priorityInfo.label}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {need.neighborhood}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${verificationInfo.badgeClass}`}
            >
              <span>{verificationInfo.label}</span>
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
              Requeridos:
            </div>
            <div className="space-y-1.5">
              {need.resources.slice(0, 3).map((r) => {
                const requested = r.requestedQuantity || 0;
                const fulfilled = r.fulfilledQuantity || 0;
                const percentage = requested > 0 ? Math.min(100, Math.round((fulfilled / requested) * 100)) : 0;

                return (
                  <div key={r.id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs text-slate-800">
                      <span className="font-medium truncate max-w-[200px]">
                        • {r.description || CATEGORY_LABELS[r.type]?.label}
                      </span>
                      {requested > 0 && fulfilled > 0 ? (
                        <span className="font-bold shrink-0 text-slate-900 text-[11px]">
                          {fulfilled} / {requested} {r.unit || ''}
                        </span>
                      ) : requested > 0 ? (
                        <span className="text-slate-500 font-semibold text-[11px]">
                          Se necesitan {requested} {r.unit || ''}
                        </span>
                      ) : (
                        <span className="text-indigo-600 font-bold text-[11px]">Requerido</span>
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
              {need.resources.length > 3 && (
                <div className="text-[10px] text-slate-400 uppercase font-semibold italic pt-0.5">
                  + {need.resources.length - 3} necesidades más...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {need.categories.map((c) => (
            <span
              key={c}
              className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-slate-200 flex items-center gap-1"
            >
              <span>{CATEGORY_LABELS[c]?.icon || '🔹'}</span>
              <span>{CATEGORY_LABELS[c]?.label || c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-slate-50/60 border-t border-slate-200 p-3.5 flex items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 font-semibold text-slate-900">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{need.address || need.neighborhood}</span>
            {distanceText && (
              <span className="text-slate-400 font-normal">({distanceText})</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase italic">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Actualizado {formatTimeAgo(need.updatedAt)}</span>
            {need.lastUpdatedBy?.startsWith('[MOD]') && (
              <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHelp(need);
            }}
            className="bg-brand-blue hover:bg-brand-blue/90 active:bg-brand-blue/80 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1"
            id={`btn-help-${need.id}`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-indigo-200" />
            <span>Quiero ayudar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
