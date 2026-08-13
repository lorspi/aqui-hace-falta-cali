import React from 'react';
import { MapPin, Clock, ChevronRight, ShieldCheck } from 'lucide-react';
import { Offer, OfferStatus, VerificationStatus } from '../types';
import { CATEGORY_LABELS, VERIFICATION_CONFIG, formatTimeAgo } from '../utils/formatters';

interface OfferCardProps {
  offer: Offer;
  onClick: () => void;
}

const OFFER_STATUS_CONFIG: Record<OfferStatus, { label: string; badgeClass: string }> = {
  AVAILABLE: {
    label: 'Disponible',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
  },
  PARTIALLY_AVAILABLE: {
    label: 'Parcialmente disponible',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  EXHAUSTED: {
    label: 'Agotado',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  CLOSED: {
    label: 'Cerrado',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

function renderVerificationBadge(status: VerificationStatus) {
  const info = VERIFICATION_CONFIG[status];
  if (!info) return null;
  if (status === 'REPORTED' || status === 'ARCHIVED') return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${info.badgeClass}`}>
      <span>{info.label}</span>
    </span>
  );
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onClick }) => {
  const statusInfo = OFFER_STATUS_CONFIG[offer.offerStatus] || OFFER_STATUS_CONFIG.AVAILABLE;
  const isInactive = offer.offerStatus === 'EXHAUSTED' || offer.offerStatus === 'CLOSED';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-md ${
        isInactive ? 'opacity-50' : ''
      }`}
      id={`offer-card-${offer.id}`}
    >
      {/* Card Header & Badges */}
      <div className={`p-5 space-y-2.5 ${isInactive ? 'line-through decoration-slate-400' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs mb-1">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>

          <div className="flex items-center gap-1.5">
            {renderVerificationBadge(offer.verificationStatus)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition-colors no-underline" style={{ textDecoration: 'none' }}>
          {offer.title}
        </h3>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {offer.categories.map((c) => (
            <span
              key={c}
              className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-blue-200 flex items-center gap-1"
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
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{offer.address || offer.neighborhood}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase italic">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Actualizado {formatTimeAgo(offer.updatedAt)}</span>
            {offer.verificationStatus === 'VERIFIED' && (
              <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
      </div>
    </div>
  );
};
