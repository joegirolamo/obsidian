import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDefaultToolsAction } from "@/app/actions/serverActions";
import { getToken } from "next-auth/jwt";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    // Output environment variables for debugging
    console.log('Verify Access Code API Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL
    });
    
    // First try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Verify Access Code API - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // If no session, try to get token directly from request
    let userId = session?.user?.id;
    
    if (userId) {
      console.log('Using session authentication with user ID:', userId);
    } else {
      try {
        const token = await getToken({ 
          req: request as any,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        console.log('Token from getToken:', token ? 'Found' : 'Not found');
        
        if (token) {
          userId = token.id as string;
          console.log('Retrieved user info from token:', { userId });
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }

    if (!code) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('Verify Access Code API - Unauthorized: No valid authentication found');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find business by access code and check for published items
    const business = await prisma.business.findUnique({
      where: { code },
      select: {
        id: true,
        isScorecardPublished: true,
        isOpportunitiesPublished: true,
        tools: {
          select: { id: true }
        }
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 404 }
      );
    }

    // Check if client portal already exists
    const existingClientPortal = await prisma.clientPortal.findFirst({
      where: {
        businessId: business.id,
        clientId: userId
      }
    });

    // Create client portal if it doesn't exist
    if (!existingClientPortal) {
      await prisma.clientPortal.create({
        data: {
          businessId: business.id,
          clientId: userId,
          isActive: true
        }
      });
    }

    // Create default tools if none exist
    if (business.tools.length === 0) {
      await createDefaultToolsAction(business.id);
    }

    // Check if there are any published items
    const hasPublishedItems = business.isScorecardPublished || business.isOpportunitiesPublished;

    return NextResponse.json({ 
      businessId: business.id,
      hasPublishedItems,
      publishedTypes: {
        scorecard: business.isScorecardPublished,
        opportunities: business.isOpportunitiesPublished
      }
    });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json(
      { error: "Failed to verify access code" },
      { status: 500 }
    );
  }
} 