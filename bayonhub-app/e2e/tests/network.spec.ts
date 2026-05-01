import { test, expect } from '@playwright/test';
import { HomePage } from '../pom/HomePage';

test.describe('Network Resilience & Edge Connectivity', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('should show Limited Mode banner on API timeout/error', async ({ page }) => {
    // 1. Intercept all API calls and return 500
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Edge timeout simulation' }),
      });
    });

    await homePage.goto();

    // 2. Assert Limited Mode banner appears
    await expect(homePage.limitedModeBanner).toBeVisible();
  });

  test('should show Offline banner when browser goes offline', async ({ page, context }) => {
    await homePage.goto();
    
    // 1. Simulate complete offline state
    await context.setOffline(true);

    // 2. Assert Offline banner renders (resilience check)
    await expect(homePage.offlineBanner).toBeVisible();

    // 3. Restore network and assert banner removal
    await context.setOffline(false);
    await expect(homePage.offlineBanner).not.toBeVisible();
  });
});
