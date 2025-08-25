-- AlterTable
ALTER TABLE "users" ADD COLUMN     "availableBalance" DECIMAL(10,2) DEFAULT 0;

-- CreateTable
CREATE TABLE "provider_payout_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payoutType" TEXT NOT NULL,
    "pixKey" TEXT,
    "bankName" TEXT,
    "agencyNumber" TEXT,
    "accountNumber" TEXT,

    CONSTRAINT "provider_payout_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_payout_info_userId_key" ON "provider_payout_info"("userId");

-- AddForeignKey
ALTER TABLE "provider_payout_info" ADD CONSTRAINT "provider_payout_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
