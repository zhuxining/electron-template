# electron-template

Electron in all its glory. Everything you will need to develop your beautiful desktop application.

![Demo GIF](https://github.com/zhuxining/electron-template/blob/main/images/demo.png)

## Libs and tools

To develop a Electron app, you probably will need some UI, test, formatter, style or other kind of library or framework, so let me install and configure some of them to you.

### Core 🏍️

- [Electron 43](https://www.electronjs.org)
- [Vite Plus](https://viteplus.dev) (Vite, test runner, linting, and formatting)

### DX 🛠️

- [TypeScript 7](https://www.typescriptlang.org)
- [oRPC](https://orpc.unnoq.com)
- [Oxlint and Oxfmt via Vite Plus](https://viteplus.dev)
- [Zod 4](https://zod.dev)
- [React Query (TanStack)](https://react-query.tanstack.com)

### UI 🎨

- [React 19.2](https://reactjs.org)
- [Tailwind 4.3](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Geist](https://vercel.com/font) as default font
- [i18next](https://www.i18next.com)
- [TanStack Router](https://tanstack.com/router) (with file based routing)
- [Lucide](https://lucide.dev)

### Test 🧪

- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### Packing and distribution 📦

- [Electron Forge](https://www.electronforge.io)

### CI/CD 🚀

- Pre-configured [GitHub Actions workflow](https://github.com/zhuxining/electron-template/blob/main/.github/workflows/playwright.yml), for test with Playwright

### Project preferences 🎯

- Use Context isolation
- [React Compiler](https://react.dev/learn/react-compiler) is enabled through `oxc-transform-react`, without Babel.
- Window chrome uses macOS native traffic lights and Windows native window controls overlay.
- Geist as default font
- Some default styles was applied, check the [`styles`](https://github.com/zhuxining/electron-template/tree/main/src/styles) directory
- Electron's built-in DevTools are available in development. React DevTools are not installed automatically.

## How to use

Requires Node.js 22.17.0 or newer and Bun. Main process changes automatically restart the app during development.

1. Clone this repository

```bash
git clone https://github.com/zhuxining/electron-template.git
```

Or use it as a template on GitHub

2. Install dependencies

```bash
bun install
```

3. Run the app

```bash
bun run start
```

Now you can go directly to `/src/routes/index.tsx` and modify the app as you want.

> You can also delete the `/src/routes/second.tsx` file if you don't want a second page.

## Development checks

Vite Plus configures linting, formatting, and unit tests in [`vite.config.ts`](./vite.config.ts). Electron Forge uses the separate main, preload, and renderer Vite configs.

```bash
bun run check       # Check formatting, lint, and types
bun run fix         # Apply formatting and lint fixes
bun run typecheck   # Check TypeScript only
bun run test        # Run unit tests once
bun run test:watch  # Watch unit tests
```

## Title bar configuration

`src/config/window.ts` centralizes platform title bar styles, native control colors, heights, and fallback control widths. The main process reads its window options, and `BaseLayout` reads its layout parameters. The component remains in `src/components`, layout in `src/layouts`, and styles in `src/styles/global.css`. `BaseLayout` owns the shared platform and title bar CSS variables.

macOS uses `hiddenInset` with traffic lights vertically centered using the shared title bar height. Windows uses native window controls overlay, with CSS environment variables reserving the actual control area. Other platforms retain their native title bar.

Each column has its own draggable header and a content area that fills the remaining height. The column dividers extend from the top to the bottom of the window in normal, maximized, and full-screen windows. `DragWindowRegion` accepts `leading`, `title`, and `toolbar` slots. Empty space is draggable; the toolbar and common interactive elements are excluded from dragging. Use `window-no-drag` for custom interactive content. Native controls retain their system behavior.

`BaseLayout` exposes `title`, `toolbar`, `leftPanel`, `rightPanel`, and `children` slots. When a panel collapses, its button moves to the center column header so the panel can be reopened. Both panels resize independently and restore their previous width when expanded. Omit a panel slot to remove that panel and its button. The root route contains example panel content using the Sidebar primitives.

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

The app observes its own native window fullscreen state through an oRPC event stream. Entering fullscreen removes the traffic light inset; leaving fullscreen restores it. Subscriptions are canceled when the layout unmounts. Windows control colors follow theme changes in the main process.

Validate native dragging, double-click preferences, Windows snap layouts, display scaling, and full-screen transitions on each target OS before release.

## Auto update

> [!WARNING]
> This feature only work in open-source repositories in GitHub, if you need to use in a private repository, you need to setup a custom update server. Check the [Updating Applications](https://www.electronjs.org/docs/latest/tutorial/updates) section in the Electron documentation for more details.

The auto update uses GitHub Releases as source for the updates. The `release` script will automatically create a new release with the version specified in your `package.json` file. You can run locally the `release` script to create a new release, but you need to set the `GITHUB_TOKEN` environment variable with a GitHub Personal Access Token that has permission to create releases in your repository.

You can also use the GitHub Actions workflow to automatically create a new release when you push a new tag to the repository. The workflow need to be triggered manually, but you can modify to fit your needs. Also, the release is created as draft by default, so you can review and set a proper description before publish.

> Check the [`.github/workflows/publish.yml`](https://github.com/zhuxining/electron-template/blob/main/.github/workflows/publish.yaml) file for more details.

When you open the app, it will check for updates automatically. If an update is available, it will download and install the update, after that, it will restart the app to apply the update. This ensure that your users always have the latest version of your app.

The auto update is implemented using [update-electron-app](https://github.com/electron/update-electron-app) to check the updates and apply them. For the publishing, it is using the [Electron Forge's GitHub publisher](https://www.electronforge.io/config/publishers/github).

## Documentation

Check out the full documentation [here](https://docs.zhuxining.dev/electron-template).

## Used by

- [yaste](https://github.com/zhuxining/yaste) - yaste (Yet another super ₛᵢₘₚₗₑ text editor) is a text editor, that can be used as an alternative to the native text editor of your SO, maybe.
- [eletric-drizzle](https://github.com/zhuxining/electric-drizzle) - shadcn-ui and Drizzle ORM with Electron.
- [Wordle Game](https://github.com/masonyekta/wordle-game) - A Wordle game which features interactive gameplay, cross-platform compatibility, and integration with a custom Wordle API for word validation and letter correctness.
- [Mehr 🌟](https://github.com/xmannii/MehrLocalChat) - A modern, elegant local AI chatbot application using Electron, React, shadcn/ui, and Ollama.

> Does you've used this template in your project? Add it here and open a PR.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/zhuxining/electron-template/blob/main/LICENSE) file for details.
