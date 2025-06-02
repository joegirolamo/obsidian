'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OpportunityStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createOpportunity(
  businessId: string,
  data: {
    title: string;
    description?: string;
    category: string;
    serviceArea: string;
    targetKPI?: string;
  }
) {
  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        businessId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        serviceArea: data.serviceArea,
        targetKPI: data.targetKPI || null,
      },
    });

    revalidatePath('/admin/dvcp/opportunities');
    return { success: true, opportunity };
  } catch (error) {
    console.error('Failed to create opportunity:', error);
    return { success: false, error: 'Failed to create opportunity' };
  }
}

/**
 * Update an opportunity's timeline span in the database
 */
export async function updateOpportunityTimelineSpan(
  opportunityId: string,
  span: number
) {
  try {
    // Get the opportunity to update
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { description: true, businessId: true }
    });

    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Use both approaches for reliability: update description and use timeline_span field
    
    // 1. Update description with span marker
    let newDescription = opportunity.description || '';
    const spanMarker = "[SPAN:";
    
    if (newDescription.includes(spanMarker)) {
      // Replace existing span data
      newDescription = newDescription.replace(
        /\[SPAN:[0-9]+\]/g, 
        `[SPAN:${span}]`
      );
    } else {
      // Add span data at the end
      newDescription = `${newDescription} [SPAN:${span}]`.trim();
    }
    
    // 2. Try to update using SQL to ensure the timeline_span field is set
    try {
      // Update both fields at once
      await prisma.$executeRaw`
        UPDATE "Opportunity" 
        SET description = ${newDescription}, timeline_span = ${span} 
        WHERE id = ${opportunityId}
      `;
      
      // Fetch the updated opportunity
      const updated = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
      });
      
      // Revalidate paths
      revalidatePath('/admin/dvcp/opportunities');
      revalidatePath('/admin/dvcp/planning');
      
      if (opportunity.businessId) {
        revalidatePath(`/admin/dvcp/planning?businessId=${opportunity.businessId}`);
        revalidatePath(`/admin/dvcp/opportunities?businessId=${opportunity.businessId}`);
      }
      
      return { success: true, opportunity: updated };
    } catch (sqlError) {
      console.error('SQL update failed:', sqlError);
      
      // Fall back to regular Prisma update
      // Use any type to bypass TypeScript validation
      const updateData: any = { 
        description: newDescription,
        timeline_span: span
      };
      
      const updated = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: updateData
      });
      
      // Revalidate paths
      revalidatePath('/admin/dvcp/opportunities');
      revalidatePath('/admin/dvcp/planning');
      
      if (opportunity.businessId) {
        revalidatePath(`/admin/dvcp/planning?businessId=${opportunity.businessId}`);
        revalidatePath(`/admin/dvcp/opportunities?businessId=${opportunity.businessId}`);
      }
      
      return { success: true, opportunity: updated };
    }
  } catch (error) {
    console.error('Failed to update opportunity span:', error);
    return { success: false, error: 'Failed to update opportunity span' };
  }
}

export async function updateOpportunityTimeline(
  opportunityId: string,
  timeline: string
) {
  try {
    // First, get the opportunity to retrieve its businessId
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { businessId: true }
    });

    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Try using raw SQL if the Prisma client isn't recognizing the timeline field
    try {
      await prisma.$executeRaw`UPDATE "Opportunity" SET timeline = ${timeline} WHERE id = ${opportunityId}`;
      
      // Fetch the updated opportunity
      const updated = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
      });
      
      // Revalidate paths
      revalidatePath('/admin/dvcp/opportunities');
      revalidatePath('/admin/dvcp/planning');
      
      if (opportunity.businessId) {
        revalidatePath(`/admin/dvcp/planning?businessId=${opportunity.businessId}`);
        revalidatePath(`/admin/dvcp/opportunities?businessId=${opportunity.businessId}`);
      }
      
      return { success: true, opportunity: updated };
    } catch (sqlError) {
      console.error('SQL update failed:', sqlError);
      
      // Fall back to regular Prisma update as a last resort
      const updated = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          // @ts-ignore - Try to update timeline anyway
          timeline
        }
      });
      
      // Revalidate paths
      revalidatePath('/admin/dvcp/opportunities');
      revalidatePath('/admin/dvcp/planning');
      
      if (opportunity.businessId) {
        revalidatePath(`/admin/dvcp/planning?businessId=${opportunity.businessId}`);
        revalidatePath(`/admin/dvcp/opportunities?businessId=${opportunity.businessId}`);
      }
      
      return { success: true, opportunity: updated };
    }
  } catch (error) {
    console.error('Failed to update opportunity timeline:', error);
    return { success: false, error: 'Failed to update opportunity timeline' };
  }
} 