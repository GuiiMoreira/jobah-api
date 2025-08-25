-- CreateTable
CREATE TABLE "review_photos" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,

    CONSTRAINT "review_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
