-- CreateEnum
CREATE TYPE "AssessmentSource" AS ENUM ('ADMIN', 'SELF');

-- DropForeignKey on Assessment.takenById to allow nullable
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_takenById_fkey";

-- AlterTable Assessment: takenById nullable, add source + tokenId
ALTER TABLE "Assessment"
  ALTER COLUMN "takenById" DROP NOT NULL,
  ADD COLUMN "source" "AssessmentSource" NOT NULL DEFAULT 'ADMIN',
  ADD COLUMN "tokenId" TEXT;

-- CreateTable AssessmentToken
CREATE TABLE "AssessmentToken" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revoked" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "AssessmentToken_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE UNIQUE INDEX "AssessmentToken_token_key" ON "AssessmentToken"("token");
CREATE INDEX "AssessmentToken_employeeId_idx" ON "AssessmentToken"("employeeId");
CREATE INDEX "AssessmentToken_token_idx" ON "AssessmentToken"("token");

-- Re-add Assessment.takenById FK as nullable
ALTER TABLE "Assessment"
  ADD CONSTRAINT "Assessment_takenById_fkey"
  FOREIGN KEY ("takenById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AssessmentToken FK
ALTER TABLE "AssessmentToken"
  ADD CONSTRAINT "AssessmentToken_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Assessment.tokenId FK (set null on token delete to preserve assessment record)
ALTER TABLE "Assessment"
  ADD CONSTRAINT "Assessment_tokenId_fkey"
  FOREIGN KEY ("tokenId") REFERENCES "AssessmentToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
