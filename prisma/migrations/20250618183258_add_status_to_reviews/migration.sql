-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ACTIVE', 'DELETED_BY_USER', 'HIDDEN_BY_ADMIN');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'ACTIVE';
