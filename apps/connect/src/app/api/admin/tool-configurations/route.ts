import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('Tool Config API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Tool Config API GET - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from cookies
    let userId = session?.user?.id;
    let userRole = session?.user?.role;
    
    if (!userId) {
      // Try to get token directly from request
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

    if (!userId) {
      console.error('Tool Config API GET - Unauthorized: No session or token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('Tool Config API GET - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('Tool Config API GET - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('Tool Config API GET - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Log environment variables for debugging
    console.log('Environment variables:', {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      META_CLIENT_ID: process.env.META_CLIENT_ID ? 'Set' : 'Not set',
      META_CLIENT_SECRET: process.env.META_CLIENT_SECRET ? 'Set' : 'Not set',
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? 'Set' : 'Not set',
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'Set' : 'Not set',
      SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID ? 'Set' : 'Not set',
      SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET ? 'Set' : 'Not set',
      SHOPIFY_SHOP_NAME: process.env.SHOPIFY_SHOP_NAME ? 'Set' : 'Not set'
    });

    const configurations = [
      {
        name: 'Google Analytics',
        isConfigured: Boolean(
          process.env.GOOGLE_CLIENT_ID?.trim() && 
          process.env.GOOGLE_CLIENT_SECRET?.trim()
        ),
        requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
      },
      {
        name: 'Google Ads',
        isConfigured: Boolean(
          process.env.GOOGLE_CLIENT_ID?.trim() && 
          process.env.GOOGLE_CLIENT_SECRET?.trim()
        ),
        requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
      },
      {
        name: 'Meta Business Manager',
        isConfigured: Boolean(
          process.env.META_CLIENT_ID?.trim() && 
          process.env.META_CLIENT_SECRET?.trim()
        ),
        requiredEnvVars: ['META_CLIENT_ID', 'META_CLIENT_SECRET']
      },
      {
        name: 'LinkedIn Business Manager',
        isConfigured: Boolean(
          process.env.LINKEDIN_CLIENT_ID?.trim() && 
          process.env.LINKEDIN_CLIENT_SECRET?.trim()
        ),
        requiredEnvVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET']
      },
      {
        name: 'Shopify Partner',
        isConfigured: Boolean(
          process.env.SHOPIFY_CLIENT_ID?.trim() && 
          process.env.SHOPIFY_CLIENT_SECRET?.trim() && 
          process.env.SHOPIFY_SHOP_NAME?.trim()
        ),
        requiredEnvVars: ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_NAME']
      }
    ];

    return NextResponse.json({
      success: true,
      configurations,
    });
  } catch (error) {
    console.error('Error checking tool configurations:', error);
    return NextResponse.json(
      { error: 'Failed to check tool configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('Tool Config API POST Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Tool Config API POST - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from cookies
    let userId = session?.user?.id;
    let userRole = session?.user?.role;
    
    if (!userId) {
      // Try to get token directly from request
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

    if (!userId) {
      console.error('Tool Config API POST - Unauthorized: No session or token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('Tool Config API POST - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('Tool Config API POST - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('Tool Config API POST - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { toolName, configuration } = body;

    if (!toolName || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert the tool configuration
    const toolConfig = await prisma.toolConfiguration.upsert({
      where: {
        userId_toolName: {
          userId: userId,
          toolName: toolName,
        },
      },
      update: {
        configuration,
      },
      create: {
        userId: userId,
        toolName,
        configuration,
      },
    });

    return NextResponse.json({
      success: true,
      configuration: toolConfig,
    });
  } catch (error) {
    console.error('Error saving tool configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save tool configuration' },
      { status: 500 }
    );
  }
}

export async function CHECK() {
  try {
    const configurations = [
      {
        name: 'Google Analytics',
        isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
      },
      {
        name: 'Google Ads',
        isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
      },
      {
        name: 'Meta Business Manager',
        isConfigured: !!(process.env.META_CLIENT_ID && process.env.META_CLIENT_SECRET),
        requiredEnvVars: ['META_CLIENT_ID', 'META_CLIENT_SECRET']
      },
      {
        name: 'LinkedIn Business Manager',
        isConfigured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
        requiredEnvVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET']
      },
      {
        name: 'Shopify Partner',
        isConfigured: !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET && process.env.SHOPIFY_SHOP_NAME),
        requiredEnvVars: ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_NAME']
      }
    ];

    return NextResponse.json({ success: true, configurations });
  } catch (error) {
    console.error('Error checking tool configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check tool configurations' },
      { status: 500 }
    );
  }
} 