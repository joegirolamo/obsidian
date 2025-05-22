'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Placeholder data from the Scorecard component
const placeholderData = [
  {
    name: 'Foundation',
    score: 75,
    serviceAreas: ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
    highlights: [
      { text: 'Brand messaging inconsistent across digital touchpoints', serviceArea: 'Brand/GTM Strategy' },
      { text: 'Marketing automation tools severely underutilized', serviceArea: 'Martech' },
      { text: 'Analytics implementation lacks cross-channel customer journey tracking', serviceArea: 'Data & Analytics' }
    ]
  },
  {
    name: 'Acquisition',
    score: 82,
    serviceAreas: ['Performance Media', 'Campaigns', 'Earned Media'],
    highlights: [
      { text: 'Google Ads quality scores below industry average', serviceArea: 'Performance Media' },
      { text: 'Campaign attribution lacking for multi-touch journeys', serviceArea: 'Campaigns' },
      { text: 'PR and earned media strategy not aligned with overall marketing goals', serviceArea: 'Earned Media' }
    ]
  },
  {
    name: 'Conversion',
    score: 65,
    serviceAreas: ['Website', 'Ecommerce Platforms', 'Digital Product'],
    highlights: [
      { text: 'Mobile page load speed exceeding 4 seconds on product pages', serviceArea: 'Website' },
      { text: 'Cart abandonment rate 15% above industry average', serviceArea: 'Ecommerce Platforms' },
      { text: 'Product recommendation algorithm performing below benchmark standards', serviceArea: 'Digital Product' }
    ]
  },
  {
    name: 'Retention',
    score: 70,
    serviceAreas: ['CRM', 'App', 'Organic Social'],
    highlights: [
      { text: 'Email list declining 5% month-over-month due to unsubscribes', serviceArea: 'CRM' },
      { text: 'Social content calendar inconsistently maintained', serviceArea: 'Organic Social' },
      { text: 'Mobile app retention rate drops 40% after first week of installation', serviceArea: 'App' }
    ]
  }
];

export async function preloadScorecardData(businessId: string) {
  try {
    console.log('[DEBUG] Preloading scorecard data for business:', businessId);
    
    // Format the highlights for each category into a description string
    const formattedData = placeholderData.map(category => {
      // Format the highlights into a structured description
      const highlightsText = category.highlights.map(h => 
        `- ${h.text} (${h.serviceArea})`
      ).join('\n');
      
      const description = `Service Areas: ${category.serviceAreas.join(', ')}\n\nHighlights:\n${highlightsText}`;
      
      return {
        name: category.name,
        score: category.score,
        description
      };
    });
    
    // Create or update scorecard opportunities for each category
    const results = await Promise.all(formattedData.map(async (data) => {
      const existingScorecard = await prisma.opportunity.findFirst({
        where: {
          businessId: businessId,
          category: data.name,
          title: { contains: 'Scorecard' }
        }
      });
      
      if (existingScorecard) {
        // Update existing scorecard
        return prisma.opportunity.update({
          where: { id: existingScorecard.id },
          data: {
            title: `${data.name} Scorecard`,
            description: data.description,
            status: "OPEN",
          }
        });
      } else {
        // Create new scorecard
        return prisma.opportunity.create({
          data: {
            businessId,
            title: `${data.name} Scorecard`,
            category: data.name,
            description: data.description,
            status: "OPEN",
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
    console.log('[DEBUG] updateScorecardCategory called with:', { 
      businessId, 
      category: data.name,
      score: data.score,
      highlightsLength: data.highlights?.length || 0,
      serviceAreas: data.serviceAreas,
      highlightsDataProvided: !!data.highlightsData
    });
    
    // Check if scorecards are published for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { isScorecardPublished: true }
    });

    if (!business) {
      console.log('[DEBUG] Business not found:', businessId);
      throw new Error('Business not found');
    }
    
    console.log('[DEBUG] Found business with isScorecardPublished:', business.isScorecardPublished);

    // Check if a scorecard for this category already exists - using the Scorecard model
    let existingScorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId: businessId,
        category: data.name
      }
    });
    
    console.log('[DEBUG] Existing Scorecard found:', existingScorecard ? 'yes' : 'no');
    if (existingScorecard) {
      console.log('[DEBUG] Existing Scorecard ID:', existingScorecard.id);
    }

    let scorecard;
    let highlightsData = data.highlightsData || { 
      items: [], 
      score: data.score, 
      maxScore: 100,
      serviceAreas: data.serviceAreas || []
    };
    
    if (existingScorecard) {
      console.log('[DEBUG] Updating existing scorecard with ID:', existingScorecard.id);
      
      // Update the scorecard with the new data
      scorecard = await (prisma as any).scorecard.update({
        where: { id: existingScorecard.id },
        data: {
          score: data.score,
          maxScore: 100,
          highlights: highlightsData,
          isPublished: business.isScorecardPublished
        }
      });
      console.log('[DEBUG] Updated scorecard:', {
        id: scorecard.id,
        category: scorecard.category,
        score: scorecard.score
      });
    } else {
      console.log('[DEBUG] Creating new scorecard for category:', data.name);
      
      // Create a new scorecard with the data
      scorecard = await (prisma as any).scorecard.create({
        data: {
          businessId,
          category: data.name,
          score: data.score,
          maxScore: 100,
          highlights: highlightsData,
          isPublished: business.isScorecardPublished
        }
      });
      console.log('[DEBUG] Created new scorecard:', {
        id: scorecard.id,
        category: scorecard.category,
        score: scorecard.score
      });
    }

    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true, scorecard };
  } catch (error) {
    console.error('[DEBUG] Failed to update scorecard category:', error);
    return { success: false, error: 'Failed to update scorecard category' };
  }
}

export async function publishScorecard(businessId: string) {
  try {
    console.log('[DEBUG] Publishing scorecard for business:', businessId);
    
    // Update the business flag
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { isScorecardPublished: true }
    });
    console.log('[DEBUG] Updated business:', business);
    
    // Also mark all scorecards as published
    const updatedScorecards = await (prisma as any).scorecard.updateMany({
      where: {
        businessId: businessId
      },
      data: { isPublished: true }
    });
    console.log('[DEBUG] Updated scorecards:', updatedScorecards);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to publish scorecard:', error);
    return { success: false, error: 'Failed to publish scorecard' };
  }
}

export async function unpublishScorecard(businessId: string) {
  try {
    console.log('[DEBUG] Unpublishing scorecard for business:', businessId);
    
    // Update the business flag
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { isScorecardPublished: false }
    });
    console.log('[DEBUG] Updated business:', business);
    
    // Also mark all scorecards as unpublished
    const updatedScorecards = await (prisma as any).scorecard.updateMany({
      where: {
        businessId: businessId
      },
      data: { isPublished: false }
    });
    console.log('[DEBUG] Updated scorecards:', updatedScorecards);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish scorecard:', error);
    return { success: false, error: 'Failed to unpublish scorecard' };
  }
}

export async function getScorecardPublishStatus(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecard status for business:', businessId);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { isScorecardPublished: true }
    });
    console.log('[DEBUG] Found business:', business);
    
    if (!business) {
      throw new Error('Business not found');
    }

    return { success: true, isPublished: business.isScorecardPublished };
  } catch (error) {
    console.error('Failed to get scorecard publish status:', error);
    return { success: false, error: 'Failed to get scorecard publish status' };
  }
}

// New function to get all scorecard data for a business
export async function getScorecardData(businessId: string) {
  try {
    console.log('[DEBUG] Getting scorecard data for business:', businessId);
    
    // Get all scorecards - using the Scorecard model directly
    const scorecards = await (prisma as any).scorecard.findMany({
      where: {
        businessId
      }
    });
    
    console.log('[DEBUG] Found scorecards:', scorecards.length);
    
    // Process the scorecards
    const processedScorecards = scorecards.map((scorecard: any) => {
      let highlights = [];
      let metricSignals = [];
      
      // Try to parse structured highlights from the highlights field
      try {
        if (scorecard.highlights) {
          const parsedHighlights = typeof scorecard.highlights === 'string'
            ? JSON.parse(scorecard.highlights)
            : scorecard.highlights;
          
          if (Array.isArray(parsedHighlights)) {
            // Direct array format
            highlights = parsedHighlights.map((h: any) => ({
              id: h.id || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              text: h.text,
              serviceArea: h.serviceArea,
              relatedMetricId: h.relatedMetricId
            }));
          } else if (parsedHighlights && parsedHighlights.items && Array.isArray(parsedHighlights.items)) {
            // Format with items property
            highlights = parsedHighlights.items.map((h: any) => ({
              id: h.id || `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              text: h.text,
              serviceArea: h.serviceArea,
              relatedMetricId: h.relatedMetricId
            }));
            
            if (parsedHighlights.metricSignals && Array.isArray(parsedHighlights.metricSignals)) {
              metricSignals = parsedHighlights.metricSignals;
            }
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error parsing highlights:', error);
      }
      
      return {
        id: scorecard.id,
        category: scorecard.category,
        score: scorecard.score || 0,
        maxScore: scorecard.maxScore || 100,
        highlights,
        metricSignals
      };
    });
    
    return { 
      success: true, 
      scorecards: processedScorecards 
    };
  } catch (error) {
    console.error('[DEBUG] Error getting scorecard data:', error);
    return { success: false, error: 'Failed to get scorecard data' };
  }
}

// Initialize empty scorecards if none exist
export async function initializeScorecards(businessId: string) {
  try {
    console.log('[DEBUG] Initializing scorecards for business:', businessId);
    
    // Check if any scorecards exist
    const existingCount = await (prisma as any).scorecard.count({
      where: { businessId }
    });
    
    console.log('[DEBUG] Found existing scorecards:', existingCount);
    
    if (existingCount > 0) {
      console.log('[DEBUG] Scorecards already exist, skipping initialization');
      return { success: true, message: 'Scorecards already exist' };
    }
    
    // Create empty scorecards for each category
    const categories = ['Foundation', 'Acquisition', 'Conversion', 'Retention'];
    
    const results = await Promise.all(categories.map(async (category) => {
      // Generate a unique ID for the new scorecard
      const id = `scorecard_${businessId}_${category}_${Date.now()}`;
      
      // Create empty scorecard
      return (prisma as any).scorecard.create({
        data: {
          id,
          businessId,
          category,
          score: 0,
          maxScore: 100,
          isPublished: false,
          updatedAt: new Date(),
          highlights: { 
            items: [],
            metricSignals: [],
            score: 0,
            maxScore: 100
          }
        }
      });
    }));
    
    console.log('[DEBUG] Created initial scorecards:', results.length);
    
    revalidatePath('/admin/scorecard');
    revalidatePath(`/portal/${businessId}/dashboard`);
    
    return { success: true, count: results.length };
  } catch (error) {
    console.error('[DEBUG] Failed to initialize scorecards:', error);
    return { success: false, error: 'Failed to initialize scorecards' };
  }
}

// Update just a scorecard's score quickly
export async function updateScorecardScore(businessId: string, category: string, score: number) {
  try {
    console.log('[DEBUG] Quick updating score for category:', { businessId, category, score });
    
    // Find existing scorecard
    const existingScorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category
      }
    });
    
    if (!existingScorecard) {
      console.log('[DEBUG] No scorecard found for quick score update. Creating new one.');
      
      // Generate a unique ID for the new scorecard
      const id = `scorecard_${businessId}_${category}_${Date.now()}`;
      
      // Create a new scorecard with just the score
      await (prisma as any).scorecard.create({
        data: {
          id,
          businessId,
          category,
          score,
          maxScore: 100,
          highlights: { items: [] },
          isPublished: false,
          updatedAt: new Date(),
        }
      });
      
      return { success: true };
    }
    
    console.log('[DEBUG] Updating existing scorecard score from', existingScorecard.score, 'to', score);
    
    // Update just the score field
    await (prisma as any).scorecard.update({
      where: { id: existingScorecard.id },
      data: { score }
    });
    
    // No need to revalidate paths for quick score updates
    return { success: true };
  } catch (error: any) {
    console.error('[DEBUG] Error updating score:', error);
    return { success: false, error: error.message || 'Failed to update score' };
  }
} 