/*
  Warnings:

  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_cnpj_key";

-- DropIndex
DROP INDEX "users_cpf_key";

-- DropIndex
DROP INDEX "users_phone_number_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "location",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "operatingHours" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER;
