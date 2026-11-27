import { test, expect } from '@playwright/test';

/**
 * E2E tests for Menu UI (FR-01 / UC-01):
 * - Xem thực đơn (View Menu)
 * - Lọc theo danh mục (Category Filter)
 * - Tìm kiếm món & trạng thái trống (Search & EmptyState)
 * - Xem & đóng modal chi tiết món (Product Detail Modal)
 */
test.describe('Menu UI (FR-01)', () => {
  test('displays seeded menu products and category filter', async ({ page }) => {
    await page.goto('/menu');

    const categoryFilter = page.getByTestId('category-filter');
    await expect(categoryFilter).toBeVisible();
    await expect(page.getByTestId('category-all-tab')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Cà phê sữa đá' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trà Sữa Oolong Nướng' })).toBeVisible();
  });

  test('filters products by category and resets to all', async ({ page }) => {
    await page.goto('/menu');

    const categoryFilter = page.getByTestId('category-filter');
    await expect(page.getByRole('heading', { name: 'Cà phê sữa đá' })).toBeVisible();

    await categoryFilter.getByRole('button', { name: 'Trà sữa' }).click();
    await expect(page.getByRole('heading', { name: 'Trà Sữa Oolong Nướng' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cà phê sữa đá' })).toBeHidden();

    await page.getByTestId('category-all-tab').click();
    await expect(page.getByRole('heading', { name: 'Cà phê sữa đá' })).toBeVisible();
  });

  test('searches products by keyword and shows empty state when no match', async ({ page }) => {
    await page.goto('/menu');

    const searchInput = page.locator('[data-testid="search-input"]:visible');
    await expect(page.getByRole('heading', { name: 'Cà Phê Muối Hoàng Gia' })).toBeVisible();

    await searchInput.fill('Muối');
    await expect(page.getByRole('heading', { name: 'Cà Phê Muối Hoàng Gia' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trà Sữa Oolong Nướng' })).toBeHidden();

    await searchInput.fill('mon-khong-ton-tai-xyz');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    await page.getByTestId('reset-filter-btn').click();
    await expect(page.getByRole('heading', { name: 'Trà Sữa Oolong Nướng' })).toBeVisible();
  });

  test('opens and closes product detail modal', async ({ page }) => {
    await page.goto('/menu');

    const productHeading = page.getByRole('heading', { name: 'Cà phê sữa đá' });
    await expect(productHeading).toBeVisible();
    await productHeading.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Cà phê sữa đá');

    await modal.getByRole('button', { name: 'Đóng' }).click();
    await expect(modal).toBeHidden();
  });
});
