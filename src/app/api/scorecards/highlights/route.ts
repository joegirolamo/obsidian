import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// GET - Fetch highlights for a specific scorecard
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('businessId');
  const category = searchParams.get('category');

  if (!businessId || !category) {
    return NextResponse.json(
      { error: 'Business ID and category are required' },
      { status: 400 }
    );
  }

  try {
    // Find the scorecard for this category
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      },
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: 'Scorecard not found' },
        { status: 404 }
      );
    }

    // Parse the highlights data
    let highlights = [];
    let metricSignals = [];
    let lastAuditedAt = null;
    
    try {
      if (scorecard.highlights) {
        const parsed = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
        
        if (parsed && typeof parsed === 'object') {
          // Extract metrics if they exist
          if (parsed.metricSignals && Array.isArray(parsed.metricSignals)) {
            metricSignals = parsed.metricSignals;
          }
          
          // Extract lastAuditedAt if it exists
          if (parsed.lastAuditedAt) {
            lastAuditedAt = parsed.lastAuditedAt;
          }
          
          // Process highlights
          if (Array.isArray(parsed)) {
            highlights = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            highlights = parsed.items;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing highlights:', e);
    }

    return NextResponse.json({ 
      id: scorecard.id,
      category: scorecard.category,
      score: scorecard.score || 0,
      maxScore: scorecard.maxScore || 100,
      highlights,
      metricSignals,
      lastAuditedAt,
      serviceAreas: scorecard.serviceAreas || []
    });
  } catch (error) {
    console.error('Error fetching scorecard highlights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard highlights' },
      { status: 500 }
    );
  }
}

// POST - Add a new highlight
export async function POST(request: NextRequest) {
  try {
    const { businessId, category, highlight } = await request.json();

    if (!businessId || !category || !highlight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      },
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: 'Scorecard not found' },
        { status: 404 }
      );
    }

    // Parse existing highlights
    let highlightsData = { items: [], score: scorecard.score || 0, maxScore: scorecard.maxScore || 100 };
    
    try {
      if (scorecard.highlights) {
        const parsed = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
        
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = parsed;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing highlights:', e);
    }
    
    // Add the new highlight with a unique ID
    const newHighlight = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...highlight
    };
    
    highlightsData.items.push(newHighlight);
    
    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: {
        // @ts-ignore - Using highlights as a custom field
        highlights: highlightsData
      }
    });

    revalidatePath('/admin/scorecard');
    
    return NextResponse.json({
      success: true,
      highlight: newHighlight
    });
  } catch (error) {
    console.error('Error adding highlight:', error);
    return NextResponse.json(
      { error: 'Failed to add highlight' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a highlight
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const businessId = searchParams.get('businessId');
  const category = searchParams.get('category');
  const highlightId = searchParams.get('highlightId');

  if (!businessId || !category || !highlightId) {
    return NextResponse.json(
      { error: 'Business ID, category, and highlight ID are required' },
      { status: 400 }
    );
  }

  try {
    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      },
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: 'Scorecard not found' },
        { status: 404 }
      );
    }

    // Parse existing highlights
    let highlightsData = { items: [], score: scorecard.score || 0, maxScore: scorecard.maxScore || 100 };
    
    try {
      if (scorecard.highlights) {
        const parsed = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
        
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = parsed;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing highlights:', e);
    }
    
    // Remove the highlight with the matching ID
    highlightsData.items = highlightsData.items.filter(h => h.id !== highlightId);
    
    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: {
        // @ts-ignore - Using highlights as a custom field
        highlights: highlightsData
      }
    });

    revalidatePath('/admin/scorecard');
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json(
      { error: 'Failed to delete highlight' },
      { status: 500 }
    );
  }
}

// PATCH - Update score or other fields
export async function PATCH(request: NextRequest) {
  try {
    const { businessId, category, score, maxScore } = await request.json();

    if (!businessId || !category) {
      return NextResponse.json(
        { error: 'Business ID and category are required' },
        { status: 400 }
      );
    }

    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      },
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: 'Scorecard not found' },
        { status: 404 }
      );
    }

    // Parse existing highlights
    let highlightsData = { items: [], score: scorecard.score || 0, maxScore: scorecard.maxScore || 100 };
    
    try {
      if (scorecard.highlights) {
        const parsed = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
        
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = parsed;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing highlights:', e);
    }
    
    // Update score and maxScore
    if (typeof score === 'number') {
      highlightsData.score = score;
    }
    
    if (typeof maxScore === 'number') {
      highlightsData.maxScore = maxScore;
    }
    
    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: {
        score: typeof score === 'number' ? score : scorecard.score,
        maxScore: typeof maxScore === 'number' ? maxScore : scorecard.maxScore,
        // @ts-ignore - Using highlights as a custom field
        highlights: highlightsData
      }
    });

    revalidatePath('/admin/scorecard');
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error updating scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to update scorecard' },
      { status: 500 }
    );
  }
}

// Add a new endpoint to add metric signals
export async function PUT(request: NextRequest) {
  try {
    const { businessId, category, metricSignals } = await request.json();

    if (!businessId || !category || !metricSignals) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the scorecard
    const scorecard = await prisma.opportunity.findFirst({
      where: {
        businessId,
        category,
        title: { contains: 'Scorecard' }
      },
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: 'Scorecard not found' },
        { status: 404 }
      );
    }

    // Parse existing highlights
    let highlightsData = { 
      items: [], 
      metricSignals: [],
      score: scorecard.score || 0, 
      maxScore: scorecard.maxScore || 100 
    };
    
    try {
      if (scorecard.highlights) {
        const parsed = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
        
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            highlightsData.items = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            highlightsData = parsed;
            // Ensure we at least have an empty array for metricSignals
            if (!highlightsData.metricSignals) {
              highlightsData.metricSignals = [];
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing highlights:', e);
    }
    
    // Add the new metrics
    const currentTime = new Date();
    const newMetrics = Array.isArray(metricSignals) ? metricSignals : [metricSignals];
    
    newMetrics.forEach(metric => {
      // Add an ID and timestamp if not provided
      if (!metric.id) {
        metric.id = `metric-${currentTime.getTime()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      if (!metric.createdAt) {
        metric.createdAt = currentTime.toISOString();
      }
    });
    
    // Add new metrics to existing ones
    highlightsData.metricSignals = [...highlightsData.metricSignals, ...newMetrics];
    
    // Update the scorecard
    await prisma.opportunity.update({
      where: { id: scorecard.id },
      data: {
        // @ts-ignore - Using highlights as a custom field
        highlights: highlightsData
      }
    });

    revalidatePath('/admin/scorecard');
    
    return NextResponse.json({
      success: true,
      metrics: newMetrics
    });
  } catch (error) {
    console.error('Error adding metrics:', error);
    return NextResponse.json(
      { error: 'Failed to add metrics' },
      { status: 500 }
    );
  }
} 