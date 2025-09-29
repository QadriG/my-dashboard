/*
  Warnings:

  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatSession" DROP CONSTRAINT "ChatSession_agentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatSession" DROP CONSTRAINT "ChatSession_userId_fkey";

-- DropTable
DROP TABLE "public"."ChatMessage";

-- DropTable
DROP TABLE "public"."ChatSession";
