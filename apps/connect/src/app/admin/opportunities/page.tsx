'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2 } from "lucide-react";
import { createOpportunity, deleteOpportunity, publishOpportunities, unpublishOpportunities, getOpportunitiesPublishStatus } from '@/app/actions/opportunity';
import PublishToggle from '@/components/PublishToggle';

interface OpportunityForm {
  title: string;
  description: string;
}

interface OpportunityData extends OpportunityForm {
  id: string;
}

export default function OpportunitiesPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  if (!businessId) {
    console.error('No business ID found in query parameters');
    return <div>Error: No business ID found</div>;
  }

  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Record<string, OpportunityData[]>>({
    EBITDA: [],
    Revenue: [],
    'De-Risk': [],
  });
  const [forms, setForms] = useState<Record<string, OpportunityForm>>({});

  // Load initial publish status
  useEffect(() => {
    const loadPublishStatus = async () => {
      const result = await getOpportunitiesPublishStatus(businessId);
      if (result.success) {
        setIsPublished(result.isPublished ?? false);
      }
    };

    loadPublishStatus();
  }, [businessId]);

  const handlePublishToggle = async () => {
    setIsLoading(true);
    try {
      const result = isPublished 
        ? await unpublishOpportunities(businessId)
        : await publishOpportunities(businessId);
        
      if (result.success) {
        setIsPublished(!isPublished);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["EBITDA", "Revenue", "De-Risk"];

  const handleFormChange = (category: string, field: keyof OpportunityForm, value: string) => {
    setForms((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleAddOpportunity = async (category: string) => {
    const form = forms[category];
    if (!form?.title || !form?.description) return;

    const result = await createOpportunity(businessId, {
      ...form,
      category,
    });

    if (result.success && result.opportunity) {
      setOpportunities((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), { ...form, id: result.opportunity.id }],
      }));
      // Clear form
      setForms((prev) => ({
        ...prev,
        [category]: { title: '', description: '' },
      }));
    } else {
      console.error(result.error);
    }
  };

  const handleDeleteOpportunity = async (category: string, opportunityId: string) => {
    const result = await deleteOpportunity(opportunityId);
    if (result.success) {
      setOpportunities((prev) => ({
        ...prev,
        [category]: prev[category].filter((opp) => opp.id !== opportunityId),
      }));
    } else {
      console.error(result.error);
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1">Opportunities</h1>
              <p className="text-body mt-2">
                Manage and track business opportunities
              </p>
            </div>
            <PublishToggle
              isPublished={isPublished}
              onToggle={handlePublishToggle}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category}
              className="bg-white shadow sm:rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {category}
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  {/* Add new opportunity form */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Title"
                      value={forms[category]?.title || ''}
                      onChange={(e) => handleFormChange(category, 'title', e.target.value)}
                      className="input"
                    />
                    <textarea
                      placeholder="Description"
                      value={forms[category]?.description || ''}
                      onChange={(e) => handleFormChange(category, 'description', e.target.value)}
                      className="input"
                      rows={3}
                    />
                    <button
                      onClick={() => handleAddOpportunity(category)}
                      className="button button-primary w-full flex items-center justify-center"
                      disabled={!forms[category]?.title || !forms[category]?.description}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Opportunity
                    </button>
                  </div>

                  {/* List of opportunities */}
                  <div className="space-y-4">
                    {opportunities[category]?.map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className="bg-gray-50 p-4 rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {opportunity.title}
                          </h4>
                          <button
                            onClick={() => handleDeleteOpportunity(category, opportunity.id)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          {opportunity.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 