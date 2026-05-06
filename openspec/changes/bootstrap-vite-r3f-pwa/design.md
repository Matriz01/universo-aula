# Design: Bootstrap Vite + R3F + PWA

## Enfoque técnico

Scaffold mínimo oficial (`pnpm create vite@latest --template react-ts`) y composición incremental de capas verificables. Cada capa se añade en un orden que permite validar la anterior antes de seguir: tooling y testing primero (para activar Strict TDD lo antes posible), luego presentación (Tailwind), runtime (i18n + state), 3D, PWA, y finalmente CI/CD. El resultado es un repo deployable a Cloudflare Pages con Lighthouse PWA ≥ 90 y CI verde, sin contenido pedagógico todavía.

## Decisiones de arquitectura

### Decisión: Estructura `src/` modular preparada para crecimiento

**Elección**: carpetas `app/`, `scenes/`, `components/`, `store/`, `i18n/`, `lib/`, `styles/`, `types/` desde día 1; `voice/` y `kb/` vacías con `README.md` placeholder.
**Alternativas consideradas**: monorepo pnpm workspaces (descartado por YAGNI); `src/` plano (descartado por refactor garantizado).
**Rationale**: el contrato arquitectónico (LLMConnector, KB, voz) ya está decidido aunque su implementación sea posterior. Reservar las carpetas evita renombrados masivos.

### Decisión: Path aliases `@/*` apuntando a `src/*`

**Elección**: alias en `tsconfig.json` y `vite.config.ts` (`vite-tsconfig-paths`).
**Alternativas**: imports relativos largos (`../../../`).
**Rationale**: legibilidad y refactor seguro. Imprescindible con la estructura modular.

### Decisión: Tailwind 4 vía `@tailwindcss/vite`, no PostCSS

**Elección**: plugin oficial de Vite. CSS único `src/styles/tailwind.css` con `@import "tailwindcss"`.
**Alternativas**: Tailwind 3 + PostCSS (legacy), CSS Modules (no escalable a 28 locales con utilidades).
**Rationale**: pipeline simplificado, sin `postcss.config.js`. Compatible con Vite 7 oficialmente.

### Decisión: Vitest 4 + Playwright 1.59 desde el inicio

**Elección**: ambos instalados en la primera fase de tooling, antes de cualquier código de producto. Reactiva Strict TDD inmediatamente.
**Alternativas**: añadir tests al final (descartado: contradice TDD del usuario).
**Rationale**: el config.yaml indica `strict_tdd: false` solo porque no hay runner. Instalar Vitest debe ser una de las primeras tasks, y al cerrarse este change el flag se actualiza a `true` (en archive).

### Decisión: Headers COOP/COEP en `public/_headers` desde día 1

**Elección**: configurar `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp` ya, aunque el MVP no use SharedArrayBuffer.
**Alternativas**: añadirlos cuando llegue el change de voz (Whisper + WebGPU).
**Rationale**: validar el pipeline de headers en Cloudflare Pages cuesta lo mismo ahora que después, y evita un debug futuro acoplado al de voz. CSP estricta complementa.

### Decisión: Service Worker con `maximumFileSizeToCacheInBytes: 5 MB` provisional

**Elección**: límite Workbox a 5 MB en bootstrap (suficiente para Three + Drei + JS app).
**Alternativas**: dejar default (2 MiB) — se rompe al añadir Three.
**Rationale**: modelos Whisper (75 MB) NO se cachean vía SW; se sirven via HuggingFace CDN o se gestionan con `Cache API` manual en el change de voz.

### Decisión: GitHub Actions con job único secuencial

**Elección**: install → typecheck → lint → test:unit → build → test:e2e (Playwright sobre `dist/`).
**Alternativas**: matriz de jobs paralelos (overkill para un repo sin volumen aún).
**Rationale**: simplicidad. Migrable a paralelo cuando los tiempos lo justifiquen.

## Flujo de bootstrap (orden de capas)

```
1. scaffold      → pnpm create vite@latest react-ts (capability: app-shell base)
2. tooling       → ESLint + Prettier + EditorConfig + commitlint + husky + lint-staged
3. testing       → Vitest + Playwright + setup + 1 test verde cada uno  ← ACTIVA Strict TDD
4. estilos       → Tailwind 4 + design tokens + reset
5. i18n          → react-i18next + locales/{es,en}/common.json + fallback chain
6. state         → Zustand store skeleton (useAppStore con currentLevel placeholder)
7. 3D            → R3F Canvas + Drei OrbitControls + escena vacía con luz ambiental
8. PWA           → manifest + iconos placeholder + vite-plugin-pwa + _headers + CSP
9. legal/docs    → LICENSE + LICENSE-CONTENT + CREDITS.md + README.md (ES/EN)
10. CI           → .github/workflows/ci.yml
11. deploy       → Cloudflare Pages connect + verificación URL pública
```

## Cambios en archivos

| Archivo                                | Acción | Descripción                                                                                             |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `package.json`                         | Crear  | Deps fijadas (versiones de exploración), scripts: dev/build/preview/test/test:e2e/lint/format/typecheck |
| `pnpm-lock.yaml`                       | Crear  | Lockfile reproducible                                                                                   |
| `tsconfig.json`                        | Crear  | TS 6 strict, paths `@/*` → `src/*`                                                                      |
| `tsconfig.node.json`                   | Crear  | Config para `vite.config.ts`                                                                            |
| `vite.config.ts`                       | Crear  | Plugins: react, tailwindcss, VitePWA, tsconfig-paths                                                    |
| `index.html`                           | Crear  | Meta viewport SMART Board + tablet, lang dinámico                                                       |
| `src/main.tsx`                         | Crear  | Bootstrap React 19 + providers                                                                          |
| `src/app/App.tsx`                      | Crear  | Landing "Hola Universo Aula"                                                                            |
| `src/app/providers.tsx`                | Crear  | I18nextProvider + ErrorBoundary                                                                         |
| `src/scenes/EmptyScene.tsx`            | Crear  | Canvas R3F + cámara + luz                                                                               |
| `src/store/useAppStore.ts`             | Crear  | Zustand store skeleton                                                                                  |
| `src/i18n/index.ts`                    | Crear  | Config react-i18next + fallback chain                                                                   |
| `src/i18n/locales/{es,en}/common.json` | Crear  | Strings demo                                                                                            |
| `src/styles/tailwind.css`              | Crear  | `@import "tailwindcss"` + tokens                                                                        |
| `src/types/index.ts`                   | Crear  | Tipos compartidos (PedagogicalLevel, etc.)                                                              |
| `src/voice/README.md`                  | Crear  | Placeholder documentado                                                                                 |
| `src/kb/README.md`                     | Crear  | Placeholder documentado                                                                                 |
| `tests/unit/App.test.tsx`              | Crear  | Test trivial Vitest                                                                                     |
| `tests/e2e/smoke.spec.ts`              | Crear  | Smoke E2E Playwright                                                                                    |
| `vitest.config.ts`                     | Crear  | jsdom, setup file, alias                                                                                |
| `playwright.config.ts`                 | Crear  | webServer `pnpm preview`, baseURL                                                                       |
| `.eslintrc.cjs`                        | Crear  | TS + React + a11y                                                                                       |
| `.prettierrc`                          | Crear  | Config compartida                                                                                       |
| `.editorconfig`                        | Crear  | LF, UTF-8, indent 2                                                                                     |
| `commitlint.config.cjs`                | Crear  | Conventional commits                                                                                    |
| `.husky/{pre-commit,commit-msg}`       | Crear  | Hooks                                                                                                   |
| `public/manifest.webmanifest`          | Crear  | PWA manifest                                                                                            |
| `public/icons/icon-{192,512}.png`      | Crear  | Iconos placeholder                                                                                      |
| `public/_headers`                      | Crear  | COOP/COEP/CSP                                                                                           |
| `public/robots.txt`                    | Crear  | allow all                                                                                               |
| `LICENSE`                              | Crear  | AGPL-3.0-or-later                                                                                       |
| `LICENSE-CONTENT`                      | Crear  | CC BY-SA 4.0                                                                                            |
| `CREDITS.md`                           | Crear  | Atribuciones                                                                                            |
| `README.md`                            | Crear  | ES + EN                                                                                                 |
| `.github/workflows/ci.yml`             | Crear  | Pipeline CI                                                                                             |
| `.gitignore`                           | Crear  | node_modules, dist, .env\*, coverage, playwright-report                                                 |
| `.gitattributes`                       | Crear  | LF normalization                                                                                        |

## Interfaces / contratos

**Zustand store skeleton** (`src/store/useAppStore.ts`):

```ts
type PedagogicalLevel = 'explorer' | 'apprentice' | 'researcher';
interface AppState {
  level: PedagogicalLevel;
  locale: string;
  setLevel: (l: PedagogicalLevel) => void;
  setLocale: (l: string) => void;
}
```

**LLMConnector placeholder** (`src/voice/README.md`): documenta interfaz futura con métodos `transcribe`, `embed`, `match`, `speak` — no implementación.

**Manifest PWA mínimo**: `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, `icons` (192/512 maskable + any).

**`public/_headers` (Cloudflare Pages)**:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://huggingface.co https://*.hf.co; worker-src 'self' blob:; manifest-src 'self'
```

## Estrategia de testing

| Capa        | Qué se testea                                                                 | Cómo                                            |
| ----------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| Unit        | Render de `App`, store Zustand (set/get level y locale), helper i18n fallback | Vitest + jsdom                                  |
| Integration | `App` con providers (i18n cambia textos al alternar `es`/`en`)                | Vitest + @testing-library/react                 |
| E2E         | Página carga sin errores de consola, manifest accesible, SW registra          | Playwright sobre `pnpm preview` (build de prod) |

Cobertura objetivo bootstrap: presencia de tests verdes en cada capa, no porcentaje. La meta de coverage real arranca en changes posteriores.

## Despliegue / rollout

- **Provider**: Cloudflare Pages (free tier suficiente para MVP).
- **Integración**: GitHub App de Cloudflare conecta el repo `Matriz01/universo-aula`. Build automático en push a `main` y preview por PR.
- **Build cmd**: `pnpm install --frozen-lockfile && pnpm build`.
- **Output dir**: `dist`.
- **Node**: 22 LTS (variable de entorno `NODE_VERSION=22`).
- **Env vars**: ninguna en bootstrap (no hay backend ni API keys).
- **Headers**: vía `public/_headers` (Cloudflare lo respeta nativamente).
- **Preview por PR**: activado por defecto; cada PR genera URL `*.pages.dev`.
- **Rollback**: `git revert` en `main` redespliega versión anterior automáticamente.
- **Verificación post-deploy**: smoke manual (URL responde, headers presentes, SW registrado, cambio de idioma funciona).

## Open Questions

- [ ] ¿Configurar Dependabot o Renovate para deps en este change o en uno posterior? (recomendado: posterior, evita ruido).
- [ ] ¿Tag de release `v0.0.1-bootstrap` al cerrar este change? (recomendado: sí, marca hito reproducible).
- [ ] ¿Branch protection en `main` desde día 1 (require PR + checks)? (recomendado: sí, configurar tras primer merge).
- [ ] Domain custom Cloudflare Pages: ¿reservar `universoaula.org` o similar ya, o usar `*.pages.dev` durante MVP?
