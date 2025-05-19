import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json(
      { error: 'Business ID is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch all scorecard opportunities for this business
    const scorecards = await prisma.opportunity.findMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
      },
    });

    return NextResponse.json(scorecards);
  } catch (error) {
    console.error('Error fetching scorecards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecards' },
      { status: 500 }
    );
  }
} 