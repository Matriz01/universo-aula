/**
 * attribution.spec.ts — atribución Solar System Scope siempre visible.
 *
 * Playwright E2E — Phase 11 de solar-system-mvp.
 * Requiere `pnpm preview` en ejecución (build de producción).
 */

import { test, expect } from '@playwright/test';

test.describe('Atribución — Solar System Scope', () => {
  test('el footer de atribución es visible en la página', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('[data-testid="attribution-footer"]');
    await expect(footer).toBeVisible({ timeout: 10_000 });
  });

  test('el texto "Solar System Scope" está presente en el DOM', async ({ page }) => {
    await page.goto('/');

    // El texto debe estar en el footer
    const solarSystemScopeText = page.getByText('Solar System Scope', { exact: false });
    await expect(solarSystemScopeText).toBeVisible({ timeout: 10_000 });
  });

  test('el link a solarsystemscope.com está presente', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('[data-testid="attribution-footer"]');
    await expect(footer).toBeVisible({ timeout: 10_000 });

    const link = footer.locator('a[href*="solarsystemscope.com"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Solar System Scope');
  });

  test('el footer no tiene display:none ni visibility:hidden', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('[data-testid="attribution-footer"]');
    await expect(footer).toBeVisible({ timeout: 10_000 });

    // Verificar que los estilos computados no ocultan el elemento
    const styles = await footer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
      };
    });

    expect(styles.display).not.toBe('none');
    expect(styles.visibility).not.toBe('hidden');
    expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
  });

  test('la atribución es visible tras cambio de nivel pedagógico', async ({ page }) => {
    await page.goto('/');

    // Cambia a Investigador
    const investigadorBtn = page.locator('[data-testid="level-button-investigador"]');
    await expect(investigadorBtn).toBeVisible({ timeout: 10_000 });
    await investigadorBtn.click();

    // El footer sigue siendo visible
    const footer = page.locator('[data-testid="attribution-footer"]');
    await expect(footer).toBeVisible({ timeout: 5_000 });
    await expect(footer).toContainText('Solar System Scope');
  });
});
