import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getInsights, getAdAccounts } from '@/lib/meta-api';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the last 30 days of data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get ad accounts
    const adAccounts = await getAdAccounts(session.user.id);
    if (!adAccounts.data.length) {
      return NextResponse.json(
        { error: 'No ad accounts found' },
        { status: 404 }
      );
    }

    // Get insights for the first ad account
    const insights = await getInsights(session.user.id, adAccounts.data[0].id, startDate, endDate);

    // Process the insights data
    const data = {
      totalImpressions: insights.data.reduce((sum, insight) => sum + (insight.impressions || 0), 0),
      totalClicks: insights.data.reduce((sum, insight) => sum + (insight.clicks || 0), 0),
      totalSpend: insights.data.reduce((sum, insight) => sum + (insight.spend || 0), 0),
      totalReach: insights.data.reduce((sum, insight) => sum + (insight.reach || 0), 0),
      totalActions: insights.data.reduce((sum, insight) => sum + (insight.actions?.length || 0), 0),
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching Meta Ads data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Meta Ads data' },
      { status: 500 }
    );
  }
} 