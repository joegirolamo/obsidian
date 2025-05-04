'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Notification from '@/components/Notification';

interface AgencyTool {
  name: string;
  description: string;
  isConfigured: boolean;
  icon: string;
  requiredEnvVars: string[];
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(true);
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
        const response = await fetch('/api/admin/tool-configurations');
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
  }, []);

  const handleNotificationClose = () => {
    setShowNotification(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('success');
    url.searchParams.delete('error');
    router.replace(url.pathname);
  };

  return (
    <div>
      {showNotification && <Notification onClose={handleNotificationClose} />}
      
      <div className="mb-8">
        <h1 className="heading-1">Agency Settings</h1>
        <p className="text-body mt-2">
          View the configuration status of your agency's tool connections
        </p>
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
    </div>
  );
}