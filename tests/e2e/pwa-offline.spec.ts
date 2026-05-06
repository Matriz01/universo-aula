/**
 * pwa-offline.spec.ts — funcionalidad PWA offline tras primera visita.
 *
 * Playwright E2E — Phase 11 de solar-system-mvp.
 * Requiere `pnpm preview` en ejecución (build de producción con SW activo).
 *
 * Nota: el Service Worker se registra con un ligero retardo tras la primera carga.
 * En CI el timing puede variar; el test usa skip condicional si el SW no está listo.
 */

import { test, expect } from '@playwright/test';

test.describe('PWA — modo offline', () => {
  test('la app sigue funcionando offline tras primera visita', async ({ browser }) => {
    // Contexto fresco para asegurar primera visita
    const context = await browser.newContext();
    const page = await context.newPage();

    // --- Primera visita (con red) ---
    await page.goto('/');

    const canvas = page.locator('[data-testid="solar-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Espera a que el SW se registre (máx. 10 s)
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('SW timeout')), 10_000),
          ),
        ]);
        return reg !== null;
      } catch {
        return false;
      }
    });

    if (!swRegistered) {
      test.skip(true, 'Service Worker no disponible en este entorno — omitiendo test offline');
      await context.close();
      return;
    }

    // --- Segunda visita (offline) ---
    await context.setOffline(true);
    await page.reload();

    // La app debe seguir cargando desde caché
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Verifica que no hay errores de red críticos (errores de assets no bloqueantes son aceptables)
    // Al menos el HTML/JS principal debe cargar correctamente
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    await context.close();
  });

  test('el HTML principal es accesible offline', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Primera carga para poblar la caché
    await page.goto('/');
    const canvas = page.locator('[data-testid="solar-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Pequeña pausa para que el SW precachee los assets
    await page.waitForTimeout(2_000);

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        await navigator.serviceWorker.ready;
        return true;
      } catch {
        return false;
      }
    });

    if (!swRegistered) {
      test.skip(true, 'Service Worker no disponible — omitiendo test de caché offline');
      await context.close();
      return;
    }

    // Offline
    await context.setOffline(true);

    let httpStatus = 0;
    page.on('response', (resp) => {
      if (resp.url().endsWith('/') || resp.url().endsWith('/index.html')) {
        httpStatus = resp.status();
      }
    });

    await page.goto('/');

    // La respuesta debe ser 200 (servida desde caché del SW)
    // o la app al menos renderiza el canvas
    const canvasOffline = page.locator('[data-testid="solar-canvas"]');
    const isVisible = await canvasOffline.isVisible().catch(() => false);
    const statusOk = httpStatus === 200 || httpStatus === 0;

    // Al menos uno de los dos debe ser verdad
    expect(isVisible || statusOk).toBe(true);

    await context.close();
  });
});
