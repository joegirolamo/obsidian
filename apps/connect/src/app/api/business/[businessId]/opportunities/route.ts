import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: { businessId: string } }
) {
  try {
    const { businessId } = context.params;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Get all opportunities for the business
    const opportunities = await prisma.opportunity.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      opportunities
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 