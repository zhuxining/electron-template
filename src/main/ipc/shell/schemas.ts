import { z } from "zod";

import { isSafeExternalUrl } from "@/main/security";

export const openExternalLinkInputSchema = z.object({
  url: z
    .url()
    .refine(isSafeExternalUrl, "Only HTTP and HTTPS links without credentials are allowed"),
});
