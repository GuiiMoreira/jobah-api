/*
  Warnings:

  - You are about to drop the column `serviceId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `providerProfessionId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_providerId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "serviceId",
ADD COLUMN     "providerProfessionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "services";

-- CreateTable
CREATE TABLE "professions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_professions" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION,
    "providerId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,

    CONSTRAINT "provider_professions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professions_name_key" ON "professions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_professions_providerId_professionId_key" ON "provider_professions"("providerId", "professionId");

-- AddForeignKey
ALTER TABLE "provider_professions" ADD CONSTRAINT "provider_professions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_professions" ADD CONSTRAINT "provider_professions_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_providerProfessionId_fkey" FOREIGN KEY ("providerProfessionId") REFERENCES "provider_professions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
