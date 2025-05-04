import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReport } from '@/lib/google-analytics';

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

    // Fetch metrics
    const metrics = [
      'ga:users',
      'ga:sessions',
      'ga:avgSessionDuration',
      'ga:bounceRate'
    ];

    const report = await getReport(
      session.user.id,
      process.env.GOOGLE_ANALYTICS_VIEW_ID!,
      startDate,
      endDate,
      metrics
    );

    // Process the report data
    const data = {
      totalUsers: parseInt(report.rows[0][0]),
      totalSessions: parseInt(report.rows[0][1]),
      averageSessionDuration: formatDuration(parseInt(report.rows[0][2])),
      bounceRate: `${parseFloat(report.rows[0][3]).toFixed(1)}%`
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 