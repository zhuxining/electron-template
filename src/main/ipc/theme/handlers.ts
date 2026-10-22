import { os } from "@orpc/server";
import { nativeTheme } from "electron";

import { setThemeModeInputSchema } from "./schemas";

export const toggleThemeMode = os.handler(() => {
  nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? "light" : "dark";
  return nativeTheme.shouldUseDarkColors;
});

export const setThemeMode = os.input(setThemeModeInputSchema).handler(({ input }) => {
  nativeTheme.themeSource = input;
  return nativeTheme.shouldUseDarkColors;
});
