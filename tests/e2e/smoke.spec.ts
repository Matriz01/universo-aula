import { test, expect } from '@playwright/test';

test('la página carga sin errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/.+/);

  expect(consoleErrors, `Errores de consola inesperados: ${consoleErrors.join(', ')}`).toHaveLength(
    0,
  );

  expect(pageErrors, `Errores de página inesperados: ${pageErrors.join(', ')}`).toHaveLength(0);
});
