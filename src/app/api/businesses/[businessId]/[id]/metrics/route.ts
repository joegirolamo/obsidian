import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  try {
    const { metrics } = await request.json();
    const businessId = params.businessId;

    // Update each metric value
    await Promise.all(
      Object.entries(metrics).map(([metricId, value]) =>
        prisma.metric.update({
          where: { id: metricId },
          data: { value: value as string },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving metrics:", error);
    return NextResponse.json(
      { error: "Failed to save metrics" },
      { status: 500 }
    );
  }
} 