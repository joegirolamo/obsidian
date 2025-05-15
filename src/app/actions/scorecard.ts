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
    // Find existing scorecard opportunity
    const existingScorecard = await prisma.opportunity.findFirst({
      where: {
        businessId: businessId,
        category: data.name,
        title: { contains: 'Scorecard' }
      }
    });

    let scorecard;
    
    if (existingScorecard) {
      // Update existing record
      scorecard = await prisma.opportunity.update({
        where: {
          id: existingScorecard.id
        },
        data: {
          title: `${data.name} Scorecard`,
          description: data.highlights,
          status: "OPEN",
        }
      });
    } else {
      // Create new record
      scorecard = await prisma.opportunity.create({
        data: {
          businessId,
          title: `${data.name} Scorecard`,
          category: data.name,
          description: data.highlights,
          status: "OPEN",
        }
      });
    }

    revalidatePath('/admin/scorecard');
    return { success: true, scorecard };
  } catch (error) {
    console.error('Failed to update scorecard category:', error);
    return { success: false, error: 'Failed to update scorecard category' };
  }
}

export async function publishScorecard(businessId: string) {
  try {
    await prisma.opportunity.updateMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
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
    await prisma.opportunity.updateMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
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

export async function getScorecardPublishStatus(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecard status for business:', businessId);
    const opportunities = await prisma.opportunity.findMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
      },
      select: {
        isPublished: true
      }
    });
    
    // Consider published if any opportunities are published
    const isPublished = opportunities.some(opp => opp.isPublished);
    console.log('[DEBUG] Scorecard publish status:', { businessId, isPublished, opportunityCount: opportunities.length });
    
    return { success: true, isPublished };
  } catch (error) {
    console.error('[DEBUG] Failed to get scorecard publish status:', error);
    return { success: false, error: 'Failed to get scorecard publish status' };
  }
} 