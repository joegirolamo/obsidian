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
    console.log('[DEBUG] updateScorecardCategory called with:', { businessId, data });
    
    // Check if scorecards are published for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { isScorecardPublished: true }
    });

    if (!business) {
      console.log('[DEBUG] Business not found:', businessId);
      throw new Error('Business not found');
    }
    
    console.log('[DEBUG] Found business with isScorecardPublished:', business.isScorecardPublished);

    const existingScorecard = await prisma.opportunity.findFirst({
      where: {
        businessId: businessId,
        category: data.name,
        title: { contains: 'Scorecard' }
      }
    });
    
    console.log('[DEBUG] Existing scorecard found:', existingScorecard ? 'yes' : 'no');
    if (existingScorecard) {
      console.log('[DEBUG] Existing scorecard ID:', existingScorecard.id);
    }

    let scorecard;
    
    if (existingScorecard) {
      scorecard = await prisma.opportunity.update({
        where: { id: existingScorecard.id },
        data: {
          title: `${data.name} Scorecard`,
          description: data.highlights,
          status: "OPEN",
          // Set isPublished based on the business's publish status
          isPublished: business.isScorecardPublished
        }
      });
      console.log('[DEBUG] Updated scorecard:', scorecard);
    } else {
      scorecard = await prisma.opportunity.create({
        data: {
          businessId,
          title: `${data.name} Scorecard`,
          category: data.name,
          description: data.highlights,
          status: "OPEN",
          // Set isPublished based on the business's publish status
          isPublished: business.isScorecardPublished
        }
      });
      console.log('[DEBUG] Created new scorecard:', scorecard);
    }

    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true, scorecard };
  } catch (error) {
    console.error('[DEBUG] Failed to update scorecard category:', error);
    return { success: false, error: 'Failed to update scorecard category' };
  }
}

export async function publishScorecard(businessId: string) {
  try {
    console.log('[DEBUG] Publishing scorecard for business:', businessId);
    
    // Update the business flag
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { isScorecardPublished: true }
    });
    console.log('[DEBUG] Updated business:', business);
    
    // Also mark all scorecard opportunities as published
    const updatedOpportunities = await prisma.opportunity.updateMany({
      where: {
        businessId: businessId,
        title: { contains: 'Scorecard' }
      },
      data: { isPublished: true }
    });
    console.log('[DEBUG] Updated scorecard opportunities:', updatedOpportunities);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish scorecard:', error);
    return { success: false, error: 'Failed to publish scorecard' };
  }
}

export async function unpublishScorecard(businessId: string) {
  try {
    console.log('[DEBUG] Unpublishing scorecard for business:', businessId);
    
    // Update the business flag
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { isScorecardPublished: false }
    });
    console.log('[DEBUG] Updated business:', business);
    
    // Also mark all scorecard opportunities as unpublished
    const updatedOpportunities = await prisma.opportunity.updateMany({
      where: {
        businessId: businessId,
        title: { contains: 'Scorecard' }
      },
      data: { isPublished: false }
    });
    console.log('[DEBUG] Updated scorecard opportunities:', updatedOpportunities);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish scorecard:', error);
    return { success: false, error: 'Failed to unpublish scorecard' };
  }
}

export async function getScorecardPublishStatus(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecard status for business:', businessId);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { isScorecardPublished: true }
    });
    console.log('[DEBUG] Found business:', business);
    
    if (!business) {
      throw new Error('Business not found');
    }

    return { success: true, isPublished: business.isScorecardPublished };
  } catch (error) {
    console.error('Failed to get scorecard publish status:', error);
    return { success: false, error: 'Failed to get scorecard publish status' };
  }
} 