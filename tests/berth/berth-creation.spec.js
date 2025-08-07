import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../utils/auth-helpers.js';
import { PageHelpers } from '../../utils/page-helpers.js';
import { testBerths } from '../../fixtures/test-data.js';

test.describe('Berth Creation Functionality', () => {
  let authHelpers;
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    pageHelpers = new PageHelpers(page);
    await authHelpers.login();
  });

  test('should display berth creation form correctly', async ({ page }) => {
    await page.goto('/home/create-berth');
    await expect(page).toHaveTitle(/Create Berth|Add Berth|Mooringmate/);
    
    // Check main form elements are visible
    await expect(page.getByText('Create Bearth')).toBeVisible();
    await expect(page.getByText('List your own Berth')).toBeVisible();
    
    // Check key form fields
    await expect(page.getByRole('textbox', { name: 'Berth name' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Rate per day ($)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Length (meters)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Beam (meters)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Depth (meters)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Dock height (meters)' })).toBeVisible();
    await expect(page.locator('button:has-text("Submit")')).toBeVisible();
  });

  test('should display all required form sections', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check image upload section
    await expect(page.locator('.blogImageParent')).toBeVisible();
    await expect(page.locator('button:has-text("Select image")')).toBeVisible();
    
    // Check location and date selection buttons
    await expect(page.locator('button:has-text("location")')).toBeVisible();
    await expect(page.locator('button:has-text("availability slot")')).toBeVisible();
    
    // Check power selection dropdown
    await expect(page.locator('label:has-text("Power")')).toBeVisible();
  });

  test('should display berth availability options', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check radio buttons for berth availability
    await expect(page.getByText('Make berth available for')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Swap' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Hire (rent)' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Both' })).toBeVisible();
  });

  test('should show power requirement options', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Click the actual select dropdown instead of label
    await page.click('#power');
    
    // Check some power options are available
    await expect(page.getByText('No Power Required')).toBeVisible();
    await expect(page.getByText('16 Amp Single Phase')).toBeVisible();
    await expect(page.getByText('30 Amp Service')).toBeVisible();
  });

  test('should display Your Berths section', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check Your Berths section
    await expect(page.getByText('Your Berths')).toBeVisible();
    
    // Should show either berths or "Berths not available!" message
    // This depends on user's existing berths
  });

  test('should require essential fields', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check required fields have required attribute or asterisk
    await expect(page.getByRole('textbox', { name: 'Berth name' })).toHaveAttribute('required');
    await expect(page.getByRole('textbox', { name: 'Port authority\'s email' })).toHaveAttribute('required');
    await expect(page.getByRole('spinbutton', { name: 'Rate per day ($)' })).toHaveAttribute('required');
    
    // Check location and availability slot buttons show asterisk
    await expect(page.locator('button:has-text("location *")')).toBeVisible();
    await expect(page.locator('button:has-text("availability slot *")')).toBeVisible();
  });

  test('should handle form submission attempt without required fields', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Form should prevent submission due to HTML5 validation or show toast error
    // The page should remain on the create berth page
    await expect(page.getByText('Create Bearth')).toBeVisible();
  });

  test('should show correct button text based on form state', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Initially should show "Submit" for new berth
    await expect(page.locator('button[type="submit"]:has-text("Submit")')).toBeVisible();
    
    // Button text changes to "update" when editing existing berth
    // This would require actual berth data manipulation to test fully
  });

  test('should display proper form layout and styling', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check form is in a card layout
    await expect(page.locator('.MuiCard-root')).toBeVisible();
    await expect(page.locator('.MuiCardContent-root')).toBeVisible();
    
    // Check grid layout is used - use first() to avoid strict mode violation
    await expect(page.locator('.MuiGrid-container').first()).toBeVisible();
  });

  test('should validate email field format', async ({ page }) => {
    await page.goto('/home/create-berth');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check email field type
    const emailField = page.getByRole('textbox', { name: 'Port authority\'s email' });
    await expect(emailField).toHaveAttribute('type', 'email');
    
    // Try entering invalid email
    await emailField.fill('invalid-email');
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    await expect(page.getByText('Create Bearth')).toBeVisible();
  });
});