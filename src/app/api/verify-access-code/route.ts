import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDefaultToolsAction } from "@/app/actions/serverActions";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const session = await getServerSession(authOptions);

    if (!code) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
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
        assessments: {
          where: { isPublished: true },
          select: { id: true },
        },
        opportunities: {
          where: { isPublished: true },
          select: { id: true },
        },
        clientPortal: true,
        tools: {
          select: {
            id: true
          }
        }
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 404 }
      );
    }

    // Create client portal if it doesn't exist
    if (!business.clientPortal) {
      await prisma.clientPortal.create({
        data: {
          businessId: business.id,
          clientId: session.user.id,
          isActive: true
        }
      });
    }

    // Create default tools if none exist
    if (business.tools.length === 0) {
      await createDefaultToolsAction(business.id);
    }

    // Check if there are any published items
    const hasPublishedItems = 
      business.assessments.length > 0 || 
      business.opportunities.length > 0;

    return NextResponse.json({ 
      businessId: business.id,
      hasPublishedItems
    });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json(
      { error: "Failed to verify access code" },
      { status: 500 }
    );
  }
} 