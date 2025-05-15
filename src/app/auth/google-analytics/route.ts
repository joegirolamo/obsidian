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
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics'
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/auth/google-analytics/callback`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google Analytics OAuth:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=Failed to initiate Google Analytics connection', request.url)
    );
  }
} 