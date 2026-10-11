"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { direction, isLocale, locales, nativeNames, type Locale } from "./locale";
import { readLocale, setLocale, subscribeLocale } from "./locale-store";
import { translate, translateDynamic, type TranslationKey } from "./translations";

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({ locale: "en", setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(subscribeLocale, readLocale, () => "en");
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction(locale);
  }, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale, t: (key: TranslationKey) => translate(locale, key), dynamic: (key: string) => translateDynamic(locale, key) };
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  return <label className="language-selector">{t("Language")}
    <select aria-label={t("Language")} value={locale} onChange={event => {
      if (isLocale(event.target.value)) setLocale(event.target.value);
    }}>
      {locales.map(value => <option key={value} value={value} lang={value}>{nativeNames[value]}</option>)}
    </select>
  </label>;
}
