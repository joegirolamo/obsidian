'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { generateNewAccessCode, createBusiness, getBusinessByAdminId, getBusinessById, updateBusinessDetails, updateBusinessConnections } from '@/app/actions/business';
import EditBusinessModal from '@/components/EditBusinessModal';
import EditMetricModal from '@/components/EditMetricModal';
import { useSession } from 'next-auth/react';
import { MetricType } from '@prisma/client';
import { saveMetricAction, updateMetricAction, deleteMetricAction, createDefaultMetricsAction, createDefaultToolsAction, getBusinessMetricsAction, getBusinessToolsAction, updateToolRequest, deleteAllToolsAction } from '@/app/actions/serverActions';

interface BusinessDetails {
  name: string;
  industry: string;
  website: string;
  description?: string;
}

interface ConnectionRequest {
  id: string;
  name: string;
  isConnected: boolean;
  icon?: string;
}

interface Tool {
  id: string;
  name: string;
  description: string | null;
  status: "GRANTED" | "REQUESTED" | "DENIED" | null;
  isRequested: boolean;
  authUrl?: string;
}

type Metric = {
  id: string;
  name: string;
  description: string | null;
  type: MetricType;
  value: string | null;
  target: string | null;
  isClientRequested: boolean;
};

const BusinessDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const businessId = params?.businessId as string;

  useEffect(() => {
    // Handle invalid business ID
    if (!businessId || businessId === 'default-business-id') {
      router.push('/admin');
    }
  }, [businessId, router]);

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [editModalType, setEditModalType] = useState<'details' | 'connections'>('details');
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessCode, setBusinessCode] = useState<string | null>(null);

  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: "My Business",
    industry: "",
    website: "",
  });

  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([
    { id: '1', name: 'Google Analytics', isConnected: false, icon: 'ga' },
    { id: '2', name: 'Google Ads', isConnected: false, icon: 'gads' },
    { id: '3', name: 'Meta Ads', isConnected: false, icon: 'meta' },
    { id: '4', name: 'Meta Page', isConnected: false, icon: 'meta' },
    { id: '5', name: 'Meta Dataset', isConnected: false, icon: 'meta' },
    { id: '6', name: 'LinkedIn Page', isConnected: false, icon: 'linkedin' },
    { id: '7', name: 'LinkedIn Ads', isConnected: false, icon: 'linkedin' },
    { id: '8', name: 'Shopify', isConnected: false, icon: 'shopify' },
  ]);

  const [tools, setTools] = useState<Tool[]>([]);

  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const result = await getBusinessMetricsAction(businessId as string);
      
      if (result.success && result.metrics) {
        // Only create default metrics if this is a new business
        if (result.metrics.length === 0 && businessId === 'new') {
          const defaultMetricsResult = await createDefaultMetricsAction(businessId as string);
          if (defaultMetricsResult.success && defaultMetricsResult.metrics) {
            const componentMetrics: Metric[] = defaultMetricsResult.metrics.map(m => ({
              id: m.id,
              name: m.name,
              description: m.description,
              type: m.type,
              value: m.value,
              target: m.target,
              isClientRequested: m.isClientRequested
            }));
            setMetrics(componentMetrics);
          }
        } else {
          const componentMetrics: Metric[] = result.metrics.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            type: m.type,
            value: m.value,
            target: m.target,
            isClientRequested: m.isClientRequested
          }));
          setMetrics(componentMetrics);
        }
      }
    };

    if (businessId && businessId !== 'new') {
      fetchMetrics();
    }
  }, [businessId]);

  useEffect(() => {
    const fetchTools = async () => {
      console.log('Fetching tools for businessId:', businessId);
      try {
        const result = await getBusinessToolsAction(businessId);
        console.log('Tools fetch result:', result);
        if (result.success && result.tools) {
          console.log('Setting tools:', result.tools);
          setTools(result.tools);
        } else {
          console.error('Failed to fetch tools:', result.error);
        }
      } catch (error) {
        console.error('Error fetching tools:', error);
      }
    };

    if (businessId && businessId !== 'new') {
      fetchTools();
    }
  }, [businessId]);

  useEffect(() => {
    const initializeBusiness = async () => {
      console.log('Starting business initialization with ID:', businessId);
      console.log('Session user:', session?.user);

      if (!session?.user?.id) {
        console.error('No user session found');
        setError("Please sign in to create a business");
        setIsLoading(false);
        return;
      }

      // Redirect if businessId is invalid
      if (!businessId || businessId === 'default-business-id') {
        console.log('Invalid business ID, redirecting to admin');
        router.push('/admin');
        return;
      }

      try {
        let business;
        if (businessId === "new") {
          console.log('Creating new business for user:', session.user.id);
          business = await createBusiness({
            name: "My Business",
            adminId: session.user.id
          });
          console.log('Create business result:', business);

          if (business.success && business.business) {
            console.log('Business created successfully:', business.business);
            // Create default metrics for new business
            const metricsResult = await createDefaultMetricsAction(business.business.id);
            console.log('Default metrics created:', metricsResult);
            // Create default tools for new business
            const toolsResult = await createDefaultToolsAction(business.business.id);
            console.log('Default tools created:', toolsResult);
            router.push(`/admin/business-details/${business.business.id}`);
          } else {
            console.error('Failed to create business:', business.error);
            setError("Failed to create new business");
            setIsLoading(false);
            return;
          }
        } else {
          console.log('Fetching existing business:', businessId);
          business = await getBusinessById(businessId);
          console.log('Fetch business result:', business);

          if (business.success && business.business) {
            console.log('Setting business details:', business.business);
            setBusinessDetails({
              name: business.business.name,
              industry: business.business.industry || "",
              website: business.business.website || "",
              description: business.business.description || "",
            });
            setBusinessCode(business.business.code);
            // Load saved connections or use defaults
            if (business.business.connections) {
              try {
                const savedConnections = typeof business.business.connections === 'string' 
                  ? JSON.parse(business.business.connections)
                  : business.business.connections;
                if (Array.isArray(savedConnections) && savedConnections.length > 0) {
                  setConnectionRequests(savedConnections);
                }
              } catch (e) {
                console.error('Error parsing connections:', e);
              }
            }
          } else {
            console.error('Business not found:', businessId);
            setError("Business not found. Please check the URL and try again.");
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error in initializeBusiness:', error);
        setError("An error occurred while initializing your business.");
      }
      
      setIsLoading(false);
    };

    initializeBusiness();
  }, [session, businessId, router]);

  const handleEditClick = (type: 'details' | 'connections') => {
    setEditModalType(type);
    setShowEditModal(true);
  };

  const handleMetricClick = (metric: Metric | null) => {
    setSelectedMetric(metric);
    setShowMetricModal(true);
  };

  const handleSave = async (data: any) => {
    if (editModalType === 'details') {
      const businessData = data as BusinessDetails;
      const result = await updateBusinessDetails(businessId, businessData);
      if (result.success) {
        setBusinessDetails(businessData);
      } else {
        setError('Failed to update business details');
      }
    } else if (editModalType === 'connections') {
      // The modal sends data in the format { connections: ConnectionRequest[] }
      const updatedConnections = (data as { connections: ConnectionRequest[] }).connections;
      const result = await updateBusinessConnections(businessId, updatedConnections);
      if (result.success) {
        setConnectionRequests(updatedConnections);
      } else {
        setError('Failed to update connections');
      }
    }
    setShowEditModal(false);
  };

  const handleMetricSave = async (metric: Metric) => {
    try {
      console.log('Current businessId:', businessId);
      console.log('Current params:', params);

      if (!businessId) {
        setError('No business ID available. Please try refreshing the page.');
        return;
      }

      // Verify business exists before proceeding
      const business = await getBusinessById(businessId);
      if (!business.success || !business.business) {
        console.error('Business not found when saving metric:', businessId);
        setError('Business not found. Please check the URL and try again.');
        return;
      }

      if (selectedMetric) {
        console.log('Updating existing metric:', { metric, businessId });
        const result = await updateMetricAction(selectedMetric.id, businessId, {
          name: metric.name,
          description: metric.description || undefined,
          type: metric.type,
          isClientRequested: metric.isClientRequested,
          value: metric.value || undefined,
          target: metric.target || undefined
        });
        if (result.success && result.metric) {
          const updatedMetric: Metric = {
            id: result.metric.id,
            name: result.metric.name,
            description: result.metric.description,
            type: result.metric.type,
            value: result.metric.value,
            target: result.metric.target,
            isClientRequested: result.metric.isClientRequested
          };
          setMetrics(metrics.map(m => m.id === metric.id ? updatedMetric : m));
          setShowMetricModal(false);
        } else {
          console.error('Failed to update metric:', result.error);
          setError(`Failed to update metric: ${result.error}`);
        }
      } else {
        // Creating a new metric
        console.log('Creating new metric:', { metric, businessId });
        
        if (!businessId) {
          console.error('No business ID available');
          setError('No business ID available. Please try refreshing the page.');
          return;
        }

        const result = await saveMetricAction(businessId, {
          name: metric.name,
          description: metric.description || undefined,
          type: metric.type,
          isClientRequested: metric.isClientRequested || false,
          value: metric.value || undefined,
          target: metric.target || undefined
        });

        if (result.success && result.metric) {
          const newMetric: Metric = {
            id: result.metric.id,
            name: result.metric.name,
            description: result.metric.description,
            type: result.metric.type,
            value: result.metric.value,
            target: result.metric.target,
            isClientRequested: result.metric.isClientRequested
          };
          setMetrics([...metrics, newMetric]);
          setShowMetricModal(false);
          setError(null); // Clear any existing errors
        } else {
          const errorMessage = result.error || 'Unknown error occurred';
          console.error('Failed to save new metric:', errorMessage);
          setError(`Failed to save metric: ${errorMessage}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Error in handleMetricSave:', err);
      setError(`Error saving metric: ${errorMessage}`);
    }
  };

  const handleMetricDelete = async (metricId: string) => {
    if (confirm('Are you sure you want to delete this metric?')) {
      const result = await deleteMetricAction(metricId, businessId);
      if (result.success) {
        setMetrics(metrics.filter(m => m.id !== metricId));
      }
    }
  };

  const connectedCount = connectionRequests.filter(c => c.isConnected).length;

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
            <h1 className="heading-1">Business Details</h1>
            <p className="text-body mt-2">
              Manage business information and connection requests
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
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

        {/* Tool Access Requests Card */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="heading-2">Tool Access Requests</h2>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="mt-6">
              <div className="space-y-4">
                {tools.map(tool => (
                  <div key={tool.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {/* Tool Icon */}
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {tool.name === 'Google Analytics' && (
                            <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.5 20.5h-17v-17h17v17zm-16-1h15v-15h-15v15z"/>
                              <path d="M12 16.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"/>
                              <path d="M12 9.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"/>
                              <path d="M12 13c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
                            </svg>
                          )}
                          {tool.name === 'Google Ads' && (
                            <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                          )}
                          {(tool.name === 'Meta Ads' || tool.name === 'Meta Page' || tool.name === 'Meta Dataset') && (
                            <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                          )}
                          {(tool.name === 'LinkedIn Page' || tool.name === 'LinkedIn Ads') && (
                            <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          )}
                          {tool.name === 'Shopify' && (
                            <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M15.337 3l.75 2.25H13.5v1.5h2.25l-.75 2.25H12v1.5h2.587l-.75 2.25H12V15h1.5l-.75 2.25H9.75L9 15h1.5v-1.5H9l.75-2.25H12v-1.5H9.413l.75-2.25H12v-1.5H9.75L10.5 3h4.837zM12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{tool.name}</h3>
                          {tool.description && (
                            <p className="text-sm text-gray-500">{tool.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        tool.isRequested 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tool.isRequested ? 'Requesting' : 'Not requesting'}
                      </div>
                      <Switch
                        checked={tool.isRequested}
                        onChange={async () => {
                          const updatedTools = tools.map(t =>
                            t.id === tool.id ? { ...t, isRequested: !t.isRequested } : t
                          );
                          setTools(updatedTools);
                          await updateToolRequest(tool.id, !tool.isRequested);
                        }}
                        className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          tool.isRequested ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]'
                        }`}
                      >
                        <span className="sr-only">
                          {tool.isRequested ? 'Stop requesting' : 'Request from client'}
                        </span>
                        <span
                          className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            tool.isRequested ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </Switch>
                    </div>
                  </div>
                ))}
                {tools.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No tools available. They will be created when a client first accesses the portal.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Workbook Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-2">Metric Workbook</h2>
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
                  <th className="text-left pb-4 text-sm font-medium text-gray-500">Target Value</th>
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
                      <span className="text-gray-600">{metric.target || '-'}</span>
                    </td>
                    <td className="py-4 pl-4">
                      <Switch
                        checked={metric.isClientRequested}
                        onChange={async () => {
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
      </div>

      <EditBusinessModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        type={editModalType}
        businessDetails={businessDetails || { name: '' }}
        connectionRequests={connectionRequests || []}
        onSave={async (data) => {
          await handleSave(data);
          setShowEditModal(false);
        }}
      />

      <EditMetricModal
        isOpen={showMetricModal}
        onClose={() => setShowMetricModal(false)}
        metric={selectedMetric}
        onSave={handleMetricSave}
      />
    </div>
  );
}

export default BusinessDetailsPage; 