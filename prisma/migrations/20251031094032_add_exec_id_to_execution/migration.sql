/*
  Warnings:

  - A unique constraint covering the columns `[execId]` on the table `Execution` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `execId` to the `Execution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Execution" ADD COLUMN     "execId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Execution_execId_key" ON "Execution"("execId");
