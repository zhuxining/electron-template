export const APP_CONFIG = {
  name: "electron-template",
  appId: "com.electron-template.app",
  repository: { owner: "zhuxining", name: "electron-template" },
} as const;
export const updateRepository = APP_CONFIG.repository.owner + "/" + APP_CONFIG.repository.name;
