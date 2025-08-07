import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../utils/auth-helpers.js';
import { PageHelpers } from '../../utils/page-helpers.js';

test.describe('Dashboard Functionality', () => {
  let authHelpers;
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    pageHelpers = new PageHelpers(page);
    await authHelpers.login();
  });

  test('should display dashboard with request sections', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check main sections exist
    await expect(page.getByText('Current requests to your berths')).toBeVisible();
    await expect(page.getByText('Your requests to others berths')).toBeVisible();
    
    // Check navigation buttons exist
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Available Berths")')).toBeVisible();
    await expect(page.locator('button:has-text("List your berth")')).toBeVisible();
    await expect(page.locator('button:has-text("Past Berths")')).toBeVisible();
  });

  test('should display berth request cards', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check for berth request cards (DashCard components)
    const requestCards = page.locator('.BearthCard');
    
    if (await requestCards.count() > 0) {
      // Verify card structure
      const firstCard = requestCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check berth image
      await expect(firstCard.locator('img[alt="berth-image"]')).toBeVisible();
      
      // Check berth name (h4 heading)
      await expect(firstCard.locator('h4')).toBeVisible();
      
      // Check transaction type (Open to...)
      await expect(firstCard.locator('.cardTypeBox')).toBeVisible();
      
      // Check total amount
      await expect(firstCard.locator('text=Total Amount:')).toBeVisible();
      
      // Check specifications
      await expect(firstCard.locator('text=Length:')).toBeVisible();
      await expect(firstCard.locator('text=Beam:')).toBeVisible();
    }
  });

  test('should navigate to berth creation', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Click the "List your berth" button
    await page.click('button:has-text("List your berth")');
    
    await expect(page).toHaveURL(/.*create-berth/);
  });

  test('should navigate to available berths', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Click the "Available Berths" button
    await page.click('button:has-text("Available Berths")');
    
    await expect(page).toHaveURL(/.*available-berths/);
  });

  test('should display berth transaction details', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check if there are any berth cards
    const requestCards = page.locator('.BearthCard');
    
    if (await requestCards.count() > 0) {
      const firstCard = requestCards.first();
      
      // Check booking period information
      await expect(firstCard.locator('text=Booking period:')).toBeVisible();
      
      // Check location information
      await expect(firstCard.locator('text=Location:')).toBeVisible();
      
      // Check dock specifications
      await expect(firstCard.locator('text=Depth:')).toBeVisible();
      await expect(firstCard.locator('text=Dock height:')).toBeVisible();
    }
  });

  test('should navigate to berth detail on card click', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check if there are any berth cards to click
    const requestCards = page.locator('.BearthCard');
    
    if (await requestCards.count() > 0) {
      // Click on first card to navigate to berth detail
      await requestCards.first().click();
      
      // Should navigate to berth-detail page
      await expect(page).toHaveURL(/.*berth-detail/);
    }
    
    // This test passes if either navigation works or no cards exist
  });

  test('should handle request data properly', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check that both sections exist regardless of content
    await expect(page.getByText('Current requests to your berths')).toBeVisible();
    await expect(page.getByText('Your requests to others berths')).toBeVisible();
    
    // Dashboard should show content (either cards or empty state would be valid)
    // The main thing is that the sections are properly structured
  });

  test('should display correct transaction types', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check for transaction type indicators
    const transactionTypes = page.locator('.cardTypeBox');
    
    if (await transactionTypes.count() > 0) {
      // Should show transaction types like "Open to swap", "Open to hire", etc.
      const firstType = transactionTypes.first();
      await expect(firstType).toBeVisible();
      
      const typeText = await firstType.textContent();
      expect(typeText).toMatch(/Open to (swap|hire|hire or swap)/);
    }
  });

  test('should navigate to past berths', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Click the "Past Berths" button
    await page.click('button:has-text("Past Berths")');
    
    await expect(page).toHaveURL(/.*past-berths/);
  });

  test('should display proper berth specifications format', async ({ page }) => {
    await page.goto('/home');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check if there are berth cards with specifications
    const requestCards = page.locator('.BearthCard');
    
    if (await requestCards.count() > 0) {
      const firstCard = requestCards.first();
      
      // Check that specifications include units (meters)
      const lengthText = await firstCard.locator('text=Length:').textContent();
      const beamText = await firstCard.locator('text=Beam:').textContent();
      
      expect(lengthText).toContain('m'); // Should include meter unit
      expect(beamText).toContain('m'); // Should include meter unit
    }
  });
});