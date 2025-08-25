/*
  Warnings:

  - Added the required column `superCategoryId` to the `professions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "professions" ADD COLUMN     "superCategoryId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "super_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "super_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_categories_name_key" ON "super_categories"("name");

-- AddForeignKey
ALTER TABLE "professions" ADD CONSTRAINT "professions_superCategoryId_fkey" FOREIGN KEY ("superCategoryId") REFERENCES "super_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
