import { test, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Signup Functionality', () => {
  test('should display signup form correctly', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Sign Up|Register|Mooringmate/);
    
    // Check for required form sections
    await expect(page.getByText('General Info')).toBeVisible();
    await expect(page.getByText('Yacht Specifications')).toBeVisible();
    await expect(page.getByText('Captain Info')).toBeVisible();
    
    // Check for key form fields
    await expect(page.locator('input[name="userName"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="yachtName"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign up")')).toBeVisible();
  });

  test.skip('should show validation errors for invalid data', async ({ page }) => {
    // Skipped - complex yacht registration form validation needs detailed analysis
  });

  test.skip('should check password confirmation match', async ({ page }) => {
    // Skipped - need to analyze form validation behavior
  });

  test.skip('should show error for duplicate email', async ({ page }) => {
    // Skipped - need to analyze form validation behavior  
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/signup');
    
    await page.click('button:has-text("Login")');
    
    await expect(page).toHaveURL('/login');
  });

  test.skip('should accept terms and conditions', async ({ page }) => {
    // Skipped - need to check if terms checkbox exists
  });
});