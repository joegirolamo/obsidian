import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the user has access to this business
    const clientPortal = await prisma.clientPortal.findFirst({
      where: {
        businessId: params.businessId,
        clientId: session.user.id,
        isActive: true,
      },
    });

    if (!clientPortal) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get business publish status
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: {
        isScorecardPublished: true,
        isOpportunitiesPublished: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publishedTypes: {
        scorecard: business.isScorecardPublished,
        opportunities: business.isOpportunitiesPublished
      }
    });
  } catch (error) {
    console.error("Error checking publish status:", error);
    return NextResponse.json(
      { error: "Failed to check publish status" },
      { status: 500 }
    );
  }
} 