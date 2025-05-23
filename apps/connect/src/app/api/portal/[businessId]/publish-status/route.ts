import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Try to get businessId from query params first
    const url = new URL(request.url);
    let businessId = url.searchParams.get('businessId');
    
    // If not in query params, try to extract from URL path
    if (!businessId) {
      const pathname = url.pathname;
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length >= 3) {
        businessId = pathParts[2]; // ["api", "portal", "businessId", "publish-status"]
      }
    }
    
    if (!businessId) {
      console.log('[DEBUG] Business ID is missing from both query and path');
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }
    
    console.log('[DEBUG] Checking publish status for businessId:', businessId);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[DEBUG] Authentication required - No valid session');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    console.log('[DEBUG] User authenticated:', session.user.id);

    // Verify the user has access to this business
    const clientPortal = await prisma.clientPortal.findFirst({
      where: {
        businessId: businessId,
        clientId: session.user.id,
        isActive: true,
      },
    });

    if (!clientPortal) {
      console.log('[DEBUG] Unauthorized - User does not have access to this business');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log('[DEBUG] User has access to clientPortal:', clientPortal.id);

    // Get business publish status
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        isScorecardPublished: true,
        isOpportunitiesPublished: true,
      },
    });

    if (!business) {
      console.log('[DEBUG] Business not found:', businessId);
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }
    
    console.log('[DEBUG] Business found, publish status:', { 
      scorecard: business.isScorecardPublished, 
      opportunities: business.isOpportunitiesPublished 
    });

    return NextResponse.json({
      publishedTypes: {
        scorecard: business.isScorecardPublished,
        opportunities: business.isOpportunitiesPublished
      }
    });
  } catch (error) {
    console.error("Error checking publish status:", error);
    return NextResponse.json(
      { error: "Failed to check publish status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 