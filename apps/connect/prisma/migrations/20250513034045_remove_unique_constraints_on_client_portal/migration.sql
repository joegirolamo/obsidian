/*
  Warnings:

  - A unique constraint covering the columns `[businessId,clientId]` on the table `ClientPortal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ClientPortal_businessId_key";

-- DropIndex
DROP INDEX "ClientPortal_clientId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ClientPortal_businessId_clientId_key" ON "ClientPortal"("businessId", "clientId");
