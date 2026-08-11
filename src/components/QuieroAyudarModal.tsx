import React from 'react';
import { X, HeartHandshake, MapPin, MessageSquare, Phone, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { Need } from '../types';
import { CATEGORY_LABELS, buildWhatsappLink } from '../utils/formatters';

interface QuieroAyudarModalProps {
  need: Need | null;
  onClose: () => void;
}

export const QuieroAyudarModal: React.FC<QuieroAyudarModalProps> = ({ need, onClose }) => {
  if (!need) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${need.latitude},${need.longitude}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Ofrecer ayuda</h3>
              <p className="text-xs text-slate-500">Vas a contactar a este punto para coordinar tu aporte.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
          <h4 className="font-bold text-slate-900 text-base leading-snug">{need.title}</h4>

          <div className="space-y-1 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{need.address} ({need.neighborhood}, Cali)</span>
            </div>
            {need.operatingHours && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Horario: {need.operatingHours}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Necesidades prioritarias:
            </span>
            <div className="space-y-1 text-xs text-slate-800">
              {need.resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span>• {r.description || CATEGORY_LABELS[r.type]?.label}</span>
                  {r.requestedQuantity && (
                    <span className="font-semibold text-slate-900">
                      Faltan: {r.requestedQuantity - (r.fulfilledQuantity || 0)} {r.unit || ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact actions */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-600 font-medium">Elige el canal directo de coordinación:</p>

          <div className="grid grid-cols-1 gap-2">
            {need.contactWhatsapp && (
              <a
                href={buildWhatsappLink(need.contactWhatsapp, need.title, need.categories)}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Escribir por WhatsApp</span>
              </a>
            )}

            {need.contactPhone && (
              <a
                href={`tel:${need.contactPhone}`}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Llamar por teléfono ({need.contactPhone})</span>
              </a>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir ruta en Google Maps</span>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Recuerda confirmar con el responsable la disponibilidad y las medidas de seguridad antes de desplazarte.
          </span>
        </div>
      </div>
    </div>
  );
};
