/*
  Warnings:

  - You are about to drop the column `messages` on the `ChatSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ChatMessage" ADD COLUMN     "delivered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."ChatSession" DROP COLUMN "messages",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'user_admin';
