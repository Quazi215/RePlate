import { isLocale, type Locale } from "./locale";

let selectedLocale: Locale | undefined;

export function readLocale(): Locale {
  if (selectedLocale) return selectedLocale;
  try {
    const saved = localStorage.getItem("hiraku-locale");
    if (isLocale(saved)) return saved;
  } catch { /* Storage may be disabled; English remains available. */ }
  return "en";
}

export function setLocale(locale: Locale): void {
  selectedLocale = locale;
  try { localStorage.setItem("hiraku-locale", locale); } catch { /* Keep this visit's choice. */ }
  window.dispatchEvent(new Event("hiraku-locale"));
}

export function subscribeLocale(changed: () => void): () => void {
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== null && event.key !== "hiraku-locale") return;
    selectedLocale = undefined;
    changed();
  };
  window.addEventListener("hiraku-locale", changed);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener("hiraku-locale", changed);
    window.removeEventListener("storage", storageChanged);
  };
}
