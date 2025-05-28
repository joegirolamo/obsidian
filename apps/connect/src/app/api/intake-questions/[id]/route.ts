import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

// GET /api/intake-questions/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Output environment variables for debugging
    console.log('Intake Questions [id] GET API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Intake Questions [id] GET - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
    } else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          console.log('Retrieved user info from token:', { userId });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // If no authentication method succeeded
    if (!userId) {
      console.error('Intake Questions [id] GET - Unauthorized: No valid authentication found');
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
    // Output environment variables for debugging
    console.log('Intake Questions [id] PATCH API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Intake Questions [id] PATCH - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
    } else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          console.log('Retrieved user info from token:', { userId });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // If no authentication method succeeded
    if (!userId) {
      console.error('Intake Questions [id] PATCH - Unauthorized: No valid authentication found');
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
    // Output environment variables for debugging
    console.log('Intake Questions [id] DELETE API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Intake Questions [id] DELETE - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
    } else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          console.log('Retrieved user info from token:', { userId });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // If no authentication method succeeded
    if (!userId) {
      console.error('Intake Questions [id] DELETE - Unauthorized: No valid authentication found');
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