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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's business ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { managedBusinesses: { select: { id: true } } }
    });

    if (!user?.managedBusinesses?.[0]?.id) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const data = await request.json();
    console.log('Creating question with data:', data);
    const { question, type, options, order, area } = data;

    const newQuestion = await prisma.intakeQuestion.create({
      data: {
        question,
        type,
        options: options || [],
        order: order || 0,
        area: area || 'Other',
        businessId: user.managedBusinesses[0].id,
        isActive: true,
      },
    });

    console.log('Created question:', newQuestion);
    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Error creating intake question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/intake-questions
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's business ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { managedBusinesses: { select: { id: true } } }
    });

    if (!user?.managedBusinesses?.[0]?.id) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const data = await request.json();
    const { id, question, type, options, order, isActive, area } = data;

    // If no ID is provided, create a new question
    if (!id) {
      if (!question) {
        return NextResponse.json({ error: 'Question field is required' }, { status: 400 });
      }

      const newQuestion = await prisma.intakeQuestion.create({
        data: {
          question,
          type: type || 'TEXT',
          options: options || [],
          order: order || 0,
          area: area || 'Other',
          isActive: true,
          businessId: user.managedBusinesses[0].id,
        },
      });
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

    const updatedQuestion = await prisma.intakeQuestion.update({
      where: {
        id,
        businessId: user.managedBusinesses[0].id, // Ensure the question belongs to the user's business
      },
      data: updateData,
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating intake question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 