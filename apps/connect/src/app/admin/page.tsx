'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBusinessByAdminId } from '@/app/actions/business';
import { useSession } from 'next-auth/react';

export default function AdminOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      
      const result = await getBusinessByAdminId(session.user.id);
      if (result.success && result.business) {
        setBusiness(result.business);
      }
      setIsLoading(false);
    };

    fetchBusiness();
  }, [session]);

  // Example metrics data - in a real app, this would come from an API call
  const metrics = [
    { name: 'EBITDA Score', value: '8/10', change: '+2', trend: 'up' },
    { name: 'Revenue Score', value: '7/10', change: '+1', trend: 'up' },
    { name: 'De-Risk Score', value: '6/10', change: '-1', trend: 'down' },
    { name: 'Overall Health', value: '85%', change: '+5%', trend: 'up' },
  ];

  // Example recent activity - in a real app, this would come from an API call
  const recentActivity = [
    { id: 1, type: 'update', description: 'Updated EBITDA assessment', date: '2 hours ago' },
    { id: 2, type: 'publish', description: 'Published scorecard to portal', date: '1 day ago' },
    { id: 3, type: 'create', description: 'Added new opportunity', date: '2 days ago' },
    { id: 4, type: 'update', description: 'Updated business details', date: '3 days ago' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Dashboard</h1>
            <p className="text-body mt-2">
              Workspace overview and activity
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.name} className="card">
            <div className="card-body">
              <h3 className="text-body mb-2">{metric.name}</h3>
              <div className="flex items-baseline justify-between">
                <span className="heading-2">{metric.value}</span>
                <div className={`flex items-center ${
                  metric.trend === 'up' ? 'text-success' : 'text-error'
                }`}>
                  {metric.trend === 'up' ? '↑' : '↓'}
                  <span className="ml-1">{metric.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="heading-2">Recent Activity</h2>
        </div>
        <div className="card-body">
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between">
                  <div>
                    <p className="text-body">{activity.description}</p>
                  </div>
                  <span className="text-body">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <button className="btn-primary w-full">Update Scorecard</button>
              {isLoading ? (
                <button 
                  className="btn-secondary w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  Loading...
                </button>
              ) : business ? (
                <button 
                  onClick={() => router.push(`/admin/business-details/${business.id}`)}
                  className="btn-secondary w-full"
                >
                  View Business Details
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/admin/business-details/new')}
                  className="btn-secondary w-full"
                >
                  Create Business
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notes or Reminders */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">Notes</h2>
          </div>
          <div className="card-body">
            <textarea
              className="form-input h-[120px]"
              placeholder="Add notes or reminders..."
            />
          </div>
        </div>
      </div>
    </div>
  );
} 