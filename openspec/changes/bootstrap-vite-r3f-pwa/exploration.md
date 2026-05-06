# Exploration: bootstrap-vite-r3f-pwa

## Current State

Repositorio recién inicializado. Solo contiene:

- `.git/` — git init -b main, sin commits.
- `openspec/` — config.yaml, specs/, changes/archive/.
- `.atl/skill-registry.md`.

No hay `package.json`, ni código fuente, ni configuración de build/test/lint/format. Stack target ya decidido en sdd-init (Vite + React + R3F + Drei + Zustand + Tailwind + react-i18next + PWA + Vitest + Playwright + ESLint + Prettier + TypeScript).

## Affected Areas

- `package.json` — a crear.
- `tsconfig*.json` — a crear (config base + node + browser).
- `vite.config.ts` — a crear con plugins React + PWA + path aliases.
- `index.html` — entry HTML con meta viewport para SMART Board y tablets.
- `src/main.tsx` — bootstrap React.
- `src/App.tsx` — pantalla landing mínima.
- `src/styles/` — Tailwind base.
- `src/i18n/` — react-i18next config + locales/{es,en}/common.json placeholder.
- `src/store/` — Zustand store skeleton.
- `src/scenes/` — placeholder R3F Canvas (escena vacía con luz ambiental, cámara orbital).
- `tests/` — config Vitest + Playwright + setup.
- `.eslintrc.json`, `.prettierrc`, `.editorconfig`.
- `LICENSE`, `LICENSE-CONTENT`, `CREDITS.md`, `README.md`.
- `.github/workflows/ci.yml` — lint + typecheck + test + build.
- `.gitignore`.
- `public/manifest.webmanifest` + iconos PWA + service worker (vite-plugin-pwa lo genera).

## Approaches

### 1. Scaffold con `pnpm create vite@latest` y luego añadir todo manualmente

- **Pros**: máxima granularidad, entiendes cada dependencia, evitas plantillas con cosas no deseadas.
- **Cons**: ~30-40 archivos a configurar a mano (R3F, PWA, i18n, Tailwind, ESLint, Vitest, Playwright). Lento y propenso a olvidos.
- **Effort**: Alto (2-3 sesiones de scaffolding).

### 2. Plantilla preconstruida (Vite + R3F + PWA boilerplate de la comunidad)

- **Pros**: rápido, plantillas como `react-three/r3f-template` o `vite-pwa-react-ts` ya tienen integración hecha.
- **Cons**: dependes de mantenedor externo, suelen incluir cosas que no quieres (ejemplos, branding), versiones potencialmente desactualizadas, licencias mezcladas.
- **Effort**: Bajo (~30 min) pero deuda técnica posterior alta.

### 3. Scaffold mínimo `pnpm create vite@latest universo-aula --template react-ts` y añadir capas en orden controlado mediante una `tasks.md` SDD

- **Pros**: punto de partida oficial Vite (mantenido), TypeScript de fábrica, cero código de ejemplo "decorativo". Las capas (R3F, PWA, i18n, Tailwind, tests, lint) se añaden en pasos discretos verificables. Cada capa es testeable y revertible.
- **Cons**: requiere disciplina en el orden. La integración Tailwind v4 + Vite ha cambiado recientemente (v4 usa @tailwindcss/vite, no postcss).
- **Effort**: Medio (1-2 sesiones bien planificadas).

### 4. Monorepo (pnpm workspaces) preparando ya separación `apps/web` + `packages/kb-data` + `packages/voice-engine`

- **Pros**: estructura escalable. La KB y el motor de voz pueden ser packages reutilizables; encaja con la arquitectura ya decidida (LLMConnector como módulo independiente).
- **Cons**: complejidad añadida day-1, sobreingeniería para un MVP. La división correcta es difícil de saber antes de tener código real.
- **Effort**: Alto.

## Recommendation

**Approach 3** — scaffold oficial mínimo + capas controladas vía `tasks.md`.

Razones:

1. Punto de partida confiable y mantenido (Vite oficial).
2. Cada capa se añade como tarea discreta, alineado con cómo SDD orquesta el trabajo.
3. Permite que Vitest se instale temprano para activar **Strict TDD Mode** antes de escribir lógica real.
4. Evita la deuda y opacidad de plantillas comunitarias.
5. Pospone la decisión monorepo hasta que el dolor lo justifique (YAGNI). Si más adelante hace falta separar paquetes, la migración a pnpm workspaces es mecánica.

**Versiones verificadas (mayo 2026) — fijar en `package.json` para reproducibilidad**:

| Paquete                             | Versión                     | Notas                                                         |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------- |
| `vite`                              | `^7.x`                      | NO Vite 8 todavía: vite-plugin-pwa no lo soporta oficialmente |
| `react` + `react-dom`               | `^19.2.5`                   |                                                               |
| `@react-three/fiber`                | `^9.6.1`                    | Compatible con React 19.2                                     |
| `@react-three/drei`                 | `^10.7.7`                   |                                                               |
| `three`                             | última compatible con R3F 9 |                                                               |
| `tailwindcss` + `@tailwindcss/vite` | `^4.x`                      | Plugin Vite oficial, NO PostCSS                               |
| `vite-plugin-pwa`                   | `^1.2.0`                    |                                                               |
| `zustand`                           | `^5.0.13`                   | Stores con prefix `use` para React Compiler                   |
| `i18next` + `react-i18next`         | `^17.0.6`                   |                                                               |
| `vitest` + `@vitest/coverage-v8`    | `^4.1.5`                    |                                                               |
| `@playwright/test`                  | `^1.59.1`                   |                                                               |
| `typescript`                        | `^6.0.3`                    | Strict por defecto                                            |
| `eslint` + `@typescript-eslint/*`   | últimas estables            |                                                               |
| `prettier`                          | última                      |                                                               |
| `@huggingface/transformers`         | `^4.2.0` (post-MVP)         | WebGPU + WASM fallback, no en este change                     |

- **Package manager**: `pnpm` 9.x.
- **Node**: 22 LTS (22.18.0+) — tiene ejecución TypeScript nativa.
- **TypeScript**: `strict: true` (TS 6 ya lo trae por defecto).
- **Estructura `src/`**:
  ```
  src/
    app/        ← App.tsx, providers (i18n, store)
    scenes/     ← R3F canvases por nivel/tema
    components/ ← UI Tailwind (atomic-ish: ui/ + features/)
    store/      ← Zustand stores
    i18n/       ← config + locales/{lang}/{ns}.json
    voice/      ← (futuro) STT, intent, TTS, LLMConnector interface
    kb/         ← (futuro) knowledge base loader
    lib/        ← utilidades puras
    styles/     ← tailwind.css base
    types/      ← tipos compartidos
  ```
- **Tests**: `tests/unit/` (Vitest, junto al código permitido también via `*.test.ts`) + `tests/e2e/` (Playwright).
- **CI**: GitHub Actions con job único (install → typecheck → lint → test → build).

## Risks

- **Vite 8** existe pero `vite-plugin-pwa@1.2.0` aún no lo declara en peerDeps. Decidido: usar Vite 7 hasta que el plugin oficialice soporte v8. Monitor: https://github.com/vite-pwa/vite-plugin-pwa/issues/918
- **SMART Board RX (Android AM50)** con Chromium embebido viejo puede no tener WebGPU. Mitigación ya prevista: WASM fallback para Whisper + Web Speech API como segundo fallback.
- **vite-plugin-pwa + R3F**: el bundle de Three.js es grande (~500KB gzipped). El service worker debe cachear correctamente assets WASM (Whisper) y modelos (Whisper-tiny ~75MB) sin reventar el límite por defecto de Workbox (2MiB). Hay que configurar `maximumFileSizeToCacheInBytes` desde el inicio.
- **transformers.js + Vite**: requiere headers COOP/COEP para WebGPU/SharedArrayBuffer. Esto afecta a la elección de hosting estático más adelante (Netlify, Cloudflare Pages, GitHub Pages — no todos permiten setear esos headers). NO bloquea el bootstrap pero conviene mencionarlo.
- **Locale fallback de react-i18next** con 28 idiomas eventuales: configurar bien el `fallbackLng` en cadena (`ca-ES-valencia` → `ca` → `es` → `en`) para evitar texto en blanco.
- **PWA + SMART Board**: algunos dispositivos Android embebidos no soportan installation prompts. Hay que asegurar que la app funciona como web normal aunque no se "instale".
- **Strict TDD Mode**: el usuario tiene preferencia activada, pero hasta que Vitest esté instalado no aplica. La task de instalar Vitest debe ir muy al principio para reactivar TDD cuanto antes.

## Ready for Proposal

**Sí**. El alcance está claro: un change atómico de scaffolding que entrega un repo deployable con:

- Build Vite que compila a `dist/`.
- React + TypeScript strict.
- Tailwind con un componente "Hello Universo Aula" estilizado.
- R3F Canvas vacío con cámara y luz (sin contenido todavía).
- i18n con `es` y `en` en string demo ("Hola universo" / "Hello universe").
- Zustand store mínimo (ej: nivel pedagógico actual).
- PWA installable con manifest e iconos placeholder.
- Vitest con un test trivial pasando (activa Strict TDD).
- Playwright con un E2E "página carga sin errores".
- ESLint + Prettier configurados y CI pasando en GitHub Actions.
- Licencias y CREDITS.

**El orquestador debe preguntar al usuario**:

1. Confirmación de **pnpm** como package manager (vs npm/yarn/bun).
2. Confirmación de **Tailwind v4** vs v3 (impacta config inicial).
3. **Repositorio remoto**: ¿GitHub? ¿Bajo qué cuenta/organización? ¿Público desde el día 1 o privado hasta MVP?
4. **CI provider**: ¿GitHub Actions? (asumido).
5. **Iconos PWA**: ¿hay branding/logo ya definido o usamos placeholder hasta tener identidad visual?
