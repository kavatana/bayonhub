import { expect, type Locator, type Page } from '@playwright/test';

export class ListingPage {
  readonly page: Page;
  readonly mapContainer: Locator;
  readonly threeJsCanvas: Locator;
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mapContainer = page.locator('#map').or(page.locator('.leaflet-container'));
    this.threeJsCanvas = page.locator('canvas').filter({ has: page.locator('..').locator('div') }); // Searching for the 3D canvas
    this.loader = page.locator('[role="progressbar"]').or(page.locator('.animate-pulse'));
  }

  async navigateToFirstListing() {
    await this.page.click('main .grid a:first-child');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Strategy for verifying lazy-loaded heavy assets (vendor-three, vendor-maps)
   * 1. Check for the presence of the container
   * 2. Wait for the heavy component to swap the loader
   * 3. Verify stable bounding box to ensure no layout shift
   */
  async verifyLazyLoadedAssets() {
    // 1. Verify Map (vendor-maps)
    await expect(this.mapContainer).toBeVisible({ timeout: 15000 });
    const mapBox = await this.mapContainer.boundingBox();
    expect(mapBox?.height).toBeGreaterThan(100);

    // 2. Verify 3D Model (vendor-three)
    // Three.js often takes longer to init. We wait for the canvas to be ready.
    await this.page.waitForSelector('canvas', { state: 'visible', timeout: 20000 });
    
    // Check for layout shift: The container should not jump in size after loading
    const initialBox = await this.page.locator('section').filter({ has: this.threeJsCanvas }).boundingBox();
    await this.page.waitForTimeout(1000); // Wait for potential GSAP transitions
    const finalBox = await this.page.locator('section').filter({ has: this.threeJsCanvas }).boundingBox();
    
    expect(initialBox?.y).toBe(finalBox?.y);
    expect(initialBox?.height).toBe(finalBox?.height);
  }
}
