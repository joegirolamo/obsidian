'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brain, AlertCircle, Loader2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getBusinessById } from '@/app/actions/business';

interface BusinessData {
  business: {
    id: string;
    name: string;
    industry?: string | null;
    website?: string | null;
    description?: string | null;
    properties?: string[];
  } | null;
  metrics: any[];
  goals: any[];
  kpis: any[];
  intakeQuestions: any[];
  intakeAnswers: any[];
  scorecards: any[];
  opportunities: any[];
}

export default function AIBrainPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusinessData() {
      if (!businessId) {
        setError('No business ID provided. Please select a business.');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch basic business data
        const businessResult = await getBusinessById(businessId);
        
        if (!businessResult.success || !businessResult.business) {
          setError('Failed to fetch business data.');
          setIsLoading(false);
          return;
        }

        // Fetch additional data in parallel
        const [metrics, goals, kpis, intakeQuestions, scorecards, opportunities] = await Promise.all([
          // Fetch metrics
          fetch(`/api/admin/metrics?businessId=${businessId}`).then(res => res.json()),
          
          // Fetch goals
          fetch(`/api/admin/goals?businessId=${businessId}`).then(res => res.json()),
          
          // Fetch KPIs
          fetch(`/api/admin/kpis?businessId=${businessId}`).then(res => res.json()),
          
          // Fetch intake questions
          fetch(`/api/admin/intake-questions?businessId=${businessId}`).then(res => res.json()),
          
          // Fetch scorecards
          fetch(`/api/admin/scorecards?businessId=${businessId}`).then(res => res.json()),
          
          // Fetch opportunities
          fetch(`/api/admin/opportunities?businessId=${businessId}`).then(res => res.json()),
        ]);

        // Fetch intake answers if we have questions
        const intakeAnswers = intakeQuestions?.items?.length 
          ? await fetch(`/api/admin/intake-answers?businessId=${businessId}`).then(res => res.json())
          : { items: [] };

        // Combine all data
        setBusinessData({
          business: businessResult.business,
          metrics: metrics?.items || [],
          goals: goals?.items || [],
          kpis: kpis?.items || [],
          intakeQuestions: intakeQuestions?.items || [],
          intakeAnswers: intakeAnswers?.items || [],
          scorecards: scorecards?.items || [],
          opportunities: opportunities?.items || [],
        });
      } catch (err) {
        console.error('Error fetching business data:', err);
        setError('An error occurred while fetching business data.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBusinessData();
  }, [businessId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !businessData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Error</h1>
        <p className="text-gray-600">{error || 'Failed to load business data.'}</p>
        {!businessId && (
          <p className="mt-4 text-sm">
            Please select a business from the workspace dropdown.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center">
        <Brain className="w-8 h-8 text-indigo-600 mr-3" />
        <h1 className="text-2xl font-bold">AI Brain</h1>
      </div>
      
      <p className="mb-8 text-gray-600">
        This page shows all the information we've collected about {businessData.business?.name}. 
        This data is used by our AI to generate analyses like Scorecards and Opportunities.
      </p>
      
      {/* Business Profile Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Business Profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-2">Basic Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p>{businessData.business?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Industry:</span>
                <p>{businessData.business?.industry || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Website:</span>
                <p>{businessData.business?.website || 'Not specified'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-600">
              {businessData.business?.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Goals & KPIs Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Goals & KPIs</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-2">Business Goals</h3>
            {businessData.goals.length > 0 ? (
              <ul className="space-y-2">
                {businessData.goals.map((goal) => (
                  <li key={goal.id} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">{goal.name}</div>
                    {goal.description && <div className="text-sm text-gray-600">{goal.description}</div>}
                    <div className="text-xs mt-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {goal.status}
                      </span>
                      {goal.targetDate && (
                        <span className="ml-2 text-gray-500">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No goals have been defined.</p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-2">Key Performance Indicators</h3>
            {businessData.kpis.length > 0 ? (
              <ul className="space-y-2">
                {businessData.kpis.map((kpi) => (
                  <li key={kpi.id} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">{kpi.name}</div>
                    {kpi.description && <div className="text-sm text-gray-600">{kpi.description}</div>}
                    <div className="text-xs mt-1 flex items-center">
                      {kpi.current && (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Current: {kpi.current}{kpi.unit ? ` ${kpi.unit}` : ''}
                        </span>
                      )}
                      {kpi.target && (
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Target: {kpi.target}{kpi.unit ? ` ${kpi.unit}` : ''}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No KPIs have been defined.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Metrics Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Metrics</h2>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          {businessData.metrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Value</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {businessData.metrics.map((metric) => (
                    <tr key={metric.id}>
                      <td className="px-4 py-2">{metric.name}</td>
                      <td className="px-4 py-2">
                        {metric.value || <span className="text-gray-400 italic">Not provided</span>}
                      </td>
                      <td className="px-4 py-2">{metric.type}</td>
                      <td className="px-4 py-2">{metric.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No metrics have been collected.</p>
          )}
        </div>
      </div>
      
      {/* Intake Questions & Answers Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Intake Questions & Answers</h2>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          {businessData.intakeQuestions.length > 0 ? (
            <div className="space-y-4">
              {businessData.intakeQuestions.map((question) => {
                // Find corresponding answer
                const answer = businessData.intakeAnswers.find(
                  (a) => a.questionId === question.id
                );
                
                return (
                  <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium mb-1">{question.question}</div>
                    <div className="flex items-start">
                      <div className="w-24 text-sm text-gray-500">Answer:</div>
                      <div className="flex-1">
                        {answer ? (
                          <div className="bg-white p-2 rounded border">
                            {answer.answer}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">Not answered yet</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Category: {question.area || 'Other'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">No intake questions have been set up.</p>
          )}
        </div>
      </div>
      
      {/* Analysis Section - Scorecards */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Scorecards</h2>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          {businessData.scorecards.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {businessData.scorecards.map((scorecard) => {
                // Parse highlights if available
                let highlights = [];
                try {
                  if (scorecard.highlights) {
                    const parsed = typeof scorecard.highlights === 'string'
                      ? JSON.parse(scorecard.highlights)
                      : scorecard.highlights;
                    
                    highlights = Array.isArray(parsed) 
                      ? parsed 
                      : (parsed.items || []);
                  }
                } catch (err) {
                  console.error('Error parsing highlights:', err);
                }
                
                return (
                  <div key={scorecard.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{scorecard.category}</div>
                    <div className="text-sm mb-2">
                      Score: {scorecard.score || 0}/{scorecard.maxScore || 100}
                    </div>
                    
                    {highlights.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1">Highlights:</div>
                        <ul className="text-xs space-y-1">
                          {highlights.slice(0, 3).map((h: any, index: number) => (
                            <li key={index} className="pl-2 border-l-2 border-gray-300">
                              {h.text}
                            </li>
                          ))}
                          {highlights.length > 3 && (
                            <li className="text-gray-500 italic">
                              +{highlights.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">No scorecards have been generated.</p>
          )}
        </div>
      </div>
      
      {/* Opportunities Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Opportunities</h2>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          {businessData.opportunities.length > 0 ? (
            <div className="space-y-3">
              {businessData.opportunities.map((opportunity) => (
                <div key={opportunity.id} className="p-3 border rounded-lg flex justify-between">
                  <div>
                    <div className="font-medium">{opportunity.title}</div>
                    {opportunity.description && (
                      <div className="text-sm text-gray-600">{opportunity.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Category: {opportunity.category} | Area: {opportunity.serviceArea || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      opportunity.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                      opportunity.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      opportunity.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {opportunity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No opportunities have been identified.</p>
          )}
        </div>
      </div>
      
      {/* AI Integration Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">AI Integration</h2>
        <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
          <p className="mb-4">
            All the information on this page is what our AI system uses to generate insights.
            As more information is gathered, the AI's recommendations will improve.
          </p>
          <div className="w-full h-12 bg-gray-100 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all" 
              style={{ 
                width: `${Math.min(
                  100, 
                  10 + // Base value
                  (businessData.metrics.length > 0 ? 15 : 0) +
                  (businessData.intakeAnswers.length > 0 ? 20 : 0) +
                  (businessData.goals.length > 0 ? 15 : 0) +
                  (businessData.kpis.length > 0 ? 15 : 0) +
                  (businessData.scorecards.length > 0 ? 15 : 0) +
                  (businessData.opportunities.length > 0 ? 10 : 0)
                )}%`
              }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            AI Data Completeness:&nbsp;
            {Math.min(
              100, 
              10 + // Base value
              (businessData.metrics.length > 0 ? 15 : 0) +
              (businessData.intakeAnswers.length > 0 ? 20 : 0) +
              (businessData.goals.length > 0 ? 15 : 0) +
              (businessData.kpis.length > 0 ? 15 : 0) +
              (businessData.scorecards.length > 0 ? 15 : 0) +
              (businessData.opportunities.length > 0 ? 10 : 0)
            )}%
          </div>
        </div>
      </div>
    </div>
  );
} 