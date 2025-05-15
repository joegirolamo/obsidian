import { prisma } from "@/lib/prisma";
import { Opportunity } from "@prisma/client";

interface BusinessData {
  id: string;
  name: string;
  isScorecardPublished: boolean;
  isOpportunitiesPublished: boolean;
  scorecards: Opportunity[];
  opportunities: Opportunity[];
}

async function getBusinessData(businessId: string): Promise<BusinessData> {
  console.log('[DEBUG] Getting business data for:', businessId);
  
  // First, check ALL opportunities for this business (regardless of isPublished flag)
  const allOpportunities = await prisma.opportunity.findMany({
    where: { businessId },
    orderBy: [
      { category: 'asc' },
      { title: 'asc' }
    ]
  });
  
  console.log('[DEBUG] ALL opportunities in database:', allOpportunities.length);
  console.log('[DEBUG] ALL opportunities details:', allOpportunities.map(o => ({
    id: o.id,
    title: o.title,
    category: o.category,
    isPublished: o.isPublished
  })));
  
  // Now get the business with published opportunities
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

  console.log('[DEBUG] Found business:', business?.name, 'with published opportunities:', business?.opportunities?.length);

  if (!business) {
    throw new Error("Business not found");
  }

  // Separate scorecards and opportunities
  const scorecards = business.opportunities.filter(opp => opp.title.includes('Scorecard'));
  const opportunities = business.opportunities.filter(opp => !opp.title.includes('Scorecard'));
  
  console.log('[DEBUG] Filtered scorecards:', scorecards.length, 'opportunities:', opportunities.length);
  console.log('[DEBUG] isScorecardPublished:', business.isScorecardPublished);
  console.log('[DEBUG] isOpportunitiesPublished:', business.isOpportunitiesPublished);
  console.log('[DEBUG] Scorecard categories:', scorecards.map(s => s.category));

  return {
    ...business,
    scorecards,
    opportunities
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
                const scorecards = scorecardsByCategory[category as keyof typeof scorecardsByCategory];
                
                if (!scorecards || scorecards.length === 0) return null;
                
                return (
                  <div
                    key={category}
                    className="bg-white p-6 rounded-lg shadow-sm border"
                  >
                    <h3 className="font-medium text-gray-900 mb-4">{category}</h3>
                    <div className="space-y-4">
                      {scorecards.map(scorecard => (
                        <div key={scorecard.id} className="text-sm text-gray-600">
                          {scorecard.description}
                        </div>
                      ))}
                    </div>
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