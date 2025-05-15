'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateScorecardCategory, publishScorecard, unpublishScorecard, getScorecardPublishStatus } from '@/app/actions/scorecard';
import PublishToggle from '@/components/PublishToggle';

export default function ScorecardPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  if (!businessId) {
    console.error('No business ID found in query parameters');
    return <div>Error: No business ID found</div>;
  }

  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({
    Foundation: 75,
    Acquisition: 82,
    Conversion: 65,
    Retention: 70,
  });
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});

  // Debug log when component mounts
  useEffect(() => {
    console.log('[DEBUG] ScorecardPage mounted with businessId:', businessId);
  }, [businessId]);

  // Debug log when isPublished changes
  useEffect(() => {
    console.log('[DEBUG] isPublished changed to:', isPublished);
  }, [isPublished]);

  // Load initial publish status
  useEffect(() => {
    const loadPublishStatus = async () => {
      console.log('[DEBUG] Loading publish status for businessId:', businessId);
      const result = await getScorecardPublishStatus(businessId);
      console.log('[DEBUG] Got publish status result:', result);
      if (result.success) {
        const newState = result.isPublished ?? false;
        console.log('[DEBUG] Setting isPublished to:', newState);
        setIsPublished(newState);
      }
    };

    loadPublishStatus();
  }, [businessId]);

  const handlePublishToggle = async () => {
    console.log('[DEBUG] Toggle clicked. Current state:', isPublished);
    setIsLoading(true);
    try {
      const result = isPublished 
        ? await unpublishScorecard(businessId)
        : await publishScorecard(businessId);
      
      console.log('[DEBUG] Toggle result:', result);  
      if (result.success) {
        const newState = !isPublished;
        console.log('[DEBUG] Setting new state to:', newState);
        setIsPublished(newState);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <PublishToggle
            isPublished={isPublished}
            onToggle={handlePublishToggle}
            isLoading={isLoading}
          />
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
                    rows={3}
                    placeholder="Add highlights..."
                  />
                </div>
                <button
                  onClick={() => handleCategorySubmit(category.name)}
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