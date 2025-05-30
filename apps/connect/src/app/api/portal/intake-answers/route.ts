import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(request: Request) {
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

    const data = await request.json();
    const { businessId, answers } = data;

    if (!businessId || !answers) {
      return NextResponse.json({ error: 'Business ID and answers are required' }, { status: 400 });
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

    // Save each answer
    const savedAnswers = await Promise.all(
      Object.entries(answers).map(async ([questionId, answer]) => {
        // Check if an answer already exists
        const existingAnswer = await prisma.intakeAnswer.findFirst({
          where: {
            questionId,
            clientPortalId: clientPortal.id,
          },
        });

        if (existingAnswer) {
          // Update existing answer
          return prisma.intakeAnswer.update({
            where: {
              id: existingAnswer.id,
            },
            data: {
              answer: String(answer),
            },
          });
        } else {
          // Create new answer
          return prisma.intakeAnswer.create({
            data: {
              answer: String(answer),
              questionId,
              clientPortalId: clientPortal.id,
            },
          });
        }
      })
    );

    return NextResponse.json(savedAnswers);
  } catch (error) {
    console.error('Error saving intake answers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 