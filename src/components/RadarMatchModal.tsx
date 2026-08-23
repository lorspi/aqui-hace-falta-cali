import React, { useState, useEffect } from 'react';
import { X, MapPin, MessageSquare, Loader2, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { Need, Offer } from '../types';
import { fetchMatchingOffersForNeed, fetchMatchingNeedsForOffer, MatchingOfferResult, MatchingNeedResult } from '../lib/supabaseService';
import { getCategoryLabel, PRIORITY_CONFIG, buildWhatsappLink } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';

interface RadarMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'NEED_PUBLISHED' | 'OFFER_PUBLISHED' | null;
  item: Need | Offer | null;
  onSelectNeed?: (need: Need) => void;
  onSelectOffer?: (offer: Offer) => void;
}

export const RadarMatchModal: React.FC<RadarMatchModalProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onSelectNeed,
  onSelectOffer,
}) => {
  const { language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [offerMatches, setOfferMatches] = useState<MatchingOfferResult[]>([]);
  const [needMatches, setNeedMatches] = useState<MatchingNeedResult[]>([]);

  useEffect(() => {
    if (!isOpen || !item || !type) {
      setOfferMatches([]);
      setNeedMatches([]);
      return;
    }

    setLoading(true);

    if (type === 'NEED_PUBLISHED') {
      fetchMatchingOffersForNeed(item.id, 5)
        .then((results) => setOfferMatches(results))
        .catch(() => setOfferMatches([]))
        .finally(() => setLoading(false));
    } else if (type === 'OFFER_PUBLISHED') {
      fetchMatchingNeedsForOffer(item.id, 5)
        .then((results) => setNeedMatches(results))
        .catch(() => setNeedMatches([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, item, type]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  if (!isOpen || !item || !type) return null;

  const isNeed = type === 'NEED_PUBLISHED';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-emerald-50/70 rounded-t-2xl">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                Radar Match
              </span>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Publicado
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              {isNeed ? '¡Tu solicitud fue publicada!' : '¡Tu oferta fue publicada!'}
            </h2>
            <p className="text-xs text-slate-600 leading-normal">
              {isNeed
                ? 'Coincidencias encontradas con ofertas de ayuda cercanas que podrían servirte:'
                : 'Coincidencias encontradas con solicitudes de ayuda que podrías suplir:'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0"
            id="btn-close-radar-match-modal"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Buscando coincidencias con el motor Radar Match...
              </p>
            </div>
          ) : isNeed ? (
            offerMatches.length > 0 ? (
              <div className="space-y-3">
                {offerMatches.map(({ offer, score, distanceKm, matchingCategories }) => {
                  const categoriesToDisplay = matchingCategories.length > 0 ? matchingCategories : offer.categories;
                  return (
                    <div
                      key={offer.id}
                      className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-3.5 space-y-2.5 shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{offer.title}</h4>
                          <div className="flex flex-wrap gap-1">
                            {categoriesToDisplay.map((cat) => {
                              const labelObj = getCategoryLabel(cat, language);
                              return (
                                <span
                                  key={cat}
                                  className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md"
                                >
                                  {labelObj?.icon} {labelObj?.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
                          {score}% Match
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{offer.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{offer.neighborhood || offer.address || 'Ubicación cercana'}</span>
                          {typeof distanceKm === 'number' && (
                            <span className="text-emerald-700 font-bold shrink-0">({distanceKm.toFixed(1)} km)</span>
                          )}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {offer.contactPhone && (
                            <a
                              href={buildWhatsappLink(offer.contactPhone, `Hola, vi tu oferta "${offer.title}" en Radar de Ayuda`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Contactar</span>
                            </a>
                          )}
                          {onSelectOffer && (
                            <button
                              onClick={() => {
                                onSelectOffer(offer);
                                onClose();
                              }}
                              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <span>Ver</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 px-4 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">¡Tu solicitud ya está en el mapa!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  En este momento no hay ofertas activas exactas en tu zona, pero tu petición ya es visible para toda la red de voluntariado y donantes.
                </p>
              </div>
            )
          ) : (
            needMatches.length > 0 ? (
              <div className="space-y-3">
                {needMatches.map(({ need, score, distanceKm, matchingCategories }) => {
                  const categoriesToDisplay = matchingCategories.length > 0 ? matchingCategories : need.categories;
                  const priorityConfig = need.priority ? PRIORITY_CONFIG[need.priority] : null;

                  return (
                    <div
                      key={need.id}
                      className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-3.5 space-y-2.5 shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{need.title}</h4>
                            {priorityConfig && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityConfig.badgeClass}`}>
                                {priorityConfig.label}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {categoriesToDisplay.map((cat) => {
                              const labelObj = getCategoryLabel(cat, language);
                              return (
                                <span
                                  key={cat}
                                  className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md"
                                >
                                  {labelObj?.icon} {labelObj?.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
                          {score}% Match
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{need.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{need.neighborhood || need.address || 'Ubicación cercana'}</span>
                          {typeof distanceKm === 'number' && (
                            <span className="text-emerald-700 font-bold shrink-0">({distanceKm.toFixed(1)} km)</span>
                          )}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {need.contactPhone && (
                            <a
                              href={buildWhatsappLink(need.contactPhone, `Hola, vi tu solicitud "${need.title}" en Radar de Ayuda`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ayudar</span>
                            </a>
                          )}
                          {onSelectNeed && (
                            <button
                              onClick={() => {
                                onSelectNeed(need);
                                onClose();
                              }}
                              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <span>Ver</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 px-4 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">¡Tu oferta ya está disponible!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  ¡Muchas gracias por ofrecer ayuda! Tu oferta ya está visible para la comunidad. Tan pronto una solicitud requiera tu ayuda te notificaremos.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="btn-primary-success text-xs py-2 px-5 font-bold"
            id="btn-radar-match-done"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
