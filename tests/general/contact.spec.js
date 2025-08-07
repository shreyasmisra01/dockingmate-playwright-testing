import { test, expect } from '@playwright/test';
import { contactForm } from '../../fixtures/test-data.js';

test.describe('Contact Form Functionality', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page).toHaveTitle(/Contact|Mooringmate/);
    
    await expect(page.locator('.contact-form, [data-testid="contact-form"]')).toBeVisible();
    
    await expect(page.locator('input[name="name"], [data-testid="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"], [data-testid="email"]')).toBeVisible();
    await expect(page.locator('input[name="subject"], [data-testid="subject"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"], [data-testid="message"]')).toBeVisible();
  });

  test('should submit contact form with valid data', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('input[name="name"]', contactForm.name);
    await page.fill('input[name="email"]', contactForm.email);
    await page.fill('input[name="subject"]', contactForm.subject);
    await page.fill('textarea[name="message"]', contactForm.message);
    
    await page.click('button[type="submit"], .submit-btn');
    
    await expect(page.locator('.success-message:has-text("sent"), .form-success')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/contact');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message, .field-error')).toHaveCount(4, { timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('input[name="email"]', 'invalid-email');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message:has-text("email"), .email-error')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.locator('.contact-info, [data-testid="contact-info"]')).toBeVisible();
    
    await expect(page.locator('.contact-email, .email-info')).toBeVisible();
    await expect(page.locator('.contact-phone, .phone-info')).toBeVisible();
    await expect(page.locator('.contact-address, .address-info')).toBeVisible();
  });

  test('should display office hours', async ({ page }) => {
    await page.goto('/contact');
    
    const officeHours = page.locator('.office-hours, [data-testid="office-hours"]');
    if (await officeHours.isVisible()) {
      await expect(officeHours.locator('.hours-title')).toBeVisible();
      await expect(officeHours.locator('.hours-list')).toBeVisible();
    }
  });

  test('should display contact map', async ({ page }) => {
    await page.goto('/contact');
    
    const mapContainer = page.locator('.contact-map, [data-testid="map"], .mapbox-map');
    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toBeVisible();
    }
  });

  test('should handle form submission failure', async ({ page }) => {
    await page.goto('/contact');
    
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });
    
    await page.fill('input[name="name"]', contactForm.name);
    await page.fill('input[name="email"]', contactForm.email);
    await page.fill('input[name="subject"]', contactForm.subject);
    await page.fill('textarea[name="message"]', contactForm.message);
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message:has-text("error"), .form-error')).toBeVisible();
  });

  test('should clear form after successful submission', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('input[name="name"]', contactForm.name);
    await page.fill('input[name="email"]', contactForm.email);
    await page.fill('input[name="subject"]', contactForm.subject);
    await page.fill('textarea[name="message"]', contactForm.message);
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.success-message')).toBeVisible();
    
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('input[name="subject"]')).toHaveValue('');
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
  });

  test('should display social media links', async ({ page }) => {
    await page.goto('/contact');
    
    const socialLinks = page.locator('.social-links, [data-testid="social-links"]');
    if (await socialLinks.isVisible()) {
      await expect(socialLinks.locator('a[href*="facebook"]')).toBeVisible();
      await expect(socialLinks.locator('a[href*="twitter"]')).toBeVisible();
      await expect(socialLinks.locator('a[href*="instagram"]')).toBeVisible();
    }
  });

  test('should show loading state during form submission', async ({ page }) => {
    await page.goto('/contact');
    
    await page.route('**/api/contact', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }, 2000);
    });
    
    await page.fill('input[name="name"]', contactForm.name);
    await page.fill('input[name="email"]', contactForm.email);
    await page.fill('input[name="subject"]', contactForm.subject);
    await page.fill('textarea[name="message"]', contactForm.message);
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.loading, .spinner, button:disabled')).toBeVisible();
  });

  test('should validate message length', async ({ page }) => {
    await page.goto('/contact');
    
    const shortMessage = 'Hi';
    const longMessage = 'a'.repeat(1001);
    
    await page.fill('textarea[name="message"]', shortMessage);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message:has-text("short"), .message-too-short')).toBeVisible();
    
    await page.fill('textarea[name="message"]', longMessage);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message:has-text("long"), .message-too-long')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/contact');
    
    const faqSection = page.locator('.faq-section, [data-testid="faq"]');
    if (await faqSection.isVisible()) {
      const faqItems = faqSection.locator('.faq-item, .faq-question');
      await expect(faqItems.first()).toBeVisible();
      
      await faqItems.first().click();
      await expect(faqSection.locator('.faq-answer').first()).toBeVisible();
    }
  });
});