'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@headlessui/react';
import { getAllToolRequestsAction, updateToolRequest } from '@/app/actions/serverActions';

interface Tool {
  id: string;
  name: string;
  description: string | null;
  isRequested: boolean;
}

export default function ToolAccessRequests() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      const businessId = searchParams.get('businessId');
      
      if (!businessId) {
        setError('No business selected');
        setIsLoading(false);
        return;
      }

      try {
        // @ts-ignore - TODO: Update getAllToolRequestsAction to accept businessId
        const result = await getAllToolRequestsAction(businessId);
        if (result.success && result.tools) {
          setTools(result.tools);
        } else {
          setError(result.error || 'Failed to fetch tools');
        }
      } catch (error) {
        console.error('Error fetching tools:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [searchParams]);

  const handleToolRequestToggle = async (toolId: string, isRequested: boolean) => {
    try {
      const result = await updateToolRequest(toolId, isRequested);
      if (result.success) {
        setTools(tools.map(tool => 
          tool.id === toolId ? { ...tool, isRequested } : tool
        ));
      } else {
        setError(result.error || 'Failed to update tool request');
      }
    } catch (error) {
      console.error('Error updating tool request:', error);
      setError('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
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
                <h3 className="text-sm font-medium text-gray-900">{tool.name}</h3>
                {tool.description && (
                  <p className="text-sm text-gray-500">{tool.description}</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <Switch
              checked={tool.isRequested}
              onChange={() => handleToolRequestToggle(tool.id, !tool.isRequested)}
              className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                tool.isRequested ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]'
              }`}
            >
              <span className="sr-only">
                {tool.isRequested ? 'Disable tool request' : 'Enable tool request'}
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
          No tools available for request.
        </div>
      )}
    </div>
  );
} 