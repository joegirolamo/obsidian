/*
  Warnings:

  - A unique constraint covering the columns `[businessId,name]` on the table `Assessment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "category" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_businessId_name_key" ON "Assessment"("businessId", "name");
