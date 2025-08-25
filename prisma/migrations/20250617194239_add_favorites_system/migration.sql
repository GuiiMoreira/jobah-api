-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favoriterId" TEXT NOT NULL,
    "favoritedId" TEXT NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_favoriterId_favoritedId_key" ON "favorites"("favoriterId", "favoritedId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_favoriterId_fkey" FOREIGN KEY ("favoriterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_favoritedId_fkey" FOREIGN KEY ("favoritedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
