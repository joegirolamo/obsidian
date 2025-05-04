-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED');

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "status" "ToolStatus" NOT NULL DEFAULT 'PENDING';
