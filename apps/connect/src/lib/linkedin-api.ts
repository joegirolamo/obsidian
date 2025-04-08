import { prisma } from './prisma';
import { refreshToolConnection } from './oauth';

interface LinkedInResponse {
  elements: any[];
  paging?: {
    count: number;
    start: number;
    total: number;
  };
}

export async function getLinkedInData(userId: string, endpoint: string, params: Record<string, any> = {}) {
  const connection = await prisma.toolConnection.findUnique({
    where: {
      userId_toolName: {
        userId,
        toolName: 'LinkedIn Ads',
      },
    },
  });

  if (!connection) {
    throw new Error('LinkedIn connection not found');
  }

  if (!connection.accessToken) {
    throw new Error('No access token available');
  }

  // Check if token needs refresh
  if (connection.expiresAt && connection.expiresAt <= new Date()) {
    await refreshToolConnection(userId, 'LinkedIn Ads');
  }

  const baseUrl = 'https://api.linkedin.com/v2';
  const queryParams = new URLSearchParams();
  
  // Handle complex objects in params
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'object') {
      queryParams.append(key, JSON.stringify(value));
    } else {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.statusText}`);
  }

  return response.json() as Promise<LinkedInResponse>;
}

export async function getAdAccounts(userId: string) {
  return getLinkedInData(userId, '/adAccountsV2', {
    q: 'search',
    search: {
      status: {
        values: ['ACTIVE'],
      },
    },
  });
}

export async function getCampaigns(userId: string, adAccountId: string) {
  return getLinkedInData(userId, '/adCampaignsV2', {
    q: 'search',
    search: {
      account: {
        values: [adAccountId],
      },
      status: {
        values: ['ACTIVE'],
      },
    },
  });
}

export async function getAdSets(userId: string, adAccountId: string) {
  return getLinkedInData(userId, '/adSetsV2', {
    q: 'search',
    search: {
      account: {
        values: [adAccountId],
      },
      status: {
        values: ['ACTIVE'],
      },
    },
  });
}

export async function getAds(userId: string, adAccountId: string) {
  return getLinkedInData(userId, '/adsV2', {
    q: 'search',
    search: {
      account: {
        values: [adAccountId],
      },
      status: {
        values: ['ACTIVE'],
      },
    },
  });
}

export async function getAnalytics(userId: string, adAccountId: string, startDate: string, endDate: string) {
  return getLinkedInData(userId, '/adAnalyticsV2', {
    q: 'analytics',
    analytics: {
      dateRange: {
        start: {
          day: parseInt(startDate.split('-')[2]),
          month: parseInt(startDate.split('-')[1]),
          year: parseInt(startDate.split('-')[0]),
        },
        end: {
          day: parseInt(endDate.split('-')[2]),
          month: parseInt(endDate.split('-')[1]),
          year: parseInt(endDate.split('-')[0]),
        },
      },
      accounts: [adAccountId],
      metrics: ['impressions', 'clicks', 'spend', 'reach', 'actions'],
    },
  });
} 