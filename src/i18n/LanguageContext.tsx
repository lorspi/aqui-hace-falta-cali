import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationKey } from './translations';

import type { Recurso, TipoPublicacion } from '../types/publicacion';
import {
  translateCategory,
  translateItem,
  translateUnit,
  translateResourceStatus,
  translateDistance,
  translateResourcesTitle,
  translateEmergency,
} from './catalogTranslations';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tItem: (item: string) => string;
  tCategory: (cat: string) => string;
  tUnit: (cant: number, u: string) => string;
  tResourceStatus: (r: Recurso, tipo: TipoPublicacion) => string;
  tDistance: (km: number | null | undefined) => string;
  tResourcesTitle: (recursos: Recurso[], tipo: TipoPublicacion) => string;
  tEvento: (evento: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ahf_language') as Language;
      if (saved === 'es' || saved === 'en' || saved === 'pt' || saved === 'fr') return saved;
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('en')) return 'en';
      if (navLang.startsWith('pt')) return 'pt';
      if (navLang.startsWith('fr')) return 'fr';
    }
    return 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ahf_language', lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['es'][key] || String(key);
  };

  const tItem = (item: string): string => translateItem(item, language);
  const tCategory = (cat: string): string => translateCategory(cat, language);
  const tUnit = (cant: number, u: string): string => translateUnit(cant, u, language);
  const tResourceStatus = (r: Recurso, tipo: TipoPublicacion): string =>
    translateResourceStatus(r, tipo, language);
  const tDistance = (km: number | null | undefined): string => translateDistance(km, language);
  const tResourcesTitle = (recursos: Recurso[], tipo: TipoPublicacion): string =>
    translateResourcesTitle(recursos, tipo, language);
  const tEvento = (evento: string): string => translateEmergency(evento, language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tItem,
        tCategory,
        tUnit,
        tResourceStatus,
        tDistance,
        tResourcesTitle,
        tEvento,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context) return context;

  // Fallback seguro para renders aislados (ej. renderToStaticMarkup en tooltips de Leaflet, tests, etc.)
  let validLang: Language = 'es';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ahf_language') as Language;
    if (saved === 'es' || saved === 'en' || saved === 'pt' || saved === 'fr') {
      validLang = saved;
    }
  }

  return {
    language: validLang,
    setLanguage: () => {},
    t: (key: TranslationKey): string =>
      translations[validLang]?.[key] || translations['es']?.[key] || String(key),
    tItem: (item: string): string => translateItem(item, validLang),
    tCategory: (cat: string): string => translateCategory(cat, validLang),
    tUnit: (cant: number, u: string): string => translateUnit(cant, u, validLang),
    tResourceStatus: (r: Recurso, tipo: TipoPublicacion): string =>
      translateResourceStatus(r, tipo, validLang),
    tDistance: (km: number | null | undefined): string => translateDistance(km, validLang),
    tResourcesTitle: (recursos: Recurso[], tipo: TipoPublicacion): string =>
      translateResourcesTitle(recursos, tipo, validLang),
    tEvento: (evento: string): string => translateEmergency(evento, validLang),
  };
};
