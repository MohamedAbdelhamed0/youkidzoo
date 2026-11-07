import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ar as arabicLocale, en as englishLocale } from "zod/locales";
const saved = localStorage.getItem("ykz-language");
i18n.use(initReactI18next).init({
  lng: saved === "ar" ? "ar" : "en",
  fallbackLng: "en",
  resources: { en: { translation: {} }, ar: { translation: {} } },
  interpolation: { escapeValue: false },
});
function apply() {
  z.config(i18n.language === "ar" ? arabicLocale() : englishLocale());
  document.documentElement.lang = i18n.language;
  document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  localStorage.setItem("ykz-language", i18n.language);
}
i18n.on("languageChanged", apply);
apply();
export function useLanguage() {
  const { i18n: instance } = useTranslation();
  const ar = instance.language === "ar";
  return {
    ar,
    t: (en: string, arabic: string) => (ar ? arabic : en),
    setAr: (value: boolean) => {
      void instance.changeLanguage(value ? "ar" : "en");
    },
  };
}
