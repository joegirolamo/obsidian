import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  console.log('\n=== API Route Called ===');
  console.log('Request URL:', request.url);
  console.log('Connection code:', params.code);
  
  if (!params.code) {
    console.error('No connection code provided');
    return NextResponse.json(
      { error: 'Connection code is required' },
      { status: 400 }
    );
  }

  console.log('\nEnvironment variables check:');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
  console.log('All env vars:', Object.keys(process.env));
  
  try {
    // Find the business by code
    console.log('\nLooking up business with code:', params.code);
    const business = await prisma.business.findUnique({
      where: {
        code: params.code,
      },
      include: {
        tools: true,
      },
    });

    if (!business) {
      console.error('No business found for code:', params.code);
      return NextResponse.json(
        { error: 'Invalid connection code' },
        { status: 404 }
      );
    }

    console.log('\nFound business:', business.name);
    console.log('Tools:', business.tools.map(t => t.name));

    // Get the tools that need to be connected
    const tools = business.tools.map(tool => {
      console.log('\nProcessing tool:', tool.name);
      const authUrl = getAuthUrl(tool.name, params.code);
      console.log('Generated auth URL:', authUrl);
      return {
        name: tool.name,
        description: tool.description || '',
        icon: getToolIcon(tool.name),
        authUrl,
        isConnected: false,
      };
    });

    console.log('\nReturning tools:', tools);
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('\nError in API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection tools' },
      { status: 500 }
    );
  }
}

function getToolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    'Google Analytics': 'ga',
    'Google Ads': 'gads',
    'Meta Ads': 'meta',
    'Meta Page': 'meta',
    'Meta Dataset': 'meta',
    'LinkedIn Page': 'linkedin',
    'LinkedIn Ads': 'linkedin',
    'Shopify': 'shopify',
  };
  return icons[toolName] || 'default';
}

function getAuthUrl(toolName: string, code: string): string {
  console.log('\nGenerating auth URL for tool:', toolName);
  console.log('Using code:', code);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  // Validate required environment variables
  const requiredEnvVars: Record<string, string[]> = {
    'Google Analytics': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    'Google Ads': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    'Meta Ads': ['META_CLIENT_ID', 'META_CLIENT_SECRET'],
    'Meta Page': ['META_CLIENT_ID', 'META_CLIENT_SECRET'],
    'Meta Dataset': ['META_CLIENT_ID', 'META_CLIENT_SECRET'],
    'LinkedIn Page': ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    'LinkedIn Ads': ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    'Shopify': ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_NAME'],
  };

  const missingVars = requiredEnvVars[toolName]?.filter((varName: string) => {
    const hasVar = !!process.env[varName];
    console.log(`Checking ${varName}:`, hasVar);
    return !hasVar;
  });
  
  if (missingVars?.length > 0) {
    console.error(`Missing required environment variables for ${toolName}:`, missingVars);
    return '/admin/settings'; // Fallback to settings page if credentials are missing
  }

  const urls: Record<string, string> = {
    'Google Analytics': `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/google-analytics/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      access_type: 'offline',
      state: code,
      prompt: 'consent'
    }).toString(),
    'Google Ads': `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/google-ads/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      access_type: 'offline',
      state: code,
      prompt: 'consent'
    }).toString(),
    'Meta Ads': `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({
      client_id: process.env.META_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/meta-ads/callback`,
      response_type: 'code',
      scope: 'ads_management,ads_read',
      state: code
    }).toString(),
    'Meta Page': `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({
      client_id: process.env.META_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/meta-page/callback`,
      response_type: 'code',
      scope: 'pages_show_list,pages_read_engagement',
      state: code
    }).toString(),
    'Meta Dataset': `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({
      client_id: process.env.META_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/meta-dataset/callback`,
      response_type: 'code',
      scope: 'ads_management,ads_read',
      state: code
    }).toString(),
    'LinkedIn Page': `https://www.linkedin.com/oauth/v2/authorization?` + new URLSearchParams({
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/linkedin-page/callback`,
      response_type: 'code',
      scope: 'r_organization_social',
      state: code
    }).toString(),
    'LinkedIn Ads': `https://www.linkedin.com/oauth/v2/authorization?` + new URLSearchParams({
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/linkedin-ads/callback`,
      response_type: 'code',
      scope: 'r_organization_social r_ads r_ads_reporting',
      state: code
    }).toString(),
    'Shopify': `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/oauth/authorize?` + new URLSearchParams({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/auth/shopify/callback`,
      response_type: 'code',
      scope: 'read_products,read_orders,read_customers',
      state: code
    }).toString(),
  };

  const url = urls[toolName];
  if (!url) {
    console.error(`No URL configured for tool: ${toolName}`);
    return '/admin/settings';
  }

  console.log(`Generated OAuth URL for ${toolName}:`, url);
  return url;
} 