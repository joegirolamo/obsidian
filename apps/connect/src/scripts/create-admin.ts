import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@vokal.io' }
    });
    
    if (existingUser) {
      console.log('Admin user already exists. Updating password...');
      // Hash the password
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Update the user
      await prisma.user.update({
        where: { email: 'admin@vokal.io' },
        data: { 
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log('Admin user password updated successfully!');
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Create the admin user
      await prisma.user.create({
        data: {
          email: 'admin@vokal.io',
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log('Admin user created successfully!');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 