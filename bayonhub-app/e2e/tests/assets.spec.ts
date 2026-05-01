import { test } from '@playwright/test';
import { ListingPage } from '../pom/ListingPage';

test.describe('Heavy Asset & Chunk Loading', () => {
  test('should lazy-load vendor-maps and vendor-three chunks on listing page', async ({ page }) => {
    const listingPage = new ListingPage(page);
    
    await page.goto('/');
    await listingPage.navigateToFirstListing();

    // Verify lazy assets load and don't cause layout shifts
    await listingPage.verifyLazyLoadedAssets();
  });
});
