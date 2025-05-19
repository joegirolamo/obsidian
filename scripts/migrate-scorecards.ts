import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateScorecards() {
  const opportunities = await prisma.opportunity.findMany({
    where: {
      title: { contains: 'Scorecard' }
    }
  });

  let migrated = 0;

  for (const opp of opportunities) {
    try {
      await prisma.scorecard.create({
        data: {
          businessId: opp.businessId,
          category: opp.category,
          score: (opp as any).score ?? null,
          maxScore: (opp as any).maxScore ?? 100,
          highlights: (opp as any).highlights ?? [],
          isPublished: opp.isPublished,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
        }
      });
      migrated++;
      console.log(`Migrated Opportunity ${opp.id} to Scorecard.`);
    } catch (err) {
      console.error(`Failed to migrate Opportunity ${opp.id}:`, err);
    }
  }

  console.log(`\nMigration complete. Migrated ${migrated} scorecards.`);
  await prisma.$disconnect();
}

migrateScorecards().catch((e) => {
  console.error(e);
  process.exit(1);
}); 