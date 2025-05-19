'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OpportunityStatus } from "@prisma/client";

// Simple type for an opportunity
type Opportunity = {
  id: string;
  title: string;
  description: string;
  status: OpportunityStatus;
  businessId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: string;
};

// Add an opportunity
export async function addOpportunity(
  businessId: string,
  opportunity: { title: string; description: string; category: string }
) {
  try {
    const newOpportunity = await prisma.opportunity.create({
      data: {
        title: opportunity.title,
        description: opportunity.description,
        status: OpportunityStatus.OPEN,
        businessId,
        isPublished: false,
        category: opportunity.category
      }
    });

    revalidatePath('/admin/opportunities');
    return { success: true, opportunity: newOpportunity };
  } catch (error) {
    console.error('Error adding opportunity:', error);
    return { success: false, error: 'Failed to add opportunity' };
  }
}

// Delete an opportunity
export async function deleteOpportunity(opportunityId: string) {
  try {
    await prisma.opportunity.delete({
      where: { id: opportunityId }
    });

    revalidatePath('/admin/opportunities');
    return { success: true };
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return { success: false, error: 'Failed to delete opportunity' };
  }
}

// Update an opportunity
export async function updateOpportunity(
  opportunityId: string,
  updates: { title?: string; description?: string; status?: OpportunityStatus; isPublished?: boolean }
) {
  try {
    const updatedOpportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: updates
    });

    revalidatePath('/admin/opportunities');
    return { success: true, opportunity: updatedOpportunity };
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return { success: false, error: 'Failed to update opportunity' };
  }
}

// Get all opportunities for a business
export async function getOpportunities(businessId: string) {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        businessId
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        isPublished: true,
        category: true
      }
    });

    return { success: true, opportunities };
  } catch (error) {
    console.error('Error getting opportunities:', error);
    return { success: false, error: 'Failed to get opportunities' };
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