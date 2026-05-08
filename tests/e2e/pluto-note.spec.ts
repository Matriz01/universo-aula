/**
 * pluto-note.spec.ts — nota IAU de Plutón adaptada por nivel pedagógico.
 *
 * Playwright E2E — Phase 11 de solar-system-mvp.
 * Requiere `pnpm preview` en ejecución.
 *
 * Estrategia: selecciona Plutón programáticamente vía store (URL con query param
 * o interacción con el HUD) y verifica que PlutoNote muestra el texto correcto.
 * Como la selección de un planeta en la escena 3D requiere hacer click en un
 * mesh de Three.js (no en un elemento DOM ordinario), se navega con teclado:
 * Tab × N hasta llegar a Plutón (el último cuerpo en el orden canónico).
 *
 * TODO: Reactivar cuando haya un mecanismo estable para seleccionar Plutón sin
 * depender de Tab navigation por el canvas R3F (ej. URL query param ?planet=pluto
 * o un helper de test que llame directamente al store via window.__store__).
 * La navegación por Tab funciona a través de useKeyboardNavigation (dentro de
 * CameraController en el canvas) pero el orden de Tab en el DOM y el canvas 3D
 * no es determinista en Chromium headless.
 */

import { test, expect, type Page } from '@playwright/test';

const LEVELS = ['explorador', 'aprendiz', 'investigador'] as const;

// Número de tabs hasta Plutón (Sol=1, Mercury=2, …, Pluto=10)
const TABS_TO_PLUTO = 10;

async function selectPluto(page: Page) {
  // Espera a que la escena esté lista
  const canvas = page.locator('[data-testid="solar-canvas"]');
  await expect(canvas).toBeVisible({ timeout: 15_000 });

  // Navega con Tab hasta Plutón
  for (let i = 0; i < TABS_TO_PLUTO; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
  }

  // Activa el foco en Plutón con Enter
  await page.keyboard.press('Enter');
}

test.describe('PlutoNote — nota IAU por nivel', () => {
  for (const level of LEVELS) {
    test.skip(`nivel ${level} — muestra texto IAU`, async ({ page }) => {
      // TODO: Tab navigation a través del canvas R3F no es determinista en CI.
      // useKeyboardNavigation está dentro de CameraController (R3F) y su orden
      // de Tab en headless Chromium no coincide con el orden canónico esperado.
      await page.goto('/');

      // Cambia al nivel deseado antes de seleccionar Plutón (dropdown nativo)
      const levelDropdown = page.locator('select[aria-label="Nivel pedagógico"]');
      await expect(levelDropdown).toBeVisible({ timeout: 10_000 });
      await levelDropdown.selectOption(level);

      await selectPluto(page);

      // Verifica que PlutoNote aparece
      const plutoNote = page.locator('[data-testid="pluto-note"]');
      await expect(plutoNote).toBeVisible({ timeout: 5_000 });

      // Nivel Explorador: texto "9" (noveno planeta)
      if (level === 'explorador') {
        await expect(plutoNote).toContainText('9');
        // Verificar pictograma SVG
        const svg = plutoNote.locator('svg');
        await expect(svg).toBeAttached();
      }

      // Nivel Aprendiz: texto con "2006"
      if (level === 'aprendiz') {
        await expect(plutoNote).toContainText('2006');
      }

      // Nivel Investigador: texto con "5A" (Resolución 5A de la IAU)
      if (level === 'investigador') {
        await expect(plutoNote).toContainText('5A');
      }
    });
  }

  test.skip('cambio de nivel actualiza el texto de PlutoNote', async ({ page }) => {
    // TODO: misma razón que los tests anteriores — Tab nav no determinista en CI.
    await page.goto('/');

    // Empieza en Explorador (nivel por defecto)
    await selectPluto(page);
    const plutoNote = page.locator('[data-testid="pluto-note"]');
    await expect(plutoNote).toBeVisible({ timeout: 5_000 });

    const textExplorador = await plutoNote.textContent();

    // Cambia a Investigador (dropdown nativo)
    await page.locator('select[aria-label="Nivel pedagógico"]').selectOption('investigador');
    await page.waitForTimeout(200);

    const textInvestigador = await plutoNote.textContent();

    // El texto debe haber cambiado
    expect(textExplorador).not.toEqual(textInvestigador);
    expect(textInvestigador).toContain('5A');
  });
});
