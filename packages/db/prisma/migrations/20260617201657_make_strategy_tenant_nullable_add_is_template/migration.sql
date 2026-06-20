-- AlterTable
ALTER TABLE "strategies" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tenantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "goals" DROP DEFAULT;

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "weight" DECIMAL(5,2),
    "neck" DECIMAL(5,2),
    "chest" DECIMAL(5,2),
    "waist" DECIMAL(5,2),
    "hip" DECIMAL(5,2),
    "leftArm" DECIMAL(5,2),
    "rightArm" DECIMAL(5,2),
    "leftThigh" DECIMAL(5,2),
    "rightThigh" DECIMAL(5,2),
    "calf" DECIMAL(5,2),
    "bodyFatPct" DECIMAL(4,2),
    "muscleMassPct" DECIMAL(4,2),
    "visceralFat" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "body_measurements_tenantId_measuredAt_idx" ON "body_measurements"("tenantId", "measuredAt");

-- CreateIndex
CREATE INDEX "strategies_isTemplate_idx" ON "strategies"("isTemplate");

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
