'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lightbulb, MoveHorizontal, GripHorizontal } from 'lucide-react';
import { OpportunityStatus } from '@prisma/client';
import { 
  getBusinessOpportunities, 
  updateOpportunityTimeline,
  updateOpportunityTimelineSpan 
} from '@/app/actions/opportunity';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { migrateTimelineSpans } from './migration';

// Handle span change for timeline cards
const handleSpanChange = async (id: string, span: number) => {
  console.log(`Changing span for ${id} to ${span}`);
  
  // Update local state first for immediate visual feedback
  setOpportunitySpans(prev => ({
    ...prev,
    [id]: span
  }));
  
  // Save to database
  setIsSaving(true);
  try {
    // Call server action to update the span
    const result = await updateOpportunityTimelineSpan(id, span);
    
    if (!result.success) {
      console.error('Error updating opportunity span:', result.error);
      // Revert the local state change if server update failed
      setOpportunitySpans(prev => ({
        ...prev,
        [id]: prev[id] || 1 // Revert to previous span or default to 1
      }));
    } else {
      console.log(`Successfully saved span ${span} for opportunity ${id}`);
    }
  } catch (error) {
    console.error('Error updating opportunity span:', error);
    // Revert local state on error
    setOpportunitySpans(prev => ({
      ...prev,
      [id]: prev[id] || 1
    }));
  } finally {
    setIsSaving(false);
  }
};

// Define types for the planning page
interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  status: OpportunityStatus;
  category: string;
  serviceArea: string;
  targetKPI?: string | null;
  createdAt: Date;
  updatedAt: Date;
  businessId: string;
  isPublished: boolean;
  timeline?: 'SHORT' | 'MID' | 'LONG';
  timeline_span?: number;
  // For visual tracking in the timeline
  span?: number;
}

const Planning = () => {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || '';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardState, setBoardState] = useState<BoardState>({
    opportunities: {},
    columns: {
      SHORT: { id: 'SHORT', title: 'SHORT TERM', opportunityIds: [] },
      MID: { id: 'MID', title: 'MID TERM', opportunityIds: [] },
      LONG: { id: 'LONG', title: 'LONG TERM', opportunityIds: [] },
    },
    columnOrder: ['SHORT', 'MID', 'LONG'],
  });
  const [opportunitySpans, setOpportunitySpans] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load opportunities
  useEffect(() => {
    const loadOpportunities = async () => {
      if (!businessId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await getBusinessOpportunities(businessId);
        
        if (result.success && result.opportunities) {
          // Transform the data for the board state
          const opportunitiesMap: Record<string, Opportunity> = {};
          const columnOpportunities: Record<string, string[]> = {
            SHORT: [],
            MID: [],
            LONG: [],
          };
          
          // Initialize spans
          const initialSpans: Record<string, number> = {};
          
          result.opportunities.forEach((opp) => {
            // Add to opportunities map
            opportunitiesMap[opp.id] = {
              ...opp,
              timeline: (opp.timeline as 'SHORT' | 'MID' | 'LONG') || 'SHORT',
            };
            
            // Add to appropriate column
            const timeline = opp.timeline ? 
              (opp.timeline as 'SHORT' | 'MID' | 'LONG') : 
              'SHORT';
            
            columnOpportunities[timeline].push(opp.id);
            
            // Use the timeline_span field if available, otherwise try to extract from description
            let span = opp.timeline_span || 1;
            
            // Fallback to extracting from description for backward compatibility
            if (!opp.timeline_span && opp.description && opp.description.includes('[SPAN:')) {
              const spanMatch = opp.description.match(/\[SPAN:([0-9]+)\]/);
              if (spanMatch && spanMatch[1]) {
                span = parseInt(spanMatch[1], 10);
              }
            }
            
            initialSpans[opp.id] = span;
          });
          
          // Update board state
          setBoardState({
            opportunities: opportunitiesMap,
            columns: {
              SHORT: { 
                id: 'SHORT', 
                title: 'SHORT TERM', 
                opportunityIds: columnOpportunities.SHORT 
              },
              MID: { 
                id: 'MID', 
                title: 'MID TERM', 
                opportunityIds: columnOpportunities.MID 
              },
              LONG: { 
                id: 'LONG', 
                title: 'LONG TERM', 
                opportunityIds: columnOpportunities.LONG 
              }
            },
            columnOrder: ['SHORT', 'MID', 'LONG'],
          });
          
          // Set initial spans
          setOpportunitySpans(initialSpans);
          
          console.log("Loaded opportunities:", Object.keys(opportunitiesMap).length);
        } else {
          setError('Failed to load opportunities');
        }
      } catch (err) {
        console.error('Error loading opportunities:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadOpportunities();
  }, [businessId]);

  // Handle migration of spans from description to timeline_span field
  const runMigration = async () => {
    if (!businessId) return;
    
    setIsSaving(true);
    try {
      const result = await migrateTimelineSpans(businessId);
      if (result.success) {
        alert(result.message);
        // Reload the page to see the changes
        window.location.reload();
      } else {
        alert(`Migration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error running migration:', error);
      alert('An error occurred while running the migration');
    } finally {
      setIsSaving(false);
    }
  };

  // Rest of the component code...

  // In the return statement, add the migration button:
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Opportunity Planning</h1>
        <div className="flex items-center">
          {/* Categories with color coding */}
          <div className="flex space-x-3">
            {['Foundation', 'Acquisition', 'Conversion', 'Retention'].map(category => {
              const bgColor = category === 'Foundation' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                              category === 'Acquisition' ? 'bg-green-50 border-green-200 text-green-800' :
                              category === 'Conversion' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                              'bg-orange-50 border-orange-200 text-orange-800';
              
              return (
                <div key={category} className={`text-xs font-medium border px-3 py-1.5 rounded-full ${bgColor} whitespace-nowrap`}>
                  {category}
                </div>
              );
            })}
          </div>
          
          {/* Add migration button */}
          <button
            onClick={runMigration}
            className="ml-4 px-3 py-1.5 text-xs font-medium bg-blue-50 border border-blue-200 text-blue-800 rounded-full hover:bg-blue-100"
            disabled={isSaving}
          >
            {isSaving ? 'Working...' : 'Fix Timeline Spans'}
          </button>
          
          {isSaving && !isLoading && (
            <div className="text-sm text-blue-600 flex items-center ml-4">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Rest of the existing render code... */}
    </div>
  );
};

export default function PlanningPage() {
  return <Planning />;
} 