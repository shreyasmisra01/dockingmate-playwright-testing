import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../utils/auth-helpers.js';
import { PageHelpers } from '../../utils/page-helpers.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('User Profile Functionality', () => {
  let authHelpers;
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    pageHelpers = new PageHelpers(page);
    await authHelpers.login();
  });

  test('should display user profile information', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check main profile heading and structure
    await expect(page.getByText('Profile')).toBeVisible();
    
    // Check profile image section
    await expect(page.locator('img[alt="profile img"]')).toBeVisible();
    await expect(page.locator('img[alt="click to select profile"]')).toBeVisible();
    await expect(page.locator('button:has-text("Update Image")')).toBeVisible();
    
    // Check main form sections
    await expect(page.getByText('General Info')).toBeVisible();
    await expect(page.getByText('Yacht Specifications')).toBeVisible();
    await expect(page.getByText('Captain Info')).toBeVisible();
  });

  test('should edit basic yacht information', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Update yacht name and IMO/HULL number
    const yachtNameField = page.getByRole('textbox', { name: 'Yacht Name' });
    const imoHullField = page.getByRole('textbox', { name: 'IMO/HULL number' });
    
    await yachtNameField.fill('Updated Yacht');
    await imoHullField.fill('UPDATED123');
    
    // Update button should be visible
    await expect(page.locator('button[type="submit"]:has-text("Update")')).toBeVisible();
  });

  test('should handle profile picture upload functionality', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check profile image elements exist
    await expect(page.locator('img[alt="profile img"]')).toBeVisible();
    await expect(page.locator('img[alt="click to select profile"]')).toBeVisible();
    
    // Update Image button should be disabled initially
    const updateImageBtn = page.locator('button:has-text("Update Image")');
    await expect(updateImageBtn).toBeDisabled();
    
    // File input should exist (hidden)
    await expect(page.locator('input[type="file"][accept="image/*"]')).toBeAttached();
  });

  test('should display yacht type radio buttons', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check yacht type radio buttons
    await expect(page.getByText('Yacht type')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Motor' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Sailing' })).toBeVisible();
    
    // Check hull type radio buttons
    await expect(page.getByText('Hull type')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Mono hull' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Multi hull' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Trimaran' })).toBeVisible();
  });

  test('should display yacht specifications fields', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check yacht specifications number fields
    await expect(page.getByRole('spinbutton', { name: 'Length (meters)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Beam (meters)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Draft (meters)' })).toBeVisible();
    
    // Check power requirement dropdown
    await expect(page.getByRole('combobox', { name: 'Power requirement' })).toBeVisible();
  });

  test('should display captain information fields', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check captain info section
    await expect(page.getByText('Captain Info')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Cell Number' })).toBeVisible();
    
    // Check captain email field (different from user login email)
    const captainEmailField = page.locator('#captainEmail');
    await expect(captainEmailField).toBeVisible();
  });

  test('should display vessel document upload sections', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check vessel insurance upload
    await expect(page.locator('button:has-text("Upload vessel insurance")')).toBeVisible();
    await expect(page.getByText('no file chosen').first()).toBeVisible();
    
    // Check vessel registration upload
    await expect(page.locator('button:has-text("Upload vessel Registration")')).toBeVisible();
    await expect(page.getByText('no file chosen').last()).toBeVisible();
  });

  test('should show disabled email field with explanation', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check that main email field is disabled in update mode
    const emailField = page.locator('#username');
    await expect(emailField).toBeDisabled();
    await expect(page.getByText('You can\'t update your email')).toBeVisible();
  });

  test('should handle yacht type selection', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Test yacht type radio button selection
    const motorRadio = page.locator('input[name="yachtType"][value="Motor"]');
    const sailingRadio = page.locator('input[name="yachtType"][value="Sailing"]');
    
    // Should be able to select motor type
    await motorRadio.check();
    await expect(motorRadio).toBeChecked();
    
    // Should be able to change to sailing type
    await sailingRadio.check();
    await expect(sailingRadio).toBeChecked();
    await expect(motorRadio).not.toBeChecked();
  });

  test('should handle hull type selection', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Test hull type radio button selection using specific input selectors
    const monoHullRadio = page.locator('input[name="hullType"][value="Mono hull"]');
    const multiHullRadio = page.locator('input[name="hullType"][value="Multi hull"]');
    const trimaranRadio = page.locator('input[name="hullType"][value="Trimaran"]');
    
    // Should be able to select different hull types
    await multiHullRadio.check();
    await expect(multiHullRadio).toBeChecked();
    
    await monoHullRadio.check();
    await expect(monoHullRadio).toBeChecked();
  });

  test('should validate numeric yacht specification fields', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Test that yacht specification fields accept numbers
    const lengthField = page.getByRole('spinbutton', { name: 'Length (meters)' });
    const beamField = page.getByRole('spinbutton', { name: 'Beam (meters)' });
    const draftField = page.getByRole('spinbutton', { name: 'Draft (meters)' });
    
    await lengthField.fill('25');
    await beamField.fill('8');
    await draftField.fill('2.5');
    
    await expect(lengthField).toHaveValue('25');
    await expect(beamField).toHaveValue('8');
    await expect(draftField).toHaveValue('2.5');
  });

  test('should display power requirement options', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Click power requirement dropdown
    await page.click('[id="powerReqDrop"]');
    
    // Check some power options are available
    await expect(page.getByText('No Power Required')).toBeVisible();
    await expect(page.getByText('16 Amp Single Phase')).toBeVisible();
    await expect(page.getByText('30 Amp Service')).toBeVisible();
  });

  test('should update captain contact information', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Test updating captain info using specific field IDs
    const captainNameField = page.locator('#name');
    const cellNumberField = page.locator('#cellNumber');
    const captainEmailField = page.locator('#captainEmail');
    
    await captainNameField.fill('Updated Captain');
    await cellNumberField.fill('1234567890');
    await captainEmailField.fill('updated.captain@test.com');
    
    await expect(captainNameField).toHaveValue('Updated Captain');
    await expect(cellNumberField).toHaveValue('1234567890');
    await expect(captainEmailField).toHaveValue('updated.captain@test.com');
  });

  test('should handle form submission with update button', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check that form has Update button
    const updateButton = page.locator('button[type="submit"]:has-text("Update")');
    await expect(updateButton).toBeVisible();
    
    // Form should be submittable (button not disabled)
    await expect(updateButton).toBeEnabled();
  });

  test('should display proper form structure and layout', async ({ page }) => {
    await page.goto('/home/profile');
    await pageHelpers.waitForLoadingToDisappear();
    
    // Check that profile uses card layout
    await expect(page.locator('.MuiCard-root')).toBeVisible();
    await expect(page.locator('.MuiCardContent-root')).toBeVisible();
    
    // Check grid layout is used
    await expect(page.locator('.MuiGrid-container').first()).toBeVisible();
    
    // Check form element exists
    await expect(page.locator('form')).toBeVisible();
  });
});