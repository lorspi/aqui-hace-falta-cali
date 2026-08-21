import React, { useState } from 'react';
import { Phone, ShieldAlert, Info, X } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface BannerDisclaimerProps {
  hasDemoData: boolean;
  onResetDemoData?: () => void;
}

export const BannerDisclaimer: React.FC<BannerDisclaimerProps> = ({
  hasDemoData,
  onResetDemoData,
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="bg-slate-100 border-b border-slate-200">
      {/* Official emergency notice */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900">{t('disclaimerTitle')}</strong>{' '}
            {t('disclaimerDesc')}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-slate-800 font-medium">
          <a
            href="tel:123"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-900 font-bold"
          >
            <Phone className="w-3 h-3 text-red-600" /> 123
          </a>
          <a
            href="tel:132"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-900 font-bold"
          >
            132
          </a>
          <a
            href="tel:119"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded text-slate-900 font-bold"
          >
            119
          </a>
        </div>
      </div>

      {/* Demo data alert banner */}
      {hasDemoData && !dismissed && (
        <div className="bg-amber-50 border-t border-amber-200/80 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                <strong>{t('demoNoticeTitle')}</strong> {t('demoNoticeDesc')}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDismissed(true)}
                className="p-0.5 text-amber-800 hover:text-amber-950 rounded"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
