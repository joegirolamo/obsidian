'use client';

import { useState, useEffect } from 'react';
import { MetricType } from '@prisma/client';

interface Metric {
  id: string;
  name: string;
  description: string | null;
  type: MetricType;
  value: string | null;
  benchmark?: string | null;
  isClientRequested: boolean;
}

interface EditMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: Metric | null;
  onSave: (metric: Metric) => Promise<void>;
}

export default function EditMetricModal({
  isOpen,
  onClose,
  metric,
  onSave,
}: EditMetricModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Metric>({
    id: '',
    name: '',
    description: null,
    type: 'TEXT',
    value: null,
    benchmark: null,
    isClientRequested: false,
  });

  useEffect(() => {
    if (metric) {
      setFormData({
        id: metric.id,
        name: metric.name,
        description: metric.description,
        type: metric.type,
        value: metric.value,
        benchmark: metric.benchmark,
        isClientRequested: metric.isClientRequested,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        description: null,
        type: 'TEXT',
        value: null,
        benchmark: null,
        isClientRequested: false,
      });
    }
  }, [metric]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="heading-2">
            {metric ? 'Edit Metric' : 'Add New Metric'}
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Metric Name
              </label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Revenue"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="form-input"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                placeholder="Describe what this metric measures..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="type">
                Type
              </label>
              <select
                id="type"
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as MetricType })}
              >
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="BOOLEAN">Yes/No</option>
                <option value="SELECT">Select</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="value">
                Current Value
              </label>
              <input
                type="text"
                id="value"
                className="form-input"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value || null })}
                placeholder="e.g., $50,000"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="benchmark">
                Benchmark
              </label>
              <input
                type="text"
                id="benchmark"
                className="form-input"
                value={formData.benchmark || ''}
                onChange={(e) => setFormData({ ...formData, benchmark: e.target.value || null })}
                placeholder="Auto-populated based on business profile"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                This value is automatically set based on your business profile and industry data
              </p>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={formData.isClientRequested}
                  onChange={(e) => setFormData({ ...formData, isClientRequested: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Request this metric from client</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When checked, this metric will appear on the client's metric intake form
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !formData.name}
            className="btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 