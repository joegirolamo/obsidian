'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { updateScorecardCategory, publishScorecard } from '@/app/actions/scorecard';
import PublishToggle from '@/components/PublishToggle';

export default function ScorecardPage() {
  // The error is likely happening because businessId is undefined
  // Let's provide a default value for testing or development
  const params = useParams();
  const businessId = params?.businessId as string || "default-business-id";
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({
    EBITDA: 4,
    Revenue: 7,
    'De-Risk': 6,
  });

  const categories = [
    { name: "EBITDA", maxScore: 10 },
    { name: "Revenue", maxScore: 10 },
    { name: "De-Risk", maxScore: 10 },
  ];

  const handleHighlightChange = (category: string, value: string) => {
    setHighlights((prev) => ({ ...prev, [category]: value }));
  };

  const handleScoreChange = (category: string, value: number) => {
    setScores((prev) => ({ ...prev, [category]: value }));
  };

  const handleCategorySubmit = async (category: string) => {
    try {
      // Add error handling and logging
      console.log("Submitting category:", category, "for business:", businessId);
      
      const result = await updateScorecardCategory(businessId, {
        name: category,
        score: scores[category] || 0,
        highlights: highlights[category] || '',
      });
      
      if (!result.success) {
        console.error("Error updating scorecard category:", result.error);
      } else {
        console.log("Successfully updated scorecard category");
      }
    } catch (error) {
      console.error("Exception in handleCategorySubmit:", error);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const result = await publishScorecard(businessId);
      if (!result.success) {
        console.error("Error publishing scorecard:", result.error);
      } else {
        setIsPublished(!isPublished);
      }
    } finally {
      setIsPublishing(false);
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
            isLoading={isPublishing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={category.maxScore}
                      value={scores[category.name] || 0}
                      onChange={(e) => handleScoreChange(category.name, parseInt(e.target.value, 10))}
                      onBlur={() => handleCategorySubmit(category.name)}
                      className="form-input w-16"
                    />
                    <span className="text-body">/{category.maxScore}</span>
                  </div>
                  <div className="h-2 flex-1 mx-4 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${((scores[category.name] || 0) / category.maxScore) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label
                    htmlFor={`${category.name}-highlights`}
                    className="form-label"
                  >
                    Highlights
                  </label>
                  <textarea
                    id={`${category.name}-highlights`}
                    name={`${category.name}-highlights`}
                    rows={4}
                    value={highlights[category.name] || ''}
                    onChange={(e) => handleHighlightChange(category.name, e.target.value)}
                    onBlur={() => handleCategorySubmit(category.name)}
                    className="form-input"
                    placeholder="Add highlights..."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 