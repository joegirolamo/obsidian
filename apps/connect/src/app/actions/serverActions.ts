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
  benchmark?: string;
}

async function generateBenchmark(businessId: string, metricName: string): Promise<string | null> {
  try {
    // Get business details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        industry: true,
        name: true,
        description: true
      }
    });

    if (!business) return null;

    // This is a placeholder for the AI-based benchmark generation
    // In a real implementation, this would use an AI model to analyze the business profile
    // and generate appropriate benchmarks based on the industry and metric type
    const benchmarks: { [key: string]: { [key: string]: string } } = {
      'Technology': {
        'Monthly Revenue': '$100,000',
        'Customer Acquisition Cost': '$50',
        'Churn Rate': '5%',
        'Customer Lifetime Value': '$2,000',
        'Website Conversion Rate': '2.5%'
      },
      'Retail': {
        'Monthly Revenue': '$50,000',
        'Customer Acquisition Cost': '$25',
        'Churn Rate': '3%',
        'Customer Lifetime Value': '$1,000',
        'Website Conversion Rate': '3%'
      },
      'Professional Services': {
        'Monthly Revenue': '$75,000',
        'Customer Acquisition Cost': '$100',
        'Churn Rate': '2%',
        'Customer Lifetime Value': '$5,000',
        'Website Conversion Rate': '4%'
      }
    };

    const industry = business.industry || 'Technology';
    return benchmarks[industry]?.[metricName] || null;
  } catch (error) {
    console.error('Error generating benchmark:', error);
    return null;
  }
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

    // Generate benchmark for the new metric
    const benchmark = await generateBenchmark(businessId, data.name);

    const metric = await prisma.metric.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        type: data.type,
        isClientRequested: data.isClientRequested ?? false,
        value: data.value,
        benchmark
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

    // If the name is being updated, regenerate the benchmark
    let benchmark = undefined;
    if (data.name && data.name !== existingMetric.name) {
      benchmark = await generateBenchmark(businessId, data.name);
    }

    const metric = await prisma.metric.update({
      where: { id: metricId },
      data: {
        ...data,
        benchmark: benchmark !== undefined ? benchmark : undefined
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
        name: 'Monthly Revenue',
        description: 'Total revenue for the month',
        type: 'NUMBER' as MetricType,
        isClientRequested: true,
      },
      {
        name: 'Customer Acquisition Cost',
        description: 'Average cost to acquire a new customer',
        type: 'NUMBER' as MetricType,
        isClientRequested: true,
      },
      {
        name: 'Churn Rate',
        description: 'Monthly customer churn rate',
        type: 'NUMBER' as MetricType,
        isClientRequested: true,
      }
    ];

    const metrics = await Promise.all(
      defaultMetrics.map(async metric => {
        const benchmark = await generateBenchmark(businessId, metric.name);
        return prisma.metric.create({
          data: {
            ...metric,
            businessId,
            benchmark
          }
        });
      })
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
        : tool.name === 'Google Ads'
        ? '/auth/google-ads'
        : tool.name === 'Meta Ads'
        ? '/auth/meta-ads'
        : tool.name === 'Meta Page'
        ? '/auth/meta-page'
        : tool.name === 'Meta Dataset'
        ? '/auth/meta-dataset'
        : tool.name === 'LinkedIn Page'
        ? '/auth/linkedin-page'
        : tool.name === 'LinkedIn Ads'
        ? '/auth/linkedin-ads'
        : tool.name === 'Shopify'
        ? '/auth/shopify'
        : '/auth/request-access' // Default fallback for tools without specific OAuth
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
        name: 'Google Ads',
        description: 'Manage and optimize Google advertising campaigns',
        isRequested: false,
      },
      {
        name: 'Meta Ads',
        description: 'Manage Facebook and Instagram advertising campaigns',
        isRequested: false,
      },
      {
        name: 'Meta Page',
        description: 'Access Facebook page insights and management',
        isRequested: false,
      },
      {
        name: 'Meta Dataset',
        description: 'Access Meta data for analysis and reporting',
        isRequested: false,
      },
      {
        name: 'LinkedIn Page',
        description: 'Manage LinkedIn company page and insights',
        isRequested: false,
      },
      {
        name: 'LinkedIn Ads',
        description: 'Manage LinkedIn advertising campaigns',
        isRequested: false,
      },
      {
        name: 'Shopify',
        description: 'Access store data, orders, and analytics',
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

export async function deleteAllToolsAction(businessId: string) {
  try {
    console.log('Deleting all tools for business:', businessId);
    
    // Delete all tool access records first
    await prisma.toolAccess.deleteMany({
      where: {
        tool: {
          businessId
        }
      }
    });

    // Then delete all tools
    await prisma.tool.deleteMany({
      where: {
        businessId
      }
    });

    console.log('Successfully deleted all tools for business:', businessId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete tools:', error);
    return { success: false, error: 'Failed to delete tools' };
  }
}

export async function getAllToolRequestsAction(businessId: string) {
  try {
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

    const formattedTools: Tool[] = tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      status: tool.toolAccess[0]?.isGranted ? "GRANTED" : null,
      isRequested: tool.isRequested,
    }));

    return { success: true, tools: formattedTools };
  } catch (error) {
    console.error('Error getting all tool requests:', error);
    return { success: false, error: 'Failed to get tool requests' };
  }
}

export async function getAllMetricsAction() {
  try {
    const metrics = await prisma.metric.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, metrics };
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return { success: false, error: 'Failed to fetch metrics' };
  }
}

// Goals actions
export async function getBusinessGoalsAction(businessId: string) {
  try {
    const goals = await prisma.goal.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, goals };
  } catch (error) {
    console.error('Error getting business goals:', error);
    return { success: false, error: 'Failed to get business goals' };
  }
}

export async function addGoalAction(businessId: string, data: { name: string; description?: string; status?: string; targetDate?: Date }) {
  try {
    const goal = await prisma.goal.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        status: data.status as any || 'IN_PROGRESS',
        targetDate: data.targetDate
      }
    });
    
    return { success: true, goal };
  } catch (error) {
    console.error('Error adding goal:', error);
    return { success: false, error: 'Failed to add goal' };
  }
}

export async function updateGoalAction(goalId: string, data: { name?: string; description?: string; status?: string; targetDate?: Date }) {
  try {
    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        name: data.name,
        description: data.description,
        status: data.status as any,
        targetDate: data.targetDate
      }
    });
    
    return { success: true, goal };
  } catch (error) {
    console.error('Error updating goal:', error);
    return { success: false, error: 'Failed to update goal' };
  }
}

export async function deleteGoalAction(goalId: string) {
  try {
    await prisma.goal.delete({
      where: { id: goalId }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { success: false, error: 'Failed to delete goal' };
  }
}

// KPIs actions
export async function getBusinessKPIsAction(businessId: string) {
  try {
    const kpis = await prisma.kPI.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, kpis };
  } catch (error) {
    console.error('Error getting business KPIs:', error);
    return { success: false, error: 'Failed to get business KPIs' };
  }
}

export async function addKPIAction(businessId: string, data: { name: string; description?: string; target?: string; current?: string; unit?: string }) {
  try {
    const kpi = await prisma.kPI.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        target: data.target,
        current: data.current,
        unit: data.unit
      }
    });
    
    return { success: true, kpi };
  } catch (error) {
    console.error('Error adding KPI:', error);
    return { success: false, error: 'Failed to add KPI' };
  }
}

export async function updateKPIAction(kpiId: string, data: { name?: string; description?: string; target?: string; current?: string; unit?: string }) {
  try {
    const kpi = await prisma.kPI.update({
      where: { id: kpiId },
      data: {
        name: data.name,
        description: data.description,
        target: data.target,
        current: data.current,
        unit: data.unit
      }
    });
    
    return { success: true, kpi };
  } catch (error) {
    console.error('Error updating KPI:', error);
    return { success: false, error: 'Failed to update KPI' };
  }
}

export async function deleteKPIAction(kpiId: string) {
  try {
    await prisma.kPI.delete({
      where: { id: kpiId }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting KPI:', error);
    return { success: false, error: 'Failed to delete KPI' };
  }
}

/**
 * Add a user to all existing businesses
 * This ensures users show up in the BusinessUsers relation for the open workspace model
 */
export async function addUserToAllBusinesses(userId: string) {
  try {
    console.log(`Adding user ${userId} to all businesses (open workspace model)`);
    
    // Get all businesses where the user is not already a member
    const businesses = await prisma.business.findMany({
      where: {
        users: {
          none: {
            id: userId
          }
        }
      },
      select: {
        id: true,
        name: true
      }
    });
    
    if (businesses.length === 0) {
      console.log(`User ${userId} is already a member of all businesses`);
      return { success: true, message: 'User already in all businesses' };
    }
    
    console.log(`Found ${businesses.length} businesses to add user to`);
    
    // Add user to all businesses at once (more efficient)
    for (const business of businesses) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          users: {
            connect: { id: userId }
          }
        }
      });
      console.log(`Added user ${userId} to business ${business.name}`);
    }
    
    console.log(`Successfully added user ${userId} to ${businesses.length} businesses`);
    return { success: true, message: `Added user to ${businesses.length} businesses` };
  } catch (error) {
    console.error(`Failed to add user ${userId} to all businesses:`, error);
    return { success: false, error: 'Failed to add user to all businesses' };
  }
} 