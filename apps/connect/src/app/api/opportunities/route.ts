import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get('businessId');
    const type = url.searchParams.get('type'); // Optional: 'scorecard' to filter for scorecard opportunities
    
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }
    
    // Build the query
    const query: any = {
      where: { businessId },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' }
      ]
    };
    
    // Add type filter if specified
    if (type === 'scorecard') {
      query.where.title = { contains: 'Scorecard' };
    } else if (type === 'regular') {
      query.where.NOT = { title: { contains: 'Scorecard' } };
    }
    
    // Execute the query
    const opportunities = await prisma.opportunity.findMany(query);
    
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
} 