import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAnalytics } from '@/lib/shopify-api';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Shopify connection
    const toolConnection = await prisma.toolConnection.findFirst({
      where: {
        userId: session.user.id,
        toolName: 'Shopify',
      },
    });

    if (!toolConnection) {
      return NextResponse.json({ error: 'Shopify not connected' }, { status: 404 });
    }

    // Get the last 30 days of data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch analytics data
    const analytics = await getAnalytics(session.user.id, startDate, endDate);

    if (analytics.errors) {
      throw new Error(analytics.errors[0].message);
    }

    const data = analytics.data.analyticsData;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching Shopify data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Shopify data' },
      { status: 500 }
    );
  }
} 