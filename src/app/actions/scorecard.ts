"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Opportunity, OpportunityStatus } from "@prisma/client";

// Type for Opportunity with all fields
type Opportunity = {
  id: string;
  title: string;
  description: string | null;
  status: OpportunityStatus;
  businessId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  score?: number | null;
  maxScore?: number | null;
  serviceAreas?: string[];
  highlights?: any;
};

// Simple type for a highlight
type Highlight = {
  id: string;
  text: string;
  serviceArea: string;
  aiGenerated?: boolean;
};

// Placeholder data from the Scorecard component
export const placeholderData = [
  {
    name: 'Foundation',
    score: 75,
    serviceAreas: ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
    highlights: [
      { text: 'Brand messaging inconsistent across digital touchpoints', serviceArea: 'Brand/GTM Strategy' },
      { text: 'Marketing automation tools severely underutilized', serviceArea: 'Martech' },
      { text: 'Analytics implementation lacks cross-channel customer journey tracking', serviceArea: 'Data & Analytics' }
    ],
    metricSignals: [
      { id: 'm1', name: 'Brand Consistency', value: '65%', trend: 'down', aiGenerated: true },
      { id: 'm2', name: 'Automation Utilization', value: '32%', trend: 'down', aiGenerated: true },
      { id: 'm3', name: 'Analytics Coverage', value: '48%', trend: 'neutral', aiGenerated: true }
    ],
    lastAuditedAt: new Date().toISOString()
  },
  {
    name: 'Acquisition',
    score: 82,
    serviceAreas: ['Performance Media', 'Campaigns', 'Earned Media'],
    highlights: [
      { text: 'Google Ads quality scores below industry average', serviceArea: 'Performance Media' },
      { text: 'Campaign attribution lacking for multi-touch journeys', serviceArea: 'Campaigns' },
      { text: 'PR and earned media strategy not aligned with overall marketing goals', serviceArea: 'Earned Media' }
    ],
    metricSignals: [
      { id: 'm4', name: 'Ad Quality Score', value: '5.2/10', trend: 'down', aiGenerated: true },
      { id: 'm5', name: 'Attribution Accuracy', value: '61%', trend: 'neutral', aiGenerated: true },
      { id: 'm6', name: 'Media Alignment', value: '43%', trend: 'down', aiGenerated: true }
    ],
    lastAuditedAt: new Date().toISOString()
  },
  {
    name: 'Conversion',
    score: 65,
    serviceAreas: ['Website', 'Ecommerce Platforms', 'Digital Product'],
    highlights: [
      { text: 'Mobile page load speed exceeding 4 seconds on product pages', serviceArea: 'Website' },
      { text: 'Cart abandonment rate 15% above industry average', serviceArea: 'Ecommerce Platforms' },
      { text: 'Product recommendation algorithm performing below benchmark standards', serviceArea: 'Digital Product' }
    ],
    metricSignals: [
      { id: 'm7', name: 'Page Load Speed', value: '4.3s', trend: 'down', aiGenerated: true },
      { id: 'm8', name: 'Cart Abandonment', value: '72%', trend: 'up', aiGenerated: true },
      { id: 'm9', name: 'Recommendation CTR', value: '2.1%', trend: 'down', aiGenerated: true }
    ],
    lastAuditedAt: new Date().toISOString()
  },
  {
    name: 'Retention',
    score: 70,
    serviceAreas: ['CRM', 'App', 'Organic Social'],
    highlights: [
      { text: 'Email list declining 5% month-over-month due to unsubscribes', serviceArea: 'CRM' },
      { text: 'Social content calendar inconsistently maintained', serviceArea: 'Organic Social' },
      { text: 'Mobile app retention rate drops 40% after first week of installation', serviceArea: 'App' }
    ],
    metricSignals: [
      { id: 'm10', name: 'Email Open Rate', value: '18%', trend: 'down', aiGenerated: true },
      { id: 'm11', name: 'App Retention', value: '22%', trend: 'down', aiGenerated: true },
      { id: 'm12', name: 'Social Engagement', value: '0.8%', trend: 'neutral', aiGenerated: true }
    ],
    lastAuditedAt: new Date().toISOString()
  }
];

export async function preloadScorecardFocusArea(businessId: string, focusAreaName: string) {
  try {
    console.log(`[DEBUG] Preloading ${focusAreaName} scorecard data for business:`, businessId);
    
    // Find the specific focus area data
    const focusAreaData = placeholderData.find(category => category.name === focusAreaName);
    
    if (!focusAreaData) {
      return { success: false, error: `Focus area ${focusAreaName} not found` };
    }
    
    // Create or update scorecard opportunity for this specific category
    const existingScorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category: focusAreaData.name,
        title: { contains: 'Scorecard' }
      }
    });
    
    // Format the highlights into a structured description for backward compatibility
    const highlightsText = focusAreaData.highlights.map(h => 
      `- ${h.text} (${h.serviceArea})`
    ).join('\n');
    
    // Include service areas in the description for backward compatibility
    const description = `Service Areas: ${focusAreaData.serviceAreas.join(', ')}\n\nHighlights:\n${highlightsText}`;
    
    // Prepare the highlights in JSON format including score and maxScore
    // Add timestamps to simulate an AI analysis occurring at this moment
    const currentTime = new Date();
    
    const highlightsJson = {
      items: focusAreaData.highlights.map((h, index) => ({
        id: `audit-${currentTime.getTime()}-${index}`,
        text: h.text,
        serviceArea: h.serviceArea,
        createdAt: currentTime.toISOString(),
        aiGenerated: true
      })),
      metricSignals: focusAreaData.metricSignals?.map(m => ({
        ...m,
        id: `metric-${currentTime.getTime()}-${m.id}`,
        createdAt: currentTime.toISOString()
      })) || [],
      score: focusAreaData.score,
      maxScore: 100,
      serviceAreas: focusAreaData.serviceAreas,
      lastAuditedAt: currentTime.toISOString()
    };
    
    // If there are existing highlights, we want to merge rather than replace
    if (existingScorecard && existingScorecard.highlights) {
      try {
        // Parse existing highlights
        const existingHighlights = typeof existingScorecard.highlights === 'string'
          ? JSON.parse(existingScorecard.highlights)
          : existingScorecard.highlights;
          
        // If we have existing highlights in the right format, merge with new ones
        if (existingHighlights && existingHighlights.items && Array.isArray(existingHighlights.items)) {
          // Only keep non-AI generated highlights from before
          const userHighlights = existingHighlights.items.filter((h: any) => !h.aiGenerated);
          
          // Keep user metrics (ones not generated by AI)
          const userMetrics = existingHighlights.metricSignals?.filter((m: any) => !m.aiGenerated) || [];
          
          // Combine user-created items with new AI items
          highlightsJson.items = [...userHighlights, ...highlightsJson.items];
          highlightsJson.metricSignals = [...userMetrics, ...highlightsJson.metricSignals];
          
          console.log(`[DEBUG] Merged ${userHighlights.length} user highlights and ${userMetrics.length} user metrics with AI-generated content`);
        }
      } catch (error) {
        console.error('Error parsing existing highlights during audit:', error);
      }
    }
    
    let result;
    if (existingScorecard) {
      // Update existing scorecard
      result = await prisma.opportunity.update({
        where: { id: existingScorecard.id },
        data: {
          title: `${focusAreaData.name} Scorecard`,
          description: description,
          status: "OPEN",
          // @ts-ignore - Using highlights as a custom field
          highlights: highlightsJson
        }
      });
    } else {
      // Create new scorecard
      result = await prisma.opportunity.create({
        data: {
          businessId,
          title: `${focusAreaData.name} Scorecard`,
          category: focusAreaData.name,
          description: description,
          status: "OPEN",
          // @ts-ignore - Using highlights as a custom field
          highlights: highlightsJson
        }
      });
    }
    
    console.log(`[DEBUG] Preloaded ${focusAreaName} scorecard data:`, result);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true, scorecard: result };
  } catch (error) {
    console.error(`[DEBUG] Failed to preload ${focusAreaName} scorecard data:`, error);
    return { success: false, error: `Failed to preload ${focusAreaName} scorecard data` };
  }
}

export async function preloadScorecardData(businessId: string) {
  try {
    console.log('[DEBUG] Preloading scorecard data for business:', businessId);
    
    // Create or update scorecard opportunities for each category
    const results = await Promise.all(placeholderData.map(async (category) => {
      const existingScorecard = await prisma.opportunity.findFirst({
        where: {
          businessId: businessId,
          category: category.name,
          title: { contains: 'Scorecard' }
        }
      });
      
      // Format the highlights into a structured description for backward compatibility
      const highlightsText = category.highlights.map(h => 
        `- ${h.text} (${h.serviceArea})`
      ).join('\n');
      
      // Include service areas in the description
      const description = `Service Areas: ${category.serviceAreas.join(', ')}\n\nHighlights:\n${highlightsText}`;
      
      // Prepare the highlights in JSON format including score and maxScore
      const highlightsJson = {
        items: category.highlights.map((h, index) => ({
          id: `${index + 1}`,
          text: h.text,
          serviceArea: h.serviceArea
        })),
        score: category.score,
        maxScore: 100,
        serviceAreas: category.serviceAreas
      };
      
      if (existingScorecard) {
        // Update existing scorecard
        return prisma.opportunity.update({
          where: { id: existingScorecard.id },
          data: {
            title: `${category.name} Scorecard`,
            description: description,
            status: "OPEN",
            // @ts-ignore - Using highlights as a custom field
            highlights: highlightsJson
          }
        });
      } else {
        // Create new scorecard
        return prisma.opportunity.create({
          data: {
            businessId,
            title: `${category.name} Scorecard`,
            category: category.name,
            description: description,
            status: "OPEN",
            // @ts-ignore - Using highlights as a custom field
            highlights: highlightsJson
          }
        });
      }
    }));
    
    console.log('[DEBUG] Preloaded scorecard data:', results);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true, count: results.length };
  } catch (error) {
    console.error('[DEBUG] Failed to preload scorecard data:', error);
    return { success: false, error: 'Failed to preload scorecard data' };
  }
}

export async function updateScorecardCategory(
  businessId: string,
  data: {
    name: string;
    score: number;
    highlights: string;
    serviceAreas?: string[];
    highlightsData?: any;
  }
) {
  try {
    // Find existing scorecard opportunity
    const existingScorecard = await prisma.opportunity.findFirst({
      where: {
        businessId: businessId,
        category: data.name,
        title: { contains: 'Scorecard' }
      }
    });

    let scorecard;
    
    // Parse service areas and highlights from the description if not provided directly
    const serviceAreas = data.serviceAreas || [];
    
    // Process the highlights data to ensure it's stored in the correct format
    // Include score and maxScore in the highlights JSON
    let highlightsData;
    if (data.highlightsData) {
      if (data.highlightsData.items) {
        // Already has items format, add score
        highlightsData = {
          ...data.highlightsData,
          score: data.score,
          maxScore: 100
        };
      } else if (Array.isArray(data.highlightsData)) {
        // Convert array to expected format with score
        highlightsData = { 
          items: data.highlightsData,
          score: data.score,
          maxScore: 100
        };
      } else {
        // Use as is but ensure score is added
        highlightsData = {
          ...data.highlightsData,
          score: data.score,
          maxScore: 100
        };
      }
    } else {
      // No highlights data, create minimal structure
      highlightsData = { 
        items: [],
        score: data.score,
        maxScore: 100
      };
    }
    
    // Keep the serviceAreas in the highlights data to avoid model mismatch
    if (serviceAreas.length > 0) {
      highlightsData.serviceAreas = serviceAreas;
    }
    
    if (existingScorecard) {
      // Update existing record
      scorecard = await prisma.opportunity.update({
        where: {
          id: existingScorecard.id
        },
        data: {
          title: `${data.name} Scorecard`,
          description: data.highlights,
          status: "OPEN",
          // @ts-ignore - Using highlights as a custom field
          highlights: highlightsData
        }
      });
    } else {
      // Create new record
      scorecard = await prisma.opportunity.create({
        data: {
          businessId,
          title: `${data.name} Scorecard`,
          category: data.name,
          description: data.highlights,
          status: "OPEN",
          // @ts-ignore - Using highlights as a custom field
          highlights: highlightsData
        }
      });
    }

    revalidatePath('/admin/scorecard');
    return { success: true, scorecard };
  } catch (error) {
    console.error('Failed to update scorecard category:', error);
    return { success: false, error: 'Failed to update scorecard category' };
  }
}

export async function publishScorecard(businessId: string, isPublished: boolean = true) {
  try {
    console.log(`[DEBUG] ${isPublished ? 'Publishing' : 'Unpublishing'} scorecards for business:`, businessId);
    
    await prisma.opportunity.updateMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
      },
      data: { isPublished },
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error(`[DEBUG] Failed to ${isPublished ? 'publish' : 'unpublish'} scorecards:`, error);
    return { success: false, error: `Failed to ${isPublished ? 'publish' : 'unpublish'} scorecards` };
  }
}

export async function unpublishScorecard(businessId: string) {
  try {
    await prisma.opportunity.updateMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
      },
      data: { isPublished: false },
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish scorecard:', error);
    return { success: false, error: 'Failed to unpublish scorecard' };
  }
}

export async function getScorecardPublishStatus(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecard status for business:', businessId);
    const opportunities = await prisma.opportunity.findMany({
      where: {
        businessId,
        category: {
          in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
        },
        title: {
          contains: 'Scorecard'
        }
      },
      select: {
        isPublished: true
      }
    });
    
    // Consider published if any opportunities are published
    const isPublished = opportunities.some(opp => opp.isPublished);
    console.log('[DEBUG] Scorecard publish status:', { businessId, isPublished, opportunityCount: opportunities.length });
    
    return { success: true, isPublished };
  } catch (error) {
    console.error('[DEBUG] Failed to get scorecard publish status:', error);
    return { success: false, error: 'Failed to get scorecard publish status' };
  }
}

export async function updateScorecardHighlights(
  businessId: string,
  data: {
    category: string;
    operation: 'add' | 'delete' | 'update';
    highlight?: {
      text: string;
      serviceArea: string;
      aiGenerated?: boolean;
      createdAt?: string;
    };
    highlightId?: string;
    score?: number;
    maxScore?: number;
  }
) {
  try {
    console.log('[DEBUG] updateScorecardHighlights called with:', { businessId, data });
    
    // Find existing scorecard opportunity
    const existingScorecard = await prisma.opportunity.findFirst({
      where: {
        businessId: businessId,
        category: data.category,
        title: { contains: 'Scorecard' }
      }
    });

    if (!existingScorecard) {
      console.error(`[DEBUG] No scorecard found for ${data.category}`);
      return { success: false, error: `No scorecard found for ${data.category}` };
    }
    
    // Use raw queries to work around type issues with the highlights field
    // First, get the current highlights JSON as a string
    const rawResult = await prisma.$queryRaw`
      SELECT highlights FROM "Opportunity" WHERE id = ${existingScorecard.id}
    `;
    
    console.log('[DEBUG] Raw result:', rawResult);
    
    // Parse the highlights JSON
    let highlightsData: any;
    try {
      const rawHighlights = rawResult[0]?.highlights;
      if (rawHighlights) {
        if (typeof rawHighlights === 'string') {
          highlightsData = JSON.parse(rawHighlights);
        } else {
          highlightsData = rawHighlights;
        }
      } else {
        // Default structure if no highlights
        highlightsData = {
          items: [],
          score: existingScorecard.score || 0,
          maxScore: existingScorecard.maxScore || 100,
          serviceAreas: existingScorecard.serviceAreas || []
        };
      }
    } catch (e) {
      console.error('[DEBUG] Error parsing highlights:', e);
      // Default structure if parsing fails
      highlightsData = {
        items: [],
        score: existingScorecard.score || 0,
        maxScore: existingScorecard.maxScore || 100,
        serviceAreas: existingScorecard.serviceAreas || []
      };
    }
    
    // Ensure the data has the right structure
    if (!highlightsData.items) {
      if (Array.isArray(highlightsData)) {
        // Convert array to structured format
        highlightsData = {
          items: highlightsData,
          score: existingScorecard.score || 0,
          maxScore: existingScorecard.maxScore || 100,
          serviceAreas: existingScorecard.serviceAreas || []
        };
      } else {
        // Add items array if missing
        highlightsData.items = [];
      }
    }
    
    // Perform the requested operation
    let updatedHighlightsData = { ...highlightsData };
    let newHighlight: any = null;
    
    if (data.operation === 'add' && data.highlight) {
      console.log('[DEBUG] Adding highlight:', data.highlight);
      
      // Create a new highlight with ID
      newHighlight = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...data.highlight
      };
      
      // Add to existing highlights
      updatedHighlightsData.items = [...(updatedHighlightsData.items || []), newHighlight];
      
      console.log('[DEBUG] Added highlight, new count:', updatedHighlightsData.items.length);
    } 
    else if (data.operation === 'delete' && data.highlightId) {
      console.log('[DEBUG] Deleting highlight with ID:', data.highlightId);
      
      // Remove highlight with specified ID
      updatedHighlightsData.items = updatedHighlightsData.items.filter((h: any) => h.id !== data.highlightId);
      
      console.log('[DEBUG] Deleted highlight, new count:', updatedHighlightsData.items.length);
    }
    else if (data.operation === 'update') {
      console.log('[DEBUG] Updating scorecard data');
      
      // Update score if provided
      if (typeof data.score === 'number') {
        updatedHighlightsData.score = data.score;
        console.log('[DEBUG] Updated score to:', data.score);
      }
      
      // Update maxScore if provided
      if (typeof data.maxScore === 'number') {
        updatedHighlightsData.maxScore = data.maxScore;
        console.log('[DEBUG] Updated maxScore to:', data.maxScore);
      }
    }
    
    // Convert the updated highlights to a JSON string
    const highlightsJson = JSON.stringify(updatedHighlightsData);
    
    // Update the scorecard using raw SQL to avoid type issues
    await prisma.$executeRaw`
      UPDATE "Opportunity" 
      SET highlights = ${highlightsJson}::jsonb,
          score = ${updatedHighlightsData.score || null},
          "maxScore" = ${updatedHighlightsData.maxScore || 100}
      WHERE id = ${existingScorecard.id}
    `;
    
    console.log('[DEBUG] Updated scorecard highlights for ID:', existingScorecard.id);
    
    // Update the score and maxScore in the regular fields as well
    await prisma.opportunity.update({
      where: {
        id: existingScorecard.id
      },
      data: {
        score: updatedHighlightsData.score || null,
        maxScore: updatedHighlightsData.maxScore || 100
      }
    });
    
    revalidatePath('/admin/scorecard');
    
    return { 
      success: true, 
      highlight: newHighlight
    };
  } catch (error) {
    console.error('[DEBUG] Failed to update scorecard highlights:', error);
    return { success: false, error: 'Failed to update scorecard highlights' };
  }
}

// Add a highlight to a scorecard
export async function addScorecardHighlight(
  businessId: string,
  category: string,
  highlight: { text: string; serviceArea: string }
) {
  try {
    console.log('[DEBUG] Adding highlight to scorecard:', { businessId, category, highlight });
    
    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      console.error('[DEBUG] No scorecard found for category:', category);
      return { success: false, error: `Scorecard not found for ${category}` };
    }

    // Create new highlight with ID
    const newHighlight: Highlight = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: highlight.text,
      serviceArea: highlight.serviceArea,
      aiGenerated: false
    };

    // Get current highlights
    let currentHighlights = [];
    if (scorecard.highlights) {
      try {
        currentHighlights = typeof scorecard.highlights === 'string' 
          ? JSON.parse(scorecard.highlights as string) 
          : scorecard.highlights;
      } catch (e) {
        console.error('[DEBUG] Error parsing highlights:', e);
      }
    }

    // Add new highlight
    const updatedHighlights = [...currentHighlights, newHighlight];
    
    console.log('[DEBUG] Updating scorecard with new highlight:', { 
      scorecardId: scorecard.id, 
      highlightCount: updatedHighlights.length 
    });

    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: { highlights: updatedHighlights }
    });

    revalidatePath('/admin/scorecard');
    return { success: true, highlight: newHighlight };
  } catch (error) {
    console.error('[DEBUG] Error adding highlight:', error);
    return { success: false, error: 'Failed to add highlight' };
  }
}

// Delete a highlight from a scorecard
export async function deleteScorecardHighlight(
  businessId: string,
  category: string,
  highlightId: string
) {
  try {
    console.log('[DEBUG] Deleting highlight from scorecard:', { businessId, category, highlightId });
    
    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      console.error('[DEBUG] No scorecard found for category:', category);
      return { success: false, error: `Scorecard not found for ${category}` };
    }

    // Get current highlights
    let currentHighlights = [];
    if (scorecard.highlights) {
      try {
        currentHighlights = typeof scorecard.highlights === 'string' 
          ? JSON.parse(scorecard.highlights as string) 
          : scorecard.highlights;
      } catch (e) {
        console.error('[DEBUG] Error parsing highlights:', e);
      }
    }

    // Check if the highlight exists before trying to remove it
    const highlightExists = currentHighlights.some((h: Highlight) => h.id === highlightId);
    if (!highlightExists) {
      console.error('[DEBUG] Highlight not found:', highlightId);
      return { success: false, error: `Highlight not found: ${highlightId}` };
    }

    // Remove the highlight
    const updatedHighlights = currentHighlights.filter((h: Highlight) => h.id !== highlightId);
    
    console.log('[DEBUG] Updating scorecard after removing highlight:', { 
      scorecardId: scorecard.id, 
      originalCount: currentHighlights.length,
      newCount: updatedHighlights.length 
    });

    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: { highlights: updatedHighlights }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] Error deleting highlight:', error);
    return { success: false, error: 'Failed to delete highlight' };
  }
}

// Update a scorecard's score
export async function updateScorecardScore(
  businessId: string,
  category: string,
  score: number,
  maxScore: number = 100
) {
  try {
    console.log('[DEBUG] Updating scorecard score:', { businessId, category, score, maxScore });
    
    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      console.error('[DEBUG] No scorecard found for category:', category);
      return { success: false, error: `Scorecard not found for ${category}` };
    }

    console.log('[DEBUG] Found scorecard, updating score:', { 
      scorecardId: scorecard.id, 
      oldScore: scorecard.score, 
      newScore: score 
    });

    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: { score, maxScore }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] Error updating score:', error);
    return { success: false, error: 'Failed to update score' };
  }
}

// Get all scorecards for a business
export async function getScorecards(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecards for business:', businessId);
    
    const scorecards = await prisma.opportunity.findMany({
      where: {
        businessId
      },
      select: {
        id: true,
        category: true,
        score: true,
        maxScore: true,
        highlights: true,
        metricSignals: true,
        isPublished: true
      }
    });

    console.log('[DEBUG] Found scorecards:', { count: scorecards.length });
    
    return { 
      success: true, 
      scorecards: scorecards.map(s => ({
        ...s,
        highlights: typeof s.highlights === 'string' ? JSON.parse(s.highlights) : s.highlights,
        metricSignals: typeof s.metricSignals === 'string' ? JSON.parse(s.metricSignals) : s.metricSignals
      }))
    };
  } catch (error) {
    console.error('[DEBUG] Error getting scorecards:', error);
    return { success: false, error: 'Failed to get scorecards' };
  }
} 