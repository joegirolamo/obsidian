"use client";

import { useState } from "react";
import { MetricType } from "@prisma/client";

type Metric = {
  id: string;
  name: string;
  description: string | null;
  type: MetricType;
  value: string | null;
};

type MetricFormProps = {
  businessId: string;
  metrics: Metric[];
};

export default function MetricForm({ businessId, metrics }: MetricFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    metrics.reduce((acc: Record<string, string>, metric) => ({
      ...acc,
      [metric.id]: metric.value || "",
    }), {})
  );
  const [error, setError] = useState("");

  const handleChange = (metricId: string, value: string) => {
    setValues((prev: Record<string, string>) => ({
      ...prev,
      [metricId]: value,
    }));
  };

  const renderInput = (metric: Metric) => {
    const baseInputStyles = "block w-full px-4 py-3 rounded-md border border-solid border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-primary sm:text-sm";

    switch (metric.type) {
      case "NUMBER":
        return (
          <input
            type="number"
            id={metric.id}
            name={metric.id}
            value={values[metric.id]}
            onChange={(e) => handleChange(metric.id, e.target.value)}
            className={baseInputStyles}
          />
        );
      case "BOOLEAN":
        return (
          <select
            id={metric.id}
            name={metric.id}
            value={values[metric.id]}
            onChange={(e) => handleChange(metric.id, e.target.value)}
            className={baseInputStyles}
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case "SELECT":
        return (
          <select
            id={metric.id}
            name={metric.id}
            value={values[metric.id]}
            onChange={(e) => handleChange(metric.id, e.target.value)}
            className={baseInputStyles}
          >
            <option value="">Select...</option>
            {/* Add options based on metric configuration */}
          </select>
        );
      default:
        return (
          <input
            type="text"
            id={metric.id}
            name={metric.id}
            value={values[metric.id]}
            onChange={(e) => handleChange(metric.id, e.target.value)}
            className={baseInputStyles}
          />
        );
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <div className="space-y-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="grid grid-cols-2 gap-8 items-start">
            <div>
              <label
                htmlFor={metric.id}
                className="block text-base font-medium text-gray-900"
              >
                {metric.name}
              </label>
              {metric.description && (
                <p className="mt-1 text-sm text-gray-500">{metric.description}</p>
              )}
            </div>
            <div>{renderInput(metric)}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
} 