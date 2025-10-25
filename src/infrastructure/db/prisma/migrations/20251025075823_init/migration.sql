-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('FIAT', 'CRYPTO', 'STOCK', 'RE', 'DEBT', 'COMMODITY');

-- CreateEnum
CREATE TYPE "public"."ValuationMode" AS ENUM ('MARKET', 'MANUAL');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AssetType" NOT NULL,
    "currency" TEXT NOT NULL,
    "qty" DECIMAL(38,12) NOT NULL,
    "valuationMode" "public"."ValuationMode" NOT NULL DEFAULT 'MARKET',
    "total" DECIMAL(38,2),
    "debt" DECIMAL(38,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailySnapshot" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AssetType" NOT NULL,
    "currency" TEXT NOT NULL,
    "qty" DECIMAL(38,12) NOT NULL,
    "valuationMode" "public"."ValuationMode" NOT NULL DEFAULT 'MARKET',
    "total" DECIMAL(38,2),
    "debt" DECIMAL(38,2),
    "valuesJson" JSONB NOT NULL,
    "metaJson" JSONB,
    "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "public"."User"("telegramId");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "public"."Asset"("userId");

-- CreateIndex
CREATE INDEX "DailySnapshot_dateTime_idx" ON "public"."DailySnapshot"("dateTime");

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_assetId_dateTime_key" ON "public"."DailySnapshot"("assetId", "dateTime");

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySnapshot" ADD CONSTRAINT "DailySnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySnapshot" ADD CONSTRAINT "DailySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
