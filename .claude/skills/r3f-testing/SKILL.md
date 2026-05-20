---
name: r3f-testing
description: 'Trigger: write tests, Vitest, Playwright, test an R3F component, sdd-apply, sdd-verify. Enforce exhaustive test categories and universo-aula R3F mocking patterns.'
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: '1.3'
---

# r3f-testing — Testing exhaustivo para universo-aula

## Activation Contract

Apply when writing or reviewing tests in universo-aula: unit tests (Vitest), R3F
component tests, hooks, the Zustand store, `simulationClock`, orbital math, or
Playwright e2e. Strict TDD Mode is active — red → green → refactor.

## Hard Rules

- **Exhaustive by category, not by coverage %.** Every new module under test
  MUST cover ALL of: (1) happy path, (2) boundary/limit cases, (3) invalid input
  / error paths, (4) determinism (same input → same output). Omit a category
  ONLY with an explicit one-line justification in the test file.
- **Every bug fix ships a regression test FIRST** — it must fail without the fix
  and pass with it. No fix lands without it.
- **Never render a real `<Canvas>` in jsdom** (no WebGL). Mock `@react-three/fiber`
  (`Canvas`→`<div data-testid>`, `useFrame`, `useThree`) and `@react-three/drei`
  (`Html`/`Lod`/`Detailed`→`div`/`group`).
- **Mocks before imports.** Use `vi.hoisted()` for capturable spies; declare
  `vi.mock(...)` above the `import` of the system under test.
- **`useFrame` is never auto-invoked.** Capture its callbacks and call them
  manually with a fixed `dt` (helper `tickFrames(n, dt)`). When order matters,
  assert the `priority` argument.
- **Computation inside `useFrame` MUST be extracted to a pure function** and
  tested exhaustively there — the callback stays a one-line shell. Mutating an
  R3F `Group`/`Mesh` is NOT unit-testable in jsdom: with fiber mocked, `<group>`
  renders as a plain DOM node and the ref points to it, not a Three.js object.
  `vi.spyOn(React,'useRef')` does NOT fix this — named imports aren't
  intercepted (verified by execution: it produces crashing tests). So the unit
  test verifies the callback is _registered_; the visible effect goes to
  Playwright e2e — a justified omission. Never let "the callback is registered"
  pass as coverage of what the callback DOES.
- **Never `vi.useFakeTimers()`** — the suite is fully synchronous. Advance time
  via explicit `tick()` / manual frame loops.
- **Tolerances are deliberate**: `toBe` for known exact values, `toBeCloseTo(x, n)`
  for float accumulation, ranges for physical models — with the tolerance reason
  and source (e.g. NASA JPL Horizons + JD) in a comment. Never loosen a tolerance
  to make a test pass; investigate the divergence.
- **Location mirrors `src/`**: `tests/unit/**/*.test.ts(x)`; e2e in
  `tests/e2e/*.spec.ts`. E2e uses `data-testid` locators, 10–15 s timeouts.
- Reset shared state in `beforeEach`: `simulationClock.reset(J2000)` +
  `setPaused(false)`; Zustand via `useAppStore.setState({ ... })`.
- **A mock that doesn't intercept is a false green.** A `vi.mock(path)` whose
  `path` does not match the SUT's import string EXACTLY silently mocks nothing —
  the test then passes for the wrong reason. Verify the real import before
  mocking. Never loosen an assertion to make a non-intercepting test pass.
- **Test hygiene.** Setup hooks (`beforeEach`/`afterEach`) live at `describe`
  scope, never inside an `it()`. A test's name must state what its assertion
  checks — never contradict it. Assert observable behaviour, not implementation
  internals (`displayName` is fine; `$$typeof`/`react.memo` internals are not).

## Decision Gates

| What you test                              | How                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Pure function (orbital math, JD↔Gregorian) | Direct call; `toBe`/`toBeCloseTo`; round-trips                                                         |
| R3F component                              | Mock fiber + drei; render inside wrapper `div`; assert composition, props, calls                       |
| Computation inside `useFrame`              | Extract to a pure function; test that exhaustively. Callback = one-line shell, assert it registers     |
| `useFrame` effect on a `Group`/`Mesh`      | Not unit-testable in jsdom — assert registration; cover the visible effect in e2e (justified omission) |
| `simulationClock`                          | `reset`+`setPaused` in `beforeEach`; assert `JD += dt*speedup/86400`                                   |
| Zustand store                              | `setState` in `beforeEach`; assert via `getState()`                                                    |
| Custom hook                                | `renderHook`; mock its dependencies                                                                    |
| Physical/astronomical value                | Range with justified tolerance + cited source                                                          |
| User flow / PWA / a11y                     | Playwright e2e; `data-testid`                                                                          |

## Execution Steps

1. Identify the category via Decision Gates.
2. For a bug fix: write the regression test first, watch it fail (red).
3. Declare `vi.hoisted()` spies and `vi.mock(...)` above the SUT import.
4. Cover every mandatory category; never use a real `<Canvas>`.
5. Run `rtk vitest` (`pnpm test:unit`); for user flows also `pnpm test:e2e`.
6. Keep all tests green before delivering. Do not weaken assertions to pass.

## Output Contract

- New tests live in `tests/unit/` mirroring `src/`.
- Each covers the four mandatory categories or justifies omissions inline.
- Bug fixes include a regression test that fails without the fix.
- `pnpm test:unit` green; report counts and any skipped test with reason.

## References

- `references/patterns.md` — concrete project examples for every pattern above
  (R3F mocking, `tickFrames`, `simulationClock`, store, i18n, astronomical
  cross-checks, regression tracking) plus a copy-ready component-test template.
