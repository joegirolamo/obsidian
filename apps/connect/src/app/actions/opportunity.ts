'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OpportunityStatus } from "@prisma/client";

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

export async function updateOpportunity(
  opportunityId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    serviceArea?: string;
    targetKPI?: string;
    status?: OpportunityStatus;
  }
) {
  try {
    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.serviceArea && { serviceArea: data.serviceArea }),
        ...(data.targetKPI !== undefined && { targetKPI: data.targetKPI }),
        ...(data.status && { status: data.status }),
      },
    });

    revalidatePath('/admin/dvcp/opportunities');
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

    revalidatePath('/admin/dvcp/opportunities');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete opportunity:', error);
    return { success: false, error: 'Failed to delete opportunity' };
  }
}

export async function updateOpportunityStatus(opportunityId: string, status: OpportunityStatus) {
  try {
    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status },
    });

    revalidatePath('/admin/dvcp/opportunities');
    return { success: true, opportunity };
  } catch (error) {
    console.error('Failed to update opportunity status:', error);
    return { success: false, error: 'Failed to update opportunity status' };
  }
}

export async function getBusinessOpportunities(businessId: string) {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, opportunities };
  } catch (error) {
    console.error('Failed to get business opportunities:', error);
    return { success: false, error: 'Failed to get business opportunities' };
  }
}

export async function getBusinessOpportunitiesByCategory(businessId: string) {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    // Group opportunities by category
    const opportunitiesByCategory = opportunities.reduce((acc, opportunity) => {
      const category = opportunity.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(opportunity);
      return acc;
    }, {} as Record<string, typeof opportunities>);

    return { success: true, opportunitiesByCategory };
  } catch (error) {
    console.error('Failed to get business opportunities by category:', error);
    return { success: false, error: 'Failed to get business opportunities by category' };
  }
}

export async function publishOpportunities(businessId: string) {
  try {
    await prisma.business.update({
      where: { id: businessId },
      data: { isOpportunitiesPublished: true }
    });
    
    revalidatePath('/admin/dvcp/opportunities');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish opportunities:', error);
    return { success: false, error: 'Failed to publish opportunities' };
  }
}

export async function unpublishOpportunities(businessId: string) {
  try {
    await prisma.business.update({
      where: { id: businessId },
      data: { isOpportunitiesPublished: false }
    });
    
    revalidatePath('/admin/dvcp/opportunities');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish opportunities:', error);
    return { success: false, error: 'Failed to unpublish opportunities' };
  }
}

export async function getOpportunitiesPublishStatus(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { isOpportunitiesPublished: true }
    });
    
    if (!business) {
      throw new Error('Business not found');
    }

    return { success: true, isPublished: business.isOpportunitiesPublished };
  } catch (error) {
    console.error('Failed to get opportunities publish status:', error);
    return { success: false, error: 'Failed to get opportunities publish status' };
  }
}

export async function generateOpportunitiesWithAI(businessId: string, category: string) {
  try {
    // Fetch the AI Brain data
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/business/${businessId}/ai-brain`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch business data from AI Brain');
    }
    
    const brainData = await response.json();
    
    // In a real implementation, this would call an AI service with the brain data
    // For now, we'll create some mock opportunities based on the category
    const mockOpportunities = [];
    
    const opportunityTemplates = {
      'Foundation': [
        { title: 'Develop brand guidelines for consistent messaging', serviceArea: 'Brand/GTM Strategy' },
        { title: 'Implement a marketing automation platform', serviceArea: 'Martech' },
        { title: 'Create centralized data warehouse for analytics', serviceArea: 'Data & Analytics' }
      ],
      'Acquisition': [
        { title: 'Optimize PPC campaigns to reduce CPA', serviceArea: 'Performance Media' },
        { title: 'Develop integrated campaign strategy', serviceArea: 'Campaigns' },
        { title: 'Establish influencer marketing program', serviceArea: 'Earned Media' }
      ],
      'Conversion': [
        { title: 'Implement A/B testing on key landing pages', serviceArea: 'Website' },
        { title: 'Optimize checkout process to reduce abandonment', serviceArea: 'Ecommerce Platforms' },
        { title: 'Create personalized product recommendation engine', serviceArea: 'Digital Product' }
      ],
      'Retention': [
        { title: 'Develop personalized email series based on behavior', serviceArea: 'CRM' },
        { title: 'Create loyalty program to increase repeat purchases', serviceArea: 'App' },
        { title: 'Establish social media content calendar for community building', serviceArea: 'Organic Social' }
      ]
    };
    
    // Check if we have templates for the requested category
    if (opportunityTemplates[category]) {
      // Get random KPI/Goal to attach to opportunity
      const kpis = brainData.kpis || [];
      const goals = brainData.goals || [];
      const targets = [...kpis.map(k => k.name), ...goals.map(g => g.name)];
      
      // Create opportunities from templates
      for (const template of opportunityTemplates[category]) {
        // Get a random KPI/goal if available
        const targetKPI = targets.length > 0 
          ? targets[Math.floor(Math.random() * targets.length)] 
          : null;
        
        // Create the opportunity in the database
        await createOpportunity(businessId, {
          title: template.title,
          description: `AI-generated opportunity for ${category}`,
          category,
          serviceArea: template.serviceArea,
          targetKPI
        });
      }
    }
    
    revalidatePath('/admin/dvcp/opportunities');
    return { success: true };
  } catch (error) {
    console.error('Failed to generate opportunities with AI:', error);
    return { success: false, error: 'Failed to generate opportunities with AI' };
  }
} 