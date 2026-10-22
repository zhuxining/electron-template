import { RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";

import { TooltipProvider } from "@/components/ui/tooltip";

import { updateAppLanguage } from "./actions/language";
import { syncWithLocalTheme, watchSystemTheme } from "./actions/theme";
import { router } from "./utils/routes";
import "./localization/i18n";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const stopWatchingTheme = watchSystemTheme();
    syncWithLocalTheme().catch((error: unknown) => {
      console.error("Failed to restore app theme:", error);
    });
    updateAppLanguage(i18n);
    return stopWatchingTheme;
  }, [i18n]);

  return <RouterProvider router={router} />;
}

const container = document.getElementById("app");
if (!container) {
  throw new Error('Root element with id "app" not found');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
