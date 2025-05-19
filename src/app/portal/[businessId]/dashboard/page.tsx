import { prisma } from "@/lib/prisma";
import { Opportunity } from "@prisma/client";

interface BusinessData {
  id: string;
  name: string;
  isScorecardPublished: boolean;
  isOpportunitiesPublished: boolean;
  scorecards: Scorecard[]; // Use proper type
  opportunities: Opportunity[];
}

// Define Scorecard type to match the Prisma schema
interface Scorecard {
  id: string;
  businessId: string;
  category: string;
  score: number | null;
  maxScore: number | null;
  highlights: any;
  metricSignals?: any;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

async function getBusinessData(businessId: string): Promise<BusinessData> {
  console.log('[DEBUG] Getting business data for:', businessId);
  
  // Get business with published opportunities
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      isScorecardPublished: true,
      isOpportunitiesPublished: true,
      opportunities: {
        where: { isPublished: true },
        orderBy: [
          { category: 'asc' },
          { title: 'asc' }
        ]
      },
    },
  });

  if (!business) {
    throw new Error("Business not found");
  }
  
  // Get scorecards from Scorecard model
  const scorecards = await prisma.scorecard.findMany({
    where: { 
      businessId,
      isPublished: true
    },
    orderBy: { category: 'asc' }
  });
  
  console.log('[DEBUG] Found business:', business?.name);
  console.log('[DEBUG] Found scorecards:', scorecards.length);
  console.log('[DEBUG] Found opportunities:', business.opportunities.length);
  console.log('[DEBUG] isScorecardPublished:', business.isScorecardPublished);
  console.log('[DEBUG] isOpportunitiesPublished:', business.isOpportunitiesPublished);

  return {
    ...business,
    scorecards,
    opportunities: business.opportunities.filter(opp => !opp.title?.includes('Scorecard')) // Only regular opportunities
  };
}

// Server component - params are directly accessible
export default async function Dashboard({
  params,
}: {
  params: { businessId: string };
}) {
  // In server components, params are directly accessible
  const businessId = params.businessId;
  console.log('[DEBUG] Dashboard rendering with businessId:', businessId);

  const business = await getBusinessData(businessId);

  // Group scorecards by category - using the correct categories
  const scorecardsByCategory = {
    Foundation: business.scorecards.filter(s => s.category === 'Foundation'),
    Acquisition: business.scorecards.filter(s => s.category === 'Acquisition'),
    Conversion: business.scorecards.filter(s => s.category === 'Conversion'),
    Retention: business.scorecards.filter(s => s.category === 'Retention'),
  };

  // Check if we have any content to display
  const hasScorecardsToShow = business.isScorecardPublished && business.scorecards.length > 0;
  const hasOpportunitiesToShow = business.isOpportunitiesPublished && business.opportunities.length > 0;
  const hasNoContent = !hasScorecardsToShow && !hasOpportunitiesToShow;
  
  console.log('[DEBUG] hasScorecardsToShow:', hasScorecardsToShow);
  console.log('[DEBUG] hasOpportunitiesToShow:', hasOpportunitiesToShow);
  console.log('[DEBUG] hasNoContent:', hasNoContent);
  console.log('[DEBUG] scorecardsByCategory:', Object.keys(scorecardsByCategory).map(key => 
    `${key}: ${scorecardsByCategory[key as keyof typeof scorecardsByCategory].length}`
  ));

  // Function to parse highlights
  const parseHighlights = (scorecard: any) => {
    if (!scorecard.highlights) return [];
    
    try {
      // Handle different formats of highlights storage
      const parsed = typeof scorecard.highlights === 'string' 
        ? JSON.parse(scorecard.highlights)
        : scorecard.highlights;
      
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed && parsed.items && Array.isArray(parsed.items)) {
        return parsed.items;
      }
      return [];
    } catch (error) {
      console.error('Error parsing highlights:', error);
      return [];
    }
  };
  
  // Function to parse metric signals
  const parseMetricSignals = (scorecard: any) => {
    if (!scorecard.highlights) return [];
    
    try {
      const parsed = typeof scorecard.highlights === 'string'
        ? JSON.parse(scorecard.highlights)
        : scorecard.highlights;
      
      if (parsed && parsed.metricSignals && Array.isArray(parsed.metricSignals)) {
        return parsed.metricSignals;
      }
      return [];
    } catch (error) {
      console.error('Error parsing metric signals:', error);
      return [];
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Company name centered at the top */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold">{business.name}</h1>
      </div>

      <div className="space-y-8">
        {/* Show scorecards section if published */}
        {hasScorecardsToShow && (
          <div className="grid gap-6">
            <h2 className="text-xl font-semibold">Scorecard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Foundation', 'Acquisition', 'Conversion', 'Retention'].map((category) => {
                const categoryScorecard = scorecardsByCategory[category as keyof typeof scorecardsByCategory][0];
                
                if (!categoryScorecard) return null;

                const highlights = parseHighlights(categoryScorecard);
                const metricSignals = parseMetricSignals(categoryScorecard);
                
                // Define colors based on category
                const getColorClass = (category: string) => {
                  switch(category) {
                    case 'Foundation': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
                    case 'Acquisition': return 'border-green-200 bg-green-50 text-green-800';
                    case 'Conversion': return 'border-blue-200 bg-blue-50 text-blue-800';
                    case 'Retention': return 'border-orange-200 bg-orange-50 text-orange-800';
                    default: return 'border-gray-200 bg-gray-50 text-gray-800';
                  }
                };
                
                return (
                  <div
                    key={category}
                    className="bg-white p-6 rounded-lg shadow-sm border overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900">{category}</h3>
                      <div className="flex items-center">
                        <span className="font-medium text-lg">{categoryScorecard.score}</span>
                        <span className="text-gray-500 text-sm ml-1">/{categoryScorecard.maxScore || 100}</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(categoryScorecard.score ?? 0) / (categoryScorecard.maxScore || 100) * 100}%`,
                          backgroundColor: category === 'Foundation' ? '#FFDC00' : 
                                          category === 'Acquisition' ? '#2ECC40' : 
                                          category === 'Conversion' ? '#0074D9' : 
                                          '#FF851B'
                        }}
                      ></div>
                    </div>
                    
                    {/* Highlights */}
                    {highlights && highlights.length > 0 ? (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Highlights</div>
                        <ul className="text-sm text-gray-600 space-y-2">
                          {highlights.slice(0, 3).map((highlight: any) => (
                            <li key={highlight.id} className={`pl-3 border-l-2 ${getColorClass(category).split(' ')[0]}`}>
                              <div>{highlight.text}</div>
                              {highlight.serviceArea && (
                                <div className="text-xs text-gray-500">{highlight.serviceArea}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No highlights available</div>
                    )}
                    
                    {/* Metric Signals - show if available */}
                    {metricSignals && metricSignals.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-medium text-gray-500 mb-1">Metrics</div>
                        <div className="grid grid-cols-2 gap-2">
                          {metricSignals.slice(0, 2).map((metric: any) => (
                            <div 
                              key={metric.id}
                              className={`p-2 rounded-md ${getColorClass(category)}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">{metric.name}</span>
                                {metric.trend && (
                                  <span className={`
                                    px-1 py-0.5 rounded-full text-xs
                                    ${metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                                      metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                                      'bg-gray-100 text-gray-800'}
                                  `}>
                                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-semibold mt-1">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show opportunities section if published */}
        {hasOpportunitiesToShow && (
          <div className="grid gap-6">
            <h2 className="text-xl font-semibold">Opportunities</h2>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="grid grid-cols-1 divide-y">
                {business.opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {opportunity.title}
                        </h3>
                        {opportunity.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {opportunity.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          opportunity.status === "OPEN"
                            ? "bg-green-100 text-green-800"
                            : opportunity.status === "IN_PROGRESS"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {opportunity.status}
                      </span>
                    </div>
                  </div>
                ))}
                {business.opportunities.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No opportunities available yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show message if nothing is published */}
        {hasNoContent && (
          <div className="text-center py-12">
            <p className="text-gray-500">No published content available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 