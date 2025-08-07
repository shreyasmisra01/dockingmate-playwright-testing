import { expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-data.js';

export class AuthHelpers {
  constructor(page) {
    this.page = page;
  }

  async login(userType = 'validUser') {
    const user = testUsers[userType];
    
    await this.page.goto('/login');
    await this.page.fill('input[name="userName"]', user.email);
    await this.page.fill('input[name="Password"]', user.password);
    
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('[data-testid="login-button"], button[type="submit"], .login-btn')
    ]);

    await expect(this.page).toHaveURL(/\/home/);
  }

  async logout() {
    await this.page.click('[data-testid="logout-button"], .logout-btn, .user-menu');
    await this.page.click('[data-testid="confirm-logout"], .logout-confirm');
    await expect(this.page).toHaveURL('/');
  }

  async signup(userType = 'validUser') {
    const user = testUsers[userType];
    
    await this.page.goto('/signup');
    await this.page.fill('[name="firstName"], [data-testid="first-name"]', user.firstName);
    await this.page.fill('[name="lastName"], [data-testid="last-name"]', user.lastName);
    await this.page.fill('[name="email"], [data-testid="email"]', user.email);
    await this.page.fill('[name="password"], [data-testid="password"]', user.password);
    await this.page.fill('[name="phone"], [data-testid="phone"]', user.phone);
    
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('[data-testid="signup-button"], button[type="submit"], .signup-btn')
    ]);
  }

  async isLoggedIn() {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"], .user-profile, .logout-btn', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async resetPassword(email) {
    await this.page.goto('/forgot-password');
    await this.page.fill('[name="email"], [data-testid="email"]', email);
    await this.page.click('[data-testid="reset-button"], button[type="submit"]');
    
    await expect(this.page.locator('.success-message, .alert-success')).toBeVisible();
  }
}