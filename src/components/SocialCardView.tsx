import React, { useRef, useCallback, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toPng } from 'html-to-image';
import { Need } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG } from '../utils/formatters';
import { VALLE_CITIES } from '../data/valleCities';
import { Download, Loader2 } from 'lucide-react';

interface SocialCardViewProps {
  needId: string;
  format: 'post' | 'story';
}

export const SocialCardView: React.FC<SocialCardViewProps> = ({ needId, format }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const rawNeed = useQuery(api.needs.getById, { id: needId as Id<"needs"> });

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: format === 'story' ? 1920 : 1080,
        pixelRatio: 1,
      });
      const link = document.createElement('a');
      link.download = `aqui-hace-falta-${format}-${needId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Error al generar la imagen. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  }, [format, needId]);

  if (!rawNeed) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-lg font-bold text-slate-600 animate-pulse">Cargando necesidad...</p>
      </div>
    );
  }

  const { _id, _creationTime, updates, ...rest } = rawNeed as any;
  const need: Need = { id: _id, ...rest };
  const priorityInfo = PRIORITY_CONFIG[need.priority] || PRIORITY_CONFIG.MEDIUM;
  const cityName = VALLE_CITIES.find(c => c.id === need.cityId)?.name || 'Valle del Cauca';
  const isStory = format === 'story';

  return (
    <div className="min-h-screen bg-slate-200 p-6 flex flex-col items-center gap-6">
      {/* Controls */}
      <div className="flex items-center gap-4 bg-white rounded-xl px-6 py-3 shadow-md border border-slate-200">
        <span className="text-sm font-bold text-slate-700">
          Formato: <span className="text-indigo-600">{format === 'post' ? 'Post (1080×1080)' : 'Story (1080×1920)'}</span>
        </span>
        <a
          href={window.location.pathname.replace(/\/(post|story)$/, format === 'post' ? '/story' : '/post')}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 underline"
        >
          Cambiar a {format === 'post' ? 'Story' : 'Post'}
        </a>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          ) : (
            <><Download className="w-4 h-4" /> Descargar PNG</>
          )}
        </button>
      </div>

      {/* Card preview (scrollable) */}
      <div className="overflow-auto max-w-full rounded-xl shadow-2xl border border-slate-300">
        <div
          ref={cardRef}
          className="bg-slate-900 text-white flex flex-col overflow-hidden relative shrink-0"
          style={{
            width: 1080,
            height: isStory ? 1920 : 1080,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background accent */}
          <div className="absolute top-0 left-0 right-0 h-3" style={{ backgroundColor: need.priority === 'CRITICAL' ? '#dc2626' : need.priority === 'HIGH' ? '#ea580c' : need.priority === 'MEDIUM' ? '#d97706' : '#059669' }} />

          {/* Header with logo and branding */}
          <div className="px-16 pt-16 pb-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <img src="/logo.svg" alt="" className="w-16 h-16 rounded-2xl" />
              <div>
                <h1 className="text-3xl font-black tracking-tight">AQUÍ HACE FALTA</h1>
                <p className="text-lg text-slate-400 font-semibold">{cityName}, Valle del Cauca</p>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-xl text-lg font-black uppercase tracking-wider ${
              need.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
              need.priority === 'HIGH' ? 'bg-orange-500 text-white' :
              need.priority === 'MEDIUM' ? 'bg-amber-500 text-slate-900' :
              'bg-emerald-600 text-white'
            }`}>
              {priorityInfo.label}
            </div>
          </div>

          {/* Main content */}
          <div className={`flex-1 px-16 flex flex-col ${isStory ? 'justify-center gap-12' : 'justify-center gap-8'}`}>
            {/* Title */}
            <h2 className={`font-black text-white leading-tight ${isStory ? 'text-6xl' : 'text-5xl'}`}>
              {need.title}
            </h2>

            {/* Description */}
            <p className={`text-slate-300 leading-relaxed ${isStory ? 'text-3xl line-clamp-5' : 'text-2xl line-clamp-3'}`}>
              {need.description}
            </p>

            {/* Categories */}
            <div className="flex flex-wrap gap-3">
              {need.categories.slice(0, 5).map((cat) => (
                <span
                  key={cat}
                  className="bg-slate-800 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-full text-xl font-semibold flex items-center gap-2"
                >
                  <span>{CATEGORY_LABELS[cat]?.icon || '🔹'}</span>
                  <span>{CATEGORY_LABELS[cat]?.label || cat}</span>
                </span>
              ))}
            </div>

            {/* Resources */}
            {need.resources && need.resources.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 space-y-4">
                <p className="text-lg font-bold text-slate-400 uppercase tracking-wider">Se necesita:</p>
                <div className="space-y-3">
                  {need.resources.slice(0, isStory ? 5 : 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-2xl">
                      <span className="text-slate-200 font-medium">
                        • {r.description || CATEGORY_LABELS[r.type]?.label}
                      </span>
                      {r.requestedQuantity && (
                        <span className="text-slate-400 font-bold">
                          {r.requestedQuantity} {r.unit || ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-3 text-2xl text-slate-400">
              <span>📍</span>
              <span className="font-semibold">{need.address} — {need.neighborhood}, {cityName}</span>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-16 pb-16 pt-8 flex items-center justify-between">
            <div className="bg-emerald-600 text-white font-black px-8 py-4 rounded-xl text-2xl">
              ¿Puedes ayudar? Entra a la plataforma
            </div>
            <p className="text-xl text-slate-500 font-bold">
              aqui-hace-falta.web.app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
