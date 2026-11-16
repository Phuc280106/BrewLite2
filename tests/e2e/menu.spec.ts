import { test, expect } from '@playwright/test';

/**
 * E2E test for the Menu UI.
 * It verifies that the product list renders and that the product detail modal opens.
 */
test.describe('Menu UI', () => {
  test('displays product cards and opens detail modal', async ({ page }) => {
    // Visit the web application (adjust port if needed)
    await page.goto('http://localhost:3000');

    // Expect at least one product card (example: Espresso)
    const productCard = page.locator('text=Espresso');
    await expect(productCard).toBeVisible();

    // Click the "Xem chi tiết" button within that card
    await productCard.locator('button', { hasText: 'Xem chi tiết' }).click();

    // Verify the modal appears and contains product name
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Espresso');

    // Close the modal
    await modal.getByRole('button', { name: /Close/i }).click();
    await expect(modal).toBeHidden();
  });
});
