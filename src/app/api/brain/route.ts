import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpportunityStatus } from '@prisma/client';

// Define a custom type that includes our added fields
type ExtendedOpportunity = {
  id: string;
  title: string;
  description: string | null;
  status: OpportunityStatus;
  businessId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  score?: number | null;
  maxScore?: number | null;
  serviceAreas?: string[];
  highlights?: any;
};

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
    // Fetch the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        description: true,
        connections: true,
        properties: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Fetch metrics
    const metrics = await prisma.metric.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        value: true,
        target: true,
        benchmark: true,
        isClientRequested: true,
      },
    });

    // Fetch all opportunities with their fields 
    // Cast to our extended type that includes scorecard fields
    const opportunities = await prisma.opportunity.findMany({
      where: { businessId },
    }) as unknown as ExtendedOpportunity[];

    // Fetch intake questions and answers
    const intakeQuestions = await prisma.intakeQuestion.findMany({
      where: { businessId },
      select: {
        id: true,
        question: true,
        type: true,
        options: true,
        area: true,
        answers: {
          where: {
            clientPortal: {
              businessId,
            },
          },
          select: {
            answer: true,
          },
        },
      },
    });

    // Fetch connected tools
    const tools = await prisma.tool.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
    });

    // Format scorecards separately
    const scorecards = opportunities.filter(opp => 
      ['Foundation', 'Acquisition', 'Conversion', 'Retention'].includes(opp.category) && 
      opp.title.includes('Scorecard')
    );

    // Regular opportunities (non-scorecard)
    const regularOpportunities = opportunities.filter(opp => 
      !opp.title.includes('Scorecard')
    );

    // Transform intake data to Q&A format
    const intakeQA = intakeQuestions.map(q => ({
      question: q.question,
      answer: q.answers[0]?.answer || 'Not answered',
      area: q.area,
      type: q.type,
    }));

    // Construct the brain data
    const brainData = {
      business: {
        id: business.id,
        name: business.name,
        industry: business.industry,
        website: business.website,
        description: business.description,
        properties: business.properties,
      },
      metrics: metrics.map(m => ({
        name: m.name,
        value: m.value,
        target: m.target,
        benchmark: m.benchmark,
        description: m.description,
      })),
      scorecards: scorecards.map(s => {
        // Parse highlights if they're stored as a string
        let highlights = [];
        try {
          if (s.highlights) {
            highlights = typeof s.highlights === 'string' 
              ? JSON.parse(s.highlights) 
              : s.highlights;
          }
        } catch (e) {
          console.error('Error parsing highlights:', e);
        }
          
        return {
          category: s.category,
          score: s.score || 0,
          maxScore: s.maxScore || 100,
          serviceAreas: s.serviceAreas || [],
          highlights: highlights,
        };
      }),
      opportunities: regularOpportunities.map(o => ({
        title: o.title,
        description: o.description,
        category: o.category,
        status: o.status,
      })),
      intake: intakeQA,
      tools: tools.map(t => ({
        name: t.name,
        status: t.status,
        description: t.description,
      })),
    };

    return NextResponse.json(brainData);
  } catch (error) {
    console.error('Error fetching brain data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brain data' },
      { status: 500 }
    );
  }
} 