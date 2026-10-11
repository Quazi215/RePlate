export const locales = ["en", "es", "zh-Hant", "ar", "bn", "fr", "ht", "ko", "pl", "ru", "ur"] as const;
export type Locale = typeof locales[number];

export const nativeNames: Record<Locale, string> = {
  en: "English", es: "Español", "zh-Hant": "繁體中文", ar: "العربية", bn: "বাংলা",
  fr: "Français", ht: "Kreyòl ayisyen", ko: "한국어", pl: "Polski", ru: "Русский", ur: "اردو",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function direction(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" || locale === "ur" ? "rtl" : "ltr";
}

// Flash v2.5 supports these languages. Traditional Chinese is intentionally excluded:
// the provider documents Mandarin Chinese without a verified Traditional Chinese variety.
export const speechCodes: Partial<Record<Locale, string>> = {
  en: "en", es: "es", ar: "ar", fr: "fr", ko: "ko", pl: "pl", ru: "ru",
};

// Scribe v2 Realtime accepts ISO-639-1/3 codes. Live voice also needs supported playback.
export const realtimeCodes: Partial<Record<Locale, string>> = {
  en: "eng", es: "spa", ar: "ara", fr: "fra", ko: "kor", pl: "pol", ru: "rus",
};

export const languageInstructions: Record<Locale, string> = {
  en: "English", es: "Spanish", "zh-Hant": "Traditional Chinese", ar: "Arabic",
  bn: "Bengali", fr: "French", ht: "Haitian Creole", ko: "Korean", pl: "Polish",
  ru: "Russian", ur: "Urdu",
};
