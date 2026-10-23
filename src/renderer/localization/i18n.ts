import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { APP_CONFIG } from "@/shared/app-config";

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    resources: {
      en: {
        translation: {
          appName: APP_CONFIG.name,
          documentation: "Documentation",
          madeBy: "Made by zhuxining",
          loadingAppVersion: "Loading version…",
          retryAppVersion: "Version unavailable. Retry",
          titleHomePage: "Home Page",
          titleSecondPage: "Second Page",
        },
      },
      "pt-BR": {
        translation: {
          appName: APP_CONFIG.name,
          documentation: "Documentação",
          madeBy: "Feito por zhuxining",
          loadingAppVersion: "Carregando versão…",
          retryAppVersion: "Versão indisponível. Tentar novamente",
          titleHomePage: "Página Inicial",
          titleSecondPage: "Segunda Página",
        },
      },
    },
  })
  .catch((error: unknown) => {
    console.error("Failed to initialize translations:", error);
  });
