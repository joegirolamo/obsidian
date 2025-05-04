'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { generateNewAccessCode, createBusiness, getBusinessByAdminId, getBusinessById, updateBusinessDetails, updateBusinessConnections } from '@/app/actions/business';
import EditBusinessModal from '@/components/EditBusinessModal';
import EditMetricModal from '@/components/EditMetricModal';
import { useSession } from 'next-auth/react';
import { MetricType } from '@prisma/client';
import { saveMetricAction, updateMetricAction, deleteMetricAction, createDefaultMetricsAction, createDefaultToolsAction, getBusinessMetricsAction, getBusinessToolsAction, updateToolRequest, deleteAllToolsAction } from '@/app/actions/serverActions';
import { Eye, EyeOff } from 'lucide-react';
import Properties from '@/components/admin/Properties';

interface BusinessDetails {
  name: string;
  industry: string;
  website: string;
  description?: string;
  properties?: string[];
}

const BusinessProfilePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessCode, setBusinessCode] = useState<string | null>(null);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalType, setEditModalType] = useState<'details' | 'connections'>('details');

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: "My Business",
    industry: "",
    website: "",
  });

  const [properties, setProperties] = useState<string[]>([]);

  useEffect(() => {
    const fetchBusiness = async () => {
      const businessId = searchParams.get('businessId');
      
      if (!businessId) {
        setError('No business selected');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getBusinessById(businessId);
        if (result.success && result.business) {
          setBusinessId(result.business.id);
          setBusinessDetails({
            name: result.business.name,
            industry: result.business.industry || "",
            website: result.business.website || "",
            description: result.business.description || "",
            properties: result.business.properties || [],
          });
          setBusinessCode(result.business.code);
          setProperties(result.business.properties || []);
        } else {
          setError(result.error || 'Failed to fetch business details');
        }
      } catch (error) {
        console.error('Error fetching business:', error);
        setError("An error occurred while fetching your business details.");
      }
      
      setIsLoading(false);
    };

    fetchBusiness();
  }, [searchParams]);

  const handleEditClick = (type: 'details' | 'connections') => {
    setEditModalType(type);
    setShowEditModal(true);
  };

  const handleSave = async (data: any) => {
    if (!businessId) return;

    if (editModalType === 'details') {
      const businessData = data as BusinessDetails;
      const result = await updateBusinessDetails(businessId, businessData);
      if (result.success) {
        setBusinessDetails(businessData);
      } else {
        setError('Failed to update business details');
      }
    }
    setShowEditModal(false);
  };

  const handleAddProperty = async (property: string) => {
    if (!businessId) return;
    
    try {
      const updatedProperties = [...(properties || []), property];
      const result = await updateBusinessDetails(businessId, {
        ...businessDetails,
        properties: updatedProperties
      });
      
      if (result.success) {
        setProperties(updatedProperties);
      } else {
        setError('Failed to add property');
      }
    } catch (error) {
      console.error('Error adding property:', error);
      setError('Failed to add property');
    }
  };

  const handleRemoveProperty = async (index: number) => {
    if (!businessId) return;
    
    try {
      const updatedProperties = (properties || []).filter((_, i) => i !== index);
      const result = await updateBusinessDetails(businessId, {
        ...businessDetails,
        properties: updatedProperties
      });
      
      if (result.success) {
        setProperties(updatedProperties);
      } else {
        setError('Failed to remove property');
      }
    } catch (error) {
      console.error('Error removing property:', error);
      setError('Failed to remove property');
    }
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Access Code */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Business Profile</h1>
            <p className="text-body mt-2">
              Manage business information and tool connections
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Access Code</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-medium text-primary">
                  {showAccessCode ? businessCode : '••••••'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAccessCode(!showAccessCode)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showAccessCode ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Details Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="heading-2">Details</h2>
            <button
              onClick={() => handleEditClick('details')}
              className="btn-secondary"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="text-gray-900">{businessDetails.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Industry</p>
              <p className="text-gray-900">{businessDetails.industry || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <p className="text-gray-900">
                {businessDetails.website ? (
                  <a
                    href={businessDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {businessDetails.website}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{businessDetails.description || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Card */}
      <div className="mt-6">
        <Properties
          properties={properties}
          onAdd={handleAddProperty}
          onRemove={handleRemoveProperty}
        />
      </div>

      {showEditModal && (
        <EditBusinessModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          type={editModalType}
          businessDetails={businessDetails}
          connectionRequests={[]}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default BusinessProfilePage; 