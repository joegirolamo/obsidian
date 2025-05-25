'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { generateNewAccessCode, createBusiness, getBusinessByAdminId, getBusinessById, updateBusinessDetails, updateBusinessConnections, getBusinessAnalysis } from '@/app/actions/business';
import EditBusinessModal from '@/components/EditBusinessModal';
import EditMetricModal from '@/components/EditMetricModal';
import { useSession } from 'next-auth/react';
import { MetricType } from '@prisma/client';
import { saveMetricAction, updateMetricAction, deleteMetricAction, createDefaultMetricsAction, createDefaultToolsAction, getBusinessMetricsAction, getBusinessToolsAction, updateToolRequest, deleteAllToolsAction } from '@/app/actions/serverActions';
import { Eye, EyeOff } from 'lucide-react';
import Properties from '@/components/admin/Properties';
import WebsiteAnalyzer from '@/components/WebsiteAnalyzer';
import BusinessAnalysisDetails from '@/components/BusinessAnalysisDetails';

interface BusinessDetails {
  name: string;
  industry: string;
  website: string;
  description?: string;
  properties?: string[];
}

interface WebsiteAnalysisData {
  description: string;
  businessModel: string;
  productOffering: string;
  valuePropositions: string[];
  differentiationHighlights: string[];
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
  const [analysisData, setAnalysisData] = useState<WebsiteAnalysisData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const urlChecks = useRef(0);

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: "My Business",
    industry: "",
    website: "",
  });

  const [properties, setProperties] = useState<string[]>([]);

  // Monitor URL for changes after initial load
  useEffect(() => {
    console.log('Setting up URL monitor');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Function to check URL and fetch business if ID is found
    const checkUrlAndFetchBusiness = () => {
      const currentBusinessId = searchParams.get('businessId');
      urlChecks.current += 1;
      
      console.log(`URL Check #${urlChecks.current} - Business ID: ${currentBusinessId}`);
      
      if (currentBusinessId) {
        // We have a business ID in the URL
        if (!businessId || businessId !== currentBusinessId) {
          console.log(`Found business ID in URL after ${urlChecks.current} checks: ${currentBusinessId}`);
          
          // Reset analysis data when switching businesses
          if (businessId && businessId !== currentBusinessId) {
            console.log('Clearing previous business analysis data');
            setAnalysisData(null);
          }
          
          setBusinessId(currentBusinessId);
          fetchBusinessDetails(currentBusinessId);
          
          // Clear the interval since we found what we need
          if (intervalRef.current) {
            console.log('Clearing URL monitor interval - Business ID found');
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        console.log('No business ID in URL yet');
        
        // After 10 checks (5 seconds), stop checking and show error
        if (urlChecks.current >= 10) {
          console.log('Giving up after 10 checks - No business ID found');
          setError('No business selected');
          setIsLoading(false);
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    };
    
    // Check immediately
    checkUrlAndFetchBusiness();
    
    // And then check every 500ms
    intervalRef.current = setInterval(checkUrlAndFetchBusiness, 500);
    
    // Clean up the interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchParams]);

  const fetchBusinessDetails = async (id: string) => {
    console.log('Fetching business details for ID:', id);
    setIsLoading(true);
    setError(null);
    
    // Reset all business-related state
    setBusinessDetails({
      name: "",
      industry: "",
      website: "",
      description: "",
    });
    setProperties([]);
    setBusinessCode(null);
    setAnalysisData(null);

    try {
      // Fetch business details
      const result = await getBusinessById(id);
      if (result.success && result.business) {
        console.log('Business details retrieved successfully');
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
        
        // Fetch business analysis if it exists
        const analysisResult = await getBusinessAnalysis(id);
        if (analysisResult.success && analysisResult.analysis) {
          console.log('Analysis data retrieved successfully');
          setAnalysisData({
            description: result.business.description || "",
            businessModel: analysisResult.analysis.businessModel || "",
            productOffering: analysisResult.analysis.productOffering || "",
            valuePropositions: analysisResult.analysis.valuePropositions || [],
            differentiationHighlights: analysisResult.analysis.differentiationHighlights || []
          });
        } else {
          console.log('No analysis data found or error retrieving analysis:', analysisResult.error);
        }
      } else {
        console.error('Failed to fetch business details:', result.error);
        setError(result.error || 'Failed to fetch business details');
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      setError("An error occurred while fetching your business details.");
    }
    
    setIsLoading(false);
  };

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

  const handleAnalysisComplete = async (data: WebsiteAnalysisData) => {
    setAnalysisData(data);
    
    // Update the business description with the AI-generated one
    if (data.description && businessId) {
      try {
        const result = await updateBusinessDetails(businessId, {
          ...businessDetails,
          description: data.description
        });
        
        if (result.success) {
          setBusinessDetails(prev => ({
            ...prev,
            description: data.description
          }));
        }
      } catch (error) {
        console.error('Error updating business description:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">Looking for business ID...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          {error === 'No business selected' && (
            <div className="mt-4">
              <p className="text-gray-600 mb-4">Please select a business or create a new one.</p>
              <button 
                onClick={() => router.push('/admin/new')} 
                className="btn-primary"
              >
                Create New Business
              </button>
            </div>
          )}
          {error !== 'No business selected' && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          )}
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
              Create the foundational business profile to be used as the foundation for our AI "brain"
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
              <p className="text-sm text-gray-900">{businessDetails.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Industry</p>
              <p className="text-sm text-gray-900">{businessDetails.industry || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-900">
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
                {businessDetails.website && businessId && (
                  <WebsiteAnalyzer 
                    websiteUrl={businessDetails.website} 
                    businessId={businessId}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm text-gray-900">{businessDetails.description || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Analysis Details */}
      {analysisData && (
        <BusinessAnalysisDetails
          businessModel={analysisData.businessModel}
          productOffering={analysisData.productOffering}
          valuePropositions={analysisData.valuePropositions}
          differentiationHighlights={analysisData.differentiationHighlights}
        />
      )}

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