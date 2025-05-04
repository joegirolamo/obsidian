import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { businessId: string; toolId: string } }
) {
  try {
    const { businessId, toolId } = params;

    // Create or update tool access request
    await prisma.toolAccess.upsert({
      where: {
        businessId_toolId: {
          businessId,
          toolId,
        },
      },
      update: {
        status: "REQUESTED",
        requestedAt: new Date(),
      },
      create: {
        businessId,
        toolId,
        status: "REQUESTED",
        requestedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error requesting tool access:", error);
    return NextResponse.json(
      { error: "Failed to request tool access" },
      { status: 500 }
    );
  }
} 