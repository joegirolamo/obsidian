'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateAccessCode } from "@/lib/utils";
import { createDefaultToolsAction } from "./serverActions";

export async function updateBusinessDetails(
  businessId: string,
  data: {
    name: string;
    industry: string;
    website: string;
    description?: string;
  }
) {
  try {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        industry: data.industry,
        website: data.website,
        description: data.description
      },
    });
    
    revalidatePath('/admin/business-details');
    revalidatePath(`/admin/business-details/${businessId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update business details:', error);
    return { success: false, error: 'Failed to update business details' };
  }
}

export async function updateInitiatives(
  businessId: string,
  data: {
    currentInitiatives: string;
    targetOutcomes: string;
  }
) {
  try {
    // We'll need to add these fields to the Business model
    await prisma.business.update({
      where: { id: businessId },
      data: {
        // currentInitiatives: data.currentInitiatives,
        // targetOutcomes: data.targetOutcomes,
      },
    });
    
    revalidatePath('/admin/business-details');
    return { success: true };
  } catch (error) {
    console.error('Failed to update initiatives:', error);
    return { success: false, error: 'Failed to update initiatives' };
  }
}

export async function generateNewAccessCode(businessId: string) {
  try {
    // First check if the business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      console.error('Business not found:', businessId);
      return { success: false, error: 'Business not found' };
    }

    const newCode = generateAccessCode();
    
    await prisma.business.update({
      where: { id: businessId },
      data: {
        code: newCode,
      },
    });
    
    revalidatePath('/admin/business-details');
    return { success: true, code: newCode };
  } catch (error) {
    console.error('Failed to generate access code:', error);
    return { success: false, error: 'Failed to generate access code' };
  }
}

export async function updateMetricNeeds(
  businessId: string,
  metrics: Array<{
    name: string;
    type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  }>
) {
  try {
    // Delete existing metrics
    await prisma.metric.deleteMany({
      where: { businessId },
    });
    
    // Create new metrics
    await prisma.metric.createMany({
      data: metrics.map((metric) => ({
        businessId,
        name: metric.name,
        type: metric.type,
      })),
    });
    
    revalidatePath('/admin/business-details');
    return { success: true };
  } catch (error) {
    console.error('Failed to update metric needs:', error);
    return { success: false, error: 'Failed to update metric needs' };
  }
}

export async function createBusiness(
  data: {
    name: string;
    adminId: string;
  }
) {
  try {
    console.log('Starting business creation with data:', data);
    // First check if the user already has a business
    const existingBusiness = await prisma.business.findUnique({
      where: { adminId: data.adminId },
      select: {
        id: true,
        name: true,
        code: true,
        adminId: true,
      }
    });

    if (existingBusiness) {
      console.log('Found existing business for user:', existingBusiness);
      return { success: true, business: existingBusiness };
    }

    const code = generateAccessCode();
    console.log('Generated access code for new business:', code);
    
    const business = await prisma.business.create({
      data: {
        name: data.name,
        adminId: data.adminId,
        code: code,
      },
      select: {
        id: true,
        name: true,
        code: true,
        adminId: true,
        industry: true,
        website: true,
        description: true,
        connections: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('Successfully created new business:', business);

    // Create default tools for the new business
    console.log('Creating default tools for business:', business.id);
    const toolsResult = await createDefaultToolsAction(business.id);
    console.log('Default tools creation result:', toolsResult);
    
    revalidatePath('/admin/business-details');
    return { success: true, business };
  } catch (error) {
    console.error('Failed to create business:', error);
    return { success: false, error: 'Failed to create business' };
  }
}

export async function getBusinessByAdminId(adminId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { adminId },
    });
    
    return { success: true, business };
  } catch (error) {
    console.error('Failed to fetch business:', error);
    return { success: false, error: 'Failed to fetch business' };
  }
}

export async function getBusinessById(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        code: true,
        industry: true,
        website: true,
        description: true,
        connections: true,
        createdAt: true,
        updatedAt: true,
        adminId: true,
      }
    });

    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    return { success: true, business };
  } catch (error) {
    console.error('Error getting business:', error);
    return { success: false, error: 'Failed to get business' };
  }
}

export async function updateBusinessConnections(
  businessId: string,
  connections: Array<{
    id: string;
    name: string;
    isConnected: boolean;
    icon?: string;
  }>
) {
  try {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        connections: connections
      },
    });
    
    revalidatePath('/admin/business-details');
    revalidatePath(`/admin/business-details/${businessId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update business connections:', error);
    return { success: false, error: 'Failed to update business connections' };
  }
} 