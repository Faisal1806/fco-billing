'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { translations, Language, TranslationKey } from '@/lib/i18n';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, ...args: any[]) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: TranslationKey, ...args: any[]) => {
    const translation = translations[language][key];
    if (typeof translation === 'function') {
      return translation(...args);
    }
    return translation || translations['en'][key];
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
