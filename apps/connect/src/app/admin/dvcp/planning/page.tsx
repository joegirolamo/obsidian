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
  // For visual tracking in the timeline
  span?: number;
}

// For local state management to include order
interface ColumnData {
  id: 'SHORT' | 'MID' | 'LONG';
  title: string;
  opportunityIds: string[];
}

interface BoardState {
  opportunities: Record<string, Opportunity>;
  columns: Record<'SHORT' | 'MID' | 'LONG', ColumnData>;
  columnOrder: ('SHORT' | 'MID' | 'LONG')[];
}

// Function to get color based on opportunity category
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Foundation':
      return {
        color: '#FFDC00',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
      };
    case 'Acquisition':
      return {
        color: '#2ECC40',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
      };
    case 'Conversion':
      return {
        color: '#0074D9',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
      };
    case 'Retention':
      return {
        color: '#FF851B',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
      };
    default:
      return {
        color: '#AAAAAA',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
      };
  }
};

// Resize handle should match text color
const getHandleColor = (category: string) => {
  switch(category) {
    case 'Foundation':
      return 'bg-yellow-400';
    case 'Acquisition':
      return 'bg-green-400';
    case 'Conversion':
      return 'bg-blue-400';
    case 'Retention':
      return 'bg-orange-400';
    default:
      return 'bg-gray-400';
  }
};

// Get border color for hover state
const getHoverBorderColor = (category: string) => {
  switch(category) {
    case 'Foundation':
      return 'hover:border-yellow-400';
    case 'Acquisition':
      return 'hover:border-green-400';
    case 'Conversion':
      return 'hover:border-blue-400';
    case 'Retention':
      return 'hover:border-orange-400';
    default:
      return 'hover:border-gray-400';
  }
};

// Timeline card component with drag and resize functionality
const TimelineCard = ({ 
  opportunity,
  columnId,
  onMove,
  onSpanChange,
  style = {}
}: { 
  opportunity: Opportunity;
  columnId: 'SHORT' | 'MID' | 'LONG';
  onMove: (id: string, newColumnId: 'SHORT' | 'MID' | 'LONG') => void;
  onSpanChange: (id: string, span: number) => void;
  style?: React.CSSProperties;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startColumnId, setStartColumnId] = useState(columnId);
  const [currentSpan, setCurrentSpan] = useState(opportunity.span || 1);
  const cardRef = useRef<HTMLDivElement>(null);
  const columnOrder: ('SHORT' | 'MID' | 'LONG')[] = ['SHORT', 'MID', 'LONG'];
  
  // Different background colors based on category
  const getCategoryBackground = (category: string) => {
    switch(category) {
      case 'Foundation':
        return 'bg-yellow-50';
      case 'Acquisition':
        return 'bg-green-50';
      case 'Conversion':
        return 'bg-blue-50';
      case 'Retention':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };
  
  // Get text color based on category
  const getCategoryTextColor = (category: string) => {
    switch(category) {
      case 'Foundation':
        return 'text-yellow-800';
      case 'Acquisition':
        return 'text-green-800';
      case 'Conversion':
        return 'text-blue-800';
      case 'Retention':
        return 'text-orange-800';
      default:
        return 'text-gray-800';
    }
  };
  
  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    // Only start drag if we didn't click on the resize handle
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      return;
    }
    
    console.log('Drag start');
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartColumnId(columnId);
  };
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    console.log('Resize start');
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
  };
  
  // Handle drag move
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Prevent any default behaviors
    e.preventDefault();
    
    // Find the timeline container
    const timelineContainers = document.querySelectorAll('.timeline-section');
    if (!timelineContainers.length) return;
    
    const timelineContainer = timelineContainers[0] as HTMLElement;
    const rect = timelineContainer.getBoundingClientRect();
    const columnWidth = rect.width / 3;
    
    // Calculate which column the mouse is currently in
    const relativeX = e.clientX - rect.left;
    let currentColumnIndex;
    
    if (relativeX < columnWidth) {
      currentColumnIndex = 0; // SHORT
    } else if (relativeX < columnWidth * 2) {
      currentColumnIndex = 1; // MID
    } else {
      currentColumnIndex = 2; // LONG
    }
    
    const currentColumnId = columnOrder[currentColumnIndex] as 'SHORT' | 'MID' | 'LONG';
    
    // Only move if we've actually moved to a different column
    if (currentColumnId !== startColumnId) {
      console.log(`Moving from ${startColumnId} to ${currentColumnId}`);
      // Call the onMove callback to update both timeline and kanban board
      onMove(opportunity.id, currentColumnId);
      // Update local state for dragging
      setStartColumnId(currentColumnId);
    }
  };
  
  // Handle resize move
  const handleResizeMove = async (e: MouseEvent) => {
    if (!isResizing) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const columnWidth = 300; // Use fixed width for consistency
    const spanChange = Math.round(deltaX / (columnWidth * 0.8));
    
    if (spanChange !== 0) {
      // Calculate maximum possible span based on current column
      const maxPossibleSpan = 3 - columnOrder.indexOf(columnId);
      const newSpan = Math.max(1, Math.min(maxPossibleSpan, currentSpan + spanChange));
      
      if (newSpan !== currentSpan) {
        console.log(`Resizing from span ${currentSpan} to ${newSpan}`);
        setCurrentSpan(newSpan);
        
        // Update the span in the global state and database
        // Don't await here to keep the resize smooth - let it save in the background
        onSpanChange(opportunity.id, newSpan);
        
        setStartX(e.clientX);
      }
    }
  };
  
  // Handle drag end
  const handleDragEnd = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    console.log('Drag end');
    setIsDragging(false);
  };
  
  // Handle resize end
  const handleResizeEnd = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    console.log('Resize end');
    setIsResizing(false);
  };
  
  // Calculate the maximum possible span based on current column
  const maxPossibleSpan = 3 - columnOrder.indexOf(columnId);
  
  // Ensure span doesn't exceed available columns
  const span = Math.min(currentSpan, maxPossibleSpan);
  
  // Handle drag and resize events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e);
      } else if (isResizing) {
        handleResizeMove(e);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        handleDragEnd(e);
      } else if (isResizing) {
        handleResizeEnd(e);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, isResizing, startColumnId, startX, columnId]);
  
  // Apply consistent margin without position styling that causes type errors
  const cardStyle = {
    ...style,
    marginBottom: '0',
    height: '28px'
  };
  
  // Find column index for hover tracking - removed until we can properly pass setHoveredColumn
  
  return (
    <div
      ref={cardRef}
      className={`
        relative py-1 px-2 border-0 rounded-md h-7 flex items-center
        ${getCategoryBackground(opportunity.category)} 
        hover:border ${getHoverBorderColor(opportunity.category)} transition-all duration-150 
        ${isDragging ? `opacity-75 border z-10 cursor-grabbing ${getCategoryColor(opportunity.category).color.replace('#', 'border-')}` : 'cursor-grab'}
        ${isResizing ? `opacity-75 border z-10 ${getCategoryColor(opportunity.category).color.replace('#', 'border-')}` : ''}
        group
      `}
      style={cardStyle}
      onMouseDown={(e) => {
        console.log("Card clicked", { isResizeHandle: !!(e.target as HTMLElement).closest('.resize-handle') });
        if (!(e.target as HTMLElement).closest('.resize-handle')) {
          handleDragStart(e);
        }
      }}
    >
      <div className={`text-[12px] leading-tight font-medium ${getCategoryTextColor(opportunity.category)} truncate pr-3 flex-1`}>
        {opportunity.title}
      </div>
      
      {/* Resize handle */}
      <div 
        className="resize-handle absolute right-0 top-0 bottom-0 w-3 flex items-center justify-end cursor-col-resize opacity-0 group-hover:opacity-100"
        onMouseDown={(e) => {
          console.log("Resize handle clicked");
          handleResizeStart(e);
        }}
      >
        <div className={`h-full w-1 rounded-r opacity-60 hover:opacity-100 ${getHandleColor(opportunity.category)}`}></div>
      </div>
    </div>
  );
};

// Opportunity card component
const OpportunityCard = ({ opportunity, index }: { opportunity: Opportunity; index: number }) => {
  const categoryStyles = getCategoryColor(opportunity.category);
  
  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-3 rounded-lg bg-white border border-gray-100 ${
            snapshot.isDragging ? 'shadow-md' : 'shadow-sm'
          } cursor-grab ${snapshot.isDragging ? 'cursor-grabbing' : ''}`}
        >
          <div className="flex items-start">
            <Lightbulb 
              className="h-4 w-4 mt-1 mr-2 flex-shrink-0" 
              style={{ color: categoryStyles.color }} 
            />
            <div>
              <h4 className="font-medium text-sm">{opportunity.title}</h4>
              {opportunity.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {opportunity.description}
                </p>
              )}
              <div className="mt-2 flex items-center">
                <span 
                  className={`text-xs px-2 py-0.5 rounded-full ${categoryStyles.textColor} bg-white border ${categoryStyles.borderColor}`}
                >
                  {opportunity.category}
                </span>
                {opportunity.serviceArea && (
                  <span className="text-xs text-gray-500 ml-2">
                    {opportunity.serviceArea}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Drag handle icon (now just visual, entire card is draggable) */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <MoveHorizontal className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      )}
    </Draggable>
  );
};

// Column component
const Column = ({ column, opportunities }: { column: ColumnData; opportunities: Opportunity[] }) => {
  return (
    <div className="h-full">
      <div className="rounded-lg h-full">
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`h-full ${
                snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
              } rounded-md overflow-hidden`}
              style={{
                minHeight: '500px'
              }}
            >
              <div className="h-full overflow-y-auto hide-scrollbar">
                {opportunities.map((opportunity, index) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} index={index} />
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};

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
            
            // Extract span from description if available
            let span = 1;
            if (opp.description && opp.description.includes('[SPAN:')) {
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

  // Handle span change for timeline cards
  const handleSpanChange = async (id: string, span: number) => {
    console.log(`Changing span for ${id} to ${span}`);
    
    // Update local state first
    setOpportunitySpans(prev => ({
      ...prev,
      [id]: span
    }));
    
    // Save to database
    setIsSaving(true);
    try {
      const result = await updateOpportunityTimelineSpan(id, span);
      if (result.success) {
        console.log(`Successfully saved span ${span} for opportunity ${id}`);
      } else {
        console.error('Error updating opportunity span:', result.error);
      }
    } catch (error) {
      console.error('Error updating opportunity span:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Use effect to log span changes
  useEffect(() => {
    console.log("Opportunity spans updated:", opportunitySpans);
  }, [opportunitySpans]);
  
  // Move opportunity to a timeline
  const moveOpportunityToTimeline = async (opportunityId: string, targetTimeline: 'SHORT' | 'MID' | 'LONG') => {
    const opportunity = boardState.opportunities[opportunityId];
    if (!opportunity) return;
    
    const currentTimeline = opportunity.timeline || 'SHORT';
    if (currentTimeline === targetTimeline) return;
    
    console.log(`Moving opportunity ${opportunityId} from ${currentTimeline} to ${targetTimeline}`);
    
    // Update locally first
    const updatedOpportunities = {
      ...boardState.opportunities,
      [opportunityId]: {
        ...opportunity,
        timeline: targetTimeline
      }
    };
    
    // Remove from current column
    const currentColumnOpportunityIds = [...boardState.columns[currentTimeline].opportunityIds];
    const newCurrentColumnOpportunityIds = currentColumnOpportunityIds.filter(id => id !== opportunityId);
    
    // Add to target column
    const targetColumnOpportunityIds = [...boardState.columns[targetTimeline].opportunityIds, opportunityId];
    
    // Update board state
    setBoardState({
      ...boardState,
      opportunities: updatedOpportunities,
      columns: {
        ...boardState.columns,
        [currentTimeline]: {
          ...boardState.columns[currentTimeline],
          opportunityIds: newCurrentColumnOpportunityIds
        },
        [targetTimeline]: {
          ...boardState.columns[targetTimeline],
          opportunityIds: targetColumnOpportunityIds
        }
      }
    });
    
    // Adjust span if necessary
    const columnOrder = ['SHORT', 'MID', 'LONG'];
    const targetIndex = columnOrder.indexOf(targetTimeline);
    const currentSpan = opportunitySpans[opportunityId] || 1;
    
    // If moving to a later column and span exceeds available columns, reduce it
    if (targetIndex > 0 && currentSpan > (3 - targetIndex)) {
      handleSpanChange(opportunityId, 3 - targetIndex);
    }
    
    // Save to database
    setIsSaving(true);
    try {
      await updateOpportunityTimeline(opportunityId, targetTimeline);
      console.log(`Successfully saved opportunity ${opportunityId} timeline change to ${targetTimeline}`);
    } catch (error) {
      console.error('Error updating opportunity timeline:', error);
      
      // Revert the state change if save failed
      setBoardState({
        ...boardState
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Utility function to ensure timeline view and kanban view are synchronized
  const ensureViewsAreSynchronized = () => {
    // Map through all opportunities to make sure they're in the right columns
    const updatedColumns: Record<'SHORT' | 'MID' | 'LONG', string[]> = {
      SHORT: [],
      MID: [],
      LONG: []
    };
    
    // Group opportunity IDs by their timeline
    Object.entries(boardState.opportunities).forEach(([id, opp]) => {
      const timeline = opp.timeline || 'SHORT';
      updatedColumns[timeline].push(id);
    });
    
    // Check if we need to update
    let needsUpdate = false;
    
    // Compare with current state
    for (const timeline of ['SHORT', 'MID', 'LONG'] as const) {
      const currentIds = new Set(boardState.columns[timeline].opportunityIds);
      const expectedIds = new Set(updatedColumns[timeline]);
      
      // Check if arrays have the same items (order doesn't matter for this check)
      if (currentIds.size !== expectedIds.size) {
        needsUpdate = true;
        break;
      }
      
      // Convert Set to Array before iterating to fix linter error
      for (const id of Array.from(currentIds)) {
        if (!expectedIds.has(id)) {
          needsUpdate = true;
          break;
        }
      }
    }
    
    // Update if needed
    if (needsUpdate) {
      setBoardState({
        ...boardState,
        columns: {
          SHORT: {
            ...boardState.columns.SHORT,
            opportunityIds: updatedColumns.SHORT
          },
          MID: {
            ...boardState.columns.MID,
            opportunityIds: updatedColumns.MID
          },
          LONG: {
            ...boardState.columns.LONG,
            opportunityIds: updatedColumns.LONG
          }
        }
      });
    }
  };

  // Run synchronization whenever opportunities or columns change
  useEffect(() => {
    ensureViewsAreSynchronized();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardState.opportunities, JSON.stringify(boardState.columns)]);

  // Handle drag end from kanban board
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // No destination or dropped in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Get source and destination columns
    const sourceColumn = boardState.columns[source.droppableId as 'SHORT' | 'MID' | 'LONG'];
    const destColumn = boardState.columns[destination.droppableId as 'SHORT' | 'MID' | 'LONG'];

    // Same column - reordering
    if (sourceColumn.id === destColumn.id) {
      const newOpportunityIds = Array.from(sourceColumn.opportunityIds);
      newOpportunityIds.splice(source.index, 1);
      newOpportunityIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...sourceColumn,
        opportunityIds: newOpportunityIds,
      };

      setBoardState(prevState => ({
        ...prevState,
        columns: {
          ...prevState.columns,
          [newColumn.id]: newColumn,
        },
      }));
      
      return;
    }

    // Moving from one column to another
    const sourceOpportunityIds = Array.from(sourceColumn.opportunityIds);
    sourceOpportunityIds.splice(source.index, 1);
    
    const destOpportunityIds = Array.from(destColumn.opportunityIds);
    destOpportunityIds.splice(destination.index, 0, draggableId);

    // Update opportunity in the opportunities map
    const updatedOpportunities = {
      ...boardState.opportunities,
      [draggableId]: {
        ...boardState.opportunities[draggableId],
        timeline: destColumn.id,
      },
    };
    
    // Update columns
    const updatedColumns = {
      ...boardState.columns,
      [sourceColumn.id]: {
        ...sourceColumn,
        opportunityIds: sourceOpportunityIds,
      },
      [destColumn.id]: {
        ...destColumn,
        opportunityIds: destOpportunityIds,
      }
    };
    
    setBoardState({
      ...boardState,
      opportunities: updatedOpportunities,
      columns: updatedColumns
    });

    // Update opportunity timeline in the database
    setIsSaving(true);
    try {
      await updateOpportunityTimeline(draggableId, destColumn.id);
      console.log(`Moved opportunity ${draggableId} from ${sourceColumn.id} to ${destColumn.id}`);
    } catch (error) {
      console.error('Error updating opportunity timeline:', error);
      
      // Revert the state change if save failed
      setBoardState(boardState);
    } finally {
      setIsSaving(false);
    }
  };

  // Get opportunities for a column
  const getColumnOpportunities = (column: ColumnData): Opportunity[] => {
    return column.opportunityIds.map(id => boardState.opportunities[id]);
  };
  
  // Get opportunities for the timeline display
  const getOpportunitiesByTimeline = (timeline: 'SHORT' | 'MID' | 'LONG'): Opportunity[] => {
    const column = boardState.columns[timeline];
    return column.opportunityIds.map(id => boardState.opportunities[id]);
  };

  // Function to update which column is hovered based on mouse position
  const updateHoveredColumn = (clientX: number) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const columnWidth = rect.width / 3;
    
    // Determine which column we're hovering based on position
    if (relativeX < columnWidth) {
      setHoveredColumn(0);
    } else if (relativeX < columnWidth * 2) {
      setHoveredColumn(1);
    } else {
      setHoveredColumn(2);
    }
  };

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
          {isSaving && (
            <div className="text-sm text-blue-600 flex items-center ml-4">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Main container */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        {/* Timeline section */}
        <div 
          className="p-6 pt-2 pb-6 bg-white relative timeline-section"
          ref={timelineRef}
          onMouseMove={(e) => updateHoveredColumn(e.clientX)}
          onMouseLeave={() => setHoveredColumn(null)}
        >
          {/* Timeline header */}
          <div 
            className="grid grid-cols-3 gap-6 relative z-10"
            style={{ 
              marginTop: '7px', 
              marginBottom: '12px' 
            }}
          >
            {boardState.columnOrder.map((columnId, index) => (
              <div 
                key={columnId} 
                className="text-left font-medium uppercase"
                style={{
                  fontSize: '12px',
                  color: hoveredColumn === index ? '#444' : '#999',
                  paddingBottom: '0',
                  transition: 'color 0.4s ease-in-out'
                }}
              >
                {boardState.columns[columnId].title}
              </div>
            ))}
          </div>
          
          {/* Vertical dotted dividers for timeline section */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* Divider between Short Term and Mid Term */}
            <div 
              className="absolute border-r border-dashed border-gray-200"
              style={{
                left: 'calc(33.333% + 3px)',
                top: '0',
                height: '100%',
                width: '1px'
              }}
            ></div>
            
            {/* Divider between Mid Term and Long Term */}
            <div 
              className="absolute border-r border-dashed border-gray-200"
              style={{
                left: 'calc(66.666% - 5px)',
                top: '0',
                height: '100%',
                width: '1px'
              }}
            ></div>
          </div>
          
          {/* Timeline content - Gantt chart style layout */}
          <div className="mt-4 relative">
            {/* Timeline rows - one for each category */}
            <div className="space-y-3">
              {/* Display opportunities by category */}
              {['Foundation', 'Acquisition', 'Conversion', 'Retention'].map((category) => {
                // First, collect all opportunities in this category
                const categoryOpportunities = boardState.columnOrder.flatMap(columnId => 
                  getOpportunitiesByTimeline(columnId)
                    .filter(opp => opp.category === category)
                    .map(opp => ({
                      ...opp,
                      columnId,
                      span: Math.min(opportunitySpans[opp.id] || 1, 3 - boardState.columnOrder.indexOf(columnId))
                    }))
                );
                
                // Now, create a 2D grid representation to track which cells are occupied
                // We'll start with a reasonable number of rows (5) and expand if needed
                const grid = Array(5).fill(null).map(() => Array(3).fill(null));
                
                // Place each opportunity in the grid, ensuring we respect spans
                categoryOpportunities.forEach(opp => {
                  const colIndex = boardState.columnOrder.indexOf(opp.columnId);
                  
                  // Use the span from the opportunitySpans state, which is loaded from the database
                  const span = opportunitySpans[opp.id] || 1;
                  
                  // Find the first available row for this opportunity
                  let rowIndex = 0;
                  let placed = false;
                  
                  while (!placed && rowIndex < grid.length) {
                    // Check if all cells in the span are available
                    let canPlace = true;
                    for (let c = colIndex; c < colIndex + span && c < 3; c++) {
                      if (grid[rowIndex][c] !== null) {
                        canPlace = false;
                        break;
                      }
                    }
                    
                    // If we can place the opportunity here, do so
                    if (canPlace) {
                      for (let c = colIndex; c < colIndex + span && c < 3; c++) {
                        grid[rowIndex][c] = c === colIndex ? opp : 'occupied';
                      }
                      placed = true;
                    } else {
                      rowIndex++;
                    }
                  }
                  
                  // If we couldn't place it, add a new row
                  if (!placed) {
                    grid.push(Array(3).fill(null));
                    for (let c = colIndex; c < colIndex + span && c < 3; c++) {
                      grid[grid.length - 1][c] = c === colIndex ? opp : 'occupied';
                    }
                  }
                });
                
                return (
                  <div key={category} className="relative">
                    <div className="pt-0">
                      <div className="relative">
                        {/* Render each row of the grid */}
                        {grid.map((row, rowIndex) => {
                          // Find real cells in this row (not 'occupied')
                          const hasRealCells = row.some(cell => cell !== 'occupied' && cell !== null);
                          
                          // Skip rendering this row entirely if it only contains 'occupied' cells
                          if (!hasRealCells) return null;
                          
                          return (
                            <div 
                              key={rowIndex} 
                              className="grid grid-cols-3 gap-6"
                              style={{ 
                                marginBottom: '3px',
                                height: '28px'
                              }}
                            >
                              {row.map((cell, colIndex) => {
                                // Skip 'occupied' cells (these are part of a span)
                                if (cell === 'occupied') return <div key={colIndex} className="empty-cell" style={{ height: '0px' }}></div>;
                                
                                // Render opportunity if present
                                if (cell !== null) {
                                  const opp = cell as (Opportunity & { columnId: string; span: number });
                                  return (
                                    <div 
                                      key={opp.id} 
                                      className="relative"
                                      style={{ 
                                        gridColumn: `span ${opp.span}`,
                                        marginBottom: '0px',
                                        height: '28px' // Fixed height for all card containers
                                      }}
                                    >
                                      <TimelineCard
                                        opportunity={opp}
                                        columnId={opp.columnId as 'SHORT' | 'MID' | 'LONG'}
                                        onMove={moveOpportunityToTimeline}
                                        onSpanChange={handleSpanChange}
                                        style={{
                                          width: '100%',
                                          zIndex: 10,
                                          marginBottom: '0',
                                          height: '28px' // Fixed height for all cards
                                        }}
                                      />
                                    </div>
                                  );
                                }
                                
                                // Empty cell
                                return <div key={colIndex} className="empty-cell" style={{ height: '28px' }}></div>;
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Kanban board section */}
        <div className="p-6 bg-gray-50 relative">
          {/* Vertical dotted dividers for kanban section */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* Divider between Short Term and Mid Term */}
            <div 
              className="absolute border-r border-dashed border-gray-200"
              style={{
                left: 'calc(33.333% + 3px)',
                top: '0',
                height: '100%',
                width: '1px'
              }}
            ></div>
            
            {/* Divider between Mid Term and Long Term */}
            <div 
              className="absolute border-r border-dashed border-gray-200"
              style={{
                left: 'calc(66.666% - 5px)',
                top: '0',
                height: '100%',
                width: '1px'
              }}
            ></div>
          </div>

          <style jsx global>{`
            /* Completely disable transitions for drag-and-drop */
            .react-beautiful-dnd-draggable {
              transition: none !important;
            }
            
            /* Hide scrollbars but keep functionality */
            .hide-scrollbar::-webkit-scrollbar {
              width: 4px;
              height: 4px;
            }
            
            .hide-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(0, 0, 0, 0.1);
              border-radius: 4px;
            }
            
            .hide-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
            }
          `}</style>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-6 min-h-[500px]">
              {boardState.columnOrder.map((columnId) => {
                const column = boardState.columns[columnId];
                const opportunities = getColumnOpportunities(column);
                
                return (
                  <Column 
                    key={column.id} 
                    column={column} 
                    opportunities={opportunities}
                  />
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default function PlanningPage() {
  return <Planning />;
} 