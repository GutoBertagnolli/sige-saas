ALTER TABLE "Absence"
ADD COLUMN "hourBankExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hourBankExemptionReason" TEXT;
