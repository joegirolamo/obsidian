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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const question = await prisma.intakeQuestion.findUnique({
      where: { id: params.id },
      include: {
        answers: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching intake question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { question, type, options, order, isActive } = data;

    const updatedQuestion = await prisma.intakeQuestion.update({
      where: { id: params.id },
      data: {
        question,
        type,
        options: options || [],
        order,
        isActive,
      },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating intake question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.intakeQuestion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting intake question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 