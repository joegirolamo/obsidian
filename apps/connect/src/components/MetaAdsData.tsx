'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface MetaAdsData {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalReach: number;
  totalActions: number;
}

export default function MetaAdsData() {
  const { data: session } = useSession();
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/meta-ads');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch Meta Ads data');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No Meta Ads data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Impressions</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalImpressions.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Clicks</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalClicks.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Spend</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">${data.totalSpend.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Reach</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalReach.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Actions</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{data.totalActions.toLocaleString()}</p>
      </div>
    </div>
  );
} 