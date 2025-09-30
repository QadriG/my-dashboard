/*
  Warnings:

  - A unique constraint covering the columns `[userId,exchange]` on the table `UserExchange` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserExchange_userId_exchange_key" ON "public"."UserExchange"("userId", "exchange");
