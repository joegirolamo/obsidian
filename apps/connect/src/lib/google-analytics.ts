import { prisma } from './prisma';
import { refreshToolConnection } from './oauth';

interface GoogleAnalyticsResponse {
  kind: string;
  totalResults: number;
  items: any[];
  rows?: string[][];
}

export async function getGoogleAnalyticsData(userId: string, endpoint: string, params: Record<string, string> = {}) {
  const connection = await prisma.toolConnection.findUnique({
    where: {
      userId_toolName: {
        userId,
        toolName: 'Google Analytics',
      },
    },
  });

  if (!connection) {
    throw new Error('Google Analytics connection not found');
  }

  // Check if token needs refresh
  if (connection.expiresAt && connection.expiresAt <= new Date()) {
    await refreshToolConnection(userId, 'Google Analytics');
  }

  const baseUrl = 'https://www.googleapis.com/analytics/v3';
  const queryParams = new URLSearchParams(params);
  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Analytics API error: ${response.statusText}`);
  }

  return response.json() as Promise<GoogleAnalyticsResponse>;
}

export async function getAccountSummaries(userId: string) {
  return getGoogleAnalyticsData(userId, '/management/accountSummaries');
}

export async function getWebProperties(userId: string, accountId: string) {
  return getGoogleAnalyticsData(userId, `/management/accounts/${accountId}/webproperties`);
}

export async function getProfiles(userId: string, accountId: string, webPropertyId: string) {
  return getGoogleAnalyticsData(userId, `/management/accounts/${accountId}/webproperties/${webPropertyId}/profiles`);
}

export async function getReport(userId: string, viewId: string, startDate: string, endDate: string, metrics: string[], dimensions: string[] = []) {
  const params = {
    ids: `ga:${viewId}`,
    'start-date': startDate,
    'end-date': endDate,
    metrics: metrics.join(','),
    ...(dimensions.length > 0 && { dimensions: dimensions.join(',') }),
  };

  return getGoogleAnalyticsData(userId, '/data/ga', params);
} 