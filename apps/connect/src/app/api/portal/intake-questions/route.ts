import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  try {
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('[DEBUG] Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    
    if (userId) {
      console.log('[DEBUG] Using session authentication with user ID:', userId);
    } else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('[DEBUG] Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          console.log('[DEBUG] Retrieved user info from token:', { userId });
        }
      } catch (error) {
        console.error('[DEBUG] Error getting token:', error);
      }
    }
    
    if (!userId) {
      console.log('[DEBUG] Authentication required - No valid authentication found');
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
        clientId: userId,
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