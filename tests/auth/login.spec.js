import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../utils/auth-helpers.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Login Functionality', () => {
  let authHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test('should login with valid credentials', async ({ page }) => {
    const user = testUsers.validUser;
    
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login|Mooringmate/);
    
    await page.fill('input[name="userName"]', user.email);
    await page.fill('input[name="Password"]', user.password);
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    await expect(page).toHaveURL(/\/home/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-label="Account settings"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="userName"]', 'invalid@example.com');
    await page.fill('input[name="Password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('The user does not exist.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');
    
    const emailError = page.locator('[data-testid="email-error"], .field-error').first();
    const passwordError = page.locator('[data-testid="password-error"], .field-error').last();
    
    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('a[href="/signup"], .signup-link');
    
    await expect(page).toHaveURL('/signup');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('a[href="/forgot-password"], .forgot-password-link');
    
    await expect(page).toHaveURL('/forgot-password');
  });

  test.skip('should remember user session', async ({ page, context }) => {
    await authHelpers.login();
    
    const newPage = await context.newPage();
    await newPage.goto('/home');
    
    await expect(newPage.locator('[aria-label="Account settings"]')).toBeVisible();
  });
});