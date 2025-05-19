"use client";

import { useState, useEffect } from "react";

type Tool = {
  id: string;
  name: string;
  description: string | null;
  status: "REQUESTED" | "GRANTED" | "DENIED" | null;
  isRequested: boolean;
  authUrl?: string;
};

type ToolAccessProps = {
  businessId: string;
  tools: Tool[];
};

export default function ToolAccess({ businessId, tools }: ToolAccessProps) {
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [leadsieUrl, setLeadsieUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeadsieUrl = async () => {
      console.log('[DEBUG] Fetching Leadsie URL for businessId:', businessId);
      try {
        setIsLoading(true);
        const response = await fetch(`/api/business/${businessId}/leadsie-url`);
        console.log('[DEBUG] Leadsie URL response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[DEBUG] Leadsie URL response data:', data);
          
          if (data.url) {
            console.log('[DEBUG] Setting Leadsie URL to:', data.url);
            setLeadsieUrl(data.url);
          } else {
            console.log('[DEBUG] No Leadsie URL found in response');
          }
        } else {
          console.error('[DEBUG] Failed to fetch Leadsie URL, status:', response.status);
        }
      } catch (error) {
        console.error('[DEBUG] Error fetching Leadsie URL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      fetchLeadsieUrl();
    } else {
      console.warn('[DEBUG] No businessId provided to ToolAccess component');
      setIsLoading(false);
    }
  }, [businessId]);

  const getStatusBadge = (status: Tool['status']) => {
    switch (status) {
      case "GRANTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Access Granted
          </span>
        );
      case "REQUESTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Requested
          </span>
        );
      case "DENIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Access Denied
          </span>
        );
      default:
        return null;
    }
  };

  const openLeadsieUrl = () => {
    console.log('[DEBUG] Opening Leadsie URL:', leadsieUrl);
    if (leadsieUrl) {
      window.open(leadsieUrl, '_blank');
    }
  };

  // Filter to only show requested tools
  const requestedTools = tools.filter(tool => tool.isRequested);
  console.log('[DEBUG] Requested tools:', requestedTools.length, 'Has Leadsie URL:', !!leadsieUrl);

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // First, check if Leadsie URL is available
  if (leadsieUrl) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Tool Access</h2>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Click the button below to connect the requested tools.
            </p>
            <button
              onClick={openLeadsieUrl}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Grant Tool Access
            </button>
          </div>
          
          {requestedTools.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Requested Tools:</h3>
              <div className="flex flex-wrap gap-2">
                {requestedTools.map((tool) => (
                  <span 
                    key={tool.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tool.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Then check for no requested tools
  if (requestedTools.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          No tool access requests at this time.
        </div>
      </div>
    );
  }

  // If no Leadsie URL but there are requested tools
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Tool Access</h2>
      </div>
      
      <div className="p-6">
        <div className="text-center text-gray-500">
          Tool access is not configured yet. Please contact your administrator.
        </div>
      </div>
    </div>
  );
} 