'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Add a highlight to a scorecard
export async function addScorecardHighlight(
  businessId: string,
  category: string,
  highlight: { text: string; serviceArea: string; relatedMetricId?: string }
) {
  try {
    // Find the scorecard
    const scorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      return { success: false, error: `Scorecard not found for ${category}` };
    }

    // Create new highlight with ID
    const newHighlight = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: highlight.text,
      serviceArea: highlight.serviceArea,
      relatedMetricId: highlight.relatedMetricId,
      aiGenerated: false
    };

    // Get current highlights
    let currentHighlights = { items: [] };
    
    if (scorecard.highlights) {
      try {
        if (typeof scorecard.highlights === 'string') {
          currentHighlights = JSON.parse(scorecard.highlights);
        } else {
          currentHighlights = scorecard.highlights;
        }
        
        // Handle both array and object with items property
        if (Array.isArray(currentHighlights)) {
          currentHighlights = { 
            items: currentHighlights,
            score: scorecard.score || 0,
            maxScore: scorecard.maxScore || 100
          };
        } else if (!currentHighlights.items) {
          currentHighlights.items = [];
        }
      } catch (e) {
        console.error('Error parsing highlights:', e);
        currentHighlights = { 
          items: [],
          score: scorecard.score || 0,
          maxScore: scorecard.maxScore || 100
        };
      }
    }

    // Add the new highlight to items array
    currentHighlights.items.push(newHighlight);

    // Update the scorecard
    await (prisma as any).scorecard.update({
      where: { id: scorecard.id },
      data: { highlights: currentHighlights }
    });

    revalidatePath('/admin/scorecard');
    return { success: true, highlight: newHighlight };
  } catch (error) {
    console.error('Error adding highlight:', error);
    return { success: false, error: 'Failed to add highlight' };
  }
}

// Update a highlight in a scorecard
export async function updateScorecardHighlight(
  businessId: string,
  category: string,
  highlightId: string,
  highlightData: {
    text: string;
    serviceArea: string;
    relatedMetricId?: string;
  }
) {
  try {
    // Find the scorecard
    const scorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      return { success: false, error: `Scorecard not found for ${category}` };
    }

    // Get current highlights
    let currentHighlights = { items: [] };
    
    if (scorecard.highlights) {
      try {
        if (typeof scorecard.highlights === 'string') {
          currentHighlights = JSON.parse(scorecard.highlights);
        } else {
          currentHighlights = scorecard.highlights;
        }
        
        // Handle both array and object with items property
        if (Array.isArray(currentHighlights)) {
          currentHighlights = { 
            items: currentHighlights,
            score: scorecard.score || 0,
            maxScore: scorecard.maxScore || 100
          };
        } else if (!currentHighlights.items) {
          currentHighlights.items = [];
        }
      } catch (e) {
        console.error('Error parsing highlights:', e);
        return { success: false, error: 'Failed to parse existing highlights' };
      }
    }

    // Find and update the highlight
    const itemsArray = currentHighlights.items;
    const highlightIndex = itemsArray.findIndex((h) => h.id === highlightId);
    
    if (highlightIndex === -1) {
      return { success: false, error: `Highlight not found: ${highlightId}` };
    }

    // Update the highlight
    itemsArray[highlightIndex] = {
      ...itemsArray[highlightIndex],
      text: highlightData.text,
      serviceArea: highlightData.serviceArea,
      relatedMetricId: highlightData.relatedMetricId
    };

    // Update the scorecard
    await (prisma as any).scorecard.update({
      where: { id: scorecard.id },
      data: { highlights: currentHighlights }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('Error updating highlight:', error);
    return { success: false, error: 'Failed to update highlight' };
  }
}

// Delete a highlight from a scorecard
export async function deleteScorecardHighlight(
  businessId: string,
  category: string,
  highlightId: string
) {
  try {
    // Find the scorecard
    const scorecard = await (prisma as any).scorecard.findFirst({
      where: {
        businessId,
        category
      }
    });

    if (!scorecard) {
      return { success: false, error: `Scorecard not found for ${category}` };
    }

    // Get current highlights
    let currentHighlights = { items: [] };
    
    if (scorecard.highlights) {
      try {
        if (typeof scorecard.highlights === 'string') {
          currentHighlights = JSON.parse(scorecard.highlights);
        } else {
          currentHighlights = scorecard.highlights;
        }
        
        // Handle both array and object with items property
        if (Array.isArray(currentHighlights)) {
          const items = [...currentHighlights];
          currentHighlights = { 
            items,
            score: scorecard.score || 0,
            maxScore: scorecard.maxScore || 100
          };
        } else if (!currentHighlights.items) {
          currentHighlights.items = [];
        }
      } catch (e) {
        console.error('Error parsing highlights:', e);
        return { success: false, error: 'Failed to parse existing highlights' };
      }
    }

    // Check if the highlight exists before trying to remove it
    const itemsArray = currentHighlights.items;
    const highlightIndex = itemsArray.findIndex((h) => h.id === highlightId);
    
    if (highlightIndex === -1) {
      return { success: false, error: `Highlight not found: ${highlightId}` };
    }

    // Remove the highlight
    itemsArray.splice(highlightIndex, 1);

    // Update the scorecard
    await (prisma as any).scorecard.update({
      where: { id: scorecard.id },
      data: { highlights: currentHighlights }
    });

    revalidatePath('/admin/scorecard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return { success: false, error: 'Failed to delete highlight' };
  }
} 