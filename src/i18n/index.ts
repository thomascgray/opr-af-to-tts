import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.yaml";
import fr from "../locales/fr.yaml";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LOCAL_STORAGE_KEY = "tombolaopraftotts_currentLanguage";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: "en",
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCAL_STORAGE_KEY,
      caches: ["localStorage"],
    },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (lngs, _ns, key) => {
          console.warn(
            `[i18n] missing key "${key}" for language(s): ${lngs.join(", ")}`
          );
        }
      : undefined,
  });

export default i18n;
