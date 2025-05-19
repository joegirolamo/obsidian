/*
  Warnings:

  - You are about to drop the column `highlights` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `maxScore` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `serviceAreas` on the `Opportunity` table. All the data in the column will be lost.
  - Added the required column `serviceArea` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "highlights",
DROP COLUMN "maxScore",
DROP COLUMN "score",
DROP COLUMN "serviceAreas",
ADD COLUMN     "serviceArea" TEXT NOT NULL,
ADD COLUMN     "targetKPI" TEXT;

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER,
    "maxScore" INTEGER DEFAULT 100,
    "highlights" JSONB DEFAULT '[]',
    "metricSignals" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
