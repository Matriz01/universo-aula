/**
 * local-mode-render.spec.ts — Regresión C1: render takeover en GPU no-high.
 *
 * Bug cazado: BodyMarker registraba useFrame con priority 1. En R3F cualquier
 * suscripción con priority > 0 activa el render takeover (R3F deja de llamar
 * gl.render automáticamente). El único renderizador manual es el EffectComposer
 * de postprocessing, que SOLO se monta con gpu === 'high'. Con
 * sessionStorage['gpu_capability']='mid', al entrar en modo local (donde se
 * montan los BodyMarkers) el canvas quedaba CONGELADO: 0 draw calls.
 *
 * Estrategia: addInitScript (corre ANTES que cualquier script de la página)
 * que (a) fija gpu_capability='mid' y (b) envuelve drawElements/drawArrays de
 * WebGL 1 y 2 con un contador en window.__drawCalls. Tras entrar en modo local
 * (vía el store expuesto en window.__APP_STORE__ — entrar clicando el planeta
 * exige un raycast WebGL frágil en headless), el contador DEBE seguir creciendo.
 *
 * Nota CI: requiere WebGL real (SwiftShader en Chromium headless). Si el
 * contexto WebGL no se crea, el test se marca como skipped en runtime en lugar
 * de fallar — el bug solo es observable con un canvas que renderiza.
 *
 * Requiere `pnpm preview` en puerto 4173 (baseURL en playwright.config.ts).
 */

import { test, expect } from '@playwright/test';

// Tipado de los globals inyectados (solo para los page.evaluate de este spec).
// window.__APP_STORE__ ya está declarado globalmente en src/store/useAppStore.ts
// (mismo programa TS: tsconfig.test.json incluye `src` y `tests`).
declare global {
  interface Window {
    __drawCalls?: number;
  }
}

test.describe('Modo local en GPU mid — el canvas sigue renderizando (C1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // (a) Forzar GPU 'mid' ANTES de que cargue la app → useGpuCapability lee
      // el cache de sessionStorage y NO monta el EffectComposer (gpu !== 'high').
      sessionStorage.setItem('gpu_capability', 'mid');

      // (b) Contador global de draw calls — envuelve los métodos de dibujo de
      // WebGL 1 y 2. Si R3F deja de llamar gl.render, el contador se detiene.
      window.__drawCalls = 0;
      const protos: Array<typeof WebGLRenderingContext.prototype> = [];
      if (typeof WebGLRenderingContext !== 'undefined') {
        protos.push(WebGLRenderingContext.prototype);
      }
      if (typeof WebGL2RenderingContext !== 'undefined') {
        protos.push(WebGL2RenderingContext.prototype);
      }
      const methods = [
        'drawElements',
        'drawArrays',
        'drawElementsInstanced',
        'drawArraysInstanced',
      ] as const;
      for (const proto of protos) {
        for (const name of methods) {
          const original = (proto as unknown as Record<string, unknown>)[name];
          if (typeof original !== 'function') continue;
          (proto as unknown as Record<string, unknown>)[name] = function (
            this: unknown,
            ...args: unknown[]
          ) {
            window.__drawCalls = (window.__drawCalls ?? 0) + 1;
            return (original as (...a: unknown[]) => unknown).apply(this, args);
          };
        }
      }
    });
  });

  test('tras entrar en modo local, los draw calls siguen creciendo', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('[data-testid="solar-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Esperar a que la escena global esté renderizando de verdad.
    // Si WebGL no está disponible en este entorno (CI sin SwiftShader), no se
    // puede observar el bug → skip en runtime, no false-positive ni false-fail.
    let globalModeRendering = true;
    try {
      await expect
        .poll(async () => page.evaluate(() => window.__drawCalls ?? 0), {
          timeout: 15_000,
        })
        .toBeGreaterThan(0);
    } catch {
      globalModeRendering = false;
    }
    test.skip(
      !globalModeRendering,
      'WebGL no disponible en este entorno: 0 draw calls en modo global — el bug C1 no es observable.',
    );

    // Entrar en modo local (Tierra) vía store — montará los BodyMarkers.
    await page.evaluate(() => {
      window.__APP_STORE__!.getState().goToBody('earth');
    });

    // Confirmación por UI de que el modo local está activo.
    await expect(page.locator('[data-testid="exit-local-mode"]')).toBeVisible({
      timeout: 10_000,
    });

    // Dejar que el modo local se asiente (montaje de markers) y tomar baseline.
    await page.waitForTimeout(500);
    const baseline = await page.evaluate(() => window.__drawCalls ?? 0);

    // Regresión C1: con el bug, internal.priority > 0 sin EffectComposer →
    // gl.render no se llama → el contador se congela en el baseline.
    // Con el fix, a ~60fps y decenas de draw calls por frame, en 2s el
    // contador crece varios órdenes de magnitud por encima del margen (50).
    await expect
      .poll(async () => page.evaluate(() => window.__drawCalls ?? 0), {
        timeout: 10_000,
      })
      .toBeGreaterThan(baseline + 50);
  });
});
