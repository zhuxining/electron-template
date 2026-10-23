import { SiElectron, SiReact, SiVite } from "@icons-pack/react-simple-icons";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { appVersionQueryOptions } from "@/renderer/actions/app";
import ExternalLink from "@/renderer/components/external-link";
import LangToggle from "@/renderer/components/lang-toggle";
import NavigationMenu from "@/renderer/components/navigation-menu";
import ToggleTheme from "@/renderer/components/toggle-theme";

/*
 * Update this page to modify your home page.
 * You can delete this file component to start from a blank page.
 */

function HomePage() {
  const iconSize = 48;

  const version = useQuery(appVersionQueryOptions());
  const { t } = useTranslation();

  return (
    <>
      <NavigationMenu />
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-end justify-center gap-0.5">
          <div className="inline-flex gap-2">
            <SiReact size={iconSize} />
            <SiVite size={iconSize} />
            <SiElectron size={iconSize} />
          </div>
          <span className="flex items-end justify-end">
            <h1 className="font-mono text-4xl font-bold">{t("appName")}</h1>
            <div className="text-muted-foreground text-sm">
              {version.isPending ? (
                <span role="status">{t("loadingAppVersion")}</span>
              ) : version.isError ? (
                <button type="button" onClick={() => void version.refetch()}>
                  {t("retryAppVersion")}
                </button>
              ) : (
                <span data-testid="app-version">v{version.data}</span>
              )}
            </div>
          </span>
          <div className="flex w-full justify-between">
            <ExternalLink
              className="text-muted-foreground flex gap-2 text-sm"
              href="https://github.com/zhuxining"
            >
              {t("madeBy")}
            </ExternalLink>
            <div className="flex items-center gap-2">
              <LangToggle />
              <ToggleTheme />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    // Version metadata is optional; keep the page usable while it loads or fails.
    void context.queryClient.prefetchQuery(appVersionQueryOptions());
  },
  component: HomePage,
});
