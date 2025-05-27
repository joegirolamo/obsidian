import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/intake-questions/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[Intake GET] Unauthorized request - no user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Intake GET] Fetching question with ID: ${params.id}`);
    const question = await prisma.intakeQuestion.findUnique({
      where: { id: params.id },
      include: {
        answers: true,
      },
    });

    if (!question) {
      console.error(`[Intake GET] Question not found with ID: ${params.id}`);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    console.log(`[Intake GET] Successfully retrieved question: ${params.id}`);
    return NextResponse.json(question);
  } catch (error) {
    console.error('[Intake GET] Error fetching intake question:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/intake-questions/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[Intake PATCH] Unauthorized request - no user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log(`[Intake PATCH] Updating question ${params.id} with data:`, data);
    const { question, type, options, order, isActive, area } = data;

    // Verify the question exists
    const existingQuestion = await prisma.intakeQuestion.findUnique({
      where: { id: params.id },
    });

    if (!existingQuestion) {
      console.error(`[Intake PATCH] Question not found with ID: ${params.id}`);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const updatedQuestion = await prisma.intakeQuestion.update({
      where: { id: params.id },
      data: {
        question,
        type,
        options: options || [],
        order,
        isActive,
        area,
      },
    });

    console.log(`[Intake PATCH] Successfully updated question: ${params.id}`);
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('[Intake PATCH] Error updating intake question:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/intake-questions/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[Intake DELETE] Unauthorized request - no user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the question exists
    const existingQuestion = await prisma.intakeQuestion.findUnique({
      where: { id: params.id },
    });

    if (!existingQuestion) {
      console.error(`[Intake DELETE] Question not found with ID: ${params.id}`);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    console.log(`[Intake DELETE] Deleting question with ID: ${params.id}`);
    await prisma.intakeQuestion.delete({
      where: { id: params.id },
    });

    console.log(`[Intake DELETE] Successfully deleted question: ${params.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Intake DELETE] Error deleting intake question:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 