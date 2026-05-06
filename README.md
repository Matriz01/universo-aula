# Universo Aula

[![Licencia código](https://img.shields.io/badge/código-AGPL--3.0--or--later-blue)](LICENSE)
[![Licencia contenido](https://img.shields.io/badge/contenido-CC%20BY--SA%204.0-green)](LICENSE-CONTENT)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)

**Aplicación web educativa interactiva 3D del universo**, diseñada para su uso en SMART Board, tablets y navegadores modernos.

## Descripción

Universo Aula es una Progressive Web App (PWA) que permite explorar el sistema solar y objetos astronómicos en un entorno tridimensional interactivo. Orientada a entornos educativos de primaria y secundaria.

## Stack tecnológico

| Capa     | Tecnología                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Bundler  | [Vite 7](https://vitejs.dev/)                                                                             |
| UI       | [React 19](https://react.dev/)                                                                            |
| 3D       | [React Three Fiber 9](https://docs.pmnd.rs/react-three-fiber) + [Drei 10](https://github.com/pmndrs/drei) |
| Estado   | [Zustand 5](https://github.com/pmndrs/zustand)                                                            |
| Estilos  | [Tailwind CSS 4](https://tailwindcss.com/)                                                                |
| i18n     | [react-i18next](https://react.i18next.com/)                                                               |
| PWA      | [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)                                            |
| Lenguaje | TypeScript 6                                                                                              |

## Requisitos

- **Node.js** ≥ 22
- **pnpm** ≥ 9

## Scripts

```bash
pnpm dev           # Servidor de desarrollo
pnpm build         # Compilación para producción
pnpm preview       # Vista previa del build
pnpm test:unit     # Tests unitarios con Vitest
pnpm test:e2e      # Tests end-to-end con Playwright
pnpm typecheck     # Comprobación de tipos con tsc
pnpm lint          # Linting con ESLint
pnpm format        # Formateo con Prettier
```

## Licencias

- **Código fuente:** [AGPL-3.0-or-later](LICENSE)
- **Contenido educativo:** [CC BY-SA 4.0](LICENSE-CONTENT)
- **Atribuciones:** ver [CREDITS.md](CREDITS.md)

## Mantenedor

[Matriz01](https://github.com/Matriz01)

---

# Universo Aula (English)

[![Code License](https://img.shields.io/badge/code-AGPL--3.0--or--later-blue)](LICENSE)
[![Content License](https://img.shields.io/badge/content-CC%20BY--SA%204.0-green)](LICENSE-CONTENT)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)

**Interactive 3D educational web app about the universe**, designed for use on SMART Boards, tablets, and modern browsers.

## Description

Universo Aula is a Progressive Web App (PWA) that lets students explore the solar system and astronomical objects in an interactive 3D environment. Targeted at primary and secondary education settings.

## Tech Stack

| Layer    | Technology                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Bundler  | [Vite 7](https://vitejs.dev/)                                                                             |
| UI       | [React 19](https://react.dev/)                                                                            |
| 3D       | [React Three Fiber 9](https://docs.pmnd.rs/react-three-fiber) + [Drei 10](https://github.com/pmndrs/drei) |
| State    | [Zustand 5](https://github.com/pmndrs/zustand)                                                            |
| Styles   | [Tailwind CSS 4](https://tailwindcss.com/)                                                                |
| i18n     | [react-i18next](https://react.i18next.com/)                                                               |
| PWA      | [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)                                            |
| Language | TypeScript 6                                                                                              |

## Requirements

- **Node.js** ≥ 22
- **pnpm** ≥ 9

## Scripts

```bash
pnpm dev           # Development server
pnpm build         # Production build
pnpm preview       # Preview production build
pnpm test:unit     # Unit tests with Vitest
pnpm test:e2e      # End-to-end tests with Playwright
pnpm typecheck     # Type checking with tsc
pnpm lint          # Linting with ESLint
pnpm format        # Formatting with Prettier
```

## Licenses

- **Source code:** [AGPL-3.0-or-later](LICENSE)
- **Educational content:** [CC BY-SA 4.0](LICENSE-CONTENT)
- **Attributions:** see [CREDITS.md](CREDITS.md)

## Maintainer

[Matriz01](https://github.com/Matriz01)
