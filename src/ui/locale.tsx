import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import english from './english.json';

type Locale = 'ko' | 'en';

const localeKey = 'vertactics.locale';
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: 'ko',
  setLocale: () => {},
});

const readLocale = (): Locale => {
  try {
    return localStorage.getItem(localeKey) === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
};

const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState(readLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(localeKey, locale);
    } catch {
      return;
    }
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  const t = (text: string, ...values: (string | number)[]) => {
    const translations: Record<string, string> = english;
    const message = context.locale === 'en' && Object.hasOwn(translations, text) ? translations[text]! : text;
    return values.length === 0 ? message : message.replace(/\{(\d+)\}/g, (placeholder, index: string) =>
      String(values[Number(index)] ?? placeholder));
  };
  return { ...context, t };
};

export default LocaleProvider;
