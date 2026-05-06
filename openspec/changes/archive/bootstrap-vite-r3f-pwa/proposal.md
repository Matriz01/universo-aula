# Proposal: Bootstrap Vite + R3F + PWA scaffolding

## Intent

El repo `universo-aula` está vacío. Antes de poder construir features (sistema solar 3D, voz, niveles pedagógicos, i18n completa) necesitamos un esqueleto deployable con tooling, tests, lint y CI/CD funcionando. Este change deja el repo en estado "Hello Universo" desplegado en Cloudflare Pages, con todas las capas instaladas y verificadas.

## Scope

### In Scope

- Scaffold base con `pnpm create vite@latest --template react-ts`, fijado a Vite 7.
- Stack instalado y funcionando: React 19.2, R3F 9 + Drei 10, Zustand 5, Tailwind 4 (`@tailwindcss/vite`), react-i18next 17, vite-plugin-pwa 1.2, TypeScript 6 strict.
- Estructura `src/`: `app/`, `scenes/`, `components/`, `store/`, `i18n/`, `lib/`, `styles/`, `types/`. Carpetas `voice/` y `kb/` creadas vacías como placeholders documentados.
- i18n con namespaces `common` para `es` y `en`, fallback chain configurada.
- R3F Canvas mínimo con cámara orbital + luz ambiental (sin contenido).
- PWA installable: manifest, iconos placeholder libres (Lucide o SVG propio), service worker con `maximumFileSizeToCacheInBytes` configurado.
- Vitest 4 + Playwright 1.59 con un test unitario y un E2E pasando.
- ESLint + Prettier + EditorConfig + lint-staged + husky para commits.
- Conventional commits enforcement vía commitlint.
- GitHub Actions CI: install → typecheck → lint → test → build (PR + push a main).
- Cloudflare Pages deploy automático en push a `main`. Headers COOP/COEP en `public/_headers`. CSP estricta.
- `LICENSE` (AGPL-3.0-or-later), `LICENSE-CONTENT` (CC BY-SA 4.0), `CREDITS.md`, `README.md` (ES + EN), `.gitignore`, `.gitattributes`.
- Repo público en GitHub bajo organización `Matriz01`.

### Out of Scope

- Contenido pedagógico real (KB, modelos 3D de planetas, texturas).
- Voz (Whisper, intent matching, TTS) — change separado posterior.
- Niveles pedagógicos diferenciados — change separado.
- Locales adicionales (más allá de ES + EN).
- Branding visual definitivo (iconos placeholder hasta que exista).

## Capabilities

### New Capabilities

- `app-shell`: PWA shell, providers (i18n, store), error boundary, manifest, service worker, headers de seguridad.
- `i18n-foundation`: configuración react-i18next, fallback chain, namespaces, locales `es` y `en` mínimos.
- `ui-styling`: Tailwind 4 + design tokens base + reset CSS + utilidades de accesibilidad.
- `state-management`: convenciones Zustand (prefix `use`, selectors), store skeleton.
- `3d-rendering`: wrapper R3F Canvas, escena base con cámara y luz, integración Drei.
- `tooling-quality`: ESLint + Prettier + commitlint + husky + lint-staged + EditorConfig + tsc strict.
- `testing-foundation`: Vitest unit + Playwright E2E + setup compartido + ejemplo verde de cada uno.
- `deployment-target`: Cloudflare Pages + headers COOP/COEP/CSP + GitHub Actions CI.

### Modified Capabilities

None — proyecto nuevo.

## Approach

`pnpm create vite@latest` como base oficial. Capas añadidas en orden controlado vía `tasks.md`: tooling → testing → estilos → i18n → state → 3D → PWA → deploy. Cada capa verificable de forma aislada. CI activo desde el primer push.

## Affected Areas

| Area                                  | Impact | Description                                                     |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| repo root                             | New    | package.json, tsconfig, vite.config, lint/format configs, hooks |
| `src/`                                | New    | Estructura completa de carpetas y entrypoints                   |
| `tests/`                              | New    | Configs y tests demo Vitest + Playwright                        |
| `public/`                             | New    | manifest, iconos, `_headers`, robots                            |
| `.github/workflows/`                  | New    | CI pipeline                                                     |
| `LICENSE*`, `README.md`, `CREDITS.md` | New    | Legal y docs base                                               |

## Risks

| Risk                                                          | Likelihood | Mitigation                                                             |
| ------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Tailwind 4 + vite-plugin-pwa: incompatibilidad sutil en build | Baja       | Versiones fijadas; test e2e en CI valida build de producción           |
| Cloudflare Pages 25 MB/file limit                             | Baja       | Modelos servidos desde HuggingFace CDN, no desde el bucket             |
| WebGPU no disponible en SMART Board RX antiguo                | Media      | Fallback WASM (a implementar en change voz) — bootstrap no lo requiere |
| React 19 + Zustand React Compiler warnings                    | Baja       | Convención `use*` desde día 1, documentada en `state-management` spec  |

## Rollback Plan

Reversible al 100%: este change crea un repo desde cero. Rollback = `git reset --hard` al commit inicial vacío, o eliminar el repo de Matriz01 si se decide abortar el proyecto. Cloudflare Pages se desconecta en un click.

## Dependencies

- Cuenta GitHub bajo organización `Matriz01` con permisos para crear repo público.
- Cuenta Cloudflare con acceso a Pages.
- Node 22 LTS y pnpm 9 instalados localmente.

## Success Criteria

- [ ] `pnpm install && pnpm test && pnpm build` pasa en local sin errores ni warnings de TS.
- [ ] CI verde en GitHub Actions en push a main.
- [ ] Deploy automático en Cloudflare Pages accesible vía URL pública.
- [ ] Lighthouse PWA score ≥ 90 en build de producción.
- [ ] La página muestra texto traducido al cambiar idioma (`es` ↔ `en`).
- [ ] El Canvas R3F renderiza sin errores en consola.
- [ ] Service worker registra y cachea assets.
- [ ] Headers COOP/COEP presentes en respuesta HTTP del deploy.
- [ ] LICENSE y CREDITS visibles en repo y en `/about` o footer.
