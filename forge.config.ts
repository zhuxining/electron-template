import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { APP_CONFIG } from "./src/shared/app-config";

const config: ForgeConfig = {
  makers: [
    new MakerSquirrel({
      certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
      certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  packagerConfig: {
    asar: true,
    appBundleId: APP_CONFIG.appId,
    osxSign: process.env.APPLE_SIGN_IDENTITY
      ? { identity: process.env.APPLE_SIGN_IDENTITY }
      : undefined,
    osxNotarize:
      process.env.APPLE_ID && process.env.APPLE_APP_PASSWORD && process.env.APPLE_TEAM_ID
        ? {
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_APP_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
          }
        : undefined,
  },
  plugins: [
    new VitePlugin({
      hotRestart: true,
      build: [
        {
          config: "vite.main.config.mts",
          entry: "src/main/index.ts",
          target: "main",
        },
        {
          config: "vite.preload.config.mts",
          entry: "src/preload/index.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          config: "vite.renderer.config.mts",
          name: "main_window",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      config: {
        draft: true,
        prerelease: false,
        repository: APP_CONFIG.repository,
      },
      /*
       * Publish release on GitHub as draft.
       * Remember to manually publish it on GitHub website after verifying everything is correct.
       */
      name: "@electron-forge/publisher-github",
    },
  ],
  rebuildConfig: {},
};

export default config;
