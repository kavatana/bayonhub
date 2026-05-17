CREATE INDEX IF NOT EXISTS "Listing_status_deletedAt_createdAt_idx"
  ON "Listing"("status", "deletedAt", "createdAt");

CREATE INDEX IF NOT EXISTS "Listing_status_deletedAt_categorySlug_createdAt_idx"
  ON "Listing"("status", "deletedAt", "categorySlug", "createdAt");

CREATE INDEX IF NOT EXISTS "Listing_status_deletedAt_province_createdAt_idx"
  ON "Listing"("status", "deletedAt", "province", "createdAt");

CREATE INDEX IF NOT EXISTS "Listing_status_deletedAt_promoted_createdAt_idx"
  ON "Listing"("status", "deletedAt", "promoted", "createdAt");

CREATE INDEX IF NOT EXISTS "Listing_status_deletedAt_province_district_idx"
  ON "Listing"("status", "deletedAt", "province", "district");

CREATE INDEX IF NOT EXISTS "Listing_district_idx"
  ON "Listing"("district");

CREATE INDEX IF NOT EXISTS "Listing_price_idx"
  ON "Listing"("price");

CREATE INDEX IF NOT EXISTS "Listing_viewCount_idx"
  ON "Listing"("viewCount");
