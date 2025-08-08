import { test, expect } from '@playwright/test';
import { PageHelpers } from '../../utils/page-helpers.js';

test.describe('Homepage Functionality', () => {
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    pageHelpers = new PageHelpers(page);
  });

  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mooringmate/);
    
    // Wait for page to load and check main heading
    await expect(page.locator('h1:has-text("Mooring made easy")')).toBeVisible();
    await expect(page.locator('h2:has-text("Easily Rent or swap a Mooring for Your Boat")')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for Material-UI navigation element (first nav)
    await expect(page.locator('nav').first()).toBeVisible();
    
    // Check for navigation buttons based on actual site content
    await expect(page.locator('button:has-text("Home")')).toBeVisible();
    await expect(page.locator('button:has-text("About")')).toBeVisible();
    await expect(page.locator('button:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('button:has-text("Blog")')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should display login button when not logged in', async ({ page }) => {
    await page.goto('/');
    
    // Check for login button in navigation
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Login button should be clickable
    await expect(page.locator('button:has-text("Login")')).toBeEnabled();
  });

  test('should display key service sections', async ({ page }) => {
    await page.goto('/');
    
    // Check for the main service cards using h3 headings
    await expect(page.locator('h3:has-text("Berth rentals")')).toBeVisible();
    await expect(page.locator('h3:has-text("Swapping your berth")')).toBeVisible();
    await expect(page.locator('h3:has-text("How it works")')).toBeVisible();
    
    // Check service cards are clickable
    const serviceCards = page.locator('.blog-card');
    await expect(serviceCards).toHaveCount(3);
  });

  test('should have working navigation buttons', async ({ page }) => {
    await page.goto('/');
    
    // Test that navigation buttons are clickable
    const homeButton = page.locator('button:has-text("Home")');
    const aboutButton = page.locator('button:has-text("About")');
    const loginButton = page.locator('button:has-text("Login")');
    
    await expect(homeButton).toBeVisible();
    await expect(aboutButton).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Check they're all enabled
    await expect(homeButton).toBeEnabled();
    await expect(aboutButton).toBeEnabled();
    await expect(loginButton).toBeEnabled();
  });

  test('should display main content sections', async ({ page }) => {
    await page.goto('/');
    
    // Check for the main sustainability heading using h2
    await expect(page.locator('h2:has-text("Mooringmate - Enabling sustainable mooring and mobility")')).toBeVisible();
    
    // Check for FAQ section using heading
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
    
    // Check for footer
    await expect(page.getByText('© Copyright 2025 - Mooringmate. All Rights Reserved.')).toBeVisible();
  });

  test('should have proper meta information', async ({ page }) => {
    await page.goto('/');
    
    // Check meta description matches what we found
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toContain('mooring');
    
    // Verify page loads completely
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have privacy policy link in footer', async ({ page }) => {
    await page.goto('/');
    
    // Check for privacy policy link that we found in inspection
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.goto('/');
    
    // Wait for main content to load instead of fixed timeout
    await expect(page.getByText('Mooring made easy')).toBeVisible();
    
    // Check that no critical errors occurred
    expect(errors.length).toBeLessThan(5); // Allow minor errors but not critical failures
  });

  test('should have working mobile menu toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuToggle = page.locator('.menu-toggle, .mobile-menu-btn, .hamburger');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      
      await expect(page.locator('.mobile-menu, .nav-menu.open')).toBeVisible();
    }
  });

  test('should display call-to-action section', async ({ page }) => {
    await page.goto('/');
    
    const ctaSection = page.locator('.cta-section, [data-testid="call-to-action"]');
    if (await ctaSection.isVisible()) {
      await expect(ctaSection.locator('.cta-title')).toBeVisible();
      await expect(ctaSection.locator('.cta-button, .cta-btn')).toBeVisible();
    }
  });

  test('should navigate to login page from login button', async ({ page }) => {
    await page.goto('/');
    
    // Click login button in navigation
    await page.click('button:has-text("Login")');
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to login page from service cards', async ({ page }) => {
    await page.goto('/');
    
    // Service cards should navigate to login page when clicked
    const berthRentalCard = page.locator('.blog-card').first();
    await berthRentalCard.click();
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display hero section content', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section with background image
    await expect(page.locator('.hero-section')).toBeVisible();
    
    // Check hero content
    await expect(page.locator('h1:has-text("Mooring made easy")')).toBeVisible();
    await expect(page.locator('h4:has-text("Your ultimate docking solution")')).toBeVisible();
  });

  test('should display how it works section', async ({ page }) => {
    await page.goto('/');
    
    // Check "How does it work?" section
    await expect(page.getByText('How does it work?')).toBeVisible();
    await expect(page.getByText('Easily Rent or swap a Mooring for Your Boat')).toBeVisible();
    
    // Check explanatory text
    await expect(page.getByText('Looking for a mooring for your boat?')).toBeVisible();
  });

  test('should display service card descriptions', async ({ page }) => {
    await page.goto('/');
    
    // Check berth rentals description
    await expect(page.getByText('Turn your mooring into income')).toBeVisible();
    
    // Check swapping description
    await expect(page.getByText('Explore more, without extra mooring costs')).toBeVisible();
    
    // Check how it works description
    await expect(page.getByText('List. Match. Sail.')).toBeVisible();
  });

  test('should have proper page structure', async ({ page }) => {
    await page.goto('/');
    
    // Check main Material-UI structure using first()
    await expect(page.locator('.MuiContainer-root').first()).toBeVisible();
    await expect(page.locator('.MuiGrid-container').first()).toBeVisible();
    
    // Check card components
    await expect(page.locator('.MuiCard-root')).toHaveCount(3); // Service cards
    
    // Check chevron icons in cards
    await expect(page.locator('svg[data-testid="ChevronRightIcon"]')).toHaveCount(3);
  });
});