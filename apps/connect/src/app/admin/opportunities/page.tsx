'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2 } from "lucide-react";
import { createOpportunity, deleteOpportunity, publishOpportunities } from '@/app/actions/opportunity';
import PublishToggle from '@/components/PublishToggle';

interface OpportunityForm {
  title: string;
  description: string;
}

interface OpportunityData extends OpportunityForm {
  id?: string;
}

export default function OpportunitiesPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [opportunities, setOpportunities] = useState<Record<string, OpportunityData[]>>({
    EBITDA: [],
    Revenue: [],
    'De-Risk': [],
  });
  const [forms, setForms] = useState<Record<string, OpportunityForm>>({});

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
      // Handle error
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
      // Handle error
      console.error(result.error);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const result = await publishOpportunities(businessId);
      if (!result.success) {
        // Handle error
        console.error(result.error);
      } else {
        setIsPublished(!isPublished);
      }
    } finally {
      setIsPublishing(false);
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
              isLoading={isPublishing}
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
                <div className="space-y-4">
                  {/* Existing Opportunities */}
                  {opportunities[category]?.map((opportunity) => (
                    <div key={opportunity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{opportunity.title}</h4>
                          <p className="mt-1 text-sm text-gray-500">{opportunity.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => opportunity.id && handleDeleteOpportunity(category, opportunity.id)}
                          className="ml-2 text-gray-400 hover:text-gray-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Opportunity Form */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Opportunity Title
                      </label>
                      <input
                        type="text"
                        value={forms[category]?.title || ''}
                        onChange={(e) => handleFormChange(category, 'title', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter title..."
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={forms[category]?.description || ''}
                        onChange={(e) => handleFormChange(category, 'description', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter description..."
                      />
                    </div>
                  </div>

                  {/* Add Opportunity Button */}
                  <button
                    type="button"
                    onClick={() => handleAddOpportunity(category)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-5 w-5 mr-2 text-gray-400" />
                    Add Opportunity
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 