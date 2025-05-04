'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOpportunity(
  businessId: string,
  data: {
    title: string;
    description: string;
    category: string;
  }
) {
  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        businessId,
        title: data.title,
        description: data.description,
        category: data.category,
      },
    });

    revalidatePath('/admin/opportunities');
    return { success: true, opportunity };
  } catch (error) {
    console.error('Failed to create opportunity:', error);
    return { success: false, error: 'Failed to create opportunity' };
  }
}

export async function updateOpportunity(
  opportunityId: string,
  data: {
    title: string;
    description: string;
    category?: string;
    status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  }
) {
  try {
    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        title: data.title,
        description: data.description,
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
      },
    });

    revalidatePath('/admin/opportunities');
    return { success: true, opportunity };
  } catch (error) {
    console.error('Failed to update opportunity:', error);
    return { success: false, error: 'Failed to update opportunity' };
  }
}

export async function deleteOpportunity(opportunityId: string) {
  try {
    await prisma.opportunity.delete({
      where: { id: opportunityId },
    });

    revalidatePath('/admin/opportunities');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete opportunity:', error);
    return { success: false, error: 'Failed to delete opportunity' };
  }
}

export async function publishOpportunities(businessId: string) {
  try {
    await prisma.opportunity.updateMany({
      where: { businessId },
      data: { isPublished: true },
    });

    revalidatePath('/admin/opportunities');
    return { success: true };
  } catch (error) {
    console.error('Failed to publish opportunities:', error);
    return { success: false, error: 'Failed to publish opportunities' };
  }
}

export async function unpublishOpportunities(businessId: string) {
  try {
    await prisma.opportunity.updateMany({
      where: { businessId },
      data: { isPublished: false },
    });

    revalidatePath('/admin/opportunities');
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish opportunities:', error);
    return { success: false, error: 'Failed to unpublish opportunities' };
  }
} 