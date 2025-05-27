'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAccessCode } from "@/lib/utils";
import { createDefaultToolsAction } from "./serverActions";

export async function updateBusinessDetails(
  businessId: string,
  data: {
    name: string;
    industry: string;
    website: string;
    description?: string;
    properties?: string[];
  }
) {
  try {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        industry: data.industry,
        website: data.website,
        description: data.description,
        properties: data.properties
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
    industry?: string;
    website?: string;
    description?: string;
  }
) {
  try {
    console.log('Starting business creation with data:', data);
    
    // Check if user exists, create if not
    const user = await prisma.user.upsert({
      where: { id: data.adminId },
      update: {},
      create: {
        id: data.adminId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    });

    console.log('User check/creation result:', user);
    
    const code = generateAccessCode();
    console.log('Generated access code for new business:', code);
    
    const business = await prisma.business.create({
      data: {
        name: data.name,
        adminId: data.adminId,
        code: code,
        industry: data.industry,
        website: data.website,
        description: data.description,
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
    // Get all businesses (open workspace model)
    // The function name is kept for backward compatibility
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Found ${businesses.length} total businesses accessible to user ${adminId}`);
    
    return { success: true, businesses };
  } catch (error) {
    console.error('Failed to fetch businesses:', error);
    return { success: false, error: 'Failed to fetch businesses' };
  }
}

export async function getBusinessById(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    
    if (!business) {
      return { success: false, error: 'Business not found' };
    }
    
    return { success: true, business };
  } catch (error) {
    console.error('Failed to get business by ID:', error);
    return { success: false, error: 'Failed to get business by ID' };
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

export async function getBusinessAnalysis(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connections: true }
    });
    
    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    // Parse connections JSON to get analysis data
    let connections;
    try {
      // Handle both string and object types for connections
      if (typeof business.connections === 'string') {
        connections = JSON.parse(business.connections);
      } else {
        connections = business.connections || {};
      }
    } catch (error) {
      console.error('Error parsing connections:', error);
      return { success: false, error: 'Failed to parse business data' };
    }

    // Check if websiteAnalysis exists in connections
    const analysis = connections.websiteAnalysis;
    if (!analysis) {
      return { success: false, error: 'No analysis found' };
    }
    
    return { 
      success: true, 
      analysis: {
        businessModel: analysis.businessModel || '',
        productOffering: analysis.productOffering || '',
        valuePropositions: analysis.valuePropositions || [],
        differentiationHighlights: analysis.differentiationHighlights || []
      }
    };
  } catch (error) {
    console.error('Failed to get business analysis:', error);
    return { success: false, error: 'Failed to get business analysis' };
  }
}

export async function analyzeWebsite(websiteUrl: string, userId?: string) {
  try {
    if (!websiteUrl) {
      return { success: false, error: 'Website URL is required' };
    }

    console.log('Analyzing website:', websiteUrl, 'with userId:', userId);

    // If no userId is provided, try to get it from session
    let authenticatedUserId = userId;
    if (!authenticatedUserId) {
      const session = await getServerSession(authOptions);
      authenticatedUserId = session?.user?.id;
      console.log('Got userId from session:', authenticatedUserId);
    }
    
    if (!authenticatedUserId) {
      console.error('No authenticated user ID available');
      return { success: false, error: 'Authentication required' };
    }

    // Create a temporary businessId if needed
    const tempBusinessId = 'temp-' + Math.random().toString(36).substring(2, 9);

    // Build API URL with absolute path to ensure it works in all environments
    let baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
    
    console.log('Using base URL for API call:', baseUrl);
    const apiUrl = new URL('/api/admin/analyze-website', baseUrl).toString();
    console.log('Calling API at:', apiUrl);

    // Call the analyze-website API endpoint with proper credentials
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl,
        businessId: tempBusinessId,
        userId: authenticatedUserId,
      }),
      credentials: 'include', // Include cookies in the request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Website analysis error:', errorData, 'Status:', response.status);
      return { 
        success: false, 
        error: errorData.error || `Failed to analyze website (${response.status})`
      };
    }

    const result = await response.json();
    if (result.success && result.data) {
      return { 
        success: true, 
        description: result.data.description,
        businessModel: result.data.businessModel,
        productOffering: result.data.productOffering,
        valuePropositions: result.data.valuePropositions,
        differentiationHighlights: result.data.differentiationHighlights
      };
    } else {
      return { success: false, error: 'No analysis data received' };
    }
  } catch (error) {
    console.error('Failed to analyze website:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze website'
    };
  }
}

export async function compareBusinesses(primaryBusinessData: any, competitorData: any, userId?: string) {
  try {
    if (!primaryBusinessData || !competitorData) {
      return { success: false, error: 'Both primary business and competitor data are required' };
    }

    console.log('Comparing businesses:', primaryBusinessData.name, 'vs', competitorData.name);

    // If no userId is provided, try to get it from session
    let authenticatedUserId = userId;
    if (!authenticatedUserId) {
      const session = await getServerSession(authOptions);
      authenticatedUserId = session?.user?.id;
      console.log('Got userId from session:', authenticatedUserId);
    }
    
    if (!authenticatedUserId) {
      console.error('No authenticated user ID available');
      return { success: false, error: 'Authentication required' };
    }

    // Build API URL with absolute path to ensure it works in all environments
    let baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
    
    console.log('Using base URL for API call:', baseUrl);
    const apiUrl = new URL('/api/admin/compare-businesses', baseUrl).toString();
    console.log('Calling API at:', apiUrl);

    // Call the compare-businesses API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primaryBusinessData,
        competitorData,
        userId: authenticatedUserId,
      }),
      credentials: 'include', // Include cookies in the request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Business comparison error:', errorData, 'Status:', response.status);
      return { 
        success: false, 
        error: errorData.error || `Failed to compare businesses (${response.status})`
      };
    }

    const result = await response.json();
    if (result.success && result.data) {
      return { 
        success: true, 
        strengthsVsPrimary: result.data.strengthsVsPrimary || [],
        weaknessesVsPrimary: result.data.weaknessesVsPrimary || [],
        keyDifferences: result.data.keyDifferences || []
      };
    } else {
      return { success: false, error: 'No comparison data received' };
    }
  } catch (error) {
    console.error('Failed to compare businesses:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to compare businesses'
    };
  }
}

/**
 * Delete a business and all related data
 */
export async function deleteBusiness(businessId: string) {
  try {
    console.log(`Deleting business with ID: ${businessId}`);
    
    // First check if the business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    });

    if (!business) {
      console.error('Business not found:', businessId);
      return { success: false, error: 'Business not found' };
    }

    // Using transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete reports
      const prismaAny = prisma as any;
      
      // Try to delete reports using Report model (accounting for case sensitivity issues)
      try {
        if (typeof prismaAny.Report !== 'undefined') {
          await prismaAny.Report.deleteMany({
            where: { businessId }
          });
        }
      } catch (e) {
        console.warn('Error deleting reports with Report model:', e);
        // Try with lowercase 'report'
        if (typeof prismaAny.report !== 'undefined') {
          await prismaAny.report.deleteMany({
            where: { businessId }
          });
        }
      }
      
      // Delete Scorecards - this was missing in the original function
      try {
        await tx.scorecard.deleteMany({
          where: { businessId }
        });
      } catch (e) {
        console.warn('Error deleting scorecards with scorecard model:', e);
        // Try with capitalized 'Scorecard'
        if (typeof prismaAny.Scorecard !== 'undefined') {
          await prismaAny.Scorecard.deleteMany({
            where: { businessId }
          });
        }
      }
      
      // Delete KPIs
      await tx.kPI.deleteMany({
        where: { businessId }
      });
      
      // Delete goals
      await tx.goal.deleteMany({
        where: { businessId }
      });
      
      // Delete tools (first delete related tool access)
      await tx.toolAccess.deleteMany({
        where: {
          tool: {
            businessId
          }
        }
      });
      
      await tx.tool.deleteMany({
        where: { businessId }
      });
      
      // Delete metrics
      await tx.metric.deleteMany({
        where: { businessId }
      });
      
      // Delete opportunities
      await tx.opportunity.deleteMany({
        where: { businessId }
      });
      
      // Delete client portals
      await tx.clientPortal.deleteMany({
        where: { businessId }
      });
      
      // Delete intake questions
      await tx.intakeQuestion.deleteMany({
        where: { businessId }
      });
      
      // Delete business itself
      await tx.business.delete({
        where: { id: businessId }
      });
    });
    
    console.log(`Successfully deleted business: ${business.name}`);
    
    // Revalidate paths
    revalidatePath('/admin');
    revalidatePath('/admin/business-profile');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete business:', error);
    return { success: false, error: 'Failed to delete business. There may be related data that cannot be deleted.' };
  }
} 