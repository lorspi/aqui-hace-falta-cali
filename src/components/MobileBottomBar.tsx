import React, { useState } from 'react';
import { List, Map, Plus, PlusCircle, ShieldCheck, X, MapPin, Heart } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface MobileBottomBarProps {
  mobileView: 'LIST' | 'MAP';
  onSetMobileView: (view: 'LIST' | 'MAP') => void;
  onOpenCreateModal: () => void;
  onOpenCreateOfferModal: () => void;
  onOpenAdminModal: () => void;
  onScrollToMap: () => void;
  listCount: number;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  mobileView,
  onSetMobileView,
  onOpenCreateModal,
  onOpenCreateOfferModal,
  onOpenAdminModal,
  onScrollToMap,
  listCount,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Popup menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-24 pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 pointer-events-auto"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu items */}
          <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">{t('selectLanguage')}:</span>
              <LanguageSelector />
            </div>

            {/* Necesito Ayuda */}
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCreateModal(); }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-slate-100 w-64"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">{t('publishNeed')}</span>
                <span className="text-[11px] text-slate-500">{t('createNeedSubtitle')}</span>
              </div>
            </button>

            {/* Ver necesidades */}
            <button
              onClick={() => { setIsMenuOpen(false); onScrollToMap(); }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-slate-100 w-64"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">{t('viewNeeds')}</span>
                <span className="text-[11px] text-slate-500">{t('mapView')}</span>
              </div>
            </button>

            {/* Publicar ayuda */}
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCreateOfferModal(); }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-slate-100 w-64"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">{t('offerHelp')}</span>
                <span className="text-[11px] text-slate-500">{t('createOfferSubtitle')}</span>
              </div>
            </button>

            {/* Ser moderador */}
            <button
              onClick={() => { setIsMenuOpen(false); window.location.href = '/moderador'; }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-slate-100 w-64"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">{t('moderatorView')}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg rounded-t-2xl">
        <div className="flex items-center justify-around px-4 py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
          {/* Lista tab */}
          <button
            onClick={() => { onSetMobileView('LIST'); setTimeout(() => document.getElementById('mobile-list-anchor')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all ${
              mobileView === 'LIST'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="text-[11px] font-bold">{t('listView')}</span>
          </button>

          {/* Action button — protrudes above the bar */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-11 h-11 bg-brand-blue hover:bg-brand-blue/90 rounded-xl flex items-center justify-center shadow-lg -mt-5 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Plus className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Mapa tab */}
          <button
            onClick={() => { onSetMobileView('MAP'); setTimeout(() => document.getElementById('mobile-map-anchor')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all ${
              mobileView === 'MAP'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500'
            }`}
          >
            <Map className="w-4 h-4" />
            <span className="text-[11px] font-bold">{t('mapView')}</span>
          </button>
        </div>
      </div>
    </>
  );
};
