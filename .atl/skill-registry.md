# Skill Registry — universo-aula

Delegator use only. Re-run via `/skill-registry` after installing/removing skills.

## Project

- **Name**: universo-aula
- **Path**: `C:\Users\PEDROVICENTE\Workspace\dev\Projects\universo-aula`
- **Stack target**: Vite + React + R3F + Drei + Zustand + Tailwind + react-i18next + PWA
- **License**: AGPL-3.0-or-later (code) + CC BY-SA 4.0 (content)

## Project Conventions

- Global instructions: `~/.claude/CLAUDE.md` (Agent Teams Lite orchestrator + Engram protocol + RTK + Personality + Strict TDD)
- No project-level `CLAUDE.md` / `AGENTS.md` yet (will be added in MVP setup phase if needed).

## User Skills

| Trigger                                                                              | Skill                | Path                                                                                                                             |
| ------------------------------------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Crear/abrir PRs, preparar cambios para revisión                                      | branch-pr            | `C:/Users/PEDROVICENTE/.claude/plugins/marketplaces/engram/skills/branch-pr/SKILL.md`                                            |
| PR supera 400 líneas, PRs encadenados, stacked PRs, review slices                    | chained-pr           | `C:/Users/PEDROVICENTE/.claude/skills/chained-pr/SKILL.md`                                                                       |
| Escribir guías, READMEs, RFCs, docs de onboarding, arquitectura o review             | cognitive-doc-design | `C:/Users/PEDROVICENTE/.claude/skills/cognitive-doc-design/SKILL.md`                                                             |
| Escribir comentarios de PR, feedback de review, respuestas en issues, mensajes async | comment-writer       | `C:/Users/PEDROVICENTE/.claude/skills/comment-writer/SKILL.md`                                                                   |
| Crear GitHub issues (bug reports, feature requests)                                  | issue-creation       | `C:/Users/PEDROVICENTE/.claude/plugins/marketplaces/engram/skills/issue-creation/SKILL.md`                                       |
| Dual review adversarial de implementaciones significativas antes de merge            | judgment-day         | `C:/Users/PEDROVICENTE/.claude/skills.bak.20260426/judgment-day/SKILL.md`                                                        |
| Crear nuevos skills de IA, mejorar skills existentes, documentar patrones            | skill-creator        | `C:/Users/PEDROVICENTE/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/skills/skill-creator/SKILL.md` |
| Auto-crítica de decisiones arquitectónicas, diseño, análisis teórico                 | systematic-doubt     | `C:/Users/PEDROVICENTE/.claude/skills.bak.20260426/systematic-doubt/SKILL.md`                                                    |
| Planificar commits como unidades revisables, dividir cambios grandes                 | work-unit-commits    | `C:/Users/PEDROVICENTE/.claude/skills/work-unit-commits/SKILL.md`                                                                |
| Revisar código cambiado antes de commit (calidad, reuso, eficiencia)                 | simplify             | built-in Claude Code                                                                                                             |
| Revisar un PR de GitHub                                                              | review               | built-in Claude Code                                                                                                             |
| Auditoría de seguridad de cambios pendientes en la rama actual                       | security-review      | built-in Claude Code                                                                                                             |
| Crear CLAUDE.md de proyecto con documentación del codebase                           | init                 | built-in Claude Code                                                                                                             |
| Configurar hooks, permisos, env vars del harness vía settings.json                   | update-config        | built-in Claude Code                                                                                                             |
| Escribir/revisar tests (Vitest, Playwright, componentes R3F), sdd-apply, sdd-verify  | r3f-testing          | `.claude/skills/r3f-testing/SKILL.md` (skill de proyecto)                                                                        |
| Testing patterns para Go / Bubbletea / teatest                                       | go-testing           | **NO APLICA** — proyecto JS/TS, no Go                                                                                            |
| Launchers Pinokio / construcción de apps con launchers                               | gepeto / pinokio     | **NO APLICA** — proyecto web                                                                                                     |

## SDD Skills (always available)

sdd-init, sdd-explore, sdd-propose, sdd-spec, sdd-design, sdd-tasks, sdd-apply, sdd-verify, sdd-archive, sdd-onboard.

`engram:memory` — protocolo de memoria persistente, siempre activo. `mem_save` proactivo para decisiones, bugs, convenciones. `mem_search` antes de asumir.

## Compact Rules

### branch-pr

> Flujo REAL de universo-aula (`Matriz01/universo-aula`), verificado. El skill
> `branch-pr` describe el repo de su autor (`agent-teams-lite`) — ese sistema de
> gobernanza NO aplica aquí.

- Conventional commits obligatorios: `<type>(<scope>): <description>` — validados por commitlint (`@commitlint/config-conventional`) en el hook `commit-msg`.
- Cuerpo del commit: cada línea ≤ 100 caracteres (`body-max-line-length`); commitlint rechaza el commit si se excede.
- pre-commit (husky + lint-staged): `prettier --write` sobre `*.{json,md,yml,yaml,css}` y lint sobre `*.{ts,tsx,js,jsx}` — los archivos staged se reformatean automáticamente.
- Nombre de rama recomendado: `type/description` en minúsculas (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`…).
- No `Co-Authored-By` ni atribución de AI en commits.
- El cuerpo del PR debe contener `Closes #N` / `Fixes #N` / `Resolves #N` para vincular y cerrar el issue.
- NO existen plantilla de PR, labels `type:*`/`status:*` ni Actions de validación de PR. No hay flujo de aprobación: el PR se abre y se mergea con el flujo estándar de GitHub.

### chained-pr

> El skill describe el repo de su autor (`agent-teams-lite`). En universo-aula
> NO existe el label `size:exception` ni un Action que mida el tamaño del PR: el
> umbral de 400 líneas es una guía de revisión, no una puerta automática.

- Guía: si un PR supera ~400 líneas cambiadas, divídelo en PRs encadenados — mantiene la revisión enfocada.
- Cada PR debe ser revisable en ≤60 minutos.
- Un PR = un deliverable work unit; tests y docs van en el mismo PR que el código que verifican.
- Cada PR encadenado incluye diagrama de dependencias marcando la posición actual con `📍`.
- En Feature Branch Chain: crear tracker PR draft/no-merge; PR hijo #1 apunta al tracker, los siguientes apuntan al padre inmediato.
- No mezclar estrategias de encadenamiento una vez elegida.
- Diffs contaminados son bugs de base — retarget o rebase hasta que solo aparezca el work unit actual.

### cognitive-doc-design

- Empieza con la decisión o resultado — el contexto viene después (lead with the answer).
- Disclosure progresivo: happy path primero, luego detalles, edge cases y referencias.
- Tablas, checklists y ejemplos > prosa que hay que memorizar.
- Para docs de PR: indicar qué revisar primero, qué está fuera de scope, enlazar PRs anterior y siguiente si la cadena existe.
- Mantener cada sección enfocada en una sola decisión o unidad de trabajo.
- Estructura por defecto: título orientado al outcome → párrafo resumen → quick path → tabla de decisiones → checklist → next step.

### comment-writer

- Empieza directamente con el punto accionable — sin resumir el PR completo antes del feedback.
- Tono: compañero reflexivo, no bot corporativo. Cálido y directo.
- Extensión: 1-3 párrafos cortos o lista compacta de bullets.
- Explica el motivo técnico cuando pidas un cambio.
- Comenta solo el issue de mayor valor, no cada preferencia menor.
- Escribe en el idioma del hilo. Si es español: Rioplatense/voseo (`podés`, `tenés`, `fijate`).
- Sin em-dashes; usa comas, puntos o paréntesis.
- Fórmula: observación directa → por qué importa (solo si no es obvio) → siguiente acción concreta.

### issue-creation

> Flujo REAL de universo-aula, verificado. El skill `issue-creation` describe el
> repo de su autor (`agent-teams-lite`) — sus plantillas y labels NO aplican aquí.

- Buscar duplicados ANTES de crear el issue (`gh issue list --search`).
- Título en formato conventional commit: `feat(scope): …` / `fix(scope): …` / `chore(scope): …`.
- NO hay plantillas de issue (`.github/ISSUE_TEMPLATE/` no existe): issue de texto libre con secciones claras (p. ej. Problema, Solución propuesta, Validación).
- Labels disponibles: solo los de GitHub por defecto — `bug`, `enhancement`, `documentation`, `duplicate`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`. NO existen `status:*` ni `type:*`.
- No hay aprobación de maintainer (`status:approved`): el PR puede abrirse en cuanto el issue existe.

### judgment-day

- Lanzar SIEMPRE dos sub-agentes jueces en paralelo (async/delegate), nunca en secuencia.
- Los jueces trabajan de forma ciega e independiente — ninguno sabe del otro.
- El orchestrator NUNCA revisa código directamente; solo lanza jueces, lee resultados y sintetiza.
- Antes de lanzar jueces: resolver skills del registry e inyectar como `## Project Standards (auto-resolved)` en AMBOS prompts.
- Clasificar cada WARNING: `(real)` si un usuario normal puede activarlo; `(theoretical)` si requiere escenario fabricado.
- Findings `theoretical` → INFO, no se arreglan, no bloquean, no lanzan re-juicio.
- Ronda 1: presentar tabla de veredicto al usuario y pedir confirmación antes de arreglar.
- Ronda 2+: re-juicio solo si hay CRITICALs confirmados.
- Fix Agent es una delegación separada — nunca usar un juez como arreglador.
- Después de 2 iteraciones de fixes, preguntar al usuario si continuar; nunca escalar automáticamente.
- APPROVED = 0 CRITICALs confirmados + 0 WARNINGs (real) confirmados.

### skill-creator

- Proceso: capturar intención → entrevistar edge cases → escribir SKILL.md → test prompts → eval → iterar.
- El campo `description` del frontmatter es el mecanismo primario de trigger; hacerlo "pushover" (no subactivar).
- SKILL.md < 500 líneas; si crece, añadir jerarquía con referencias a archivos externos.
- Incluir `## When to Use` con contextos concretos de código y tarea.
- Lanzar runs con-skill y sin-skill (baseline) en el MISMO turno, en paralelo.
- Siempre generar `eval-viewer` ANTES de evaluar outputs tú mismo — el humano revisa primero.
- Preservar el nombre original si se actualiza un skill existente; no crear `-v2`.

### systematic-doubt

- Aplicar Doubt Pass de oficio tras cualquier decisión arquitectónica, propuesta de diseño, selección de tecnología o análisis con consecuencias.
- No aplicar en tareas mecánicas (rename, format, CRUD) ni en resultados objetivamente verificables (tests/build).
- Las cinco trampas a chequear: motivated reasoning, description→prescription fallacy, elegance bias, worst-case blindness, user claim acceptance.
- Si el Doubt Pass no encuentra nada: decirlo explícitamente — "Doubt pass: clean — [razonamiento breve]."
- Confianza > 8/10 es señal de alarma — probablemente algo está mal.
- El objetivo es MEJORES conclusiones, no parálisis. Después de dudar, decidir.
- Nombrar al menos una cosa en la que podrías estar equivocado.

### work-unit-commits

- Un commit = un deliverable behavior, fix, migración o docs unit; no separar por tipo de archivo.
- Tests van en el mismo commit que el comportamiento que verifican.
- Docs van en el mismo commit que el cambio visible para el usuario que explican.
- Cada commit debe dejar el repo en estado coherente si solo se aplica ese commit.
- El mensaje explica el outcome (qué hace), no la lista de archivos.
- Si el cambio SDD supera 400 líneas, agrupar commits en slices de PR encadenado antes de implementar.
- Checklist antes de commitear: ¿propósito único? ¿repo coherente solo con este commit? ¿tests/docs incluidos? ¿rollback razonable? ¿mensaje explica el outcome?

### simplify (built-in)

- Revisar código cambiado en busca de oportunidades de reuso antes de commitear.
- Detectar y eliminar duplicación, código muerto, y complejidad innecesaria.
- Preferir extracciones a helpers/hooks sobre inline repetido.
- No refactorizar más allá del scope del cambio actual.
- Reportar qué se simplificó y por qué antes de aplicar los cambios.

### review (built-in)

- Revisar el PR completo: diff, descripción, scope, tests, docs.
- Verificar que el PR enlaza un issue aprobado y tiene exactamente una etiqueta `type:*`.
- Comprobar que tests pasan y cobertura no regresa.
- Señalar CRITICALs, WARNINGs y SUGGESTIONs por separado con evidencia de línea.
- No aprobar si hay CRITICALs sin resolver.

### security-review (built-in)

- Auditar cambios pendientes en la rama actual contra OWASP Top 10 y CSP del proyecto.
- Verificar: sin innerHTML con datos no sanitizados, sin eval, sin credenciales hardcodeadas.
- Revisar permisos de Service Worker y accesos de PWA.
- Confirmar que CSP estricta del proyecto no se relaja en los cambios.
- Reportar hallazgos como CRITICAL / WARNING / INFO con evidencia de archivo y línea.

### init (built-in)

- Leer estructura del proyecto y convenciones antes de escribir.
- Incluir: stack, comandos de desarrollo/build/test, convenciones de código, arquitectura de carpetas.
- No repetir lo que ya está en `~/.claude/CLAUDE.md` global.
- Mantener CLAUDE.md corto y escaneable; links a docs detallados mejor que prosa larga.

### update-config (built-in)

- Usar para cualquier automatización "cada vez que X" / "antes/después de X" — requiere hooks en `settings.json`, no memoria.
- Añadir permisos de herramientas en `settings.json` / `settings.local.json` según scope (proyecto vs usuario).
- Variables de entorno del proyecto van en `.claude/settings.json`; variables personales en `settings.local.json`.
- Nunca hardcodear secretos en settings — usar referencias a variables de entorno del sistema.

### r3f-testing

- **Exhaustividad por categorías, NO por coverage %.** Cada módulo nuevo cubre las 4: happy path, casos límite, errores/entrada inválida, determinismo. Omitir una solo con justificación inline.
- Cada bug fix lleva un test de regresión que falla SIN el fix (escrito primero — red).
- Nunca renderizar `<Canvas>` real en jsdom: mockear `@react-three/fiber` (`Canvas`→div, `useFrame`, `useThree`) y `@react-three/drei` (`Html`/`Lod`/`Detailed`→div/group).
- Mocks con `vi.hoisted()` para spies; `vi.mock(...)` ANTES del import del SUT.
- `useFrame` nunca se auto-ejecuta: capturar callbacks e invocarlos con `dt` fijo (`tickFrames(n, dt)`); cuando importa el orden, verificar `priority`.
- Nunca `vi.useFakeTimers()` — suite síncrona; avanzar con `tick()` / loop manual.
- `simulationClock`: `reset(J2000)`+`setPaused(false)` en `beforeEach`. Zustand: `setState({...})` en `beforeEach` (no hay `reset()`).
- Tolerancias deliberadas: `toBe` exacto, `toBeCloseTo(x,n)` acumulación float, rangos para modelos físicos — con motivo y fuente (NASA JPL Horizons) en comentario. Nunca relajar tolerancia para pasar.
- Tests en `tests/unit/**/*.test.ts(x)` espejo de `src/`; e2e en `tests/e2e/*.spec.ts` con locators `data-testid`.
- Detalle y plantillas: `.claude/skills/r3f-testing/references/patterns.md`.

---

## Project-specific Compact Rules (replan-2026-05)

### RULE: frame-rate state never in Zustand

60Hz mutations (simulation time, mesh transforms) NEVER go in `useAppStore`.
`simulationClock` (`src/scenes/simulationClock.ts`) is the ONLY authoritative
time source. Adding `simulationTime` or `elapsed` to the store triggers ~17
re-renders/frame (Refactor C regression). This is a hard architectural invariant.

- Tick único en `<SimulationTicker>` (primer hijo de `<SolarSystemContent>`).
- Todos los consumidores leen `simulationClock.getJD()` dentro de `useFrame`.
- `<PausedBridge>` sincroniza `simulationSpeed === 0` → `clock.setPaused()`.
- `DateControl` actualiza la fecha vía `setInterval(1000ms)` — nunca a 60Hz.

**Cross-references**: `src/store/useAppStore.ts` (JSDoc invariant), `src/scenes/simulationClock.ts` (top-of-file comment).

### Project-specific (universo-aula)

- **Static hosting only** — no backend, no BD, no SSR.
- **No cookies, no analytics, no accounts** by design (RGPD compliance).
- **No AI-generated textures** — scientific accuracy + legal risk mitigation.
- **No generative LLM in MVP** for KB answers (alucinación inaceptable en contexto educativo).
  - Voz: STT (Whisper) + intent matching (all-MiniLM-L6-v2) + KB curada humana + TTS (Web Speech).
- **Future-proof** `LLMConnector` interface for opt-in external LLM adapters (Copilot/Gemini/BYOK), post-MVP.
- **Multi-device**: SMART Board MX/RX, tablets, navegadores. Android TV solo lectura.
- **Loader visual** durante primera descarga de modelos (~200-300 MB). Service worker cache versionada; re-descarga solo en updates.
- **Seguridad**: CSP estricta, sin innerHTML con datos no sanitizados, sin eval. Mitigación XSS por diseño.

## Auto-resolved Skill Selection per Context

| Code context / Task                                          | Skills to inject     |
| ------------------------------------------------------------ | -------------------- |
| Designing or proposing architecture                          | systematic-doubt     |
| Reviewing significant changes (dual adversarial)             | judgment-day         |
| Creating GitHub issues                                       | issue-creation       |
| Opening PRs                                                  | branch-pr            |
| Documenting new patterns or skills                           | skill-creator        |
| Revisar código antes de commit                               | simplify             |
| Review dual adversarial de cambios grandes                   | judgment-day         |
| Auditoría de seguridad de cambios pendientes                 | security-review      |
| Revisar un PR de GitHub                                      | review               |
| Planificar commits revisables / dividir cambio en work units | work-unit-commits    |
| Dividir PR grande (>400 líneas) en PRs encadenados           | chained-pr           |
| Escribir comentarios de review / colaboración async          | comment-writer       |
| Escribir docs, guías, README, onboarding, arquitectura       | cognitive-doc-design |
| Configurar hooks, permisos o env vars del harness            | update-config        |
| Escribir o revisar tests (unit, componente R3F, e2e)         | r3f-testing          |
| Implementar tareas SDD con tests (sdd-apply, sdd-verify)     | r3f-testing          |

## Gap — testing JS/TS — RESUELTO (2026-05-18)

El gap de testing está cerrado con el skill de proyecto **`r3f-testing`**
(`.claude/skills/r3f-testing/`), creado con `/skill-creator` a partir de los
patrones reales del proyecto (~729 tests unitarios).

- Cubre: exhaustividad por categorías, mocking de `@react-three/fiber` /
  `@react-three/drei`, testeo de `useFrame` (`tickFrames`), `simulationClock`,
  store Zustand, i18n, cross-checks astronómicos, tests de regresión y e2e.
- `sdd-apply` y `sdd-verify` deben recibir las compact rules de `r3f-testing`
  (ver sección Compact Rules) inyectadas como `## Project Standards`.
- `go-testing` sigue **NO APLICA** (exclusivo Go + Bubbletea).
