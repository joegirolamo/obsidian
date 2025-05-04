'use client';

import { useState, useEffect } from 'react';
import { MetricType } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { getBusinessMetricsAction, saveMetricAction, updateMetricAction, deleteMetricAction, createDefaultMetricsAction } from '@/app/actions/serverActions';
import EditMetricModal from './EditMetricModal';

interface Metric {
  id: string;
  name: string;
  description: string | null;
  type: MetricType;
  value: string | null;
  target?: string | null;
  benchmark?: string | null;
  isClientRequested: boolean;
}

export default function MetricWorkbook() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const businessId = searchParams.get('businessId');
      
      if (!businessId) {
        setError('No business selected');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getBusinessMetricsAction(businessId);
        if (result.success && result.metrics) {
          // Sort metrics by name for consistent display
          const sortedMetrics = [...result.metrics].sort((a, b) => a.name.localeCompare(b.name));
          setMetrics(sortedMetrics);
        } else {
          setError(result.error || 'Failed to fetch metrics');
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [searchParams]);

  const handleMetricClick = (metric: Metric | null) => {
    setSelectedMetric(metric);
    setIsModalOpen(true);
  };

  const handleMetricDelete = async (metricId: string) => {
    const businessId = searchParams.get('businessId');
    if (!businessId) return;

    try {
      const result = await deleteMetricAction(metricId, businessId);
      if (result.success) {
        setMetrics(metrics.filter(m => m.id !== metricId));
      } else {
        setError(result.error || 'Failed to delete metric');
      }
    } catch (error) {
      console.error('Error deleting metric:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleSaveMetric = async (metric: Metric) => {
    const businessId = searchParams.get('businessId');
    if (!businessId) return;

    try {
      if (metric.id) {
        const result = await updateMetricAction(metric.id, businessId, metric);
        if (result.success) {
          setMetrics(metrics.map(m => m.id === metric.id ? metric : m));
        } else {
          setError(result.error || 'Failed to update metric');
        }
      } else {
        const result = await saveMetricAction(businessId, metric);
        if (result.success && result.metric) {
          setMetrics([...metrics, result.metric].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          setError(result.error || 'Failed to save metric');
        }
      }
    } catch (error) {
      console.error('Error saving metric:', error);
      setError('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => handleMetricClick(null)}
          className="btn-primary"
        >
          Add Metric
        </button>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-4 pl-4 text-sm font-medium text-gray-500">Metric</th>
                <th className="text-left pb-4 text-sm font-medium text-gray-500">Current Value</th>
                <th className="text-left pb-4 text-sm font-medium text-gray-500">Benchmark</th>
                <th className="text-left pb-4 text-sm font-medium text-gray-500 pl-4">Requested</th>
                <th className="text-right pb-4 pr-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {metrics.map(metric => (
                <tr key={metric.id} className="group hover:bg-gray-50/50">
                  <td className="py-4 pl-4">
                    <div>
                      <div className="font-medium text-gray-900">{metric.name}</div>
                      <div className="text-sm text-gray-500">{metric.description}</div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-gray-600">{metric.value || '-'}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-gray-600">{metric.benchmark || '-'}</span>
                  </td>
                  <td className="py-4 pl-4">
                    <Switch
                      checked={metric.isClientRequested}
                      onChange={async () => {
                        const businessId = searchParams.get('businessId');
                        if (!businessId) return;
                        // Update local state
                        const updatedMetrics = metrics.map(m => 
                          m.id === metric.id 
                            ? { ...m, isClientRequested: !m.isClientRequested }
                            : m
                        );
                        setMetrics(updatedMetrics);
                        
                        // Persist to database
                        const result = await updateMetricAction(metric.id, businessId, {
                          isClientRequested: !metric.isClientRequested
                        });
                        
                        if (!result.success) {
                          // Revert local state if update failed
                          setMetrics(metrics);
                          console.error('Failed to update metric:', result.error);
                        }
                      }}
                      className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        metric.isClientRequested ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]'
                      }`}
                    >
                      <span className="sr-only">
                        {metric.isClientRequested ? 'Disable client request' : 'Enable client request'}
                      </span>
                      <span
                        className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          metric.isClientRequested ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </Switch>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleMetricClick(metric)}
                        disabled={metric.isClientRequested}
                        className={`p-2 rounded-lg ${
                          metric.isClientRequested
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-primary hover:bg-primary/5 cursor-pointer'
                        }`}
                        title={metric.isClientRequested ? 'Cannot edit client-requested metrics' : 'Edit metric'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricDelete(metric.id)}
                        disabled={metric.isClientRequested}
                        className={`p-2 rounded-lg ${
                          metric.isClientRequested
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer'
                        }`}
                        title={metric.isClientRequested ? 'Cannot delete client-requested metrics' : 'Delete metric'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {metrics.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No metrics added yet. Click "Add Metric" to get started.
            </div>
          )}
        </div>
      </div>

      <EditMetricModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMetric(null);
        }}
        metric={selectedMetric}
        onSave={handleSaveMetric}
      />
    </div>
  );
} 