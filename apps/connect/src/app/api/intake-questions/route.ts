import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/intake-questions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        adminId: session.user.id
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const questions = await prisma.intakeQuestion.findMany({
      where: {
        businessId,
        isActive: true
      },
      include: {
        answers: {
          select: {
            answer: true,
            createdAt: true,
            clientPortal: {
              select: {
                client: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Transform the questions to include answer information
    const transformedQuestions = questions.map(question => ({
      ...question,
      hasAnswer: question.answers.length > 0,
      latestAnswer: question.answers[0]?.answer || null,
      answeredBy: question.answers[0]?.clientPortal?.client?.name || null,
      answeredAt: question.answers[0]?.createdAt || null
    }));

    return NextResponse.json(transformedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/intake-questions
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[Intake POST] Unauthorized request - no user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the incoming data first
    const data = await request.json();
    console.log('[Intake POST] Creating question with data:', data);
    const { question, type, options, order, area, businessId } = data;

    // Validate required fields
    if (!question) {
      console.error('[Intake POST] Missing required field: question');
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // If businessId is provided in the request, use it
    let targetBusinessId = businessId;

    // If no businessId provided, get the user's businesses
    if (!targetBusinessId) {
      console.log('[Intake POST] No businessId provided, looking up user businesses');
      
      // Get any business the user has access to (open workspace model)
      const businesses = await prisma.business.findMany({
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!businesses || businesses.length === 0) {
        console.error('[Intake POST] No businesses found for user');
        return NextResponse.json({ error: 'No business found' }, { status: 404 });
      }

      targetBusinessId = businesses[0].id;
    }

    console.log(`[Intake POST] Using businessId: ${targetBusinessId}`);

    // Create the new question
    const newQuestion = await prisma.intakeQuestion.create({
      data: {
        question,
        type,
        options: options || [],
        order: order || 0,
        area: area || 'Other',
        businessId: targetBusinessId,
        isActive: true,
      },
    });

    console.log('[Intake POST] Created question:', newQuestion);
    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('[Intake POST] Error creating intake question:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/intake-questions
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[Intake PATCH] Unauthorized request - no user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('[Intake PATCH] Updating question with data:', data);
    const { id, question, type, options, order, isActive, area, businessId } = data;

    // If no ID is provided, create a new question
    if (!id) {
      if (!question) {
        console.error('[Intake PATCH] Missing required field: question');
        return NextResponse.json({ error: 'Question field is required' }, { status: 400 });
      }

      // If businessId is provided in the request, use it
      let targetBusinessId = businessId;

      // If no businessId provided, get the user's businesses
      if (!targetBusinessId) {
        console.log('[Intake PATCH] No businessId provided, looking up user businesses');
        
        // Get any business the user has access to (open workspace model)
        const businesses = await prisma.business.findMany({
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!businesses || businesses.length === 0) {
          console.error('[Intake PATCH] No businesses found for user');
          return NextResponse.json({ error: 'No business found' }, { status: 404 });
        }

        targetBusinessId = businesses[0].id;
      }

      console.log(`[Intake PATCH] Creating new question for businessId: ${targetBusinessId}`);
      
      const newQuestion = await prisma.intakeQuestion.create({
        data: {
          question,
          type: type || 'TEXT',
          options: options || [],
          order: order || 0,
          area: area || 'Other',
          isActive: true,
          businessId: targetBusinessId,
        },
      });
      
      console.log('[Intake PATCH] Created new question:', newQuestion);
      return NextResponse.json(newQuestion);
    }

    // Update existing question
    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (question) updateData.question = question;
    if (type) updateData.type = type;
    if (options) updateData.options = options;
    if (order !== undefined) updateData.order = order;
    if (area) updateData.area = area;

    console.log(`[Intake PATCH] Updating question ${id} with data:`, updateData);

    // Remove the business filter to support the shared workspace model
    const updatedQuestion = await prisma.intakeQuestion.update({
      where: { id },
      data: updateData,
    });

    console.log('[Intake PATCH] Updated question:', updatedQuestion);
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('[Intake PATCH] Error updating intake question:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 