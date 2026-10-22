import type { i18n } from "i18next";

import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

export function setAppLanguage(lang: string, i18: i18n) {
  localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, lang);
  i18.changeLanguage(lang).catch((error: unknown) => {
    console.error("Failed to change app language:", error);
  });
  document.documentElement.lang = lang;
}

export function updateAppLanguage(i18: i18n) {
  const localLang = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE);
  if (!localLang) {
    return;
  }

  i18.changeLanguage(localLang).catch((error: unknown) => {
    console.error("Failed to restore app language:", error);
  });
  document.documentElement.lang = localLang;
}
