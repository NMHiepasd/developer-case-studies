import { test, expect } from '@playwright/test';

/**
 * Test Suite: Cart & Checkout Race Condition Verification
 * Target Flow: Rapid Quantity Increment/Decrement and Optimistic Sync
 */

test.describe('Cart & Checkout Quantity Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout/cart page with pre-seeded cart items
    await page.goto('/shop/checkout/cart');
    await expect(page.locator('.cart-item')).toBeVisible();
  });

  test('should gracefully debounce rapid clicks and maintain synchronous state', async ({ page }) => {
    const qtyInput = page.locator('[data-testid="item-quantity-input"]');
    const incrementBtn = page.locator('[data-testid="quantity-increment-btn"]');
    const subtotalText = page.locator('[data-testid="cart-subtotal"]');

    // Initial state check
    await expect(qtyInput).toHaveValue('1');

    // Intercept cart update API calls
    const updateRequests: Array<{ url: string; timestamp: number }> = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/checkout/cart/update') && request.method() === 'POST') {
        updateRequests.push({ url: request.url(), timestamp: Date.now() });
      }
    });

    // Simulate rapid user interaction (burst of 5 clicks in ~300ms)
    for (let i = 0; i < 4; i++) {
      await incrementBtn.click({ delay: 50 });
    }

    // Verify optimistic UI update: immediately displays 5
    await expect(qtyInput).toHaveValue('5');

    // Wait for debounce period (300ms) + network response to settle
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/checkout/cart/update') && resp.status() === 200,
      { timeout: 3000 }
    );

    // Assert that debounce prevented 4 individual API calls, batching into a single sync call
    expect(updateRequests.length).toBeLessThanOrEqual(2);

    // Verify final state consistency
    await expect(qtyInput).toHaveValue('5');
    await expect(subtotalText).toContainText('$50.00'); // Assuming $10 unit price
  });

  test('should prevent selecting same warehouse as source and destination', async ({ page }) => {
    await page.goto('/admin/inventory/transfers/create');

    const sourceSelect = page.locator('[data-testid="source-warehouse-select"]');
    const destinationSelect = page.locator('[data-testid="destination-warehouse-select"]');
    const validationError = page.locator('[data-testid="warehouse-validation-error"]');

    // Select Warehouse A as source
    await sourceSelect.selectOption({ label: 'Main Warehouse (WH-01)' });

    // Click destination dropdown and verify WH-01 is either disabled or triggers immediate validation
    await destinationSelect.selectOption({ label: 'Main Warehouse (WH-01)' });

    await expect(validationError).toBeVisible();
    await expect(validationError).toHaveText(/cannot be the same as source/i);
    await expect(page.locator('[data-testid="submit-transfer-btn"]')).toBeDisabled();
  });
});
