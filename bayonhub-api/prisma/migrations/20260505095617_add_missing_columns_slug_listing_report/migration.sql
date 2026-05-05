-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ListingStatus" ADD VALUE 'PENDING';
ALTER TYPE "ListingStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "listing_search_idx";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "search_vector" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "evidenceUrl" TEXT,
ADD COLUMN     "listingTitle" TEXT,
ADD COLUMN     "reporterSessionId" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

