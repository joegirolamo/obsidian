'use server';

import { prisma } from '@/lib/prisma';

// Simple function to debug timeline span updates
export async function debugTimelineSpan() {
  // Get all opportunities
  const opportunities = await prisma.opportunity.findMany();
  
  console.log('Current opportunities:', opportunities.map(o => ({
    id: o.id,
    title: o.title,
    timeline: o.timeline,
    // Check if timeline_span field exists
    hasTimelineSpan: 'timeline_span' in o,
    // See what fields are available
    fields: Object.keys(o)
  })));
  
  return { success: true, message: 'Check server logs for debug info' };
} 