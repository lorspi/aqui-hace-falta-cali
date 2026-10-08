import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '/idioma/es.svg' },
  { code: 'en', label: 'English', flag: '/idioma/en.svg' },
  { code: 'pt', label: 'Português', flag: '/idioma/pt.svg' },
  { code: 'fr', label: 'Français', flag: '/idioma/fr.svg' },
];

export const LanguageSelector: React.FC<{
  className?: string;
  iconOnly?: boolean;
  variant?: 'default' | 'ghost' | 'sidebar';
  dropUp?: boolean;
}> = ({ className = '', iconOnly = false, variant = 'default', dropUp = false }) => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buttonClass =
    variant === 'sidebar'
      ? `flex items-center ${iconOnly ? 'justify-center w-9 h-9' : 'justify-between w-full px-2.5 py-1.5'} rounded-rd-md border border-rd-line bg-rd-surface hover:bg-rd-fondo text-rd-ink text-rd-12 font-medium transition-colors cursor-pointer`
      : variant === 'ghost'
      ? `px-3 py-1.5 rounded-xl text-xs font-normal transition-colors cursor-pointer inline-flex items-center gap-1.5 border-0 bg-transparent ${
          isOpen
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
        }`
      : `flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl transition-all h-[34px] ${
          iconOnly ? 'w-[34px] p-0' : 'gap-1 px-2.5 py-1.5'
        }`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        id="btn-language-selector"
        title={`Idioma: ${currentLang.label}`}
      >
        <span className="flex items-center gap-2">
          <img src={currentLang.flag} alt={currentLang.label} className="w-4 h-4 rounded-xs object-cover shrink-0" />
          {!iconOnly && (
            <span className="truncate text-rd-12 text-rd-ink font-medium">{currentLang.label}</span>
          )}
        </span>
        {!iconOnly && (
          <ChevronDown className={`w-3.5 h-3.5 text-rd-ink-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${iconOnly ? 'left-0' : 'right-0 w-full min-w-36'} bg-white/98 backdrop-blur-xl border border-rd-line rounded-rd-lg shadow-rd-2 py-1 z-50 animate-fade-in font-sans`}
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer rounded-lg ${
                  isSelected
                    ? 'bg-slate-100 text-brand-blue font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <img src={lang.flag} alt={lang.label} className="w-5 h-5 rounded-sm object-cover" />
                  <span>{lang.label}</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">{lang.code}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
