import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const businessCode = searchParams.get('state');

    if (!code || !businessCode) {
      return NextResponse.redirect(
        new URL(`/connect/${businessCode}?error=Missing required parameters`, request.url)
      );
    }

    // Get the business
    const business = await prisma.business.findUnique({
      where: { code: businessCode },
      include: { clientPortal: true },
    });

    if (!business?.clientPortal) {
      return NextResponse.redirect(
        new URL(`/connect/${businessCode}?error=Invalid business code`, request.url)
      );
    }

    // Exchange the code for tokens
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/auth/linkedin-page/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Error exchanging code for tokens:', tokens);
      return NextResponse.redirect(
        new URL(`/connect/${businessCode}?error=Failed to exchange authorization code`, request.url)
      );
    }

    // Store the connection in the database
    await prisma.toolConnection.upsert({
      where: {
        userId_toolName: {
          userId: business.clientPortal.clientId,
          toolName: 'LinkedIn Page',
        },
      },
      update: {
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        userId: business.clientPortal.clientId,
        toolName: 'LinkedIn Page',
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    // Update the tool status
    await prisma.tool.update({
      where: {
        businessId_name: {
          businessId: business.id,
          name: 'LinkedIn Page',
        },
      },
      data: {
        status: 'GRANTED',
      },
    });

    return NextResponse.redirect(
      new URL(`/connect/${businessCode}?success=LinkedIn Page connected successfully`, request.url)
    );
  } catch (error) {
    console.error('Error in LinkedIn Page callback:', error);
    const businessCode = new URL(request.url).searchParams.get('state');
    return NextResponse.redirect(
      new URL(`/connect/${businessCode}?error=An unexpected error occurred`, request.url)
    );
  }
} 