import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the business ID from the URL
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Verify the user has access to this business
    const clientPortal = await prisma.clientPortal.findFirst({
      where: {
        businessId,
        clientId: session.user.id,
        isActive: true,
      },
    });

    if (!clientPortal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active questions for the business with their answers
    const questions = await prisma.intakeQuestion.findMany({
      where: {
        businessId,
        isActive: true,
      },
      include: {
        answers: {
          where: {
            clientPortalId: clientPortal.id,
          },
          select: {
            answer: true,
          },
        },
      },
      orderBy: [
        { area: 'asc' },
        { order: 'asc' },
      ],
    });

    // Transform the questions to include the answer
    const questionsWithAnswers = questions.map(question => ({
      ...question,
      savedAnswer: question.answers[0]?.answer || '',
    }));

    // Group questions by area
    const groupedQuestions = questionsWithAnswers.reduce((acc, question) => {
      const area = question.area || 'Other';
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(question);
      return acc;
    }, {} as Record<string, typeof questionsWithAnswers>);

    return NextResponse.json(groupedQuestions);
  } catch (error) {
    console.error('Error fetching intake questions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 