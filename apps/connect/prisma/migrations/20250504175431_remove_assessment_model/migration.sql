/*
  Warnings:

  - You are about to drop the `Assessment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_businessId_fkey";

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "category" TEXT NOT NULL;

-- DropTable
DROP TABLE "Assessment";
