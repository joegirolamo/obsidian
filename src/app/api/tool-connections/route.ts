import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connections = await prisma.toolConnection.findMany({
      where: {
        userId: session.user.id,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        toolName: true,
        accessToken: true,
        refreshToken: true,
        expiresAt: true
      }
    });

    return NextResponse.json({
      success: true,
      connections
    });
  } catch (error) {
    console.error('Error fetching tool connections:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 