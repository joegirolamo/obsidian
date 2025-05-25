import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { generateOpportunitiesWithAI } from '@/app/actions/opportunity';

export async function POST(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('AI Opportunities Generate API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // Parse request body
    const body = await request.json();
    const { businessId, category } = body;

    if (!businessId || !category) {
      return NextResponse.json(
        { error: 'Business ID and category are required' },
        { status: 400 }
      );
    }

    // Authentication - try multiple methods
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('AI Opportunities Generate API - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    let userRole = session?.user?.role;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
    } 
    // Next try the token approach
    else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          userRole = token.role as string;
          console.log('Retrieved user info from token:', { userId, userRole });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    
    // If no authentication method succeeded
    if (!userId) {
      console.error('AI Opportunities Generate API - Unauthorized: No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized: No valid authentication found' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('AI Opportunities Generate API - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('AI Opportunities Generate API - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('AI Opportunities Generate API - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 403 });
    }

    // Call the server action to generate opportunities and pass the userId directly
    const result = await generateOpportunitiesWithAI(businessId, category, userId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Opportunities generated successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to generate opportunities' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating opportunities with AI:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate opportunities with AI',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 