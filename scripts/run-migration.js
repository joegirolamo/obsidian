const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Execute the SQL to add timeline_span column
    const result = await prisma.$queryRaw`
      ALTER TABLE "Opportunity" 
      ADD COLUMN IF NOT EXISTS "timeline_span" INTEGER NOT NULL DEFAULT 1;
    `;
    
    console.log('Migration successful!');
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 