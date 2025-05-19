import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpportunityStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('businessId');
  const category = searchParams.get('category');
  const highlightId = searchParams.get('highlightId');
  const excludeScorecards = searchParams.get('excludeScorecards') === 'true';

  if (!businessId) {
    return NextResponse.json(
      { error: 'Business ID is required' },
      { status: 400 }
    );
  }

  try {
    // Build the where clause based on parameters
    const where: any = {
      businessId,
    };

    // Add category filter if provided
    if (category) {
      where.category = category;
    }

    // Exclude opportunities with 'Scorecard' in title
    if (excludeScorecards) {
      where.title = {
        not: {
          contains: 'Scorecard'
        }
      };
    }

    // Fetch opportunities with optional filters
    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { businessId, title, description, category, status, highlightId } = data;

    if (!businessId || !title || !category) {
      return NextResponse.json(
        { error: 'Business ID, title, and category are required' },
        { status: 400 }
      );
    }

    let finalDescription = description || '';
    if (highlightId) {
      finalDescription = `${finalDescription}\n\nRelated to highlight: ${highlightId}`;
    }

    // Create a new opportunity linked to a highlight if highlightId is provided
    const opportunity = await prisma.opportunity.create({
      data: {
        businessId,
        title,
        description: finalDescription,
        category,
        status: status || 'OPEN',
      }
    });

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, title, description, category, status } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Update the opportunity
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(status && { status }),
      }
    });

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
} 