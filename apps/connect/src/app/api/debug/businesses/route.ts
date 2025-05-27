import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all businesses where the user is an admin
    const adminBusinesses = await prisma.business.findMany({
      where: { adminId: session.user.id },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        adminId: true,
        industry: true,
        website: true,
      }
    });

    // Get all businesses where the user is a member
    const memberBusinesses = await prisma.business.findMany({
      where: {
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        adminId: true,
        industry: true,
        website: true,
      }
    });

    // Get all businesses (for reference)
    const allBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        adminId: true,
        industry: true,
        website: true,
      }
    });

    return NextResponse.json({
      userId: session.user.id,
      adminBusinesses,
      memberBusinesses,
      allBusinesses,
      adminCount: adminBusinesses.length,
      memberCount: memberBusinesses.length,
      totalCount: allBusinesses.length
    });
  } catch (error) {
    console.error('Error fetching businesses debug info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 