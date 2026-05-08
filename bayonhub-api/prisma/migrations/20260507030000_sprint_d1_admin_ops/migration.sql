ALTER TYPE "ListingStatus" ADD VALUE 'FLAGGED';
ALTER TYPE "ListingStatus" ADD VALUE 'HIDDEN';
ALTER TYPE "ListingStatus" ADD VALUE 'DELETED';

ALTER TABLE "User"
  ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "banReason" TEXT,
  ADD COLUMN "bannedUntil" TIMESTAMP(3);

CREATE TABLE "FeaturedListing" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "FeaturedListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeaturedListing_listingId_key" ON "FeaturedListing"("listingId");
CREATE INDEX "FeaturedListing_listingId_idx" ON "FeaturedListing"("listingId");
CREATE INDEX "FeaturedListing_adminId_idx" ON "FeaturedListing"("adminId");

ALTER TABLE "FeaturedListing"
  ADD CONSTRAINT "FeaturedListing_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeaturedListing"
  ADD CONSTRAINT "FeaturedListing_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Appeal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appeal_userId_idx" ON "Appeal"("userId");
CREATE INDEX "Appeal_status_idx" ON "Appeal"("status");

ALTER TABLE "Appeal"
  ADD CONSTRAINT "Appeal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "User"
SET "isAdmin" = true
WHERE "role" = 'ADMIN' OR "email" = 'admin@bayonhub.com';
