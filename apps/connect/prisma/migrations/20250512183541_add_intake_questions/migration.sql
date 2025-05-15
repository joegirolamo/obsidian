-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT');

-- CreateTable
CREATE TABLE "IntakeQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeAnswer" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "clientPortalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeAnswer_questionId_clientPortalId_key" ON "IntakeAnswer"("questionId", "clientPortalId");

-- AddForeignKey
ALTER TABLE "IntakeQuestion" ADD CONSTRAINT "IntakeQuestion_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeAnswer" ADD CONSTRAINT "IntakeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "IntakeQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeAnswer" ADD CONSTRAINT "IntakeAnswer_clientPortalId_fkey" FOREIGN KEY ("clientPortalId") REFERENCES "ClientPortal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
