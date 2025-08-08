import { test, expect } from '@playwright/test';

test.describe('Contact Functionality', () => {
  test('should show 404 for contact route', async ({ page }) => {
    await page.goto('/contact');
    
    // Contact route doesn't exist, should show 404
    await expect(page.getByText('404 - Page Not Found')).toBeVisible();
    await expect(page.getByText('Sorry, the page you are looking for does not exist.')).toBeVisible();
  });

  test('should have go home button on 404 page', async ({ page }) => {
    await page.goto('/contact');
    
    // Should have a way to go back home
    const goHomeButton = page.locator('button:has-text("Go to Home")');
    await expect(goHomeButton).toBeVisible();
    await expect(goHomeButton).toBeEnabled();
  });

  test('should display footer with contact info on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for Mooringmate contact information in footer
    await expect(page.getByText('© Copyright 2025 - Mooringmate. All Rights Reserved.')).toBeVisible();
    
    // Check that footer section exists
    const footerSection = page.locator('footer, .footer, .MuiContainer-root').last();
    await expect(footerSection).toBeVisible();
  });

  test('should navigate back to home from 404', async ({ page }) => {
    await page.goto('/contact');
    
    // Click go home button
    await page.click('button:has-text("Go to Home")');
    
    // Should navigate to homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Mooring made easy')).toBeVisible();
  });

  test('should display privacy policy link as contact option', async ({ page }) => {
    await page.goto('/');
    
    // Privacy policy could be a way to contact/get info about the company
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  test.skip('ContactForm component is available but not used', async ({ page }) => {
    // The ContactForm component exists in the codebase with these fields:
    // - Name (required)  
    // - Email (required, type="email")
    // - Phone (optional, type="tel", name="phn")
    // - Message (required, multiline)
    // - Checkbox for data consent (required)
    // - Submit button with loading state
    
    // But it's commented out in the Dockingmate.jsx component
    // If it were enabled, it would be at the bottom of the homepage
  });

  test.skip('should submit contact form when enabled', async ({ page }) => {
    // Skipped - ContactForm is commented out in homepage
    // When enabled, the form would:
    // 1. Validate required fields (name, email, message, consent checkbox)
    // 2. Show loading state during submission
    // 3. Call sendContact service
    // 4. Show success/error toast messages
  });

  test.skip('should validate contact form fields when enabled', async ({ page }) => {
    // Skipped - ContactForm is commented out
    // Form validation would include:
    // - Required field validation for name, email, message
    // - Email format validation (HTML5 type="email")
    // - Phone field is optional (name="phn")
    // - Required consent checkbox
  });

  test.skip('should show loading state during form submission', async ({ page }) => {
    // Skipped - ContactForm is commented out
    // Would show CircularProgress component during submission
    // Button text changes from "Send Message" to loading spinner
  });

  test.skip('should handle form submission success', async ({ page }) => {
    // Skipped - ContactForm is commented out
    // On success: shows toast.success with response message
    // Form state would be handled by React component
  });

  test.skip('should handle form submission error', async ({ page }) => {
    // Skipped - ContactForm is commented out  
    // On error: shows toast.error "Something went wrong, please try again later."
  });

  test('should have working 404 page navigation', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Any non-existent route should show 404
    await expect(page.getByText('404 - Page Not Found')).toBeVisible();
    
    // Should have navigation back to main site - use more specific selectors
    await expect(page.locator('nav button:has-text("Home")')).toBeVisible();
    await expect(page.locator('nav button:has-text("Login")')).toBeVisible();
  });

  test('should maintain header navigation on 404 pages', async ({ page }) => {
    await page.goto('/invalid-route');
    
    // Header navigation should still be present - use nav context
    await expect(page.locator('nav button:has-text("Home")')).toBeVisible();
    await expect(page.locator('nav button:has-text("About")')).toBeVisible();
    await expect(page.locator('nav button:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('nav button:has-text("Blog")')).toBeVisible();
    await expect(page.locator('nav button:has-text("Login")')).toBeVisible();
  });
});