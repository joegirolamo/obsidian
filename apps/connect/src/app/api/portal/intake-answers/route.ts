import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
        clientId: session.user.id,
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