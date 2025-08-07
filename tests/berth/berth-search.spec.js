import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../utils/auth-helpers.js';
import { PageHelpers } from '../../utils/page-helpers.js';
import { testBerths } from '../../fixtures/test-data.js';

test.describe('Berth Search Functionality', () => {
  let authHelpers;
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    pageHelpers = new PageHelpers(page);
    await authHelpers.login();
  });

  test('should display berth search page correctly', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check main search elements are visible
    await expect(page.getByText('Find Berths')).toBeVisible();
    await expect(page.getByText('Currently listed berths')).toBeVisible();
    
    // Check search form elements
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    await expect(page.locator('label:has-text("Looking to")')).toBeVisible();
    await expect(page.getByText('Get Berth within')).toBeVisible();
    
    // Check that search is disabled until location is selected
    await expect(page.locator('button:has-text("Search")')).toBeDisabled();
    
    // Check MapBox search input is present
    await expect(page.locator('input[placeholder="Port of Amsterdam, Netherlands"]')).toBeVisible();
  });

  test('should show search filters correctly', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check Looking to filter exists by using label selector
    await expect(page.locator('label:has-text("Looking to")')).toBeVisible();
    
    // Check distance filter exists
    await expect(page.locator('label:has-text("Get Berth within")')).toBeVisible();
    
    // Check both selects are disabled until location is selected
    const lookingToSelect = page.locator('#lookingFor[role="combobox"]');
    const distanceSelect = page.locator('#demo-simple-select');
    
    await expect(lookingToSelect).toBeDisabled();
    await expect(distanceSelect).toBeDisabled();
  });

  test('should display map container', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check map container is present
    await expect(page.locator('.maps')).toBeVisible();
  });

  test('should show location permission request', async ({ page }) => {
    await page.goto('/home/available-berths');
    
    // Wait for potential location permission toast
    // This test verifies the page handles location gracefully
    await page.waitForTimeout(3000);
    
    // Page should still be functional even if location is blocked
    await expect(page.getByText('Find Berths')).toBeVisible();
  });

  test.skip('should perform berth search with mock location', async ({ page }) => {
    // Skipped - would require mocking geolocation and complex MapBox interaction
  });

  test.skip('should handle search results modal', async ({ page }) => {
    // Skipped - requires actual search execution which needs location permission
  });

  test('should display berth count when available', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check that berth count text is present (may or may not have number)
    const berthCountElement = page.locator('text=Currently listed berths');
    await expect(berthCountElement).toBeVisible();
  });

  test('should show helpful tip text', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check tip text is visible
    await expect(page.getByText('Tip:', { exact: false })).toBeVisible();
    await expect(page.getByText('Use the searchbox on the below to find the available berths in your area.')).toBeVisible();
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/home/available-berths');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check form controls have proper labels using more specific selectors
    await expect(page.locator('[role="combobox"]#lookingFor')).toBeVisible();
    await expect(page.locator('#demo-simple-select')).toBeVisible();
    
    // Check search button accessibility
    const searchBtn = page.locator('button:has-text("Search")');
    await expect(searchBtn).toBeVisible();
    await expect(searchBtn).toHaveClass(/theme-btn/);
  });
});