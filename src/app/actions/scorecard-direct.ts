'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Direct server action to add a highlight to a scorecard
 */
export async function addScorecardHighlight(
  businessId: string,
  category: string,
  highlightData: {
    text: string;
    serviceArea: string;
    aiGenerated?: boolean;
    createdAt?: string;
  }
) {
  try {
    console.log('[DIRECT] Adding highlight to scorecard', { businessId, category, highlightData });

    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      }
    });

    if (!scorecard) {
      console.error('[DIRECT] Scorecard not found', { businessId, category });
      return { 
        success: false, 
        error: `Scorecard not found for ${category}`
      };
    }

    // Get current highlights
    let highlightsData: any = { items: [], score: scorecard.score || 0, maxScore: scorecard.maxScore || 100 };
    
    if (scorecard.highlights) {
      try {
        // Parse highlights if string, otherwise use directly
        const parsed = typeof scorecard.highlights === 'string' 
          ? JSON.parse(scorecard.highlights as string)
          : scorecard.highlights;
        
        if (parsed) {
          if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = parsed;
          } else if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          }
        }
      } catch (error) {
        console.error('[DIRECT] Error parsing highlights', error);
      }
    }

    // Create new highlight with ID
    const newHighlight = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...highlightData,
      createdAt: highlightData.createdAt || new Date().toISOString()
    };

    // Add new highlight to items array
    highlightsData.items = [...(highlightsData.items || []), newHighlight];

    // Use $executeRaw to update the JSON field - more reliable than type-checked update
    await prisma.$executeRaw`
      UPDATE "Opportunity"
      SET highlights = ${JSON.stringify(highlightsData)}::jsonb
      WHERE id = ${scorecard.id}
    `;

    console.log('[DIRECT] Successfully added highlight', { scorecardId: scorecard.id, newHighlight });
    
    revalidatePath('/admin/scorecard');
    
    return {
      success: true,
      highlight: newHighlight
    };
  } catch (error) {
    console.error('[DIRECT] Error adding highlight', error);
    return { 
      success: false, 
      error: `Failed to add highlight: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Direct server action to delete a highlight from a scorecard
 */
export async function deleteScorecardHighlight(
  businessId: string,
  category: string,
  highlightId: string
) {
  try {
    console.log('[DIRECT] Deleting highlight from scorecard', { businessId, category, highlightId });

    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      }
    });

    if (!scorecard) {
      console.error('[DIRECT] Scorecard not found', { businessId, category });
      return { 
        success: false, 
        error: `Scorecard not found for ${category}`
      };
    }

    // Get current highlights
    let highlightsData: any = { items: [], score: scorecard.score || 0, maxScore: scorecard.maxScore || 100 };
    
    if (scorecard.highlights) {
      try {
        // Parse highlights if string, otherwise use directly
        const parsed = typeof scorecard.highlights === 'string' 
          ? JSON.parse(scorecard.highlights as string)
          : scorecard.highlights;
        
        if (parsed) {
          if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = parsed;
          } else if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          }
        }
      } catch (error) {
        console.error('[DIRECT] Error parsing highlights', error);
      }
    }

    // Remove highlight with the given ID
    const originalCount = highlightsData.items?.length || 0;
    highlightsData.items = highlightsData.items?.filter((h: any) => h.id !== highlightId) || [];
    const newCount = highlightsData.items.length;

    // Check if the highlight was actually removed
    if (originalCount === newCount) {
      console.warn('[DIRECT] Highlight not found', { highlightId, availableIds: highlightsData.items.map((h: any) => h.id) });
    }

    // Use $executeRaw to update the JSON field - more reliable than type-checked update
    await prisma.$executeRaw`
      UPDATE "Opportunity"
      SET highlights = ${JSON.stringify(highlightsData)}::jsonb
      WHERE id = ${scorecard.id}
    `;

    console.log('[DIRECT] Successfully deleted highlight', { 
      scorecardId: scorecard.id, 
      highlightId,
      originalCount,
      newCount
    });
    
    revalidatePath('/admin/scorecard');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('[DIRECT] Error deleting highlight', error);
    return { 
      success: false, 
      error: `Failed to delete highlight: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Direct server action to update scorecard score
 */
export async function updateScorecardScore(
  businessId: string,
  category: string,
  score: number,
  maxScore?: number
) {
  try {
    console.log('[DIRECT] Updating scorecard score', { businessId, category, score, maxScore });

    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      }
    });

    if (!scorecard) {
      console.error('[DIRECT] Scorecard not found', { businessId, category });
      return { 
        success: false, 
        error: `Scorecard not found for ${category}`
      };
    }

    // Get current highlights
    let highlightsData: any = { items: [], score, maxScore: maxScore || 100 };
    
    if (scorecard.highlights) {
      try {
        // Parse highlights if string, otherwise use directly
        const parsed = typeof scorecard.highlights === 'string' 
          ? JSON.parse(scorecard.highlights as string)
          : scorecard.highlights;
        
        if (parsed) {
          if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = { ...parsed, score, maxScore: maxScore || parsed.maxScore || 100 };
          } else if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          }
        }
      } catch (error) {
        console.error('[DIRECT] Error parsing highlights', error);
      }
    }

    // Update both the score field and the score in the highlights JSON
    await prisma.$executeRaw`
      UPDATE "Opportunity"
      SET 
        highlights = ${JSON.stringify(highlightsData)}::jsonb,
        score = ${score},
        "maxScore" = ${maxScore || 100}
      WHERE id = ${scorecard.id}
    `;

    console.log('[DIRECT] Successfully updated score', { 
      scorecardId: scorecard.id, 
      newScore: score,
      newMaxScore: maxScore
    });
    
    revalidatePath('/admin/scorecard');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('[DIRECT] Error updating score', error);
    return { 
      success: false, 
      error: `Failed to update score: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 