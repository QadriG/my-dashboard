-- CreateTable
CREATE TABLE "Execution" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "closedPnl" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION,
    "execTime" TIMESTAMP(3) NOT NULL,
    "balanceAfter" DOUBLE PRECISION,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Execution_userId_execTime_idx" ON "Execution"("userId", "execTime");

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
