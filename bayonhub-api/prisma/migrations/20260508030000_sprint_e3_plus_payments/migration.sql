-- Sprint E3: Plus payment receipt review fields.
-- Existing Payment/PaymentStatus infrastructure is preserved for promotion payments.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "screenshotUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
