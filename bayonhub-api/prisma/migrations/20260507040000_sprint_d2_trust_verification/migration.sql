CREATE TABLE "PhoneOTP" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneOTP_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PhoneOTP_phone_idx" ON "PhoneOTP"("phone");

CREATE TABLE "VerificationRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "idFrontUrl" TEXT NOT NULL,
  "idBackUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "adminNote" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationRequest_userId_key" ON "VerificationRequest"("userId");
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

ALTER TABLE "VerificationRequest"
  ADD CONSTRAINT "VerificationRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isVerifiedSeller" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lastSeen" TIMESTAMP(3),
  ADD COLUMN "responseRate" DOUBLE PRECISION;

UPDATE "User"
SET "phoneVerified" = true
WHERE "phoneVerifiedAt" IS NOT NULL;
