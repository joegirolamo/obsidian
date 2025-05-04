/*
  Warnings:

  - A unique constraint covering the columns `[businessId,name]` on the table `Tool` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tool_businessId_name_key" ON "Tool"("businessId", "name");
