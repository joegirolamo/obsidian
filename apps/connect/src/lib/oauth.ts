import { prisma } from './prisma';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function refreshGoogleToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export async function refreshMetaToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://graph.facebook.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.META_CLIENT_ID!,
      client_secret: process.env.META_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export async function refreshLinkedInToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export async function refreshShopifyToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://your-store.myshopify.com/admin/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export async function refreshToolConnection(userId: string, toolName: string) {
  const connection = await prisma.toolConnection.findUnique({
    where: {
      userId_toolName: {
        userId,
        toolName,
      },
    },
  });

  if (!connection) {
    throw new Error('Tool connection not found');
  }

  if (!connection.refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    let tokens: TokenResponse;

    switch (toolName) {
      case 'Google Analytics':
      case 'Google Ads':
        tokens = await refreshGoogleToken(connection.refreshToken);
        break;
      case 'Meta Ads':
      case 'Meta Page':
      case 'Meta Dataset':
        tokens = await refreshMetaToken(connection.refreshToken);
        break;
      case 'LinkedIn Page':
      case 'LinkedIn Ads':
        tokens = await refreshLinkedInToken(connection.refreshToken);
        break;
      case 'Shopify':
        tokens = await refreshShopifyToken(connection.refreshToken);
        break;
      default:
        throw new Error(`Unsupported tool: ${toolName}`);
    }

    await prisma.toolConnection.update({
      where: {
        userId_toolName: {
          userId,
          toolName,
        },
      },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || connection.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  } catch (error) {
    console.error(`Error refreshing ${toolName} token:`, error);
    throw error;
  }
} 