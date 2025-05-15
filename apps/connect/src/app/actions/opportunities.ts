'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function publishOpportunities(businessId: string) {
  try {
    console.log('[DEBUG] Publishing opportunities for business:', businessId);
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { isOpportunitiesPublished: true }
    });
    console.log('[DEBUG] Updated business:', business);
    
    revalidatePath('/admin/opportunities');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish opportunities:', error);
    return { success: false, error: 'Failed to publish opportunities' };
  }
}

export async function unpublishOpportunities(businessId: string) {
  try {
    console.log('[DEBUG] Unpublishing opportunities for business:', businessId);
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { isOpportunitiesPublished: false }
    });
    console.log('[DEBUG] Updated business:', business);
    
    revalidatePath('/admin/opportunities');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish opportunities:', error);
    return { success: false, error: 'Failed to unpublish opportunities' };
  }
}

export async function getOpportunitiesPublishStatus(businessId: string) {
  try {
    console.log('[DEBUG] Getting opportunities status for business:', businessId);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { isOpportunitiesPublished: true }
    });
    console.log('[DEBUG] Found business:', business);
    
    if (!business) {
      throw new Error('Business not found');
    }

    return { success: true, isPublished: business.isOpportunitiesPublished };
  } catch (error) {
    console.error('Failed to get opportunities publish status:', error);
    return { success: false, error: 'Failed to get opportunities publish status' };
  }
} 