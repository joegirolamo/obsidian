import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const scopes = [
      'read_products',
      'read_orders',
      'read_customers',
      'read_analytics'
    ];

    const shop = process.env.SHOPIFY_SHOP_DOMAIN;
    const clientId = process.env.SHOPIFY_CLIENT_ID;

    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.append('client_id', clientId!);
    authUrl.searchParams.append('scope', scopes.join(','));
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/auth/shopify/callback`);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Shopify OAuth:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=Failed to initiate Shopify connection', request.url)
    );
  }
} 