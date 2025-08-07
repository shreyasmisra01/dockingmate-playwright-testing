export class PageHelpers {
  constructor(page) {
    this.page = page;
  }

  async waitForLoadingToDisappear() {
    await this.page.waitForFunction(
      () => !document.querySelector('.loading, .spinner, [data-testid="loading"]'),
      { timeout: 10000 }
    );
  }

  async fillFormField(selector, value) {
    await this.page.fill(selector, value);
    await this.page.waitForTimeout(100);
  }

  async selectDropdownOption(selector, value) {
    await this.page.selectOption(selector, value);
  }

  async uploadFile(selector, filePath) {
    await this.page.setInputFiles(selector, filePath);
  }

  async waitForApiResponse(urlPattern) {
    return await this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === 200
    );
  }

  async scrollToElement(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async takeScreenshotOnFailure(testInfo) {
    if (testInfo.status !== testInfo.expectedStatus) {
      await this.page.screenshot({ 
        path: `test-results/failure-${testInfo.title}-${Date.now()}.png`,
        fullPage: true 
      });
    }
  }

  async verifyPageTitle(expectedTitle) {
    const title = await this.page.title();
    return title.includes(expectedTitle);
  }

  async verifyUrl(expectedPath) {
    const url = this.page.url();
    return url.includes(expectedPath);
  }
}