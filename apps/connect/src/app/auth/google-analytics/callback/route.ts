import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const businessCode = searchParams.get('code');

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
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/auth/google-analytics/callback`,
        grant_type: 'authorization_code',
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
          toolName: 'Google Analytics',
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        userId: business.clientPortal.clientId,
        toolName: 'Google Analytics',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    // Update the tool status
    await prisma.tool.update({
      where: {
        businessId_name: {
          businessId: business.id,
          name: 'Google Analytics',
        },
      },
      data: {
        status: 'GRANTED',
      },
    });

    return NextResponse.redirect(
      new URL(`/connect/${businessCode}?success=Google Analytics connected successfully`, request.url)
    );
  } catch (error) {
    console.error('Error in Google Analytics callback:', error);
    const businessCode = new URL(request.url).searchParams.get('code');
    return NextResponse.redirect(
      new URL(`/connect/${businessCode}?error=An unexpected error occurred`, request.url)
    );
  }
} 