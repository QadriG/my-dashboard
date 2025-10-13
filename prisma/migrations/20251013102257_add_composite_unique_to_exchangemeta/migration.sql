/*
  Warnings:

  - A unique constraint covering the columns `[ccxtId,type]` on the table `ExchangeMeta` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ExchangeMeta_ccxtId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeMeta_ccxtId_type_key" ON "ExchangeMeta"("ccxtId", "type");
