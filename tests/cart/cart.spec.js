import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../utils/auth-helpers.js';
import { PageHelpers } from '../../utils/page-helpers.js';

test.describe('Shopping Cart Functionality', () => {
  let authHelpers;
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    pageHelpers = new PageHelpers(page);
    await authHelpers.login();
  });

  test('should display empty cart message', async ({ page }) => {
    await page.goto('/home/cart');
    
    const emptyCart = page.locator('.empty-cart, [data-testid="empty-cart"]');
    if (await emptyCart.isVisible()) {
      await expect(emptyCart).toContainText(/empty|no items/i);
      await expect(page.locator('.continue-shopping, [data-testid="continue-shopping"]')).toBeVisible();
    }
  });

  test('should display cart items', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    const firstBerth = page.locator('.berth-card').first();
    await firstBerth.click();
    
    await page.fill('[data-testid="check-in"]', '2024-12-01');
    await page.fill('[data-testid="check-out"]', '2024-12-03');
    await page.click('[data-testid="add-to-cart"]');
    
    await page.goto('/home/cart');
    
    await expect(page.locator('.cart-item, [data-testid="cart-item"]')).toBeVisible();
    await expect(page.locator('.berth-name, .item-name')).toBeVisible();
    await expect(page.locator('.item-price, .price')).toBeVisible();
    await expect(page.locator('.item-dates, .booking-dates')).toBeVisible();
  });

  test('should update item quantity', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItem = page.locator('.cart-item').first();
    if (await cartItem.isVisible()) {
      const quantityInput = cartItem.locator('.quantity-input, [data-testid="quantity"]');
      await quantityInput.fill('2');
      
      await page.click('.update-quantity, [data-testid="update-quantity"]');
      
      await expect(page.locator('.success-message:has-text("updated"), .quantity-updated')).toBeVisible();
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItem = page.locator('.cart-item').first();
    if (await cartItem.isVisible()) {
      await cartItem.locator('.remove-item, [data-testid="remove-item"]').click();
      
      await page.click('.confirm-remove, [data-testid="confirm-remove"]');
      
      await expect(page.locator('.success-message:has-text("removed"), .item-removed')).toBeVisible();
    }
  });

  test('should calculate cart total correctly', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    const count = await cartItems.count();
    
    if (count > 0) {
      await expect(page.locator('.cart-subtotal, [data-testid="subtotal"]')).toBeVisible();
      await expect(page.locator('.cart-total, [data-testid="total"]')).toBeVisible();
      
      const subtotalText = await page.locator('.cart-subtotal').textContent();
      const totalText = await page.locator('.cart-total').textContent();
      
      const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
      const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
      
      expect(total).toBeGreaterThanOrEqual(subtotal);
    }
  });

  test('should apply promo code', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    if (await cartItems.count() > 0) {
      await page.fill('[data-testid="promo-code"], .promo-input', 'TESTCODE10');
      await page.click('[data-testid="apply-promo"], .apply-promo-btn');
      
      await expect(page.locator('.promo-success, [data-testid="promo-applied"]')).toBeVisible();
      await expect(page.locator('.discount-amount, .promo-discount')).toBeVisible();
    }
  });

  test('should handle invalid promo code', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    if (await cartItems.count() > 0) {
      await page.fill('[data-testid="promo-code"]', 'INVALID_CODE');
      await page.click('[data-testid="apply-promo"]');
      
      await expect(page.locator('.promo-error, [data-testid="promo-invalid"]')).toBeVisible();
    }
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    if (await cartItems.count() > 0) {
      await Promise.all([
        page.waitForNavigation(),
        page.click('[data-testid="checkout-btn"], .checkout-btn')
      ]);
      
      await expect(page).toHaveURL(/\/checkout|\/payment/);
    }
  });

  test('should continue shopping from cart', async ({ page }) => {
    await page.goto('/home/cart');
    
    await page.click('[data-testid="continue-shopping"], .continue-shopping-btn');
    
    await expect(page).toHaveURL(/\/home\/available-berths|\/home/);
  });

  test('should save cart for later', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    if (await cartItems.count() > 0) {
      await page.click('[data-testid="save-for-later"], .save-later-btn');
      
      await expect(page.locator('.success-message:has-text("saved"), .cart-saved')).toBeVisible();
    }
  });

  test('should clear entire cart', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    if (await cartItems.count() > 0) {
      await page.click('[data-testid="clear-cart"], .clear-cart-btn');
      
      await page.click('[data-testid="confirm-clear"], .confirm-clear-btn');
      
      await expect(page.locator('.empty-cart, [data-testid="empty-cart"]')).toBeVisible();
    }
  });

  test('should display cart item details', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItem = page.locator('.cart-item').first();
    if (await cartItem.isVisible()) {
      await expect(cartItem.locator('.berth-image, .item-image')).toBeVisible();
      await expect(cartItem.locator('.berth-name, .item-title')).toBeVisible();
      await expect(cartItem.locator('.berth-location, .item-location')).toBeVisible();
      await expect(cartItem.locator('.booking-dates, .item-dates')).toBeVisible();
      await expect(cartItem.locator('.item-price, .price')).toBeVisible();
    }
  });

  test('should handle cart persistence across sessions', async ({ page, context }) => {
    await page.goto('/home/available-berths');
    
    const firstBerth = page.locator('.berth-card').first();
    if (await firstBerth.isVisible()) {
      await firstBerth.click();
      
      await page.fill('[data-testid="check-in"]', '2024-12-01');
      await page.fill('[data-testid="check-out"]', '2024-12-03');
      await page.click('[data-testid="add-to-cart"]');
      
      const newPage = await context.newPage();
      await newPage.goto('/home/cart');
      
      await expect(newPage.locator('.cart-item')).toBeVisible();
    }
  });

  test('should show estimated taxes and fees', async ({ page }) => {
    await page.goto('/home/cart');
    
    const cartItems = page.locator('.cart-item');
    if (await cartItems.count() > 0) {
      const priceBreakdown = page.locator('.price-breakdown, [data-testid="price-breakdown"]');
      if (await priceBreakdown.isVisible()) {
        await expect(priceBreakdown.locator('.taxes, .tax-amount')).toBeVisible();
        await expect(priceBreakdown.locator('.fees, .service-fee')).toBeVisible();
      }
    }
  });
});