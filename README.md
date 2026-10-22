# electron-template

Electron in all its glory. A starting point for building a desktop application with React, TypeScript, and native window controls.

## Libraries and tools

See [`package.json`](./package.json) for dependency versions and all available scripts.

- **Core:** [Electron](https://www.electronjs.org), [Vite Plus](https://viteplus.dev), and [TypeScript](https://www.typescriptlang.org).
- **UI:** [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Geist](https://vercel.com/font), [Lucide](https://lucide.dev), and [i18next](https://www.i18next.com).
- **Routing and IPC:** [TanStack Router](https://tanstack.com/router) with file based routes, [oRPC](https://orpc.unnoq.com), and [Zod](https://zod.dev).
- **Testing:** [Vitest](https://vitest.dev), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro), and [Playwright](https://playwright.dev).
- **Packaging:** [Electron Forge](https://www.electronforge.io) with its GitHub publisher.

React Compiler is enabled through the React Vite plugin. Vite Plus provides linting and formatting through Oxlint and Oxfmt. Electron's built-in DevTools are available in development; React DevTools are not installed automatically.

## Getting started

Use the Node.js version in [`.node-version`](./.node-version); supported Node.js versions are recorded in `package.json`. Install a current stable version of Bun for dependency installation and running package scripts. Bun is not required as the application runtime.

Use this repository as a GitHub template, or clone it:

```bash
git clone https://github.com/zhuxining/electron-template.git
cd electron-template
bun install --frozen-lockfile
bun run start
```

Main process changes automatically restart the app during development. Start editing [`src/renderer/routes/index.tsx`](./src/renderer/routes/index.tsx); remove `src/renderer/routes/second.tsx` if you do not need the example second page.

## Project structure

```text
src/
  main/       Electron lifecycle, windows, security, and IPC handlers
  preload/    Isolated bridge between the renderer and main process
  renderer/   React UI, routes, layouts, styles, and localization
  shared/     Shared configuration, types, and validation helpers
tests/
  unit/       Main and renderer unit tests
  e2e/        Playwright application tests
```

File based routes live in `src/renderer/routes`; the router plugin generates `src/renderer/routeTree.gen.ts`. Configure linting, formatting, and unit tests in [`vite.config.ts`](./vite.config.ts). Forge uses separate [`main`](./vite.main.config.mts), [`preload`](./vite.preload.config.mts), and [`renderer`](./vite.renderer.config.mts) Vite configs. Playwright uses [`playwright.config.ts`](./playwright.config.ts).

TypeScript uses three configs: `tsconfig.json` holds common options and lists the two projects for editor discovery; `tsconfig.node.json` checks main, preload, tooling, and tests with Node and DOM types; `tsconfig.renderer.json` checks renderer and shared code with browser types. Both checks use `noEmit`, and the renderer imports the main router directly as a type for oRPC inference. Lint rules enforce process ownership for both aliases and relative imports, and prevent Node imports and globals in renderer and shared code.

When adapting the template, set the app name, app ID, and repository identity in [`src/shared/app-config.ts`](./src/shared/app-config.ts). The updater and Forge publisher share this single repository identity. Customize `package.json` metadata, including `name`, `productName`, `description`, `author`, and `repository`, for your application. Review maker metadata in [`forge.config.ts`](./forge.config.ts) as well.

## Development and testing

| Command                 | Purpose                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `bun run check`         | Read-only formatting, lint, and type checks; does not apply fixes.                                              |
| `bun run fix`           | Explicitly apply formatting and lint fixes.                                                                     |
| `bun run typecheck`     | Run TypeScript checks only.                                                                                     |
| `bun run test:unit`     | Run unit tests once (`bun run test` is an alias).                                                               |
| `bun run test:watch`    | Watch unit tests.                                                                                               |
| `bun run test:coverage` | Run unit tests with coverage reports.                                                                           |
| `bun run test:e2e`      | Build a fresh local package, then run Playwright tests.                                                         |
| `bun run test:smoke`    | Verify the current packaged executable starts and initializes the renderer and IPC, without Node inspect flags. |
| `bun run test:all`      | Run check, unit, E2E, and smoke checks in that order.                                                           |

The smoke test does not build the app. Run `bun run package` first when using it on its own:

```bash
bun run package
bun run test:smoke
```

The CI test matrix runs on Linux, macOS, and Windows via [testing.yaml](./.github/workflows/testing.yaml), alongside the checks in [check.yaml](./.github/workflows/check.yaml). Local results only cover the host OS; the matrix verifies the remaining platforms when CI runs.

## Renderer permissions and IPC

The renderer has no Node integration and runs with sandboxing and context isolation enabled. Native capabilities go through the preload bridge and typed oRPC handlers. The main process validates the IPC sender against the app's own main frame and expected renderer URL before accepting a connection.

External links are validated and restricted to HTTP/HTTPS URLs without embedded credentials. Navigation away from the trusted renderer entry is blocked, as are new windows and webviews. See [`src/main/security.ts`](./src/main/security.ts), [`src/main/window.ts`](./src/main/window.ts), and [`src/main/index.ts`](./src/main/index.ts) when extending these policies.

## Native title bar and panels

[`src/shared/window.ts`](./src/shared/window.ts) centralizes shared title bar heights, fallback control widths, and theme colors. Main-process window options live in [`src/main/window.ts`](./src/main/window.ts). UI components, layouts, and styles live under `src/renderer/components`, `src/renderer/layouts`, and [`src/renderer/styles/global.css`](./src/renderer/styles/global.css). `BaseLayout` owns the platform and title bar CSS variables.

macOS uses `hiddenInset` with native traffic lights centered in the shared title bar height. Windows uses the native window controls overlay, with CSS environment variables reserving its actual control area. Other platforms retain their native title bar. Native controls retain their system behavior.

Each column has a draggable header and content that fills the remaining height. Dividers span the window in normal, maximized, and fullscreen states. `DragWindowRegion` accepts `leading`, `title`, and `toolbar` slots. Empty space is draggable; the toolbar and common interactive elements are excluded from dragging. Use `window-no-drag` for custom interactive content.

`BaseLayout` exposes `title`, `toolbar`, `leftPanel`, `rightPanel`, and `children` slots. Both panels resize independently and restore their previous width when expanded. Manually resized widths are remembered across relaunches; collapse state lasts for the session. A collapsed panel's button moves to the center header so it can be reopened. Omit a panel slot to remove that panel and its button. The root route demonstrates panel content using the Sidebar primitives.

```tsx
<BaseLayout
  title={<span>My workspace</span>}
  toolbar={<Button variant="ghost">New</Button>}
  leftPanel={<nav>Navigation</nav>}
  rightPanel={<div>Details</div>}
>
  <Outlet />
</BaseLayout>
```

The app observes its own native fullscreen state through an oRPC event stream, using shared state definitions in [`src/shared/window-state.ts`](./src/shared/window-state.ts). Entering fullscreen removes the traffic light inset; leaving restores it. Subscriptions are canceled when the layout unmounts. Windows control colors follow theme changes in the main process.

Validate native dragging, double-click preferences, Windows snap layouts, display scaling, and fullscreen transitions on each target OS before release.

## Theme initialization

[`public/theme-init.js`](./public/theme-init.js) remains a separate classic script loaded in the HTML head before stylesheets and the application module. Keep it there so the saved or system theme applies before the first paint.

Runtime theme handling in [`src/renderer/actions/theme.ts`](./src/renderer/actions/theme.ts) uses [`src/shared/theme.ts`](./src/shared/theme.ts) to normalize invalid saved modes to `system`. Restoration and user operations are queued in order, keeping the renderer and native appearance synchronized when operations overlap. System theme changes are followed while the selected mode is `system`.

## Packaging and releases

```bash
bun run package  # Create a local application package
bun run make     # Create platform distributables
bun run release  # Build and publish a GitHub draft release through Forge
```

`bun run release` uses the current Forge release command. For local publishing, provide `GITHUB_TOKEN` with permission to create releases in the repository configured in `src/shared/app-config.ts`. The release version comes from `package.json`.

The manual [release workflow](./.github/workflows/release.yaml) builds on Linux, macOS, and Windows and publishes verified assets to a GitHub draft release. It is started with `workflow_dispatch`, with no tag trigger. Review the draft and its artifacts before publishing it.

Optional signing and notarization settings in `forge.config.ts` use these environment variables:

| Platform           | Environment variables                                      |
| ------------------ | ---------------------------------------------------------- |
| Windows signing    | `WINDOWS_CERTIFICATE_FILE`, `WINDOWS_CERTIFICATE_PASSWORD` |
| macOS signing      | `APPLE_SIGN_IDENTITY`                                      |
| macOS notarization | `APPLE_ID`, `APPLE_APP_PASSWORD`, `APPLE_TEAM_ID`          |

Import signing certificates into the build machine and supply the corresponding environment variables. For CI, add certificate import steps and map repository secrets to these variables before the make step; the template does not provision certificates. Never commit certificates, passwords, or other credentials. These configuration hooks do not establish that a build has been signed or notarized successfully.

## Auto updates

Packaged Windows and macOS apps use [update-electron-app](https://github.com/electron/update-electron-app) with public GitHub Releases. Linux has no built-in updater in this template. Private repositories require a different update service; see Electron's [Updating Applications](https://www.electronjs.org/docs/latest/tutorial/updates) guide.

The app checks for updates automatically. Available updates download in the background and, by default, prompt the user to restart and install. Publishing uses [Forge's GitHub publisher](https://www.electronforge.io/config/publishers/github); publish the reviewed draft release to make it available to users.
