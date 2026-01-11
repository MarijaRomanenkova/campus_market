import { test, expect } from '@playwright/test';

/**
 * Example E2E test to verify Playwright setup
 * This test checks that the homepage loads correctly
 */
test('homepage loads', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads (wait for network to be idle)
  await page.waitForLoadState('networkidle');
  
  // Check that the page title or a key element is present
  await expect(page).toHaveTitle(/Campmar|Campus Marketplace/i);
  
  // Check for a key element on the homepage - look for "Create Product" button or product list
  const createButton = page.getByRole('button', { name: /create product/i }).or(page.getByText(/create product/i));
  const productList = page.locator('[data-testid="product-list"]').or(page.getByText(/newest products/i));
  
  // At least one of these should be visible
  await expect(createButton.or(productList).first()).toBeVisible({ timeout: 10000 });
});
