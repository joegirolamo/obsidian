'use client';

import { useState } from 'react';
import { PlusCircle, Lightbulb, Sparkles, X } from 'lucide-react';
import Button from '@/components/shared/Button';

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
  text: string;
  serviceArea: string;
  goalTag?: string; // Optional goal or KPI tag
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
  const [newOpportunity, setNewOpportunity] = useState({ text: '', serviceArea: 'Other', goalTag: '' });
  const [isPublished, setIsPublished] = useState(false);
  const [goals, setGoals] = useState([
    'Increase Revenue by 20%',
    'Reduce Customer Acquisition Cost',
    'Improve Conversion Rate',
    'Expand Market Share',
    'Enhance Customer Retention'
  ]);
  const [buckets, setBuckets] = useState<BucketData[]>([
    {
      name: 'Foundation',
      color: '#FFDC00', // Refined yellow
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      serviceAreas: ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
      opportunities: [
        { id: '1', text: 'Develop omnichannel brand guidelines to ensure consistent messaging', serviceArea: 'Brand/GTM Strategy', goalTag: 'Expand Market Share' },
        { id: '2', text: 'Implement marketing automation workflow for lead nurturing', serviceArea: 'Martech', goalTag: 'Improve Conversion Rate' },
        { id: '9', text: 'Create centralized data warehouse to unify marketing analytics', serviceArea: 'Data & Analytics', goalTag: 'Improve Conversion Rate' }
      ]
    },
    {
      name: 'Acquisition',
      color: '#2ECC40', // Refined green
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      serviceAreas: ['Performance Media', 'Campaigns', 'Earned Media'],
      opportunities: [
        { id: '3', text: 'Optimize PPC campaigns to reduce cost per acquisition', serviceArea: 'Performance Media', goalTag: 'Reduce Customer Acquisition Cost' },
        { id: '4', text: 'Develop integrated campaign strategy for Q4 product launch', serviceArea: 'Campaigns', goalTag: 'Increase Revenue by 20%' },
        { id: '11', text: 'Establish influencer marketing program with performance tracking', serviceArea: 'Earned Media', goalTag: 'Expand Market Share' }
      ]
    },
    {
      name: 'Conversion',
      color: '#0074D9', // Refined blue
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      serviceAreas: ['Website', 'Ecommerce Platforms', 'Digital Product'],
      opportunities: [
        { id: '5', text: 'Implement A/B testing on key landing pages to increase conversion', serviceArea: 'Website', goalTag: 'Improve Conversion Rate' },
        { id: '6', text: 'Optimize checkout process to reduce abandonment', serviceArea: 'Ecommerce Platforms', goalTag: 'Increase Revenue by 20%' },
        { id: '13', text: 'Create personalized product recommendation engine for e-commerce', serviceArea: 'Digital Product', goalTag: 'Increase Revenue by 20%' }
      ]
    },
    {
      name: 'Retention',
      color: '#FF851B', // Refined orange
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      serviceAreas: ['CRM', 'App', 'Organic Social'],
      opportunities: [
        { id: '7', text: 'Develop personalized email series based on customer behavior', serviceArea: 'CRM', goalTag: 'Enhance Customer Retention' },
        { id: '8', text: 'Create loyalty program to increase repeat purchases', serviceArea: 'App', goalTag: 'Enhance Customer Retention' },
        { id: '16', text: 'Establish social media content calendar focused on community building', serviceArea: 'Organic Social', goalTag: 'Expand Market Share' }
      ]
    }
  ]);

  const handleAddOpportunity = (bucketName: string) => {
    if (!newOpportunity.text || !newOpportunity.serviceArea) return;
    
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            opportunities: [
              ...bucket.opportunities,
              { 
                id: Date.now().toString(), 
                text: newOpportunity.text, 
                serviceArea: newOpportunity.serviceArea,
                goalTag: newOpportunity.goalTag || undefined
              }
            ]
          };
        }
        return bucket;
      })
    );
    
    setNewOpportunity({ text: '', serviceArea: 'Other', goalTag: '' });
    setIsAddingOpportunity(null);
  };

  const generateOpportunities = (bucketName: string) => {
    console.log(`Generating AI opportunities for ${bucketName}`);
    // This would be where we call the AI service to generate opportunities
    alert(`AI generation for ${bucketName} would run here`);
  };

  const handleDeleteOpportunity = (bucketName: string, opportunityId: string) => {
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            opportunities: bucket.opportunities.filter(opp => opp.id !== opportunityId)
          };
        }
        return bucket;
      })
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Opportunities</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm">
            <span className="mr-2 font-medium">Publish</span>
            <button 
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isPublished ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={() => setIsPublished(!isPublished)}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <Button variant="outline" size="sm">
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
                    onClick={() => generateOpportunities(bucket.name)}
                  >
                    <SparkleGradientIcon className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-white">
              <div className="px-5 py-5">
                
                {isAddingOpportunity === bucket.name && (
                  <div className={`mb-3 p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor}`}>
                    <textarea 
                      value={newOpportunity.text}
                      onChange={(e) => setNewOpportunity({...newOpportunity, text: e.target.value})}
                      placeholder="Enter opportunity..."
                      className="w-full p-2 mb-2 bg-white border border-gray-200 rounded"
                      rows={2}
                    />
                    <div className="flex flex-col space-y-2 mb-2">
                      <div className="flex items-center justify-between">
                        <select 
                          value={newOpportunity.serviceArea}
                          onChange={(e) => setNewOpportunity({...newOpportunity, serviceArea: e.target.value})}
                          className="w-full p-2 pr-8 bg-white border border-gray-200 rounded appearance-none"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                        >
                          {bucket.serviceAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <select 
                          value={newOpportunity.goalTag}
                          onChange={(e) => setNewOpportunity({...newOpportunity, goalTag: e.target.value})}
                          className="w-full p-2 pr-8 bg-white border border-gray-200 rounded appearance-none"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                        >
                          <option value="">Select a goal or KPI (optional)</option>
                          {goals.map(goal => (
                            <option key={goal} value={goal}>{goal}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewOpportunity({ text: '', serviceArea: 'Other', goalTag: '' });
                          setIsAddingOpportunity(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleAddOpportunity(bucket.name)}
                        disabled={!newOpportunity.text || !newOpportunity.serviceArea}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
                
                {bucket.opportunities.length > 0 ? (
                  <div className="space-y-2">
                    {bucket.opportunities.map((opportunity) => (
                      <div 
                        key={opportunity.id} 
                        className={`p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor} relative group`}
                      >
                        <button
                          onClick={() => handleDeleteOpportunity(bucket.name, opportunity.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className={`h-4 w-4 ${bucket.textColor}`} />
                        </button>
                        <div className="flex items-start">
                          <Lightbulb className={`flex-shrink-0 h-5 w-5 mr-2 mt-0.5 ${bucket.textColor}`} />
                          <div className="w-full">
                            <p className="text-sm">{opportunity.text}</p>
                            <div className={`flex flex-wrap justify-between items-center mt-2 pt-2 border-t ${bucket.borderColor}`}>
                              <span className={`text-xs font-medium ${bucket.textColor} inline-block`}>
                                {opportunity.serviceArea}
                              </span>
                              {opportunity.goalTag && (
                                <span className={`text-xs font-medium bg-white ${bucket.textColor} py-0.5 px-2 rounded-full`}>
                                  {opportunity.goalTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-gray-500">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No opportunities yet. Add one or generate to get started.</p>
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