-- CreateTable
CREATE TABLE "MerchantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeNameKm" TEXT,
    "tagline" TEXT,
    "taglineKm" TEXT,
    "bannerKey" TEXT,
    "logoKey" TEXT,
    "businessPhone" TEXT,
    "telegramHandle" TEXT,
    "facebookPage" TEXT,
    "businessHours" JSONB,
    "aboutUs" TEXT,
    "aboutUsKm" TEXT,
    "taxId" TEXT,
    "catalogConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_userId_key" ON "MerchantProfile"("userId");

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
