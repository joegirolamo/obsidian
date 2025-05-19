-- Add scorecard data fields to the Opportunity model
ALTER TABLE "Opportunity" ADD COLUMN "score" INTEGER;
ALTER TABLE "Opportunity" ADD COLUMN "maxScore" INTEGER DEFAULT 100;
ALTER TABLE "Opportunity" ADD COLUMN "serviceAreas" TEXT[] DEFAULT '{}';
ALTER TABLE "Opportunity" ADD COLUMN "highlights" JSONB DEFAULT '[]'; 