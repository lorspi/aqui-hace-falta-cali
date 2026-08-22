import React, { useState } from 'react';
import { List, Map, PlusCircle, X, Heart, HeartHandshake } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface MobileBottomBarProps {
  mobileView: 'LIST' | 'MAP';
  onSetMobileView: (view: 'LIST' | 'MAP') => void;
  onOpenCreateModal: () => void;
  onOpenCreateOfferModal: () => void;
  onOpenAdminModal?: () => void;
  onScrollToMap?: () => void;
  listCount?: number;
  // Auth (kept optional for backwards compatibility)
  isLoggedIn?: boolean;
  userName?: string;
  onOpenRegisterModal?: () => void;
  onLogout?: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  mobileView,
  onSetMobileView,
  onOpenCreateModal,
  onOpenCreateOfferModal,
}) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Popup menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-28 pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 pointer-events-auto"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu items */}
          <div className="relative z-10 flex flex-col items-stretch gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200 w-64">
            {/* Publicar necesidad */}
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCreateModal(); }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-slate-100 w-full text-left cursor-pointer transition-all hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block text-left">{t('publishNeed')}</span>
                <span className="text-[11px] text-slate-500 block text-left">{t('createNeedSubtitle')}</span>
              </div>
            </button>

            {/* Ofrecer ayuda */}
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCreateOfferModal(); }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border border-slate-100 w-full text-left cursor-pointer transition-all hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block text-left">{t('offerHelp')}</span>
                <span className="text-[11px] text-slate-500 block text-left">{t('createOfferSubtitle')}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg rounded-t-2xl">
        <div className="flex items-center justify-around px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {/* Mapa tab */}
          <button
            onClick={() => { onSetMobileView('MAP'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
            className={`flex items-center gap-2 px-4.5 py-2 rounded-xl transition-all ${
              mobileView === 'MAP'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-xs font-bold">{t('mapView')}</span>
          </button>

          {/* Action button — protrudes above the bar */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-12.5 h-12.5 bg-brand-blue hover:bg-brand-blue/90 rounded-2xl flex items-center justify-center shadow-lg -mt-6 transition-colors shrink-0 cursor-pointer"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <HeartHandshake className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Lista tab */}
          <button
            onClick={() => { onSetMobileView('LIST'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-2 px-4.5 py-2 rounded-xl transition-all ${
              mobileView === 'LIST'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500'
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-xs font-bold">{t('listView')}</span>
          </button>
        </div>
      </div>
    </>
  );
};
