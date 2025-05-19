'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Lightbulb, Sparkles, X, AlertTriangle, Award, Loader2, Pencil } from 'lucide-react';
import Button from '../../../../packages/ui/src/components/Button';
import Toggle from '../../../../components/shared/Toggle';
import { useSearchParams } from 'next/navigation';
import { publishOpportunities, unpublishOpportunities, getOpportunitiesPublishStatus, getBusinessOpportunities, createOpportunity, deleteOpportunity, generateOpportunitiesWithAI, updateOpportunityStatus, updateOpportunity } from '@/app/actions/opportunity';
import { getBusinessGoalsAction, getBusinessKPIsAction } from '@/app/actions/serverActions';
import { OpportunityStatus } from '@prisma/client';

// Define the sparkle gradient icon as a custom component
const SparkleGradientIcon = ({className}: {className?: string}) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="url(#sparkleGradient)" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
        <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
      </linearGradient>
    </defs>
    <path d="M12 3v18M3 12h18M5.63 5.63l12.73 12.73M18.37 5.63L5.63 18.36" />
  </svg>
);

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
  _renderKey?: string;
}

interface BucketData {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  serviceAreas: string[];
  opportunities: Opportunity[];
}

export default function OpportunitiesPage() {
  const [isAddingOpportunity, setIsAddingOpportunity] = useState<string | null>(null);
  const [isEditingOpportunity, setIsEditingOpportunity] = useState<string | null>(null);
  const [newOpportunity, setNewOpportunity] = useState({ title: '', description: '', serviceArea: 'Other', targetKPI: '' });
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  const [goals, setGoals] = useState<string[]>([]);
  const [rawOpportunities, setRawOpportunities] = useState<Opportunity[]>([]);
  
  // Define bucket templates but don't initialize them yet
  const bucketTemplates = [
    {
      name: 'Foundation',
      color: '#FFDC00', // Refined yellow
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      serviceAreas: ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
      opportunities: []
    },
    {
      name: 'Acquisition',
      color: '#2ECC40', // Refined green
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      serviceAreas: ['Performance Media', 'Campaigns', 'Earned Media'],
      opportunities: []
    },
    {
      name: 'Conversion',
      color: '#0074D9', // Refined blue
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      serviceAreas: ['Website', 'Ecommerce Platforms', 'Digital Product'],
      opportunities: []
    },
    {
      name: 'Retention',
      color: '#FF851B', // Refined orange
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      serviceAreas: ['CRM', 'App', 'Organic Social'],
      opportunities: []
    }
  ];
  
  const [buckets, setBuckets] = useState<BucketData[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!businessId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true); // Ensure loading is true at the start
      
      try {
        // Load publish status
        const statusResult = await getOpportunitiesPublishStatus(businessId);
        if (statusResult.success) {
          setIsPublished(statusResult.isPublished ?? false);
        }
        
        // Load goals and KPIs
        const [goalsResult, kpisResult] = await Promise.all([
          getBusinessGoalsAction(businessId),
          getBusinessKPIsAction(businessId)
        ]);
        
        const goalsList = [
          ...(goalsResult.success ? goalsResult.goals.map(g => g.name) : []),
          ...(kpisResult.success ? kpisResult.kpis.map(k => k.name) : [])
        ];
        setGoals(goalsList);
        
        // Load opportunities
        const opportunitiesResult = await getBusinessOpportunities(businessId);
        if (opportunitiesResult.success) {
          const opportunities = opportunitiesResult.opportunities || [];
          setRawOpportunities(opportunities);
          
          // Initialize buckets with loaded opportunities
          const initializedBuckets = [...bucketTemplates];
          
          // Track processed IDs to prevent duplicates and create ID map for rendering
          const processedIds = new Set<string>();
          const opportunitiesByCategory: Record<string, Opportunity[]> = {};
          
          // First, organize opportunities by category and add unique render keys
          opportunities.forEach(opportunity => {
            // Skip if we've already processed this ID
            if (!opportunity.id || processedIds.has(opportunity.id)) return;
            
            const category = opportunity.category;
            if (!opportunitiesByCategory[category]) {
              opportunitiesByCategory[category] = [];
            }
            
            // Add a unique rendering ID
            const opportunityWithKey = {
              ...opportunity,
              _renderKey: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            };
            
            opportunitiesByCategory[category].push(opportunityWithKey);
            processedIds.add(opportunity.id);
          });
          
          // Then distribute to buckets
          Object.keys(opportunitiesByCategory).forEach(category => {
            const bucketIndex = initializedBuckets.findIndex(b => b.name === category);
            if (bucketIndex !== -1) {
              initializedBuckets[bucketIndex].opportunities = opportunitiesByCategory[category];
            }
          });
          
          setBuckets(initializedBuckets);
          
          // Wait for state updates to complete before setting loading to false
          setTimeout(() => {
            setIsLoading(false);
          }, 100);
        } else {
          // Initialize empty buckets if we couldn't load opportunities
          setBuckets([...bucketTemplates]);
          setError('Failed to load opportunities');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setBuckets([...bucketTemplates]);
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };

    loadData();
  }, [businessId]);
  
  // Distribute opportunities to appropriate buckets
  useEffect(() => {
    if (rawOpportunities.length === 0 || buckets.length === 0) return;
    
    // Skip the first load since we handle that in the loadData function
    if (isLoading) return;
    
    // Create a copy of buckets to update
    const updatedBuckets = [...buckets];
    
    // Clear existing opportunities
    updatedBuckets.forEach(bucket => {
      bucket.opportunities = [];
    });
    
    // Track processed IDs to prevent duplicates and create ID map to ensure unique keys
    const processedIds = new Set<string>();
    const opportunitiesByCategory: Record<string, Opportunity[]> = {};
    
    // First, organize opportunities by category
    rawOpportunities.forEach(opportunity => {
      // Skip if we've already processed this ID
      if (!opportunity.id || processedIds.has(opportunity.id)) return;
      
      const category = opportunity.category;
      if (!opportunitiesByCategory[category]) {
        opportunitiesByCategory[category] = [];
      }
      
      // Add a unique rendering ID if needed
      const opportunityWithKey = {
        ...opportunity,
        _renderKey: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      opportunitiesByCategory[category].push(opportunityWithKey);
      processedIds.add(opportunity.id);
    });
    
    // Then distribute to buckets
    Object.keys(opportunitiesByCategory).forEach(category => {
      const bucketIndex = updatedBuckets.findIndex(b => b.name === category);
      if (bucketIndex !== -1) {
        updatedBuckets[bucketIndex].opportunities = opportunitiesByCategory[category];
      }
    });
    
    setBuckets(updatedBuckets);
  }, [rawOpportunities, isLoading]);

  const handleAddOpportunity = async (bucketName: string) => {
    if (!businessId || !newOpportunity.title || !newOpportunity.serviceArea) return;
    
    try {
      const result = await createOpportunity(businessId, {
        title: newOpportunity.title,
        description: newOpportunity.description || undefined,
        category: bucketName,
        serviceArea: newOpportunity.serviceArea,
        targetKPI: newOpportunity.targetKPI || undefined
      });
      
      if (result.success) {
        // Update raw opportunities, which will in turn update buckets
        setRawOpportunities(prev => [result.opportunity, ...prev]);
        setNewOpportunity({ title: '', description: '', serviceArea: 'Other', targetKPI: '' });
      } else {
        setError('Failed to add opportunity');
      }
    } catch (error) {
      console.error('Error adding opportunity:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsAddingOpportunity(null);
    }
  };

  const handleGenerateOpportunities = async (bucketName: string) => {
    if (!businessId) return;
    
    setIsGenerating(bucketName);
    
    try {
      const result = await generateOpportunitiesWithAI(businessId, bucketName);
      
      if (result.success) {
        // Refresh opportunities after generation
        const opportunitiesResult = await getBusinessOpportunities(businessId);
        if (opportunitiesResult.success) {
          setRawOpportunities(opportunitiesResult.opportunities);
        }
      } else {
        setError('Failed to generate opportunities');
      }
    } catch (error) {
      console.error('Error generating opportunities:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    try {
      const result = await deleteOpportunity(opportunityId);
      
      if (result.success) {
        // Update raw opportunities
        setRawOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      } else {
        setError('Failed to delete opportunity');
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      setError('An unexpected error occurred');
    }
  };

  const handlePublishToggle = async () => {
    if (!businessId) {
      setError('No business ID available');
      return;
    }

    setIsPublishing(true);
    
    try {
      const result = isPublished 
        ? await unpublishOpportunities(businessId)
        : await publishOpportunities(businessId);
      
      if (result.success) {
        setIsPublished(!isPublished);
      } else {
        setError('Failed to update publish status');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!businessId) return;
    
    // Generate opportunities for each bucket in sequence
    setIsGenerating('all');
    
    try {
      for (const bucket of buckets) {
        await generateOpportunitiesWithAI(businessId, bucket.name);
      }
      
      // Refresh opportunities after generation
      const opportunitiesResult = await getBusinessOpportunities(businessId);
      if (opportunitiesResult.success) {
        setRawOpportunities(opportunitiesResult.opportunities);
      }
    } catch (error) {
      console.error('Error generating all opportunities:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleUpdateOpportunity = async (opportunityId: string, bucketName: string) => {
    if (!businessId || !editingOpportunity || !editingOpportunity.title || !editingOpportunity.serviceArea) return;
    
    try {
      const result = await updateOpportunity(opportunityId, {
        title: editingOpportunity.title,
        description: editingOpportunity.description || undefined,
        category: bucketName,
        serviceArea: editingOpportunity.serviceArea,
        targetKPI: editingOpportunity.targetKPI || undefined
      });
      
      if (result.success && result.opportunity) {
        // Update raw opportunities
        setRawOpportunities(prev => 
          prev.map(o => o.id === opportunityId ? result.opportunity : o)
        );
      } else {
        setError('Failed to update opportunity');
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsEditingOpportunity(null);
      setEditingOpportunity(null);
    }
  };

  const startEditingOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity({...opportunity});
    setIsEditingOpportunity(opportunity.id);
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
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center text-red-700 mb-4">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
          <button 
            className="ml-auto text-red-500 hover:text-red-700" 
            onClick={() => setError(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Opportunities</h1>
        <div className="flex items-center gap-3">
          <Toggle
            isEnabled={isPublished}
            onToggle={handlePublishToggle}
            isLoading={isPublishing}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGenerating !== null}
          >
            <SparkleGradientIcon className="h-4 w-4 mr-1" />
            Generate All
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
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddingOpportunity(bucket.name)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateOpportunities(bucket.name)}
                    disabled={isGenerating !== null}
                  >
                    <SparkleGradientIcon className="h-4 w-4 mr-1" />
                    {isGenerating === bucket.name ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {isAddingOpportunity === bucket.name && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opportunity Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter opportunity title"
                      value={newOpportunity.title}
                      onChange={(e) => setNewOpportunity({...newOpportunity, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter description"
                      rows={2}
                      value={newOpportunity.description}
                      onChange={(e) => setNewOpportunity({...newOpportunity, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Area
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newOpportunity.serviceArea}
                        onChange={(e) => setNewOpportunity({...newOpportunity, serviceArea: e.target.value})}
                      >
                        {bucket.serviceAreas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal/KPI (Optional)
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newOpportunity.targetKPI}
                        onChange={(e) => setNewOpportunity({...newOpportunity, targetKPI: e.target.value})}
                      >
                        <option value="">Select a goal/KPI</option>
                        {goals.map(goal => (
                          <option key={goal} value={goal}>{goal}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddingOpportunity(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleAddOpportunity(bucket.name)}
                      disabled={!newOpportunity.title}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {bucket.opportunities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                  <p>No opportunities yet</p>
                  <p className="text-sm mt-1">Add manually or generate with AI</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bucket.opportunities.map((opportunity) => (
                    <div 
                      key={opportunity._renderKey || `${bucket.name}-${opportunity.id}-${Math.random()}`} 
                      className={`p-4 rounded-lg ${bucket.bgColor} ${bucket.borderColor} border group`}
                    >
                      {isEditingOpportunity === opportunity.id ? (
                        // Inline edit form
                        <div className="space-y-3 bg-white p-3 rounded-md shadow-sm">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Opportunity Title
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                              placeholder="Enter opportunity title"
                              value={editingOpportunity?.title || ''}
                              onChange={(e) => setEditingOpportunity({...editingOpportunity!, title: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (Optional)
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                              placeholder="Enter description"
                              rows={2}
                              value={editingOpportunity?.description || ''}
                              onChange={(e) => setEditingOpportunity({...editingOpportunity!, description: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Area
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                value={editingOpportunity?.serviceArea || ''}
                                onChange={(e) => setEditingOpportunity({...editingOpportunity!, serviceArea: e.target.value})}
                              >
                                {bucket.serviceAreas.map(area => (
                                  <option key={area} value={area}>{area}</option>
                                ))}
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Goal/KPI (Optional)
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                value={editingOpportunity?.targetKPI || ''}
                                onChange={(e) => setEditingOpportunity({...editingOpportunity!, targetKPI: e.target.value})}
                              >
                                <option value="">Select a goal/KPI</option>
                                {goals.map(goal => (
                                  <option key={goal} value={goal}>{goal}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setIsEditingOpportunity(null);
                                setEditingOpportunity(null);
                              }}
                              className="bg-white"
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleUpdateOpportunity(opportunity.id, bucket.name)}
                              disabled={!editingOpportunity?.title}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Regular opportunity view
                        <div className="flex">
                          <div className="mr-3 mt-0.5">
                            <Lightbulb className="h-5 w-5" style={{ color: bucket.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{opportunity.title}</h3>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                  onClick={() => startEditingOpportunity(opportunity)}
                                  title="Edit opportunity"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                  onClick={() => handleDeleteOpportunity(opportunity.id)}
                                  title="Delete opportunity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {opportunity.description && (
                              <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200">
                                {opportunity.serviceArea}
                              </span>
                              <div className="flex items-center gap-2">
                                {opportunity.targetKPI && (
                                  <span className={`text-xs ${bucket.textColor}`}>
                                    {opportunity.targetKPI}
                                  </span>
                                )}
                                <select
                                  className="text-xs px-2 py-1 pr-6 rounded-full bg-white border border-gray-200 cursor-pointer appearance-none"
                                  style={{ 
                                    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                                    backgroundPosition: "right 0.5rem center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "0.8em 0.8em"
                                  }}
                                  value={opportunity.status}
                                  onChange={async (e) => {
                                    const result = await updateOpportunityStatus(
                                      opportunity.id, 
                                      e.target.value as OpportunityStatus
                                    );
                                    if (result.success && result.opportunity) {
                                      setRawOpportunities(prev => 
                                        prev.map(o => o.id === opportunity.id 
                                          ? {...o, status: result.opportunity.status} 
                                          : o
                                        )
                                      );
                                    } else {
                                      setError('Failed to update status');
                                    }
                                  }}
                                >
                                  <option value="OPEN">Open</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CLOSED">Closed</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 