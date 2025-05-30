'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Notification from '@/components/Notification';
import Button from '@/components/Button';
import { AlertCircle, Save, X } from 'lucide-react';

interface AgencyTool {
  name: string;
  description: string;
  isConfigured: boolean;
  icon: string;
  requiredEnvVars: string[];
}

interface AIProvider {
  name: string;
  isConfigured: boolean;
  requiredEnvVars: string[];
  defaultModel?: string;
  availableModels?: string[];
}

interface AIConfigForm {
  provider: string;
  apiKey: string;
  model: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiProviders, setAIProviders] = useState<AIProvider[]>([]);
  const [aiConfigForm, setAIConfigForm] = useState<AIConfigForm>({
    provider: 'OpenAI',
    apiKey: '',
    model: 'gpt-4.1',
    isActive: true
  });
  const [aiConfigurations, setAIConfigurations] = useState<any[]>([]);
  const [aiConfigError, setAIConfigError] = useState<string | null>(null);
  const [aiConfigSuccess, setAIConfigSuccess] = useState<string | null>(null);
  
  const [tools, setTools] = useState<AgencyTool[]>([
    {
      name: 'Google Analytics',
      description: 'Configure your agency Google Analytics account for client connections',
      isConfigured: false,
      icon: 'ga',
      requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    },
    {
      name: 'Google Ads',
      description: 'Configure your agency Google Ads account for client connections',
      isConfigured: false,
      icon: 'gads',
      requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    },
    {
      name: 'Meta Business Manager',
      description: 'Configure your agency Meta Business Manager account for client connections',
      isConfigured: false,
      icon: 'meta',
      requiredEnvVars: ['META_CLIENT_ID', 'META_CLIENT_SECRET']
    },
    {
      name: 'LinkedIn Business Manager',
      description: 'Configure your agency LinkedIn Business Manager account for client connections',
      isConfigured: false,
      icon: 'linkedin',
      requiredEnvVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET']
    },
    {
      name: 'Shopify Partner',
      description: 'Configure your agency Shopify Partner account for client connections',
      isConfigured: false,
      icon: 'shopify',
      requiredEnvVars: ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_NAME']
    }
  ]);

  useEffect(() => {
    const fetchToolConfigurations = async () => {
      try {
        console.log('Fetching tool configurations with user:', session?.user?.id);
        
        if (!session?.user?.id) {
          console.log('No user session found for tool config fetch');
          return;
        }
        
        const response = await fetch('/api/admin/tool-configurations', {
          credentials: 'include' // Include cookies in the request
        });
        
        console.log('Tool Config API response status:', response.status);
        
        if (!response.ok) {
          console.error('Error fetching tool configurations:', response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setTools(prev => prev.map(tool => {
            const config = data.configurations.find((c: any) => c.name === tool.name);
            return {
              ...tool,
              isConfigured: config?.isConfigured || false,
              requiredEnvVars: config?.requiredEnvVars || tool.requiredEnvVars
            };
          }));
        }
      } catch (error) {
        console.error('Error fetching tool configurations:', error);
      }
    };

    fetchToolConfigurations();
  }, [session]);

  // Fetch AI configurations
  useEffect(() => {
    const fetchAIConfigurations = async () => {
      try {
        console.log('Fetching AI configurations with user:', session?.user?.id);
        
        if (!session?.user?.id) {
          console.log('No user session found for AI config fetch');
          return;
        }
        
        const response = await fetch('/api/admin/ai-configuration', {
          credentials: 'include' // Include cookies in the request
        });
        
        console.log('AI Config API GET response status:', response.status);
        
        if (!response.ok) {
          console.error('Error fetching AI configurations:', response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAIProviders(data.providers || []);
          setAIConfigurations(data.configurations || []);
          
          // Set default model from first provider if available
          if (data.providers?.length > 0) {
            const provider = data.providers[0];
            setAIConfigForm(prev => ({
              ...prev,
              model: provider.defaultModel || prev.model
            }));
          }

          // If we have a configured provider, populate the form
          if (data.configurations?.length > 0) {
            const config = data.configurations[0];
            setAIConfigForm({
              provider: config.provider,
              apiKey: config.apiKey,
              model: config.model,
              isActive: config.isActive
            });
          }
        }
      } catch (error) {
        console.error('Error fetching AI configurations:', error);
      }
    };

    fetchAIConfigurations();
  }, [session]);

  // Add navigation debugging
  useEffect(() => {
    console.log('Settings page mounted. Current pathname:', window.location.pathname);
    console.log('Settings page search params:', window.location.search);
  }, []);

  const handleNotificationClose = () => {
    setShowNotification(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('success');
    url.searchParams.delete('error');
    router.replace(url.pathname);
  };

  const handleAIFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setAIConfigForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAIFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAIConfigError(null);
    setAIConfigSuccess(null);
    
    try {
      // Validate form
      if (!aiConfigForm.provider || !aiConfigForm.apiKey || !aiConfigForm.model) {
        setAIConfigError('All fields are required');
        return;
      }
      
      // Get the existing configuration if any
      const existingConfig = aiConfigurations.length > 0 ? aiConfigurations[0] : null;
      
      const response = await fetch('/api/admin/ai-configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...(existingConfig?.id ? { id: existingConfig.id } : {}),
          provider: aiConfigForm.provider,
          apiKey: aiConfigForm.apiKey,
          model: aiConfigForm.model,
          isActive: aiConfigForm.isActive
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAIConfigSuccess('AI configuration saved successfully');
          
          // Refresh the configurations list
          const updatedResponse = await fetch('/api/admin/ai-configuration');
          if (updatedResponse.ok) {
            const updatedData = await updatedResponse.json();
            if (updatedData.success) {
              setAIConfigurations(updatedData.configurations || []);
            }
          }
        } else {
          setAIConfigError(data.error || 'Failed to save AI configuration');
        }
      } else {
        setAIConfigError('Failed to save AI configuration');
      }
    } catch (error) {
      console.error('Error saving AI configuration:', error);
      setAIConfigError('An error occurred while saving the AI configuration');
    }
  };

  return (
    <div>
      {showNotification && <Notification onClose={handleNotificationClose} />}
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Agency Settings</h1>
            <p className="text-body mt-2">
              View the configuration status of your agency's tool connections
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* AI Configuration Card */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="heading-2">AI Configuration</h2>
        </div>
        <div className="card-body">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
              <button 
                className="ml-auto text-red-500 hover:text-red-700"
                onClick={() => setError(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
              <div className="flex-shrink-0 mr-2">✓</div>
              <p>{success}</p>
              <button 
                className="ml-auto text-green-500 hover:text-green-700"
                onClick={() => setSuccess(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="p-6 border border-gray-100 rounded-lg">
              <h3 className="text-lg font-medium mb-4">OpenAI Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    value={aiConfigForm.apiKey}
                    onChange={handleAIFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter your OpenAI API key"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    name="model"
                    value={aiConfigForm.model}
                    onChange={handleAIFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {aiProviders.find(p => p.name === 'OpenAI')?.availableModels?.map(model => (
                      <option key={model} value={model}>{model}</option>
                    )) || (
                      <>
                        <option value="gpt-4.5">gpt-4.5</option>
                        <option value="gpt-4.1">gpt-4.1</option>
                        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                        <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                        <option value="gpt-4o">gpt-4o</option>
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="o3">o3</option>
                        <option value="o4-mini">o4-mini</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={aiConfigForm.isActive}
                    onChange={handleAIFormChange}
                    className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAIFormSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Configuration'}
                    {!isLoading && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="heading-2">Tool Configurations</h2>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="p-6 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-4">
                  {/* Tool Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {tool.icon === 'ga' && (
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 20.5h-17v-17h17v17zm-16-1h15v-15h-15v15z"/>
                        <path d="M12 16.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"/>
                        <path d="M12 9.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"/>
                        <path d="M12 13c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
                      </svg>
                    )}
                    {tool.icon === 'gads' && (
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    )}
                    {tool.icon === 'meta' && (
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    )}
                    {tool.icon === 'linkedin' && (
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                    {tool.icon === 'shopify' && (
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.337 3l.75 2.25H13.5v1.5h2.25l-.75 2.25H12v1.5h2.587l-.75 2.25H12V15h1.5l-.75 2.25H9.75L9 15h1.5v-1.5H9l.75-2.25H12v-1.5H9.413l.75-2.25H12v-1.5H9.75L10.5 3h4.837zM12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">{tool.name}</h3>
                        <p className="text-sm text-gray-500">{tool.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        tool.isConfigured 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {tool.isConfigured ? 'Configured' : 'Not Configured'}
                      </div>
                    </div>
                    {!tool.isConfigured && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Required environment variables:</p>
                        <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                          {tool.requiredEnvVars.map(varName => (
                            <li key={varName}>{varName}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900">AI Configuration</h3>
        
        {aiConfigurations.length === 0 && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No AI configuration found. This is required for PDF processing and insights generation. Please configure your AI settings below.
                </p>
              </div>
            </div>
          </div>
        )}

        {aiConfigError && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{aiConfigError}</p>
              </div>
            </div>
          </div>
        )}

        {aiConfigSuccess && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{aiConfigSuccess}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleAIFormSubmit} className="mt-5 space-y-4">
          {/* ... existing code ... */}
        </form>
      </div>
    </div>
  );
}