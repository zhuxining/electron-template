import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";

import { TooltipProvider } from "@/renderer/components/ui/tooltip";
import { queryClient } from "@/renderer/lib/query-client";

import { updateAppLanguage } from "./actions/language";
import { startThemeSync } from "./actions/theme";
import { router } from "./router";
import "./localization/i18n";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => startThemeSync(), []);
  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
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
