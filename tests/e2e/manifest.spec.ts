import { test, expect } from '@playwright/test';

test('manifest.webmanifest es accesible y válido', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');

  expect(response.status()).toBe(200);

  const text = await response.text();
  // Debe ser JSON parseable
  const manifest = JSON.parse(text) as Record<string, unknown>;

  expect(manifest.name).toBe('Universo Aula');
});

// El registro del Service Worker solo es relevante en build de producción.
// En modo dev (devOptions.enabled: false) el SW no se registra intencionalmente.
// Este test se omite en dev y queda pendiente de verificación en el paso 6.6.
