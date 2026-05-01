import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly watermark: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly heroSection: Locator;
  readonly categoryFilter: Locator;
  readonly locationInput: Locator;
  readonly propertyTypeInput: Locator;
  readonly resultsList: Locator;
  readonly limitedModeBanner: Locator;
  readonly offlineBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.watermark = page.locator('div[aria-hidden="true"] img[src*="khmer-sketch"]');
    this.searchInput = page.getByPlaceholder(/Search iPhone, Honda/i);
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.heroSection = page.locator('section').filter({ hasText: /Buy, sell, and grow/i }).or(page.locator('section').filter({ hasText: /Buy & Sell Anything/i }));
    this.categoryFilter = page.getByRole('button', { name: /Categories/i });
    this.locationInput = page.getByPlaceholder(/Location/i).or(page.getByRole('button', { name: /All Cambodia/i }));
    this.propertyTypeInput = page.getByPlaceholder(/Property Type/i);
    this.resultsList = page.locator('[data-testid="listings-grid"]').or(page.locator('main .grid'));
    this.limitedModeBanner = page.getByRole('status').filter({ hasText: /Limited Mode/i });
    this.offlineBanner = page.getByRole('status').filter({ hasText: /offline/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async validateAesthetics() {
    // Assert the background watermark has the correct low-opacity class (Khmer Minimalist design)
    const watermarkContainer = this.page.locator('div[aria-hidden="true"]').first();
    await expect(watermarkContainer).toHaveClass(/opacity-\[0.03\]/);

    // Assert the Search Button uses the primary theme color (Deep Bayon Red)
    // Note: bg-primary is mapped to #C62828 in tailwind.config.js
    await expect(this.searchButton).toHaveClass(/bg-primary|bg-\[#C62828\]/);
  }

  async performVisualRegression() {
    // Hero section visual regression check
    await expect(this.heroSection).toHaveScreenshot('hero-khmer-minimalist.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  }
}
