"use server"

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Define category colors - needed for initialization
const categoryColors = {
  'Foundation': {},
  'Acquisition': {},
  'Conversion': {},
  'Retention': {}
};

// Define Scorecard type based on the Prisma schema
type ScorecardType = {
  id: string;
  businessId: string;
  category: string;
  score: number | null;
  maxScore: number | null;
  highlights: any;
  metricSignals: any;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
};

// Simple type for a highlight
type Highlight = {
  id: string;
  text: string;
  serviceArea: string;
  aiGenerated?: boolean;
  createdAt?: string;
};

// Placeholder data for the Scorecard component
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

// Preload the scorecard focus area data
export async function preloadScorecardFocusArea(businessId: string, focusAreaName: string) {
  try {
    console.log(`[DEBUG] Preloading ${focusAreaName} scorecard data for business:`, businessId);
    
    // Find the specific focus area data
    const focusAreaData = placeholderData.find(category => category.name === focusAreaName);
    
    if (!focusAreaData) {
      return { success: false, error: `Focus area ${focusAreaName} not found` };
    }
    
    // Format the highlights into a structured description
    const highlightsText = focusAreaData.highlights.map(h => 
      `- ${h.text} (${h.serviceArea})`
    ).join('\n');
    
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
    
    // Find existing scorecard
    const existingScorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category: focusAreaName
      }
    });
    
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
      result = await (prisma as any).scorecard.update({
        where: { id: existingScorecard.id },
        data: {
          score: focusAreaData.score,
          maxScore: 100,
          highlights: highlightsJson
        }
      });
    } else {
      // Create new scorecard
      result = await (prisma as any).scorecard.create({
        data: {
          businessId,
          category: focusAreaData.name,
          score: focusAreaData.score,
          maxScore: 100,
          highlights: highlightsJson,
          isPublished: false
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

// Preload all scorecard data - modified to NOT override existing data with placeholders
export async function preloadScorecardData(businessId: string) {
  try {
    console.log('[DEBUG] Creating empty scorecards if needed for business:', businessId);
    
    // Check if scorecards exist for each category, create empty ones if needed
    const results = await Promise.all(Object.keys(categoryColors).map(async (category) => {
      // Find existing scorecard
      const existingScorecard = await (prisma as any).scorecard.findFirst({
        where: {
          businessId,
          category: category
        }
      });
      
      if (existingScorecard) {
        // Don't modify existing scorecards
        console.log(`[DEBUG] Scorecard for ${category} already exists, skipping`);
        return existingScorecard;
      } else {
        // Create empty scorecard structure only if none exists
        console.log(`[DEBUG] Creating empty scorecard for ${category}`);
        return (prisma as any).scorecard.create({
          data: {
            businessId,
            category: category,
            score: 0,
            maxScore: 100,
            highlights: { items: [] },
            isPublished: false
          }
        });
      }
    }));
    
    console.log('[DEBUG] Scorecard initialization complete:', results);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true, count: results.length };
  } catch (error) {
    console.error('[DEBUG] Failed to initialize scorecards:', error);
    return { success: false, error: 'Failed to initialize scorecards' };
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
    let scorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      console.error('[DEBUG] No scorecard found for category:', category);
      
      // Create a new scorecard if it doesn't exist
      const newScorecard = await (prisma as any).scorecard.create({
        data: {
          businessId,
          category,
          score: 0,
          maxScore: 100,
          highlights: { 
            items: [], 
            serviceAreas: [] 
          },
          isPublished: false
        }
      });
      
      console.log('[DEBUG] Created new scorecard:', newScorecard);
      
      // Now use this scorecard
      scorecard = newScorecard;
    }

    // Create new highlight with ID
    const newHighlight: Highlight = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: highlight.text,
      serviceArea: highlight.serviceArea,
      aiGenerated: false,
      createdAt: new Date().toISOString()
    };

    console.log('[DEBUG] Created new highlight object:', newHighlight);

    // Get current highlights
    let currentHighlights: any = { items: [] };
    
    if (scorecard.highlights) {
      try {
        // Parse if it's a string
        if (typeof scorecard.highlights === 'string') {
          currentHighlights = JSON.parse(scorecard.highlights);
        } else {
          currentHighlights = scorecard.highlights;
        }
        
        // Handle both array and object with items property
        if (Array.isArray(currentHighlights)) {
          // Convert old format to new format
          currentHighlights = { 
            items: currentHighlights,
            score: scorecard.score || 0,
            maxScore: scorecard.maxScore || 100
          };
        } else if (!currentHighlights.items) {
          // Ensure items exists
          currentHighlights.items = [];
        }
        
        console.log('[DEBUG] Parsed current highlights:', currentHighlights);
      } catch (e) {
        console.error('[DEBUG] Error parsing highlights, using empty structure:', e);
        currentHighlights = { 
          items: [],
          score: scorecard.score || 0,
          maxScore: scorecard.maxScore || 100
        };
      }
    }

    // Add the new highlight to items array
    currentHighlights.items.push(newHighlight);
    
    console.log('[DEBUG] Updated highlights structure:', currentHighlights);

    // Update the scorecard
    const updatedScorecard = await (prisma as any).scorecard.update({
      where: { id: scorecard.id },
      data: { highlights: currentHighlights }
    });
    
    console.log('[DEBUG] Updated scorecard:', updatedScorecard);

    revalidatePath('/admin/scorecard');
    return { success: true, highlight: newHighlight };
  } catch (error: any) {
    console.error('[DEBUG] Error adding highlight:', error);
    return { success: false, error: 'Failed to add highlight: ' + (error.message || 'Unknown error') };
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
    const scorecard = await (prisma as any).scorecard.findFirst({
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
    let currentHighlights: any = { items: [] };
    if (scorecard.highlights) {
      try {
        // Parse if it's a string
        if (typeof scorecard.highlights === 'string') {
          currentHighlights = JSON.parse(scorecard.highlights);
        } else {
          currentHighlights = scorecard.highlights;
        }
        
        // Handle both array and object with items property
        if (Array.isArray(currentHighlights)) {
          // Convert old format to new format
          const items = [...currentHighlights];
          currentHighlights = { 
            items: items,
            score: scorecard.score || 0,
            maxScore: scorecard.maxScore || 100
          };
        } else if (!currentHighlights.items) {
          // If no items array, create one
          currentHighlights.items = [];
        }
      } catch (e) {
        console.error('[DEBUG] Error parsing highlights:', e);
        return { success: false, error: 'Failed to parse existing highlights' };
      }
    }

    // Check if the highlight exists before trying to remove it
    const itemsArray = currentHighlights.items;
    const highlightIndex = itemsArray.findIndex((h: any) => h.id === highlightId);
    
    if (highlightIndex === -1) {
      console.error('[DEBUG] Highlight not found:', highlightId);
      return { success: false, error: `Highlight not found: ${highlightId}` };
    }

    // Remove the highlight
    itemsArray.splice(highlightIndex, 1);
    
    console.log('[DEBUG] Updating scorecard after removing highlight:', { 
      scorecardId: scorecard.id, 
      originalCount: itemsArray.length + 1,
      newCount: itemsArray.length 
    });

    // Update the scorecard
    await (prisma as any).scorecard.update({
      where: { id: scorecard.id },
      data: { highlights: currentHighlights }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error: any) {
    console.error('[DEBUG] Error deleting highlight:', error);
    return { success: false, error: 'Failed to delete highlight: ' + (error.message || 'Unknown error') };
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
    const scorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      // Create a new scorecard if one doesn't exist
      console.log('[DEBUG] Creating new scorecard with score:', score);
      await (prisma as any).scorecard.create({
        data: {
          businessId,
          category,
          score,
          maxScore,
          highlights: { items: [] },
          isPublished: false
        }
      });
      
      revalidatePath('/admin/scorecard');
      return { success: true };
    }

    console.log('[DEBUG] Found scorecard, updating score:', { 
      scorecardId: scorecard.id, 
      oldScore: scorecard.score, 
      newScore: score 
    });

    // Update the scorecard score and also update the score in the highlights JSON if it exists
    let updatedHighlights = scorecard.highlights;
    
    // If highlights exists, update the score there too
    if (scorecard.highlights) {
      try {
        const parsedHighlights = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
          
        if (typeof parsedHighlights === 'object' && !Array.isArray(parsedHighlights)) {
          // Update score in the highlights object
          parsedHighlights.score = score;
          updatedHighlights = parsedHighlights;
        } else if (Array.isArray(parsedHighlights)) {
          // Convert to new format with score
          updatedHighlights = {
            items: parsedHighlights,
            score,
            maxScore
          };
        }
      } catch (e) {
        console.error('[DEBUG] Error parsing highlights during score update:', e);
        // Just update the score directly in this case
      }
    } else {
      // Create a basic highlights structure with the score
      updatedHighlights = {
        items: [],
        score,
        maxScore
      };
    }

    // Update the scorecard with both score and potentially modified highlights
    await (prisma as any).scorecard.update({
      where: { id: scorecard.id },
      data: { 
        score, 
        maxScore,
        highlights: updatedHighlights
      }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error: any) {
    console.error('[DEBUG] Error updating score:', error);
    return { success: false, error: 'Failed to update score: ' + (error.message || 'Unknown error') };
  }
}

// Get all scorecards for a business
export async function getScorecards(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecards for business:', businessId);
    
    // Use type assertion to tell TypeScript the client has the scorecard property
    const scorecards = await (prisma as any).scorecard.findMany({
      where: {
        businessId
      }
    });

    console.log('[DEBUG] Found scorecards:', { count: scorecards.length });
    
    return { 
      success: true, 
      scorecards: scorecards.map((s: any) => ({
        ...s,
        highlights: typeof s.highlights === 'string' 
          ? JSON.parse(s.highlights as string) 
          : s.highlights,
        metricSignals: typeof s.metricSignals === 'string' 
          ? JSON.parse(s.metricSignals as string) 
          : s.metricSignals
      }))
    };
  } catch (error) {
    console.error('[DEBUG] Error getting scorecards:', error);
    return { success: false, error: 'Failed to get scorecards' };
  }
}

// Update scorecard category
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
    console.log('[DEBUG] Updating scorecard category:', { businessId, category: data.name });
    
    // Find existing scorecard
    const scorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category: data.name
      }
    });

    // Process the highlights data
    let highlightsData: any = data.highlightsData || {
      items: [],
      score: data.score,
      maxScore: 100
    };

    // Keep the serviceAreas in the highlights data
    if (data.serviceAreas && data.serviceAreas.length > 0) {
      highlightsData.serviceAreas = data.serviceAreas;
    }
    
    if (scorecard) {
      // Update existing record
      await (prisma as any).scorecard.update({
        where: {
          id: scorecard.id
        },
        data: {
          score: data.score,
          highlights: highlightsData
        }
      });
    } else {
      // Create new record
      await (prisma as any).scorecard.create({
        data: {
          businessId,
          category: data.name,
          score: data.score,
          maxScore: 100,
          highlights: highlightsData,
          isPublished: false
        }
      });
    }

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] Failed to update scorecard category:', error);
    return { success: false, error: 'Failed to update scorecard category' };
  }
}

// Check if the scorecard is published
export async function getScorecardPublishStatus(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecard publish status for business:', businessId);
    
    const scorecards = await (prisma as any).scorecard.findMany({
      where: {
        businessId
      },
      select: {
        isPublished: true
      }
    });
    
    // Consider published if any scorecards are published
    const isPublished = scorecards.some((card: any) => card.isPublished);
    
    console.log('[DEBUG] Scorecard publish status:', { 
      businessId, 
      isPublished, 
      scorecardCount: scorecards.length 
    });
    
    return { success: true, isPublished };
  } catch (error) {
    console.error('[DEBUG] Failed to get scorecard publish status:', error);
    return { success: false, error: 'Failed to get scorecard publish status' };
  }
}

// Publish all scorecards
export async function publishScorecard(businessId: string) {
  try {
    console.log('[DEBUG] Publishing scorecards for business:', businessId);
    
    await (prisma as any).scorecard.updateMany({
      where: { businessId },
      data: { isPublished: true }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] Failed to publish scorecards:', error);
    return { success: false, error: 'Failed to publish scorecards' };
  }
}

// Unpublish all scorecards
export async function unpublishScorecard(businessId: string) {
  try {
    console.log('[DEBUG] Unpublishing scorecards for business:', businessId);
    
    await (prisma as any).scorecard.updateMany({
      where: { businessId },
      data: { isPublished: false }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] Failed to unpublish scorecards:', error);
    return { success: false, error: 'Failed to unpublish scorecards' };
  }
}
