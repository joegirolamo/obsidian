-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "isOpportunitiesPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isScorecardPublished" BOOLEAN NOT NULL DEFAULT false;
