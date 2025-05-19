import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get business ID from query params
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this business
    const hasAccess = await prisma.business.findFirst({
      where: {
        id: businessId,
        OR: [
          { adminId: session.user.id },
          { users: { some: { id: session.user.id } } }
        ]
      }
    });
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this business' },
        { status: 403 }
      );
    }
    
    // Get all opportunities for the business
    const opportunities = await prisma.opportunity.findMany({
      where: { businessId },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' }
      ],
    });
    
    return NextResponse.json({ items: opportunities });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
} 