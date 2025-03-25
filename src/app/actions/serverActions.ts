'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MetricType } from "@prisma/client";

type ToolStatus = "GRANTED" | "REQUESTED" | "DENIED" | null;

interface Tool {
  id: string;
  name: string;
  description: string | null;
  status: ToolStatus;
  isRequested: boolean;
  authUrl?: string;
}

interface MetricInput {
  name: string;
  description?: string;
  type: MetricType;
  isClientRequested?: boolean;
  value?: string;
  target?: string;
}

export async function saveMetricAction(businessId: string, data: MetricInput) {
  try {
    console.log('Attempting to save metric:', { businessId, data });

    // Ensure required fields are present
    if (!data.name || !data.type) {
      console.error('Validation error: Missing required fields', { name: data.name, type: data.type });
      return { 
        success: false, 
        error: 'Name and type are required fields' 
      };
    }

    // Validate businessId
    if (!businessId) {
      console.error('Validation error: Missing businessId');
      return {
        success: false,
        error: 'Business ID is required'
      };
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      console.error('Validation error: Business not found', { businessId });
      return {
        success: false,
        error: 'Business not found'
      };
    }

    console.log('Found business:', business);

    const metric = await prisma.metric.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        type: data.type,
        isClientRequested: data.isClientRequested ?? false,
        value: data.value,
        target: data.target
      }
    });

    console.log('Successfully created metric:', metric);

    revalidatePath(`/portal/${businessId}/metrics`);
    revalidatePath(`/admin/business-details/${businessId}`);

    return { success: true, metric };
  } catch (error) {
    // Log the full error details
    console.error('Detailed error saving metric:', {
      error,
      businessId,
      data,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save metric'
    };
  }
}

export async function updateMetricAction(metricId: string, businessId: string, data: Partial<MetricInput>) {
  try {
    // Validate businessId
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      console.error('Validation error: Business not found', { businessId });
      return {
        success: false,
        error: 'Business not found'
      };
    }

    // Validate metric exists
    const existingMetric = await prisma.metric.findUnique({
      where: { id: metricId }
    });

    if (!existingMetric) {
      console.error('Validation error: Metric not found', { metricId });
      return {
        success: false,
        error: 'Metric not found'
      };
    }

    const metric = await prisma.metric.update({
      where: { id: metricId },
      data: {
        ...data,
        target: data.target
      }
    });

    revalidatePath(`/portal/${businessId}/metrics`);
    revalidatePath(`/admin/business-details/${businessId}`);

    return { success: true, metric };
  } catch (error) {
    console.error('Error updating metric:', {
      error,
      metricId,
      businessId,
      data,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update metric' 
    };
  }
}

export async function deleteMetricAction(metricId: string, businessId: string) {
  try {
    await prisma.metric.delete({
      where: { id: metricId }
    });

    revalidatePath(`/portal/${businessId}/metrics`);
    revalidatePath(`/admin/business-details/${businessId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting metric:', error);
    return { success: false, error: 'Failed to delete metric' };
  }
}

export async function createDefaultMetricsAction(businessId: string) {
  try {
    const defaultMetrics = [
      {
        name: 'Annual Revenue',
        description: 'Total annual revenue in USD',
        type: 'NUMBER' as MetricType,
        isClientRequested: true,
        businessId
      },
      {
        name: 'Number of Employees',
        description: 'Total number of full-time employees',
        type: 'NUMBER' as MetricType,
        isClientRequested: true,
        businessId
      },
      {
        name: 'Industry',
        description: 'Primary industry of operation',
        type: 'TEXT' as MetricType,
        isClientRequested: true,
        businessId
      }
    ];

    const metrics = await prisma.$transaction(
      defaultMetrics.map(metric => 
        prisma.metric.create({ data: metric })
      )
    );

    revalidatePath(`/portal/${businessId}/metrics`);
    revalidatePath(`/admin/business-details/${businessId}`);

    return { success: true, metrics };
  } catch (error) {
    console.error('Error creating default metrics:', error);
    return { success: false, error: 'Failed to create default metrics' };
  }
}

export async function getBusinessMetricsAction(businessId: string) {
  try {
    const metrics = await prisma.metric.findMany({
      where: { businessId }
    });

    return { success: true, metrics };
  } catch (error) {
    console.error('Error getting business metrics:', error);
    return { success: false, error: 'Failed to get business metrics' };
  }
}

export async function getBusinessToolsAction(businessId: string) {
  try {
    console.log('Fetching tools for business:', businessId);
    
    const tools = await prisma.tool.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        description: true,
        isRequested: true,
        toolAccess: {
          select: {
            isGranted: true,
          },
        },
      },
    });

    console.log('Found tools:', tools);

    const formattedTools: Tool[] = tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      status: tool.toolAccess[0]?.isGranted ? "GRANTED" : null,
      isRequested: tool.isRequested,
      authUrl: tool.name === 'Google Analytics' 
        ? '/auth/google-analytics'
        : tool.name === 'Facebook Ads'
        ? '/auth/facebook'
        : tool.name === 'Shopify'
        ? '/auth/shopify'
        : undefined
    }));

    console.log('Formatted tools:', formattedTools);
    return { success: true, tools: formattedTools };
  } catch (error) {
    console.error('Error getting business tools:', error);
    return { success: false, error: 'Failed to get business tools' };
  }
}

export async function createToolAccessAction(businessId: string, toolId: string) {
  try {
    const clientPortal = await prisma.clientPortal.findUnique({
      where: { businessId },
      select: { id: true }
    });

    if (!clientPortal) {
      throw new Error('Client portal not found');
    }

    const toolAccess = await prisma.toolAccess.create({
      data: {
        toolId,
        clientPortalId: clientPortal.id,
        isGranted: false // Initially not granted, requires admin approval
      }
    });

    revalidatePath(`/portal/${businessId}/tools`);
    revalidatePath(`/admin/business-details/${businessId}`);

    return { success: true, toolAccess };
  } catch (error) {
    console.error('Error creating tool access:', error);
    return { success: false, error: 'Failed to create tool access' };
  }
}

export async function createDefaultToolsAction(businessId: string) {
  try {
    console.log('Starting createDefaultToolsAction for business:', businessId);
    
    // Check if tools already exist for this business
    const existingTools = await prisma.tool.findMany({
      where: { businessId },
    });

    console.log('Found existing tools:', existingTools);

    if (existingTools.length > 0) {
      console.log('Tools already exist for this business, skipping creation');
      return { success: true, message: 'Tools already exist' };
    }

    // Create default tools
    const defaultTools = [
      {
        name: 'Google Analytics',
        description: 'Track website traffic and user behavior',
        isRequested: false,
      },
      {
        name: 'Google Search Console',
        description: 'Monitor search performance and website health',
        isRequested: false,
      },
      {
        name: 'Google Tag Manager',
        description: 'Manage marketing and analytics tags',
        isRequested: false,
      },
      {
        name: 'Google Business Profile',
        description: 'Manage your Google Business listing',
        isRequested: false,
      },
      {
        name: 'Facebook Business Manager',
        description: 'Manage Facebook business assets and ads',
        isRequested: false,
      },
    ];

    console.log('Creating default tools:', defaultTools);

    const createdTools = await Promise.all(
      defaultTools.map(async (tool) => {
        return prisma.tool.create({
          data: {
            ...tool,
            businessId,
            status: 'PENDING',
          },
        });
      })
    );

    console.log('Successfully created tools:', createdTools);
    return { success: true, tools: createdTools };
  } catch (error) {
    console.error('Failed to create default tools:', error);
    return { success: false, error: 'Failed to create default tools' };
  }
}

export async function updateToolRequest(toolId: string, isRequested: boolean) {
  try {
    const tool = await prisma.tool.update({
      where: { id: toolId },
      data: { isRequested }
    });

    // Revalidate both admin and portal pages since this affects both
    revalidatePath(`/admin/business-details/${tool.businessId}`);
    revalidatePath(`/portal/${tool.businessId}/tools`);

    return { success: true, tool };
  } catch (error) {
    console.error('Error updating tool request:', error);
    return { success: false, error: 'Failed to update tool request' };
  }
} 