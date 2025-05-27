import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { grantAllUsersAccessToAllBusinesses } from '@/app/actions/serverActions';

export async function POST(request: Request) {
  try {
    // Authentication - try multiple methods
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    
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
      console.error('Grant All Access API - Unauthorized: No valid authentication found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    if (!user) {
      console.error('Grant All Access API - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('Grant All Access API - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Call the server action to grant all users access to all businesses
    const result = await grantAllUsersAccessToAllBusinesses();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error granting all users access to all businesses:', error);
    return NextResponse.json(
      { error: 'Failed to grant access' },
      { status: 500 }
    );
  }
} 