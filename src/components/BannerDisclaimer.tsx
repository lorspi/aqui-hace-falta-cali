import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, Info, X } from 'lucide-react';
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

  const showDemoNotice = hasDemoData && !dismissed;

  return (
    <div className={`bg-[#f1f5f9] border-b border-slate-200 ${!showDemoNotice ? 'hidden md:block' : ''}`}>
      {/* Official emergency notice */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 hidden md:flex flex-col md:flex-row items-start md:items-center justify-between text-xs sm:text-sm text-slate-700 gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-100/80 text-amber-800 shrink-0">
            <ShieldAlert className="w-4 h-4 text-[#b45309]" />
          </div>
          <span className="text-xs sm:text-sm text-slate-800 leading-snug">
            <strong className="font-bold text-slate-900">{t('disclaimerTitle')}</strong>{' '}
            <span>{t('disclaimerDescText')}</span>{' '}
            <strong className="font-bold text-[#b45309]">{t('disclaimerDescHighlight')}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs text-slate-700">
          <span className="text-slate-600 font-medium text-xs mr-0.5">
            {t('emergencyLinesLabel')}
          </span>
          
          <a
            href="tel:123"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-md text-slate-900 font-bold text-xs shadow-2xs transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>123</span>
          </a>

          <a
            href="tel:132"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-md text-slate-900 text-xs shadow-2xs transition-all"
          >
            <span>{t('redCrossLabel')}</span>
            <strong className="font-bold text-slate-950">132</strong>
          </a>

          <a
            href="tel:119"
            className="inline-flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-md text-slate-900 text-xs shadow-2xs transition-all"
          >
            <span>{t('firefightersLabel')}</span>
            <strong className="font-bold text-slate-950">119</strong>
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
