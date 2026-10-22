import { z } from "zod";

import { THEME_MODES } from "@/shared/theme";
export const setThemeModeInputSchema = z.enum(THEME_MODES);
