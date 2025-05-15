import { prisma } from "@/lib/prisma";

async function getBusinessData(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      opportunities: {
        where: { isPublished: true },
      },
    },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  return business;
}

export default async function Dashboard({
  params,
}: {
  params: { businessId: string };
}) {
  const business = await getBusinessData(params.businessId);

  // Group opportunities by category
  const scorecardOpportunities = business.opportunities.filter(opp => 
    ['Foundation', 'Acquisition', 'Conversion', 'Retention'].includes(opp.category) && 
    opp.title.includes('Scorecard')
  );

  // Regular opportunities (non-scorecard)
  const regularOpportunities = business.opportunities.filter(opp => 
    !opp.title.includes('Scorecard')
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Company name centered at the top */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold">{business.name}</h1>
        </div>

        {/* Scorecard Section */}
        {scorecardOpportunities.length > 0 && (
          <div className="grid gap-6 mb-8">
            <h2 className="text-xl font-semibold">Scorecard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Foundation', 'Acquisition', 'Conversion', 'Retention'].map((category) => {
                const scorecard = scorecardOpportunities.find(opp => opp.category === category);
                
                if (!scorecard) return null;
                
                return (
                  <div
                    key={category}
                    className="bg-white p-6 rounded-lg shadow-sm border"
                  >
                    <h3 className="font-medium text-gray-900 mb-4">{category}</h3>
                    <div className="space-y-4">
                      {scorecard.description && (
                        <div className="text-sm text-gray-600">
                          {scorecard.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Opportunities Section */}
        {regularOpportunities.length > 0 && (
          <div className="grid gap-6">
            <h2 className="text-xl font-semibold">Opportunities</h2>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="grid grid-cols-1 divide-y">
                {regularOpportunities.map((opportunity) => (
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
                {regularOpportunities.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No opportunities available yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 