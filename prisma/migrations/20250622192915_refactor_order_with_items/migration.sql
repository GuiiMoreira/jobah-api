/*
  Warnings:

  - You are about to drop the column `providerProfessionId` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_providerProfessionId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "providerProfessionId";

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2),
    "orderId" TEXT NOT NULL,
    "providerProfessionId" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_providerProfessionId_fkey" FOREIGN KEY ("providerProfessionId") REFERENCES "provider_professions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
