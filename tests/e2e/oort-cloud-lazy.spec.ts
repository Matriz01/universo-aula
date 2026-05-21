/**
 * oort-cloud-lazy.spec.ts — Oort cloud lazy-loading behaviour.
 *
 * REQ-LAZY-3: The layer chunk is NOT requested until showOortCloud=true for the
 * first time in a session. On toggle click, exactly one matching request appears.
 *
 * REQ-LAZY-4: SW CacheFirst rule (manual check in DevTools — skipped in CI
 * headless because activating a service worker in headless Chromium requires
 * --allow-service-workers and a second page load, which is brittle in CI).
 *
 * Requires `pnpm preview` running on port 4173 (baseURL in playwright.config.ts).
 */

import { test, expect } from '@playwright/test';

test.describe('Oort Cloud — lazy loading (REQ-LAZY-3)', () => {
  test('layer chunk NOT requested before toggle is clicked', async ({ page }) => {
    const layerRequests: string[] = [];

    page.on('request', (req) => {
      if (/layer-oort-cloud/.test(req.url())) {
        layerRequests.push(req.url());
      }
    });

    await page.goto('/');

    // Wait for the canvas and HUD to be ready
    await expect(page.locator('[data-testid="solar-canvas"]')).toBeVisible({ timeout: 15_000 });

    // The toggle is in global mode by default — wait for it to appear
    const toggle = page.locator('[data-testid="oort-cloud-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    // Oort cloud starts OFF — no layer chunk should have been requested
    expect(layerRequests).toHaveLength(0);
  });

  test('layer chunk requested exactly once after toggle click', async ({ page }) => {
    const layerRequests: string[] = [];

    page.on('request', (req) => {
      if (/layer-oort-cloud/.test(req.url())) {
        layerRequests.push(req.url());
      }
    });

    await page.goto('/');

    // Wait for canvas and toggle
    await expect(page.locator('[data-testid="solar-canvas"]')).toBeVisible({ timeout: 15_000 });
    const toggle = page.locator('[data-testid="oort-cloud-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    // Click the toggle — triggers React.lazy to resolve the chunk
    await toggle.click();

    // Give the browser time to initiate the network request
    await page.waitForTimeout(2_000);

    // Exactly one layer-oort-cloud chunk should have been requested
    expect(layerRequests).toHaveLength(1);
    expect(layerRequests[0]).toMatch(/layer-oort-cloud-.*\.js/);
  });

  // REQ-LAZY-4 — SW CacheFirst: manual check only.
  // Activating a service worker in headless CI requires multiple page loads and
  // --allow-service-workers flag — too brittle for automated e2e.
  // Manual verification steps:
  //   1. `pnpm preview` → open in Chrome DevTools
  //   2. Enable Oort toggle → observe layer-oort-cloud-*.js in Network (status: 200)
  //   3. Reload page → enable toggle again → status: "(from ServiceWorker)"
  test.skip('REQ-LAZY-4: layer served from SW cache on second load (manual check)', () => {
    // justified: SW activation requires multiple real browser loads; headless
    // Playwright cannot activate the SW in the same test run reliably.
  });
});
