'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, BarChart2, AlertCircle, Zap, ChevronUp, ChevronDown, X } from 'lucide-react';
import Button from '../packages/ui/src/components/Button';
import Toggle from './shared/Toggle';
import { publishScorecard, unpublishScorecard, getScorecardPublishStatus } from '@/app/actions/scorecard';
import { useSearchParams } from 'next/navigation';

interface Highlight {
  id: string;
  text: string;
  serviceArea: string;
  relatedMetricId?: string; // Optional reference to a metric signal
}

interface MetricSignal {
  id: string;
  name: string;
  value: string;
}

interface ScoreData {
  score: number;
  maxScore: number;
  highlights: Highlight[];
  metricSignals: MetricSignal[];
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

export default function Scorecard() {
  const [isAddingHighlight, setIsAddingHighlight] = useState<string | null>(null);
  const [newHighlight, setNewHighlight] = useState({ 
    text: '', 
    serviceArea: 'Other',
    relatedMetricId: '' 
  });
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  const [buckets, setBuckets] = useState<BucketData[]>([
    {
      name: 'Foundation',
      color: '#FFDC00', // Refined yellow
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverColor: 'hover:bg-yellow-100',
      textColor: 'text-yellow-800',
      serviceAreas: ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
      data: {
        score: 75,
        maxScore: 100,
        highlights: [
          { id: '1', text: 'Brand messaging inconsistent across digital touchpoints', serviceArea: 'Brand/GTM Strategy' },
          { id: '2', text: 'Marketing automation tools severely underutilized', serviceArea: 'Martech' },
          { id: '9', text: 'Analytics implementation lacks cross-channel customer journey tracking', serviceArea: 'Data & Analytics' }
        ],
        metricSignals: [
          { id: 'm1', name: 'Brand Consistency', value: '65%' },
          { id: 'm2', name: 'Automation Utilization', value: '32%' },
          { id: 'm3', name: 'Analytics Coverage', value: '48%' }
        ]
      }
    },
    {
      name: 'Acquisition',
      color: '#2ECC40', // Refined green
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-green-800',
      serviceAreas: ['Performance Media', 'Campaigns', 'Earned Media'],
      data: {
        score: 82,
        maxScore: 100,
        highlights: [
          { id: '3', text: 'Google Ads quality scores below industry average', serviceArea: 'Performance Media' },
          { id: '4', text: 'Campaign attribution lacking for multi-touch journeys', serviceArea: 'Campaigns' },
          { id: '10', text: 'PR and earned media strategy not aligned with overall marketing goals', serviceArea: 'Earned Media' }
        ],
        metricSignals: [
          { id: 'm4', name: 'Ad Quality Score', value: '5.2/10' },
          { id: 'm5', name: 'Attribution Accuracy', value: '61%' },
          { id: 'm6', name: 'Media Alignment', value: '43%' }
        ]
      }
    },
    {
      name: 'Conversion',
      color: '#0074D9', // Refined blue
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-800',
      serviceAreas: ['Website', 'Ecommerce Platforms', 'Digital Product'],
      data: {
        score: 65,
        maxScore: 100,
        highlights: [
          { id: '5', text: 'Mobile page load speed exceeding 4 seconds on product pages', serviceArea: 'Website' },
          { id: '6', text: 'Cart abandonment rate 15% above industry average', serviceArea: 'Ecommerce Platforms' },
          { id: '11', text: 'Product recommendation algorithm performing below benchmark standards', serviceArea: 'Digital Product' }
        ],
        metricSignals: [
          { id: 'm7', name: 'Page Load Speed', value: '4.3s' },
          { id: 'm8', name: 'Cart Abandonment', value: '72%' },
          { id: 'm9', name: 'Recommendation CTR', value: '2.1%' }
        ]
      }
    },
    {
      name: 'Retention',
      color: '#FF851B', // Refined orange
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      textColor: 'text-orange-800',
      serviceAreas: ['CRM', 'App', 'Organic Social'],
      data: {
        score: 70,
        maxScore: 100,
        highlights: [
          { id: '7', text: 'Email list declining 5% month-over-month due to unsubscribes', serviceArea: 'CRM' },
          { id: '8', text: 'Social content calendar inconsistently maintained', serviceArea: 'Organic Social' },
          { id: '12', text: 'Mobile app retention rate drops 40% after first week of installation', serviceArea: 'App' }
        ],
        metricSignals: [
          { id: 'm10', name: 'Email List Growth', value: '-5%' },
          { id: 'm11', name: 'Content Consistency', value: '37%' },
          { id: 'm12', name: 'App Retention', value: '60%' }
        ]
      }
    }
  ]);

  // Load initial publish status
  useEffect(() => {
    const loadPublishStatus = async () => {
      if (!businessId) return;
      
      try {
        console.log('[DEBUG] Loading initial scorecard publish status');
        const result = await getScorecardPublishStatus(businessId);
        console.log('[DEBUG] Initial scorecard status result:', result);
        
        if (result.success) {
          setIsPublished(result.isPublished);
        }
      } catch (error) {
        console.error('[DEBUG] Failed to load scorecard publish status:', error);
      }
    };

    loadPublishStatus();
  }, [businessId]);

  const handleAddHighlight = (bucketName: string) => {
    if (!newHighlight.text || !newHighlight.serviceArea) return;
    
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              highlights: [
                ...bucket.data.highlights,
                { 
                  id: Date.now().toString(), 
                  text: newHighlight.text, 
                  serviceArea: newHighlight.serviceArea,
                  relatedMetricId: newHighlight.relatedMetricId || undefined
                }
              ]
            }
          };
        }
        return bucket;
      })
    );
    
    setNewHighlight({ text: '', serviceArea: 'Other', relatedMetricId: '' });
    setIsAddingHighlight(null);
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

  const increaseScore = (bucketName: string) => {
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket && bucket.data.score < bucket.data.maxScore) {
      handleScoreChange(bucketName, bucket.data.score + 1);
    }
  };

  const decreaseScore = (bucketName: string) => {
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket && bucket.data.score > 0) {
      handleScoreChange(bucketName, bucket.data.score - 1);
    }
  };

  const runAudit = (bucketName: string) => {
    console.log(`Running AI audit for ${bucketName}`);
    
    // This would be where we call the AI service to generate highlights and metrics
    // For now, we'll simulate by adding some random metrics
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket) return;
    
    // Sample metric signals based on bucket name
    const newMetricSignals: MetricSignal[] = [];
    
    if (bucketName === 'Foundation') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'Brand Consistency', value: `${Math.floor(Math.random() * 40 + 30)}%` },
        { id: `m${Date.now()}-2`, name: 'Tech Stack Coverage', value: `${Math.floor(Math.random() * 50 + 40)}%` }
      );
    } else if (bucketName === 'Acquisition') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'CPC', value: `$${(Math.random() * 5 + 1).toFixed(2)}` },
        { id: `m${Date.now()}-2`, name: 'CAC', value: `$${Math.floor(Math.random() * 100 + 50)}` }
      );
    } else if (bucketName === 'Conversion') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'Conversion Rate', value: `${(Math.random() * 5 + 1).toFixed(1)}%` },
        { id: `m${Date.now()}-2`, name: 'Bounce Rate', value: `${Math.floor(Math.random() * 30 + 40)}%` }
      );
    } else if (bucketName === 'Retention') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'Churn Rate', value: `${(Math.random() * 5 + 1).toFixed(1)}%` },
        { id: `m${Date.now()}-2`, name: 'LTV', value: `$${Math.floor(Math.random() * 500 + 200)}` }
      );
    }
    
    // Update the bucket with new metrics
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              metricSignals: [
                ...bucket.data.metricSignals,
                ...newMetricSignals
              ]
            }
          };
        }
        return bucket;
      })
    );
    
    alert(`AI audit for ${bucketName} completed. Added ${newMetricSignals.length} new metrics.`);
  };

  const handleDeleteHighlight = (bucketName: string, highlightId: string) => {
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
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
      })
    );
  };

  const handlePublishToggle = async () => {
    if (!businessId) {
      console.error('[DEBUG] No business ID available for publish toggle');
      return;
    }

    console.log('[DEBUG] Scorecard publish toggle clicked:', { isPublished, businessId });
    setIsPublishing(true);
    
    try {
      const result = isPublished 
        ? await unpublishScorecard(businessId)
        : await publishScorecard(businessId);
      
      console.log('[DEBUG] Scorecard publish toggle result:', result);
      
      if (result.success) {
        setIsPublished(!isPublished);
        console.log('[DEBUG] Scorecard publish state updated:', { newState: !isPublished });
      } else {
        console.error('[DEBUG] Failed to toggle scorecard publish state:', result.error);
      }
    } catch (error) {
      console.error('[DEBUG] Error toggling scorecard publish state:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Digital Performance Scorecard</h1>
        <div className="flex items-center gap-3">
          <Toggle
            isEnabled={isPublished}
            onToggle={handlePublishToggle}
            isLoading={isPublishing}
          />
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-1" />
            Run Full Audit
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {buckets.map((bucket) => (
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
                <div className="flex items-center">
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
                  <span className="ml-1 text-sm text-gray-500">/ {bucket.data.maxScore}</span>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => runAudit(bucket.name)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Run Audit
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
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Service Area:</label>
                        <select 
                          value={newHighlight.serviceArea}
                          onChange={(e) => setNewHighlight({...newHighlight, serviceArea: e.target.value})}
                          className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none flex-grow"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                        >
                          {bucket.serviceAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Related Metric:</label>
                        <select 
                          value={newHighlight.relatedMetricId}
                          onChange={(e) => setNewHighlight({...newHighlight, relatedMetricId: e.target.value})}
                          className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none flex-grow"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                        >
                          <option value="">None</option>
                          {bucket.data.metricSignals.map(signal => (
                            <option key={signal.id} value={signal.id}>{signal.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewHighlight({ text: '', serviceArea: 'Other', relatedMetricId: '' });
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
                          <X className={`h-4 w-4 ${bucket.textColor}`} />
                        </button>
                        <div className="flex items-start">
                          <AlertCircle className={`flex-shrink-0 h-5 w-5 mr-2 mt-0.5 ${bucket.textColor}`} />
                          <div>
                            <p className="text-sm">{highlight.text}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`text-xs font-medium ${bucket.textColor} inline-block`}>
                                {highlight.serviceArea}
                              </span>
                              {highlight.relatedMetricId && (
                                <span className="bg-[#f9f9f9] border border-[#e9e9e9] text-[#555555] px-2 py-0.5 rounded-full inline-flex items-center font-mono text-xs">
                                  {bucket.data.metricSignals.find(m => m.id === highlight.relatedMetricId)?.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <BarChart2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No issues identified yet. Add one or run an audit to assess performance.</p>
                  </div>
                )}
                
                {/* Metric Signals Section */}
                {bucket.data.metricSignals.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Metric Signals</h3>
                    <div className="flex flex-wrap gap-2">
                      {bucket.data.metricSignals.map((signal) => (
                        <div
                          key={signal.id}
                          className="px-3 py-1 rounded-full bg-[#f9f9f9] border border-[#e9e9e9] text-[#555555] flex items-center font-mono"
                        >
                          <span className="font-medium text-xs">{signal.name}:</span>
                          <span className="ml-1 text-xs text-black font-bold">{signal.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 