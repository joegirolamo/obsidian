import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  try {
    const business = await prisma.business.findUnique({
      where: {
        id: params.businessId,
      },
      select: {
        code: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: business.code });
  } catch (error) {
    console.error('Error getting business code:', error);
    return NextResponse.json(
      { error: 'Failed to get business code' },
      { status: 500 }
    );
  }
} 