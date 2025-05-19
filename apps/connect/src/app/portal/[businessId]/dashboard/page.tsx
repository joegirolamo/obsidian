import { prisma } from "@/lib/prisma";
import { OpportunityStatus } from "@prisma/client";
import { AlertCircle, Lightbulb } from "lucide-react";

// Define types similar to the admin portal
interface Highlight {
  id: string;
  text: string;
  serviceArea: string;
  aiGenerated?: boolean;
}

interface MetricSignal {
  id: string;
  name: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ScoreData {
  score: number;
  maxScore: number;
  highlights: Highlight[];
  metricSignals: MetricSignal[];
}

// Define opportunity interface with optional fields
interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  status: OpportunityStatus;
  category: string;
  serviceArea?: string;
  targetKPI?: string | null;
  createdAt: Date;
  updatedAt: Date;
  businessId: string;
  isPublished: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  isScorecardPublished: boolean;
  isOpportunitiesPublished: boolean;
  scorecards: any[]; // Use any type for scorecards since they're from the Scorecard model
  opportunities: Opportunity[];
}

// Define color mapping for scorecard buckets
const categoryColors = {
  Foundation: {
    color: '#FFDC00',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
  },
  Acquisition: {
    color: '#2ECC40',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
  },
  Conversion: {
    color: '#0074D9',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
  },
  Retention: {
    color: '#FF851B',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
  }
};

async function getBusinessData(businessId: string): Promise<BusinessData> {
  console.log('[DEBUG] Getting business data for:', businessId);
  
  // First, get the business with its publish flags
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      isScorecardPublished: true,
      isOpportunitiesPublished: true,
      opportunities: {
        where: { }, // Removing isPublished filter to get all opportunities
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
  
  console.log('[DEBUG] Found business:', business?.name, 'with published opportunities:', business?.opportunities?.length);
  
  // Get the scorecards from the Scorecard model
  const scorecards = await (prisma as any).scorecard.findMany({
    where: { 
      businessId,
      isPublished: true 
    },
    orderBy: [
      { category: 'asc' }
    ]
  });
  
  console.log('[DEBUG] Found scorecards from Scorecard model:', scorecards?.length);
  
  // Process scorecards to extract highlights and metrics
  const processedScorecards = scorecards.map((scorecard: any) => {
    let highlights: Highlight[] = [];
    let metricSignals: MetricSignal[] = [];
    
    // Try to parse structured highlights from the highlights field
    try {
      if (scorecard.highlights) {
        const parsedHighlights = typeof scorecard.highlights === 'string'
          ? JSON.parse(scorecard.highlights)
          : scorecard.highlights;
        
        if (Array.isArray(parsedHighlights)) {
          highlights = parsedHighlights;
        } else if (parsedHighlights && parsedHighlights.items && Array.isArray(parsedHighlights.items)) {
          highlights = parsedHighlights.items;
          
          if (parsedHighlights.metricSignals && Array.isArray(parsedHighlights.metricSignals)) {
            metricSignals = parsedHighlights.metricSignals;
          }
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error parsing highlights:', error);
    }
    
    return {
      id: scorecard.id,
      category: scorecard.category,
      score: scorecard.score || 0,
      maxScore: scorecard.maxScore || 100,
      highlights,
      metricSignals
    };
  });

  console.log('[DEBUG] isScorecardPublished:', business.isScorecardPublished);
  console.log('[DEBUG] isOpportunitiesPublished:', business.isOpportunitiesPublished);
  console.log('[DEBUG] Processed scorecards:', processedScorecards.length);
  
  return {
    ...business,
    scorecards: processedScorecards,
    opportunities: business.opportunities
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

  // Group opportunities by category if they are published
  const opportunitiesByCategory = business.isOpportunitiesPublished 
    ? {
        Foundation: business.opportunities.filter(o => 
          (o.category && o.category.toLowerCase() === 'foundation')),
        Acquisition: business.opportunities.filter(o => 
          (o.category && o.category.toLowerCase() === 'acquisition')),
        Conversion: business.opportunities.filter(o => 
          (o.category && o.category.toLowerCase() === 'conversion')),
        Retention: business.opportunities.filter(o => 
          (o.category && o.category.toLowerCase() === 'retention')),
      }
    : {
        Foundation: [],
        Acquisition: [],
        Conversion: [],
        Retention: [],
      };

  // Check if we have any content to display
  const hasScorecardsToShow = business.isScorecardPublished && business.scorecards.length > 0;
  const hasOpportunitiesToShow = business.isOpportunitiesPublished && business.opportunities.length > 0;
  const hasNoContent = !hasScorecardsToShow && !hasOpportunitiesToShow;
  
  console.log('[DEBUG] hasScorecardsToShow:', hasScorecardsToShow, 'with scorecards count:', business.scorecards.length);
  console.log('[DEBUG] hasOpportunitiesToShow:', hasOpportunitiesToShow);
  console.log('[DEBUG] hasNoContent:', hasNoContent);
  console.log('[DEBUG] scorecardsByCategory:', Object.keys(scorecardsByCategory).map(key => 
    `${key}: ${scorecardsByCategory[key as keyof typeof scorecardsByCategory].length}`
  ));
  
  // Add detailed logging of opportunities
  console.log('[DEBUG] All opportunities:', business.opportunities);
  console.log('[DEBUG] opportunitiesByCategory:', {
    Foundation: opportunitiesByCategory.Foundation.length,
    Acquisition: opportunitiesByCategory.Acquisition.length,
    Conversion: opportunitiesByCategory.Conversion.length,
    Retention: opportunitiesByCategory.Retention.length
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Company name centered at the top */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold">{business.name}</h1>
      </div>

      <div className="space-y-8">
        {/* Show scorecards section if published */}
        {hasScorecardsToShow && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Performance Scorecard</h2>
            
            {/* Using the exact same grid structure as the admin portal */}
            <div className="grid md:grid-cols-2 gap-6">
              {['Foundation', 'Acquisition', 'Conversion', 'Retention'].map((category) => {
                const scorecards = scorecardsByCategory[category as keyof typeof scorecardsByCategory];
                
                if (!scorecards || scorecards.length === 0) return null;
                const scorecard = scorecards[0]; // Get the first scorecard for this category
                const colors = categoryColors[category as keyof typeof categoryColors];
                
                return (
                  <div
                    key={category}
                    className="rounded-lg border border-gray-200 overflow-hidden bg-white"
                    style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' }}
                  >
                    {/* Header with score */}
                    <div className="px-5 py-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{category}</h3>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold">{scorecard.score}</div>
                          <span className="ml-1 text-sm text-gray-500">/ {scorecard.maxScore}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score progress bar */}
                    <div className="p-5 bg-white">
                      <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                        <div 
                          className="h-full rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${(scorecard.score / scorecard.maxScore) * 100}%`,
                            backgroundColor: colors.color
                          }}
                        ></div>
                      </div>
                      
                      {/* Highlights */}
                      <div>
                        <h4 className="font-medium mb-3">Highlights</h4>
                        {scorecard.highlights && scorecard.highlights.length > 0 ? (
                          <div className="space-y-2">
                            {scorecard.highlights.map((highlight: Highlight) => (
                              <div 
                                key={highlight.id} 
                                className={`p-3 ${colors.bgColor} rounded-md border ${colors.borderColor} relative`}
                              >
                                <div className="flex">
                                  <div className="mr-3 mt-0.5">
                                    <AlertCircle className="h-5 w-5" style={{ color: colors.color }} />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm">{highlight.text}</span>
                                    <div className="flex items-center mt-1">
                                      <span className={`text-xs ${colors.textColor} font-medium`}>{highlight.serviceArea}</span>
                                      {highlight.aiGenerated && (
                                        <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">AI</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No highlights available</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Metrics */}
                      {scorecard.metricSignals && scorecard.metricSignals.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-2">Metric Signals</h4>
                          <div className="flex flex-wrap gap-2">
                            {scorecard.metricSignals.map((metric: MetricSignal) => (
                              <div 
                                key={metric.id}
                                className="px-3 py-1 rounded-full bg-[#f9f9f9] border border-[#e9e9e9] text-[#555555] flex items-center font-mono"
                              >
                                <span className="font-medium text-xs">{metric.name}:</span>
                                <span className="ml-1 text-xs text-black font-bold">{metric.value}</span>
                                {metric.trend && (
                                  <span className={`
                                    ml-1 px-1 rounded-full text-xs
                                    ${metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                                      metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                                      'bg-gray-100 text-gray-800'}
                                  `}>
                                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show opportunities for this bucket if published */}
                      {hasOpportunitiesToShow && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h4 className="font-medium mb-3">Opportunities</h4>
                          {opportunitiesByCategory[category as keyof typeof opportunitiesByCategory] && 
                           opportunitiesByCategory[category as keyof typeof opportunitiesByCategory].length > 0 ? (
                            <div className="space-y-2">
                              {opportunitiesByCategory[category as keyof typeof opportunitiesByCategory].map((opportunity) => (
                                <div 
                                  key={opportunity.id}
                                  className={`p-3 ${colors.bgColor} rounded-md border ${colors.borderColor}`}
                                >
                                  <div className="flex">
                                    <div className="mr-3 mt-0.5">
                                      <Lightbulb className="h-5 w-5" style={{ color: colors.color }} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-medium">{opportunity.title}</h5>
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                            opportunity.status === "OPEN"
                                              ? "bg-green-100 text-green-800"
                                              : opportunity.status === "IN_PROGRESS"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : opportunity.status === "COMPLETED"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {opportunity.status}
                                        </span>
                                      </div>
                                      {opportunity.description && (
                                        <p className="text-xs text-gray-600 mt-1">{opportunity.description}</p>
                                      )}
                                      <div className="flex items-center justify-between mt-2">
                                        {opportunity.serviceArea && (
                                          <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200">
                                            {opportunity.serviceArea}
                                          </span>
                                        )}
                                        {opportunity.targetKPI && (
                                          <span className={`text-xs ${colors.textColor}`}>
                                            {opportunity.targetKPI}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-3 text-gray-500">
                              <p className="text-sm">No opportunities for this category</p>
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