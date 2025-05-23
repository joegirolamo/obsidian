'use client';

import { useParams, useRouter } from 'next/navigation';
import MetricForm from "@/app/portal/[businessId]/MetricForm";
import { NavigationButtons } from "@/app/portal/[businessId]/NavigationButtons";
import { getBusinessMetricsAction, updateMetricAction } from '@/app/actions/serverActions';
import { useEffect, useState } from 'react';
import { MetricType } from '@prisma/client';
import EmptyState from '@/components/EmptyState';

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
          <EmptyState type="metrics" message="No business metrics have been requested at this time." />
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