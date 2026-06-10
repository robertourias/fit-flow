-- AlterTable: add auth and profile fields to users
ALTER TABLE "users"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "bio"          VARCHAR(300),
  ADD COLUMN "age"          INTEGER,
  ADD COLUMN "goals"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deletedAt"    TIMESTAMP(3);

-- AlterTable: add purpose to verification_tokens
ALTER TABLE "verification_tokens"
  ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'LOGIN_OTP';

-- CreateTable: user_devices
CREATE TABLE "user_devices" (
  "id"            TEXT         NOT NULL,
  "userId"        TEXT         NOT NULL,
  "userAgentHash" VARCHAR(64)  NOT NULL,
  "ipAddress"     VARCHAR(45)  NOT NULL,
  "location"      VARCHAR(100),
  "isFirstDevice" BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_userId_userAgentHash_key" ON "user_devices"("userId", "userAgentHash");

-- CreateIndex
CREATE INDEX "user_devices_userId_idx" ON "user_devices"("userId");

-- AddForeignKey
ALTER TABLE "user_devices"
  ADD CONSTRAINT "user_devices_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
