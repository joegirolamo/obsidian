import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Delete existing test user if it exists
  await prisma.user.deleteMany({
    where: {
      email: 'admin@vokal.io',
    },
  });

  // Create the admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@vokal.io',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Created admin user: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 