'use client';

import { useParams, useRouter } from 'next/navigation';
import MetricForm from "@/app/portal/[businessId]/MetricForm";
import { NavigationButtons } from "@/app/portal/[businessId]/NavigationButtons";
import { getBusinessMetricsAction, updateMetricAction } from '@/app/actions/serverActions';
import { useEffect, useState } from 'react';
import { MetricType } from '@prisma/client';

interface Metric {
  id: string;
  name: string;
  description: string | null;
  type: MetricType;
  value: string | null;
  isClientRequested: boolean;
}

export default function MetricsPage() {
  const { businessId } = useParams() as { businessId: string };
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const result = await getBusinessMetricsAction(businessId);
        if (result.success && result.metrics) {
          const clientRequestedMetrics = result.metrics.filter(m => m.isClientRequested);
          setMetrics(clientRequestedMetrics);
        }
      } catch (err) {
        setError('Failed to load metrics');
        console.error('Error loading metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [businessId]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const updatePromises = metrics.map(async (metric) => {
        const value = formData.get(metric.id) as string;
        return await updateMetricAction(metric.id, businessId, {
          name: metric.name,
          description: metric.description || undefined,
          type: metric.type,
          isClientRequested: metric.isClientRequested,
          value
        });
      });

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const failures = results.filter(result => !result.success);
      if (failures.length > 0) {
        console.error('Some metrics failed to update:', failures);
        setError(failures.map(f => f.error).join(', '));
        return;
      }

      // All updates succeeded, redirect to tools page using router
      router.push(`/portal/${businessId}/tools`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save metrics';
      console.error('Error saving metrics:', err);
      setError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (metrics.length === 0) {
    return (
      <form action={handleSubmit}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No metric requests at this time.</h3>
            </div>
          </div>
          <NavigationButtons showBack={false} />
        </div>
      </form>
    );
  }

  return (
    <form action={handleSubmit}>
      <div className="max-w-2xl mx-auto space-y-6">
        <MetricForm businessId={businessId} metrics={metrics} />
        <NavigationButtons showBack={false} />
      </div>
    </form>
  );
} 