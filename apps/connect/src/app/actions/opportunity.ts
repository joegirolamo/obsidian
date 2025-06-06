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
    // First check if the opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });
    
    if (!opportunity) {
      console.error(`Opportunity with ID ${opportunityId} not found`);
      return { success: false, error: 'Opportunity not found' };
    }
    
    // Delete the opportunity
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

export async function generateOpportunitiesWithAI(businessId: string, category: string, userIdFromRequest?: string) {
  try {
    // Enhanced authentication handling
    console.log('Generating opportunities for business:', businessId, 'category:', category);
    
    // Try to get session using getServerSession
    const session = await getServerSession(authOptions);
    console.log('Opportunities - Session from getServerSession:', session ? 'Found' : 'Not found');
    
    // Use either the session user ID or the provided userIdFromRequest
    const userId = session?.user?.id || userIdFromRequest;
    
    if (!userId) {
      console.error('No authenticated user found in session or request');
      throw new Error('Unauthorized: No authenticated user found');
    }

    console.log('Using user ID for authentication:', userId);

    // Check if user is admin - always verify in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true, email: true }
    });

    console.log('Opportunities - User found:', user ? 'Yes' : 'No', 'Role:', user?.role);

    if (!user) {
      console.error('User not found in database');
      throw new Error('User not found');
    }

    if (user.role !== 'ADMIN') {
      console.error('User is not an admin:', user);
      throw new Error('Unauthorized: User is not an admin');
    }

    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!aiConfig) {
      throw new Error('No active AI configuration found');
    }

    // Get the full business brain data including website analysis
    const brainResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/business/${businessId}/ai-brain`);
    if (!brainResponse.ok) {
      throw new Error('Failed to fetch business brain data');
    }
    
    const brainData = await brainResponse.json();
    
    if (!brainData.business) {
      throw new Error('Invalid business brain data');
    }

    // Define the category mappings
    const categoryMap: Record<string, string> = {
      'EBITDA': 'Profitability and cost optimization',
      'Revenue': 'Revenue growth and sales improvement',
      'De-Risk': 'Risk mitigation and business stability',
      'Foundation': 'Marketing foundation and infrastructure',
      'Acquisition': 'Customer acquisition and lead generation',
      'Conversion': 'Website conversion and user experience',
      'Retention': 'Customer retention and engagement'
    };

    // Define service areas for each bucket
    const bucketServiceAreas: Record<string, string[]> = {
      'Foundation': ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
      'Acquisition': ['Performance Media', 'Campaigns', 'Earned Media'],
      'Conversion': ['Website', 'Ecommerce Platforms', 'Digital Product'],
      'Retention': ['CRM', 'App', 'Organic Social']
    };

    // Prepare the prompt based on the category
    const categoryDescription = categoryMap[category] || category;

    // Get bucket-specific service areas or use default list
    const relevantServiceAreas = bucketServiceAreas[category] || 
      ['Website', 'Digital Product', 'Brand/GTM Strategy', 'SEO', 'Performance Media', 'Email Marketing', 'Content Marketing', 'Social Media', 'CRM'];

    // Create the base prompt
    let prompt = `As a digital marketing strategist, I need to generate 3 actionable opportunities for a business. 
    
Business details:
Name: ${brainData.business.name}
Industry: ${brainData.business.industry || 'Not specified'}
Description: ${brainData.business.description || 'Not provided'}

Focus area: ${categoryDescription}
Service Areas to consider: ${relevantServiceAreas.join(', ')}
`;

    // Add website analysis data if available
    if (brainData.websiteAnalysis) {
      prompt += `
Website Analysis:
${brainData.websiteAnalysis.businessModel ? `Business Model: ${brainData.websiteAnalysis.businessModel}` : ''}
${brainData.websiteAnalysis.productOffering ? `Product/Service Offerings: ${brainData.websiteAnalysis.productOffering}` : ''}
`;

      // Add value propositions if available
      if (brainData.websiteAnalysis.valuePropositions && brainData.websiteAnalysis.valuePropositions.length > 0) {
        prompt += `
Value Propositions:
${brainData.websiteAnalysis.valuePropositions.map((prop: string) => `- ${prop}`).join('\n')}
`;
      }

      // Add differentiation highlights if available
      if (brainData.websiteAnalysis.differentiationHighlights && brainData.websiteAnalysis.differentiationHighlights.length > 0) {
        prompt += `
Differentiation Highlights:
${brainData.websiteAnalysis.differentiationHighlights.map((highlight: string) => `- ${highlight}`).join('\n')}
`;
      }
    }

    // Add goals, KPIs, and metrics
    prompt += `
${brainData.goals && brainData.goals.length > 0 ? 
  `Business Goals:\n${brainData.goals.map((g: any) => `- ${g.name}: ${g.description || ''}`).join('\n')}` : ''}

${brainData.kpis && brainData.kpis.length > 0 ? 
  `Key Performance Indicators:\n${brainData.kpis.map((k: any) => `- ${k.name}: ${k.description || ''} (Current: ${k.current || 'Not set'}, Target: ${k.target || 'Not set'})`).join('\n')}` : ''}

${brainData.metrics && brainData.metrics.length > 0 ? 
  `Metrics:\n${brainData.metrics.map((m: any) => `- ${m.name}: ${m.description || ''} (Value: ${m.value || 'Not set'}, Benchmark: ${m.benchmark || 'Not set'})`).join('\n')}` : ''}

Generate 3 specific, actionable opportunities for the ${categoryDescription} category. For each opportunity, provide:
1. A clear, specific title (max 10 words)
2. A short description explaining the opportunity (max 150 characters)
3. The most relevant service area from the list provided
4. Which goal or KPI this opportunity would primarily impact (if applicable)

Format your response as a JSON array of objects with properties: title, description, serviceArea, and targetKPI.`;

    // Call OpenAI API directly
    let opportunities = [];
    
    if (aiConfig.provider === 'OpenAI') {
      console.log('Calling OpenAI API with model:', aiConfig.model);
      
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates business opportunities in JSON format only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const apiResponse = await openAIResponse.json();
      console.log('OpenAI API response received');
      
      // Parse the response to get the opportunities
      try {
        const content = apiResponse.choices?.[0]?.message?.content;
        console.log('Content received:', content ? 'Yes' : 'No');
        
        if (content) {
          const parsedContent = JSON.parse(content);
          opportunities = parsedContent.opportunities || [];
          
          // Fallback if the output format is different
          if (!opportunities.length && Array.isArray(parsedContent)) {
            opportunities = parsedContent;
          }
          
          console.log(`Parsed ${opportunities.length} opportunities`);
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse AI response');
      }
    } else {
      throw new Error(`AI provider '${aiConfig.provider}' not supported`);
    }

    // Create the opportunities in the database
    const createdOpportunities = [];
    for (const opp of opportunities) {
      try {
        const result = await createOpportunity(businessId, {
          title: opp.title,
          description: opp.description,
          category: category,
          serviceArea: opp.serviceArea,
          targetKPI: opp.targetKPI
        });
        
        if (result.success && result.opportunity) {
          createdOpportunities.push(result.opportunity);
        }
      } catch (error) {
        console.error('Error creating opportunity:', error);
      }
    }

    revalidatePath('/admin/dvcp/opportunities');
    return { success: true, opportunities: createdOpportunities };
  } catch (error) {
    console.error('Failed to generate opportunities with AI:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate opportunities with AI' };
  }
}

export async function updateOpportunityTimeline(
  opportunityId: string,
  timeline: string
) {
  try {
    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { timeline },
    });

    revalidatePath('/admin/dvcp/opportunities');
    revalidatePath('/admin/dvcp/planning');
    return { success: true, opportunity };
  } catch (error) {
    console.error('Failed to update opportunity timeline:', error);
    return { success: false, error: 'Failed to update opportunity timeline' };
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
    // First, get the current opportunity to preserve its description
    const currentOpp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { description: true }
    });

    // Create a description that preserves existing content but adds span data
    let newDescription = currentOpp?.description || '';
    
    // Check if there's already span data in the description
    const spanMarker = "[SPAN:";
    const spanEndMarker = "]";
    
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
    
    // Update the opportunity in the database
    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { 
        description: newDescription
      },
    });

    revalidatePath('/admin/dvcp/opportunities');
    revalidatePath('/admin/dvcp/planning');
    return { success: true, opportunity };
  } catch (error) {
    console.error('Failed to update opportunity span:', error);
    return { success: false, error: 'Failed to update opportunity span' };
  }
} 