import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    resources: {
      en: {
        translation: {
          appName: "electron-template",
          documentation: "Documentation",
          madeBy: "Made by zhuxining",
          titleHomePage: "Home Page",
          titleSecondPage: "Second Page",
        },
      },
      "pt-BR": {
        translation: {
          appName: "electron-template",
          documentation: "Documentação",
          madeBy: "Feito por zhuxining",
          titleHomePage: "Página Inicial",
          titleSecondPage: "Segunda Página",
        },
      },
    },
  })
  .catch((error: unknown) => {
    console.error("Failed to initialize translations:", error);
  });
