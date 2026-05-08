ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bumpedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Listing_bumpedAt_idx" ON "Listing"("bumpedAt");
