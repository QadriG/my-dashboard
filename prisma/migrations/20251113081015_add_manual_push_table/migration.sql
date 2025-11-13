-- CreateTable
CREATE TABLE "ManualPushEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "exchange" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPushEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualPushEvent_userId_createdAt_idx" ON "ManualPushEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ManualPushEvent" ADD CONSTRAINT "ManualPushEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
