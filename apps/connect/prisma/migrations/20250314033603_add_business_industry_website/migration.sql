/*
  Warnings:

  - You are about to drop the column `target` on the `Metric` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "industry" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Metric" DROP COLUMN "target";
