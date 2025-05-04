-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "properties" TEXT[] DEFAULT ARRAY[]::TEXT[];
