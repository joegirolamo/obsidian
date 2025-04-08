import { prisma } from "@/lib/prisma";

async function getBusinessData(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      assessments: true,
      opportunities: true,
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

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Digital Value Creation Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your business performance and growth opportunities
          </p>
        </div>

        {/* Assessments Section */}
        <div className="grid gap-6 mb-8">
          <h2 className="text-xl font-semibold">Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Performance", "Marketing Tech", "Creative", "SEO"].map(
              (category) => (
                <div
                  key={category}
                  className="bg-white p-4 rounded-lg shadow-sm border"
                >
                  <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">0 insights</div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      In Progress
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Scorecard Section */}
        <div className="grid gap-6 mb-8">
          <h2 className="text-xl font-semibold">Scorecard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "EBITDA", score: "4/10" },
              { title: "Revenue", score: "7/10" },
              { title: "De-Risk", score: "6/10" },
            ].map((metric) => (
              <div
                key={metric.title}
                className="bg-white p-6 rounded-lg shadow-sm border"
              >
                <h3 className="font-medium text-gray-900 mb-4">{metric.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{metric.score}</div>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities Section */}
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
      </div>
    </div>
  );
} 