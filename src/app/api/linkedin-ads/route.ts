import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAnalytics, getAdAccounts } from '@/lib/linkedin-api';

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
    if (!adAccounts.elements.length) {
      return NextResponse.json(
        { error: 'No ad accounts found' },
        { status: 404 }
      );
    }

    // Get analytics for the first ad account
    const analytics = await getAnalytics(session.user.id, adAccounts.elements[0].id, startDate, endDate);

    // Process the analytics data
    const data = {
      totalImpressions: analytics.elements.reduce((sum, element) => sum + (element.impressions || 0), 0),
      totalClicks: analytics.elements.reduce((sum, element) => sum + (element.clicks || 0), 0),
      totalSpend: analytics.elements.reduce((sum, element) => sum + (element.spend || 0), 0),
      totalReach: analytics.elements.reduce((sum, element) => sum + (element.reach || 0), 0),
      totalActions: analytics.elements.reduce((sum, element) => sum + (element.actions?.length || 0), 0),
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching LinkedIn Ads data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LinkedIn Ads data' },
      { status: 500 }
    );
  }
} 