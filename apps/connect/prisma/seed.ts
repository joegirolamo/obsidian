import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = 'admin@vokal.io';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log('Creating admin user...');
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        password: await bcrypt.hash('password123', 10),
        role: 'ADMIN',
      },
    });
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists, updating password...');
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: await bcrypt.hash('password123', 10),
        role: 'ADMIN',
      },
    });
    console.log('Admin user updated successfully');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 