import { test, expect } from '@playwright/test';
import { HomePage } from '../pom/HomePage';

test.describe('Core Discovery & Aesthetic Validation', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should render homepage with correct Khmer Minimalist aesthetics', async () => {
    // 1. Initial load verification
    await expect(homePage.heroSection).toBeVisible();

    // 2. Class Assertions for Design System
    await homePage.validateAesthetics();

    // 3. Visual Regression (Snapshot)
    await homePage.performVisualRegression();
  });

  test('should execute search and filter without full page reload', async ({ page }) => {
    // Intercept network to verify no full document reload
    let reloadCount = 0;
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) reloadCount++;
    });

    // Perform Search
    await homePage.search('Villa');
    
    // Verify results UI updates
    await expect(homePage.resultsList).toBeVisible();
    
    // Verify "No Full Page Reload" (Initial goto = 1, subsequent navigations should be client-side)
    expect(reloadCount).toBeLessThanOrEqual(1); 
  });
});
