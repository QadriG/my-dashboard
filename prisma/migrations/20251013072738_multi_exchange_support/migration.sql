/*
  Warnings:

  - You are about to drop the column `action` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the `UserAPI` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserExchange` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `entryPrice` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exchange` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exchange` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."UserAPI" DROP CONSTRAINT "UserAPI_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserExchange" DROP CONSTRAINT "UserExchange_userId_fkey";

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "action",
DROP COLUMN "price",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "currentPrice" DOUBLE PRECISION,
ADD COLUMN     "entryPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "exchange" TEXT NOT NULL,
ADD COLUMN     "leverage" DOUBLE PRECISION,
ADD COLUMN     "pnl" DOUBLE PRECISION,
ADD COLUMN     "side" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "exchange" TEXT NOT NULL,
ADD COLUMN     "fee" DOUBLE PRECISION,
ADD COLUMN     "pnl" DOUBLE PRECISION,
ADD COLUMN     "side" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';

-- CreateTable
CREATE TABLE "UserExchangeAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "ccxtId" TEXT,
    "type" TEXT,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "passphrase" TEXT,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserExchangeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "free" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeMeta" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ccxtId" TEXT NOT NULL,
    "type" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "exchange" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserExchangeAccount_userId_provider_type_key" ON "UserExchangeAccount"("userId", "provider", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_exchange_asset_key" ON "Balance"("userId", "exchange", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeMeta_name_key" ON "ExchangeMeta"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeMeta_ccxtId_key" ON "ExchangeMeta"("ccxtId");

-- AddForeignKey
ALTER TABLE "UserExchangeAccount" ADD CONSTRAINT "UserExchangeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
