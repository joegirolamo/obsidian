'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateScorecardCategory(
  businessId: string,
  data: {
    name: string;
    score: number;
    highlights: string;
  }
) {
  try {
    const assessment = await prisma.assessment.upsert({
      where: {
        businessId_name: {
          businessId,
          name: data.name,
        },
      },
      update: {
        score: data.score,
        description: data.highlights,
      },
      create: {
        businessId,
        name: data.name,
        score: data.score,
        description: data.highlights,
      },
    });

    revalidatePath('/admin/scorecard');
    return { success: true, assessment };
  } catch (error) {
    console.error('Failed to update scorecard category:', error);
    return { success: false, error: 'Failed to update scorecard category' };
  }
}

export async function publishScorecard(businessId: string) {
  try {
    await prisma.assessment.updateMany({
      where: {
        businessId,
        name: {
          in: ['EBITDA', 'Revenue', 'De-Risk'],
        },
      },
      data: { isPublished: true },
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('Failed to publish scorecard:', error);
    return { success: false, error: 'Failed to publish scorecard' };
  }
}

export async function unpublishScorecard(businessId: string) {
  try {
    await prisma.assessment.updateMany({
      where: {
        businessId,
        name: {
          in: ['EBITDA', 'Revenue', 'De-Risk'],
        },
      },
      data: { isPublished: false },
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish scorecard:', error);
    return { success: false, error: 'Failed to unpublish scorecard' };
  }
} 