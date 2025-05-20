import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all AI configurations or check if configurations exist
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, provider, apiKey, model, options, isActive } = body;

    if (!provider || !apiKey || !model) {
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
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