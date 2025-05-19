'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, BarChart2, AlertCircle, Zap, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react';
import Button from "../shared/Button";
import { useSearchParams } from 'next/navigation';
import { 
  preloadScorecardData, 
  preloadScorecardFocusArea,
  publishScorecard,
  unpublishScorecard,
  getScorecardPublishStatus,
  addScorecardHighlight,
  deleteScorecardHighlight,
  updateScorecardScore
} from '../../app/actions/scorecard-new';
import { OpportunityStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Import placeholder data
import { placeholderData } from '../../app/actions/scorecard-new';

interface Highlight {
  id: string;
  text: string;
  serviceArea: string;
  createdAt?: string;
  aiGenerated?: boolean;
}

interface MetricSignal {
  id: string;
  name: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  aiGenerated?: boolean;
  createdAt?: string;
}

interface ScoreData {
  score: number;
  maxScore: number;
  highlights: Highlight[];
  metricSignals?: MetricSignal[];
  lastAuditedAt?: string;
}

interface BucketData {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  textColor: string;
  serviceAreas: string[];
  data: ScoreData;
}

// Type for the Scorecard object from database
interface ScorecardOpportunity {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  status: OpportunityStatus;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  score?: number;
  maxScore?: number;
  highlights?: any; // Can be string or object
  serviceAreas?: string[];
  // Add any other fields from the Opportunity model that might be used
}

// Map of category names to colors
const categoryColors = {
  'Foundation': {
    color: '#FFDC00',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    hoverColor: 'hover:bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  'Acquisition': {
    color: '#2ECC40',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100',
    textColor: 'text-green-800',
  },
  'Conversion': {
    color: '#0074D9',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    textColor: 'text-blue-800',
  },
  'Retention': {
    color: '#FF851B',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100',
    textColor: 'text-orange-800',
  }
};

// Default service areas by category
const defaultServiceAreas = {
  'Foundation': ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
  'Acquisition': ['Performance Media', 'Campaigns', 'Earned Media'],
  'Conversion': ['Website', 'Ecommerce Platforms', 'Digital Product'],
  'Retention': ['CRM', 'App', 'Organic Social']
};

export default function Scorecard() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  const [isAddingHighlight, setIsAddingHighlight] = useState<string | null>(null);
  const [newHighlight, setNewHighlight] = useState({ text: '', serviceArea: 'Other' });
  const [isPublished, setIsPublished] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [runningFocusAreas, setRunningFocusAreas] = useState<Record<string, boolean>>({});
  const [focusAreaStatus, setFocusAreaStatus] = useState<Record<string, string>>({});
  const [auditStatus, setAuditStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buckets, setBuckets] = useState<BucketData[]>([]);

  // Load data from the database
  const loadData = async () => {
    if (!businessId) return;
    
    setIsLoading(true);
    try {
      // Check publish status
      const publishStatus = await getScorecardPublishStatus(businessId);
      if (publishStatus.success && typeof publishStatus.isPublished === 'boolean') {
        setIsPublished(publishStatus.isPublished);
      }
      
      // Get data directly from the scorecard model
      const scorecards = await (prisma as any).scorecard.findMany({
        where: {
          businessId,
          category: {
            in: ['Foundation', 'Acquisition', 'Conversion', 'Retention'],
          }
        },
      });
      
      console.log("[DEBUG] Loaded scorecards from database:", scorecards);
      
      // Map the data to buckets
      const loadedBuckets = Object.keys(categoryColors).map(category => {
        // Find scorecard for this category
        const scorecard = scorecards.find((s: any) => s.category === category);
        
        // Parse highlights if available
        let highlights: Highlight[] = [];
        let score = 0;
        let maxScore = 100;
        let metricSignals: MetricSignal[] = [];
        let lastAuditedAt = null;
        
        if (scorecard?.highlights) {
          try {
            // Parse highlights from string if needed
            const parsed = typeof scorecard.highlights === 'string' 
              ? JSON.parse(scorecard.highlights as string) 
              : scorecard.highlights;
            
            // Handle both formats: directly an array or { items: [...], score: number }
            if (parsed && typeof parsed === 'object') {
              // Extract score and maxScore from highlights JSON if available
              if (typeof parsed.score === 'number') {
                score = parsed.score;
              }
              
              if (typeof parsed.maxScore === 'number') {
                maxScore = parsed.maxScore;
              }
              
              if (parsed.metricSignals && Array.isArray(parsed.metricSignals)) {
                metricSignals = parsed.metricSignals.map((m: any) => ({
                  id: m.id,
                  name: m.name,
                  value: m.value,
                  trend: m.trend as 'up' | 'down' | 'neutral' | undefined,
                  aiGenerated: m.aiGenerated,
                  createdAt: m.createdAt
                }));
              }
              
              if (parsed.lastAuditedAt) {
                lastAuditedAt = parsed.lastAuditedAt;
              }
              
              if (Array.isArray(parsed)) {
                // Direct array format
                highlights = parsed.map((h: any) => ({
                  id: h.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  text: h.text,
                  serviceArea: h.serviceArea,
                  aiGenerated: h.aiGenerated
                }));
              } else if (parsed.items && Array.isArray(parsed.items)) {
                // New format with items property
                highlights = parsed.items.map((h: any) => ({
                  id: h.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  text: h.text,
                  serviceArea: h.serviceArea,
                  aiGenerated: h.aiGenerated
                }));
              }
            }
          } catch (e) {
            console.error('Error parsing highlights:', e);
          }
        }

        // Use scorecard fields directly
        if (typeof scorecard?.score === 'number') {
          score = scorecard.score;
        }
        
        if (typeof scorecard?.maxScore === 'number') {
          maxScore = scorecard.maxScore || 100;
        }

        // Use default service areas for this category
        const serviceAreas = defaultServiceAreas[category as keyof typeof defaultServiceAreas];

        return {
          name: category,
          ...(categoryColors[category as keyof typeof categoryColors]),
          serviceAreas,
          data: {
            score,
            maxScore,
            highlights,
            metricSignals,
            lastAuditedAt
          }
        };
      });
      
      setBuckets(loadedBuckets);
    } catch (error) {
      console.error('Error loading scorecard data:', error);
      
      // Use default buckets if loading fails
      const defaultBuckets = Object.keys(categoryColors).map(category => ({
        name: category,
        ...(categoryColors[category as keyof typeof categoryColors]),
        serviceAreas: defaultServiceAreas[category as keyof typeof defaultServiceAreas],
        data: {
          score: 0,
          maxScore: 100,
          highlights: [],
          metricSignals: [],
          lastAuditedAt: undefined
        }
      }));
      setBuckets(defaultBuckets);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from the database
  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAddHighlight = async (bucketName: string) => {
    if (!businessId || !newHighlight.text || !newHighlight.serviceArea) return;
    
    setIsSaving(true);
    console.log(`Starting add highlight: ${businessId}, ${bucketName}`, newHighlight);
    
    try {
      // Create the new highlight object
      const highlightData = {
        text: newHighlight.text,
        serviceArea: newHighlight.serviceArea,
        aiGenerated: false,
        createdAt: new Date().toISOString()
      };
      
      console.log(`BEFORE API CALL - Adding highlight via server action: ${businessId}, ${bucketName}`, highlightData);
      
      // Call the direct server action
      const result = await addScorecardHighlight(
        businessId,
        bucketName,
        highlightData
      );
      
      console.log('AFTER API CALL - Add highlight result:', result);
      
      if (result.success && result.highlight) {
        // Update the UI with the new highlight from the result
        setBuckets(prevBuckets => {
          return prevBuckets.map(bucket => {
            if (bucket.name === bucketName) {
              // Ensure the highlight object has the correct shape
              const newHighlight: Highlight = {
                id: result.highlight.id,
                text: result.highlight.text,
                serviceArea: result.highlight.serviceArea,
                aiGenerated: result.highlight.aiGenerated || false,
                createdAt: result.highlight.createdAt
              };
              
              return {
                ...bucket,
                data: {
                  ...bucket.data,
                  highlights: [...bucket.data.highlights, newHighlight]
                }
              };
            }
            return bucket;
          });
        });
        
        // Reset the form
        setNewHighlight({ text: '', serviceArea: 'Other' });
        setIsAddingHighlight(null);
      } else {
        console.error('Error adding highlight:', result.error);
        alert(`Failed to add highlight: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding highlight:', error);
      
      // Fallback to optimistic UI update without waiting for server
      const newHighlightId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      setBuckets(prevBuckets => {
        return prevBuckets.map(bucket => {
          if (bucket.name === bucketName) {
            const newHighlightObj = { 
              id: newHighlightId, 
              text: newHighlight.text,
              serviceArea: newHighlight.serviceArea,
              aiGenerated: false,
              createdAt: new Date().toISOString()
            };
            
            return {
              ...bucket,
              data: {
                ...bucket.data,
                highlights: [...bucket.data.highlights, newHighlightObj]
              }
            };
          }
          return bucket;
        });
      });
      
      // Reset the form
      setNewHighlight({ text: '', serviceArea: 'Other' });
      setIsAddingHighlight(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = (bucketName: string, newScore: number) => {
    // Ensure score is within valid range
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket) return;
    
    const clampedScore = Math.max(0, Math.min(bucket.data.maxScore, newScore));
    
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              score: clampedScore
            }
          };
        }
        return bucket;
      })
    );
  };

  const handleScoreChangeComplete = async (bucketName: string) => {
    if (!businessId) return;
    
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket) return;
    
    setIsSaving(true);
    
    try {
      console.log(`Updating score via server action: ${businessId}, ${bucketName}, score=${bucket.data.score}`);
      
      // Call the direct server action
      const result = await updateScorecardScore(
        businessId,
        bucketName,
        bucket.data.score,
        bucket.data.maxScore
      );
      
      console.log('Update score result:', result);
      
      if (!result.success) {
        console.error('Error updating score:', result.error);
        alert(`Failed to update score: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating score:', error);
      // UI is already updated, this is just for server persistence
    } finally {
      setIsSaving(false);
    }
  };

  const increaseScore = (bucketName: string) => {
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket && bucket.data.score < bucket.data.maxScore) {
      handleScoreChange(bucketName, bucket.data.score + 1);
      handleScoreChangeComplete(bucketName);
    }
  };

  const decreaseScore = (bucketName: string) => {
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket && bucket.data.score > 0) {
      handleScoreChange(bucketName, bucket.data.score - 1);
      handleScoreChangeComplete(bucketName);
    }
  };

  const runFocusAreaAudit = async (focusAreaName: string) => {
    if (!businessId) {
      alert('No business ID found. Please make sure you are viewing a specific business.');
      return;
    }
    
    // Update state to show running status for this focus area
    setRunningFocusAreas(prev => ({ ...prev, [focusAreaName]: true }));
    setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: 'Running audit...' }));
    
    try {
      // Find default data for this focus area
      const focusAreaData = placeholderData.find(category => category.name === focusAreaName);
      
      if (!focusAreaData) {
        setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: 'Error! Focus area not found.' }));
        return;
      }
      
      // Check if scorecard exists for this category
      const existingScorecard = await (prisma as any).scorecard.findFirst({
        where: {
          businessId,
          category: focusAreaName
        }
      });
      
      // If we already have a scorecard with highlights, don't override it
      if (existingScorecard) {
        try {
          const existingHighlights = typeof existingScorecard.highlights === 'string'
            ? JSON.parse(existingScorecard.highlights as string)
            : existingScorecard.highlights;
            
          // If there are existing highlights, don't override them
          if (existingHighlights && 
              ((Array.isArray(existingHighlights) && existingHighlights.length > 0) || 
               (existingHighlights.items && existingHighlights.items.length > 0))) {
            console.log('Scorecard already has data, not overriding with audit data');
            setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: 'No changes needed!' }));
            
            setTimeout(() => {
              setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: '' }));
              setRunningFocusAreas(prev => ({ ...prev, [focusAreaName]: false }));
            }, 2000);
            
            return;
          }
        } catch (error) {
          console.error('Error checking existing highlights:', error);
        }
      }
      
      // Prepare AI-generated highlight data (would come from AI in production)
      const highlightsJson = {
        items: focusAreaData.highlights.map((h, i) => ({
          id: `ai-${Date.now()}-${i}`,
          text: h.text,
          serviceArea: h.serviceArea,
          aiGenerated: true,
          createdAt: new Date().toISOString()
        })),
        metricSignals: focusAreaData.metricSignals?.map(m => ({
          ...m,
          id: `metric-${Date.now()}-${m.id}`,
          createdAt: new Date().toISOString()
        })) || [],
        score: focusAreaData.score,
        maxScore: 100,
        serviceAreas: focusAreaData.serviceAreas,
        lastAuditedAt: new Date().toISOString()
      };
      
      // Create or update the scorecard
      if (existingScorecard) {
        // Update existing scorecard with new AI data
        await (prisma as any).scorecard.update({
          where: { id: existingScorecard.id },
          data: {
            score: focusAreaData.score,
            highlights: highlightsJson
          }
        });
      } else {
        // Create new scorecard
        await (prisma as any).scorecard.create({
          data: {
            businessId,
            category: focusAreaName,
            score: focusAreaData.score,
            maxScore: 100,
            highlights: highlightsJson,
            isPublished: false
          }
        });
      }
      
      setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: 'Success!' }));
      
      // Reload the data to reflect changes
      await loadData();
    } catch (error) {
      console.error(`Error running ${focusAreaName} audit:`, error);
      setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: 'Error! Something went wrong.' }));
    } finally {
      // Clear status and running state after 2 seconds
      setTimeout(() => {
        setFocusAreaStatus(prev => ({ ...prev, [focusAreaName]: '' }));
        setRunningFocusAreas(prev => ({ ...prev, [focusAreaName]: false }));
      }, 2000);
    }
  };

  const runAudit = async () => {
    if (!businessId) {
      alert('No business ID found. Please make sure you are viewing a specific business.');
      return;
    }
    
    setIsRunningAudit(true);
    setAuditStatus('Running audit...');
    
    try {
      // Create empty scorecards if they don't exist
      const result = await preloadScorecardData(businessId);
      
      if (result.success) {
        setAuditStatus(`Success! Created ${result.count} empty scorecards.`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
      // Refresh the buckets data after a short delay
      setTimeout(async () => {
        try {
          // Load fresh data
          await loadData();
          setAuditStatus('');
          setIsRunningAudit(false);
        } catch (error) {
          console.error('Error refreshing data after audit:', error);
          setAuditStatus('Error refreshing data after audit.');
          setTimeout(() => {
            setAuditStatus('');
            setIsRunningAudit(false);
          }, 2000);
        }
      }, 1000);
    } catch (error) {
      console.error('Error running audit:', error);
      setAuditStatus('Error: Something went wrong.');
      setTimeout(() => {
        setAuditStatus('');
        setIsRunningAudit(false);
      }, 2000);
    }
  };

  const handleDeleteHighlight = async (bucketName: string, highlightId: string) => {
    if (!businessId) return;
    
    setIsSaving(true);
    console.log(`STARTING DELETE HIGHLIGHT: businessId=${businessId}, category=${bucketName}, highlightId=${highlightId}`);
    
    try {
      console.log(`BEFORE DELETE API CALL: category=${bucketName}, highlightId=${highlightId}`);
      
      // Call the direct server action
      const result = await deleteScorecardHighlight(
        businessId,
        bucketName,
        highlightId
      );
      
      console.log('AFTER DELETE API CALL - Result:', result);
      
      if (result.success) {
        // Update the UI by removing the highlight
        setBuckets(prevBuckets => {
          return prevBuckets.map(bucket => {
            if (bucket.name === bucketName) {
              return {
                ...bucket,
                data: {
                  ...bucket.data,
                  highlights: bucket.data.highlights.filter(h => h.id !== highlightId)
                }
              };
            }
            return bucket;
          });
        });
      } else {
        console.error('Error deleting highlight:', result.error);
        alert(`Failed to delete highlight: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
      
      // Fallback to optimistic UI update without waiting for server
      setBuckets(prevBuckets => {
        return prevBuckets.map(bucket => {
          if (bucket.name === bucketName) {
            return {
              ...bucket,
              data: {
                ...bucket.data,
                highlights: bucket.data.highlights.filter(h => h.id !== highlightId)
              }
            };
          }
          return bucket;
        });
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!businessId) return;
    
    try {
      if (isPublished) {
        await unpublishScorecard(businessId);
      } else {
        await publishScorecard(businessId);
      }
      setIsPublished(!isPublished);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update publish status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Digital Performance Scorecard</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm">
            <span className="mr-2 font-medium">Publish</span>
            <button 
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isPublished ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={handlePublishToggle}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={runAudit}
            disabled={isRunningAudit}
          >
            {isRunningAudit ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {auditStatus || 'Running...'}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" />
                {auditStatus || 'Run Full Audit'}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {buckets.map((bucket) => {
          // Check if this focus area has been audited yet
          const hasBeenAudited = bucket.data.highlights.length > 0 || bucket.data.score > 0;
          
          return (
            <div 
              key={bucket.name} 
              className="rounded-lg border border-gray-200 overflow-hidden bg-white"
              style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' }}
            >
              <div className="px-5 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <h2 className="text-xl font-semibold">{bucket.name}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant={hasBeenAudited ? "outline" : "primary"}
                      size="sm"
                      onClick={() => runFocusAreaAudit(bucket.name)}
                      disabled={runningFocusAreas[bucket.name]}
                    >
                      {runningFocusAreas[bucket.name] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          {focusAreaStatus[bucket.name] || 'Running...'}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-1" />
                          Run Audit
                        </>
                      )}
                    </Button>
                    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                      <button 
                        className="p-1 hover:bg-gray-100 border-r border-gray-200"
                        onClick={() => decreaseScore(bucket.name)}
                      >
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </button>
                      <input
                        type="number"
                        value={bucket.data.score}
                        onChange={(e) => handleScoreChange(bucket.name, parseInt(e.target.value, 10) || 0)}
                        onBlur={() => handleScoreChangeComplete(bucket.name)}
                        min="0"
                        max={bucket.data.maxScore}
                        className="w-12 text-center py-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button 
                        className="p-1 hover:bg-gray-100 border-l border-gray-200"
                        onClick={() => increaseScore(bucket.name)}
                      >
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">/ {bucket.data.maxScore}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-white">
                <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                  <div 
                    className="h-full rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${(bucket.data.score / bucket.data.maxScore) * 100}%`,
                      backgroundColor: bucket.color 
                    }}
                  ></div>
                </div>
                
                {!hasBeenAudited ? (
                  <div className={`p-8 ${bucket.bgColor} rounded-md border ${bucket.borderColor} text-center`}>
                    <h3 className="text-lg font-medium mb-2">No data for {bucket.name} yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Run an audit to automatically generate performance metrics and highlights based on our analysis.
                    </p>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => runFocusAreaAudit(bucket.name)}
                      disabled={runningFocusAreas[bucket.name]}
                    >
                      {runningFocusAreas[bucket.name] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-1" />
                          Run {bucket.name} Audit
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Highlights</h3>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsAddingHighlight(bucket.name)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    {isAddingHighlight === bucket.name && (
                      <div className={`mb-4 p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor}`}>
                        <textarea 
                          value={newHighlight.text}
                          onChange={(e) => setNewHighlight({...newHighlight, text: e.target.value})}
                          placeholder="Enter highlight..."
                          className="w-full p-2 mb-2 bg-white border border-gray-200 rounded"
                          rows={2}
                        />
                        <div className="flex items-center justify-between">
                          <select 
                            value={newHighlight.serviceArea}
                            onChange={(e) => setNewHighlight({...newHighlight, serviceArea: e.target.value})}
                            className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none"
                            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                          >
                            {bucket.serviceAreas.map(area => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                          <div className="space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setNewHighlight({ text: '', serviceArea: 'Other' });
                                setIsAddingHighlight(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleAddHighlight(bucket.name)}
                              disabled={!newHighlight.text || !newHighlight.serviceArea}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {bucket.data.highlights.length > 0 ? (
                      <div className="space-y-2">
                        {bucket.data.highlights.map((highlight) => (
                          <div 
                            key={highlight.id} 
                            className={`p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor} relative group`}
                          >
                            <button
                              onClick={() => handleDeleteHighlight(bucket.name, highlight.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                            </button>
                            <div className="flex flex-col">
                              <span className="text-sm">{highlight.text}</span>
                              <div className="flex items-center mt-1">
                                <span className={`text-xs ${bucket.textColor} font-medium`}>{highlight.serviceArea}</span>
                                {highlight.aiGenerated && (
                                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">AI</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-md">
                        <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
                        <p className="text-sm mb-2">No highlights added yet</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsAddingHighlight(bucket.name)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add a highlight
                        </Button>
                      </div>
                    )}
                    
                    {/* Metrics section */}
                    {bucket.data.metricSignals && bucket.data.metricSignals.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">Performance Metrics</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {bucket.data.metricSignals.map((metric) => (
                            <div 
                              key={metric.id}
                              className={`p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">{metric.name}</span>
                                {metric.trend && (
                                  <span className={`
                                    px-1.5 py-0.5 rounded-full text-xs
                                    ${metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                                      metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                                      'bg-gray-100 text-gray-800'}
                                  `}>
                                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                                  </span>
                                )}
                              </div>
                              <div className="text-lg font-semibold mt-1">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}