'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getScorecardData, getScorecardPublishStatus, publishScorecard, unpublishScorecard, preloadScorecardData, updateScorecardCategory } from '@/app/actions/scorecard';
import PublishToggle from '@/components/PublishToggle';
import { prisma } from "@/lib/prisma";
import { getScorecardAction } from '@/app/actions/serverActions';

interface Scorecard {
  id: string;
  category: string;
  score: number;
  maxScore: number;
  highlights: Array<{
    id: string;
    text: string;
    serviceArea: string;
    relatedMetricId?: string;
  }>;
  metricSignals: any[];
}

export default function ScorecardPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || '';
  
  // Move all useState hooks to the top level
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
  const [editingHighlights, setEditingHighlights] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({
    Foundation: 75,
    Acquisition: 82,
    Conversion: 65,
    Retention: 70,
  });
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [preloadStatus, setPreloadStatus] = useState('');

  useEffect(() => {
    if (!businessId) {
      setError('No business selected');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const result = await getScorecardData(businessId);
        if (result.success) {
          setScorecards(result.scorecards);
          setDataLoaded(true);
        } else {
          setError(result.error || 'Failed to load scorecard');
        }
      } catch (error) {
        console.error('Error loading scorecard:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [businessId]);

  const loadPublishStatus = async () => {
    console.log('[DEBUG] Loading publish status for businessId:', businessId);
    const result = await getScorecardPublishStatus(businessId);
    console.log('[DEBUG] Got publish status result:', result);
    if (result.success && result.isPublished !== undefined) {
      setIsPublished(result.isPublished);
    }
  };

  const handlePublishToggle = async () => {
    try {
      const result = isPublished 
        ? await unpublishScorecard(businessId)
        : await publishScorecard(businessId);
      
      console.log('[DEBUG] Toggle result:', result);  
      if (result.success) {
        setIsPublished(!isPublished);
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const handlePreload = async () => {
    try {
      console.log('[DEBUG] Preloading scorecard data');
      const result = await preloadScorecardData(businessId);
      console.log('[DEBUG] Preload result:', result);
      
      if (result.success) {
        // Reload the scorecard data
        const dataResult = await getScorecardData(businessId);
        if (dataResult.success) {
          setScorecards(dataResult.scorecards);
        }
      }
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  };

  const handleSaveCategory = async (category: string) => {
    try {
      setSaveStatus((prev) => ({ ...prev, [category]: 'Saving...' }));
      
      const result = await updateScorecardCategory(businessId, {
        name: category,
        score: scores[category] || 0,
        highlights: editingHighlights[category] || '',
        serviceAreas: scorecards.find(s => s.category === category)?.highlights.map(h => h.serviceArea) || []
      });
      
      if (result.success) {
        setSaveStatus((prev) => ({ ...prev, [category]: 'Saved' }));
        // Reload the scorecard data
        const dataResult = await getScorecardData(businessId);
        if (dataResult.success) {
          setScorecards(dataResult.scorecards);
        }
      } else {
        setSaveStatus((prev) => ({ ...prev, [category]: 'Error' }));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setSaveStatus((prev) => ({ ...prev, [category]: 'Error' }));
    }
  };

  // Debug log when component mounts
  useEffect(() => {
    console.log('[DEBUG] ScorecardPage mounted with businessId:', businessId);
    
    // Load existing scorecard data from database
    const loadScorecardData = async () => {
      try {
        // Fetch all scorecard opportunities for this business
        const response = await fetch(`/api/opportunities?businessId=${businessId}&type=scorecard`);
        if (!response.ok) {
          throw new Error('Failed to fetch scorecard data');
        }
        
        const data = await response.json();
        console.log('[DEBUG] Loaded scorecard data:', data);
        
        if (data && data.length > 0) {
          // Update state with existing data
          const newHighlights: Record<string, string> = {};
          const newScores: Record<string, number> = { ...scores };
          
          data.forEach((scorecard: any) => {
            if (scorecard.category) {
              newHighlights[scorecard.category] = scorecard.description || '';
              // Try to extract score from title or description if available
              // This is just a placeholder - you might want to store score separately
            }
          });
          
          setHighlights(newHighlights);
          setDataLoaded(true);
          console.log('[DEBUG] Updated highlights state:', newHighlights);
        }
      } catch (error) {
        console.error('[DEBUG] Error loading scorecard data:', error);
      }
    };
    
    loadScorecardData();
  }, [businessId, scores]);

  // Load initial publish status
  useEffect(() => {
    loadPublishStatus();
  }, [businessId]);

  const categories = [
    { name: "Foundation", maxScore: 100 },
    { name: "Acquisition", maxScore: 100 },
    { name: "Conversion", maxScore: 100 },
    { name: "Retention", maxScore: 100 },
  ];

  const handleHighlightChange = (category: string, value: string) => {
    console.log('[DEBUG] Highlight changed for', category, ':', value);
    setHighlights((prev) => ({ ...prev, [category]: value }));
  };

  const handleScoreChange = (category: string, value: number) => {
    console.log('[DEBUG] Score changed for', category, ':', value);
    setScores((prev) => ({ ...prev, [category]: value }));
  };

  const handleCategorySubmit = async (category: string) => {
    try {
      console.log('[DEBUG] Submitting category:', category);
      console.log('[DEBUG] With data:', {
        businessId,
        name: category,
        score: scores[category] || 0,
        highlights: highlights[category] || '',
      });
      
      setSaveStatus((prev) => ({ ...prev, [category]: 'Saving...' }));
      
      const result = await updateScorecardCategory(businessId, {
        name: category,
        score: scores[category] || 0,
        highlights: highlights[category] || '',
        serviceAreas: scorecards.find(s => s.category === category)?.highlights.map(h => h.serviceArea) || []
      });
      
      console.log('[DEBUG] Category submit result:', result);
      
      if (!result.success) {
        console.error("[DEBUG] Error updating scorecard category:", result.error);
        setSaveStatus((prev) => ({ ...prev, [category]: 'Error!' }));
      } else {
        console.log('[DEBUG] Category saved successfully');
        setSaveStatus((prev) => ({ ...prev, [category]: 'Saved!' }));
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [category]: '' }));
        }, 3000);
      }
    } catch (error) {
      console.error("[DEBUG] Exception in handleCategorySubmit:", error);
      setSaveStatus((prev) => ({ ...prev, [category]: 'Error!' }));
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Scorecard</h1>
            <p className="text-body mt-2">
              Manage business performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreload}
              disabled={isPreloading}
              className="button button-secondary"
            >
              {preloadStatus || 'Preload Template Data'}
            </button>
            <PublishToggle
              isPublished={isPublished}
              onToggle={handlePublishToggle}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {categories.map((category) => (
          <div
            key={category.name}
            className="card"
          >
            <div className="card-header">
              <h2 className="heading-2">{category.name}</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <label className="label">Score</label>
                  <input
                    type="range"
                    min="0"
                    max={category.maxScore}
                    value={scores[category.name] || 0}
                    onChange={(e) => handleScoreChange(category.name, parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {scores[category.name] || 0}/{category.maxScore}
                  </div>
                </div>
                <div>
                  <label className="label">Highlights</label>
                  <textarea
                    value={highlights[category.name] || ''}
                    onChange={(e) => handleHighlightChange(category.name, e.target.value)}
                    className="input"
                    rows={6}
                    placeholder="Add highlights..."
                  />
                </div>
                <button
                  onClick={() => handleSaveCategory(category.name)}
                  className="button button-primary w-full"
                >
                  {saveStatus[category.name] || 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 