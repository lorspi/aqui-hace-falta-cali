import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '/idioma/es.svg' },
  { code: 'en', label: 'English', flag: '/idioma/en.svg' },
  { code: 'pt', label: 'Português', flag: '/idioma/pt.svg' },
  { code: 'fr', label: 'Français', flag: '/idioma/fr.svg' },
];

export const LanguageSelector: React.FC<{ className?: string; iconOnly?: boolean }> = ({ className = '', iconOnly = false }) => {
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl transition-all h-[34px] ${
          iconOnly ? 'w-[34px] p-0' : 'gap-1 px-2.5 py-1.5'
        }`}
        id="btn-language-selector"
        title={`Idioma: ${currentLang.label}`}
      >
        <img src={currentLang.flag} alt={currentLang.label} className="w-4 h-4 rounded-sm object-cover" />
        {!iconOnly && (
          <>
            <span className="uppercase tracking-wider">{currentLang.code}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
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
