'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from "next/image";
import { updateAssessmentInsights, publishAssessments } from '@/app/actions/assessment';
import PublishToggle from '@/components/PublishToggle';

export default function AssessmentsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});

  const categories = [
    {
      name: "Integrations",
      items: [
        { name: "Shopify", logo: "/logos/shopify.svg" },
        { name: "Klaviyo", logo: "/logos/klaviyo.svg" },
        { name: "Attentive", logo: "/logos/attentive.svg" },
        { name: "Gorgias", logo: "/logos/gorgias.svg" },
        { name: "Recharge", logo: "/logos/recharge.svg" },
      ],
    },
    {
      name: "Performance",
      items: [],
    },
    {
      name: "Creative",
      items: [],
    },
    {
      name: "Marketing Tech",
      items: [],
    },
    {
      name: "SEO",
      items: [],
    },
  ];

  const handleInsightChange = (category: string, value: string) => {
    setInsights((prev) => ({ ...prev, [category]: value }));
  };

  const handleInsightSubmit = async (category: string) => {
    const result = await updateAssessmentInsights(
      businessId,
      category,
      insights[category] || ''
    );
    if (!result.success) {
      // Handle error
      console.error(result.error);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const result = await publishAssessments(businessId);
      if (!result.success) {
        console.error("Error publishing assessments:", result.error);
      } else {
        setIsPublished(!isPublished);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Assessments</h1>
            <p className="text-body mt-2">
              Manage and review business assessments
            </p>
          </div>
          <PublishToggle
            isPublished={isPublished}
            onToggle={handlePublishToggle}
            isLoading={isPublishing}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Integrations */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">Integrations</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-5 gap-4">
              {categories[0].items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg"
                >
                  <div className="w-12 h-12 relative mb-2">
                    <Image
                      src={item.logo}
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">Performance</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">View Report</label>
              <textarea className="form-input h-32" placeholder="Enter performance notes..." />
            </div>
          </div>
        </div>

        {/* Marketing Tech */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">Marketing Tech</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">View Report</label>
              <textarea className="form-input h-32" placeholder="Enter marketing tech notes..." />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-2">SEO</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">View Report</label>
              <textarea className="form-input h-32" placeholder="Enter SEO notes..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 