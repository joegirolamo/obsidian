import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

// Get all AI configurations or check if configurations exist
export async function GET(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('AI Config API GET Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('AI Config API GET - Session from getServerSession:', session ? 'Found' : 'Not found');
    
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
      console.error('AI Config API GET - Unauthorized: No session or token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('AI Config API GET - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('AI Config API GET - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('AI Config API GET - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all AI configurations
    const configurations = await prisma.aIConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Check if OpenAI environment variables are set
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4.1';

    // Return available AI providers and their configuration status
    const providers = [
      {
        name: 'OpenAI',
        isConfigured: Boolean(openaiApiKey?.trim()),
        requiredEnvVars: ['OPENAI_API_KEY'],
        defaultModel: openaiModel,
        availableModels: [
          'gpt-4.5',
          'gpt-4.1',
          'gpt-4.1-mini',
          'gpt-4.1-nano',
          'gpt-4o',
          'gpt-4o-mini',
          'o3',
          'o4-mini'
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      configurations,
      providers
    });
  } catch (error) {
    console.error('Error fetching AI configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI configurations' },
      { status: 500 }
    );
  }
}

// Create or update an AI configuration
export async function POST(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('AI Config API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('AI Config API POST - Session from getServerSession:', session ? 'Found' : 'Not found');
    
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
      console.error('AI Config API POST - Unauthorized: No session or token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('AI Config API POST - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('AI Config API POST - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('AI Config API POST - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, provider, apiKey, model, options, isActive } = body;
    console.log('AI Config API - Request body received:', { 
      id: id ? 'provided' : 'not provided', 
      provider, 
      model, 
      isActive 
    });

    if (!provider || !apiKey || !model) {
      console.error('AI Config API - Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let configuration;

    if (id) {
      // Update existing configuration
      configuration = await prisma.aIConfiguration.update({
        where: { id },
        data: {
          provider,
          apiKey,
          model,
          options: options || {},
          isActive: isActive ?? true
        }
      });
    } else {
      // Create new configuration
      configuration = await prisma.aIConfiguration.create({
        data: {
          provider,
          apiKey,
          model,
          options: options || {},
          isActive: isActive ?? true
        }
      });
    }

    return NextResponse.json({
      success: true,
      configuration
    });
  } catch (error) {
    console.error('Error saving AI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save AI configuration' },
      { status: 500 }
    );
  }
}

// Delete an AI configuration
export async function DELETE(request: Request) {
  try {
    // Output environment variables for debugging
    console.log('AI Config API DELETE Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('AI Config API DELETE - Session from getServerSession:', session ? 'Found' : 'Not found');
    
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
      console.error('AI Config API DELETE - Unauthorized: No session or token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin - always verify in database regardless of token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('AI Config API DELETE - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('AI Config API DELETE - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      console.error('AI Config API DELETE - Unauthorized: Not an admin', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing configuration ID' },
        { status: 400 }
      );
    }

    await prisma.aIConfiguration.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting AI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI configuration' },
      { status: 500 }
    );
  }
} 