-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('FIAT', 'CRYPTO', 'STOCK', 'RE', 'DEBT');

-- CreateEnum
CREATE TYPE "public"."ValuationMode" AS ENUM ('MARKET', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."CommitKind" AS ENUM ('QTY_TOTAL', 'DEBT_TOTAL', 'MANUAL_VALUATION');

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
    "qty" DECIMAL(38,12) NOT NULL DEFAULT 0,
    "valuationMode" "public"."ValuationMode" NOT NULL DEFAULT 'MARKET',
    "quoteSymbol" TEXT,
    "manualTotalValue" DECIMAL(38,2),
    "debtOutstanding" DECIMAL(38,2),
    "debtCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetCommit" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" "public"."CommitKind" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "qtyTotal" DECIMAL(38,12),
    "debtTotal" DECIMAL(38,2),
    "debtCurrency" TEXT,
    "manualTotalValue" DECIMAL(38,2),

    CONSTRAINT "AssetCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailySnapshot" (
    "userAssetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qty" DECIMAL(38,12) NOT NULL,
    "valuesJson" JSONB NOT NULL,
    "metaJson" JSONB,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("userAssetId","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "public"."User"("telegramId");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "public"."Asset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_userId_name_key" ON "public"."Asset"("userId", "name");

-- CreateIndex
CREATE INDEX "AssetCommit_assetId_timestamp_idx" ON "public"."AssetCommit"("assetId", "timestamp");

-- CreateIndex
CREATE INDEX "DailySnapshot_date_idx" ON "public"."DailySnapshot"("date");

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetCommit" ADD CONSTRAINT "AssetCommit_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySnapshot" ADD CONSTRAINT "DailySnapshot_userAssetId_fkey" FOREIGN KEY ("userAssetId") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
