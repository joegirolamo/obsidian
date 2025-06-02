'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Utility function to migrate spans from description to timeline_span field
 * Call this from the client if needed
 */
export async function migrateTimelineSpans(businessId: string) {
  try {
    // Get all opportunities for this business
    const opportunities = await prisma.opportunity.findMany({
      where: { businessId },
      select: { id: true, description: true }
    });
    
    console.log(`Found ${opportunities.length} opportunities to check for migration`);
    
    let migrated = 0;
    
    // Process each opportunity
    for (const opp of opportunities) {
      if (opp.description && opp.description.includes('[SPAN:')) {
        // Extract span from description
        const spanMatch = opp.description.match(/\[SPAN:([0-9]+)\]/);
        if (spanMatch && spanMatch[1]) {
          const span = parseInt(spanMatch[1], 10);
          
          try {
            // Update the opportunity with the timeline_span field
            await prisma.opportunity.update({
              where: { id: opp.id },
              data: { 
                // @ts-ignore - Field may not be in type yet
                timeline_span: span 
              }
            });
            migrated++;
          } catch (error) {
            console.error(`Error updating opportunity ${opp.id}:`, error);
          }
        }
      }
    }
    
    // Revalidate paths
    revalidatePath('/admin/dvcp/opportunities');
    revalidatePath('/admin/dvcp/planning');
    revalidatePath(`/admin/dvcp/planning?businessId=${businessId}`);
    revalidatePath(`/admin/dvcp/opportunities?businessId=${businessId}`);
    
    return { 
      success: true, 
      message: `Migration completed. Processed ${opportunities.length} opportunities, migrated ${migrated}.` 
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: 'Failed to migrate timeline spans' };
  }
} 