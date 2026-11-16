import { test, expect } from '@playwright/test';

test('Menu page loads and can filter by category', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Verify menu title exists
  await expect(page.locator('text=BrewLite Menu')).toBeVisible();

  // Wait for product cards (at least one)
  const productCards = page.locator('role=article'); // fallback
  await expect(productCards.first()).toBeVisible();

  // Click on a category tab (e.g., "Tea")
  await page.click('text=Tea');

  // Verify that URL contains query param
  await expect(page).toHaveURL(/category=Tea/);

  // Ensure filtered results still show at least one product
  await expect(productCards.first()).toBeVisible();
});
