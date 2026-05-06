# Tasks: Bootstrap Vite + R3F + PWA

## Phase 1: Foundation (scaffold + tooling)

- [x] 1.1 Crear repo con `pnpm create vite@latest . --template react-ts` en directorio existente.
- [x] 1.2 Fijar versiones en `package.json` según tabla del proposal (Vite 7, React 19.2, TS 6, etc.).
- [x] 1.3 Configurar `tsconfig.json` strict + paths `@/*` → `src/*`.
- [x] 1.4 Crear `tsconfig.node.json` para `vite.config.ts`.
- [x] 1.5 Instalar `vite-tsconfig-paths` y enchufarlo en `vite.config.ts`.
- [x] 1.6 Añadir `.editorconfig` (LF, UTF-8, indent 2).
- [x] 1.7 Configurar `.gitignore` y `.gitattributes` (LF normalization, lockfile binario excluido).
- [x] 1.8 Instalar y configurar ESLint (TS + React + jsx-a11y) y Prettier; resolver conflictos vía `eslint-config-prettier`.
- [x] 1.9 Instalar husky + lint-staged + commitlint con `@commitlint/config-conventional`. Hooks `pre-commit` (lint-staged) y `commit-msg` (commitlint).
- [x] 1.10 Añadir scripts `dev`, `build`, `preview`, `lint`, `format`, `typecheck` en `package.json`.

## Phase 2: Testing infra (activa Strict TDD)

- [x] 2.1 Instalar Vitest 4 + `@vitest/coverage-v8` + `@testing-library/react` + jsdom. Crear `vitest.config.ts`.
- [x] 2.2 Crear `tests/setup.ts` con `@testing-library/jest-dom`.
- [x] 2.3 Escribir `tests/unit/App.test.tsx` que verifique render del componente raíz (verde mínimo).
- [x] 2.4 Instalar Playwright 1.59 + `@playwright/test`. Ejecutar `pnpm playwright install --with-deps chromium`.
- [x] 2.5 Crear `playwright.config.ts` con `webServer: pnpm preview`, baseURL.
- [x] 2.6 Escribir `tests/e2e/smoke.spec.ts`: la página carga sin errores de consola.
- [x] 2.7 Añadir scripts `test`, `test:unit`, `test:e2e`, `test:coverage`.
- [x] 2.8 Cambiar `openspec/config.yaml` → `strict_tdd: true` (TDD activo a partir de aquí).

## Phase 3: Estilos + i18n + state

- [x] 3.1 Instalar `tailwindcss@4` + `@tailwindcss/vite`. Añadir plugin a `vite.config.ts`.
- [x] 3.2 Crear `src/styles/tailwind.css` con `@import "tailwindcss"` + tokens base + reset accesibilidad.
- [x] 3.3 Importar `tailwind.css` desde `src/main.tsx`.
- [x] 3.4 Test (RED): `i18n.fallbackChain` para `ca-ES-valencia` devuelve `['ca','es','en']`.
- [x] 3.5 Implementar `src/i18n/index.ts` con react-i18next, default `es`, fallback chain. (GREEN).
- [x] 3.6 Crear `src/i18n/locales/{es,en}/common.json` con strings demo (`appName`, `tagline`).
- [x] 3.7 Test (RED): `useAppStore.setLocale('en')` actualiza `locale`.
- [x] 3.8 Crear `src/store/useAppStore.ts` (Zustand 5, prefix `use*`, selectors `useLevel`, `useLocale`). (GREEN).
- [x] 3.9 Crear `src/types/index.ts` con `PedagogicalLevel`.

## Phase 4: 3D + PWA + app shell

- [x] 4.1 Instalar `three`, `@react-three/fiber@9`, `@react-three/drei@10`.
- [x] 4.2 Crear `src/scenes/EmptyScene.tsx` con `<Canvas>` + cámara + `<ambientLight>` + `<OrbitControls>`.
- [x] 4.3 Crear `src/app/providers.tsx` con `I18nextProvider` + `ErrorBoundary` propio.
- [x] 4.4 Crear `src/app/App.tsx` con título traducido + selector `es`/`en` + montar `EmptyScene`.
- [x] 4.5 Conectar todo en `src/main.tsx` (`<Providers><App/></Providers>`).
- [x] 4.6 Crear `src/voice/README.md` y `src/kb/README.md` placeholders documentados.
- [x] 4.7 Instalar `vite-plugin-pwa@1.2`. Configurar en `vite.config.ts` con `registerType: autoUpdate`, `maximumFileSizeToCacheInBytes: 5_242_880`.
- [x] 4.8 Crear `public/manifest.webmanifest` (name, short_name, start_url, display, theme_color, icons).
- [x] 4.9 Generar iconos placeholder 192/512/maskable a `public/icons/` (Lucide o SVG propio exportado).
- [x] 4.10 Crear `public/_headers` con COOP/COEP/CSP/X-Content-Type-Options/Referrer-Policy (solo prod).
- [x] 4.11 Crear `public/robots.txt` (allow all).
- [x] 4.12 Test E2E: manifest accesible vía `/manifest.webmanifest`, SW registra en build de prod.

## Phase 5: Legal + docs

- [x] 5.1 Crear `LICENSE` (AGPL-3.0-or-later, texto oficial completo).
- [x] 5.2 Crear `LICENSE-CONTENT` (CC BY-SA 4.0, texto oficial completo).
- [x] 5.3 Crear `CREDITS.md` con secciones: código, contenido, datos (NASA/ESA/IAU/Solar System Scope), iconos.
- [x] 5.4 Crear `README.md` ES + EN: descripción, stack, scripts, licencias, link a Matriz01.
- [x] 5.5 Añadir footer en `App.tsx` con enlaces a LICENSE y CREDITS.

## Phase 6: CI + Repo + Deploy

- [x] 6.1 Crear `.github/workflows/ci.yml`: install → typecheck → lint → test:unit → build → test:e2e.
- [x] 6.2 Crear `.github/dependabot.yml`: security alerts inmediatos, version updates semanales agrupados.
- [x] 6.3 Crear repo público `Matriz01/universo-aula` en GitHub. Push inicial.
- [x] 6.4 Activar branch protection en `main` (require PR + status checks).
- [x] 6.5 Conectar repo a Cloudflare Workers Static Assets (build cmd `pnpm build`, output `dist`, defaults Node 22 + pnpm 10).
- [x] 6.6 Verificar deploy: URL workers.dev carga, headers COOP/COEP/CSP presentes, manifest accesible, switch ES/EN funciona. Lighthouse PWA pendiente de ejecución manual.
- [x] 6.7 Tag `v0.0.1-bootstrap` en `main` tras verificación.

> Desviaciones: Cloudflare Pages → Workers Static Assets (CF empuja proyectos nuevos a Workers). URL final: https://universo-aula.pedrovicente.workers.dev/. Iconos SVG en lugar de PNG.
