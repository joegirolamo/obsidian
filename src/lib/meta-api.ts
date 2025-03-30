import { prisma } from './prisma';
import { refreshToolConnection } from './oauth';

interface MetaResponse {
  data: any[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export async function getMetaData(userId: string, endpoint: string, params: Record<string, string> = {}) {
  const connection = await prisma.toolConnection.findUnique({
    where: {
      userId_toolName: {
        userId,
        toolName: 'Meta Ads',
      },
    },
  });

  if (!connection) {
    throw new Error('Meta connection not found');
  }

  if (!connection.accessToken) {
    throw new Error('No access token available');
  }

  // Check if token needs refresh
  if (connection.expiresAt && connection.expiresAt <= new Date()) {
    await refreshToolConnection(userId, 'Meta Ads');
  }

  const baseUrl = 'https://graph.facebook.com/v18.0';
  const queryParams = new URLSearchParams({
    access_token: connection.accessToken,
    ...params,
  });
  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Meta API error: ${response.statusText}`);
  }

  return response.json() as Promise<MetaResponse>;
}

export async function getAdAccounts(userId: string) {
  return getMetaData(userId, '/me/adaccounts');
}

export async function getCampaigns(userId: string, adAccountId: string) {
  return getMetaData(userId, `/${adAccountId}/campaigns`);
}

export async function getAdSets(userId: string, adAccountId: string) {
  return getMetaData(userId, `/${adAccountId}/adsets`);
}

export async function getAds(userId: string, adAccountId: string) {
  return getMetaData(userId, `/${adAccountId}/ads`);
}

export async function getInsights(userId: string, adAccountId: string, startDate: string, endDate: string) {
  const params = {
    time_range: JSON.stringify({
      since: startDate,
      until: endDate,
    }),
    fields: 'impressions,clicks,spend,reach,actions',
  };

  return getMetaData(userId, `/${adAccountId}/insights`, params);
} 