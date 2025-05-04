"use client";

import { useState } from "react";

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

  const handleConnect = async (tool: Tool) => {
    try {
      setRequesting(prev => ({ ...prev, [tool.id]: true }));
      setError(prev => ({ ...prev, [tool.id]: '' }));

      // Get the business code from the API
      const response = await fetch(`/api/portal/${businessId}/code`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get connection code');
      }

      // Get the OAuth URL for the tool
      const authResponse = await fetch(`/api/connect/${data.code}`);
      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Failed to get OAuth URL');
      }

      const toolConfig = authData.tools.find((t: any) => t.name === tool.name);
      if (!toolConfig) {
        throw new Error('Tool configuration not found');
      }

      // Open the OAuth window
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      window.open(
        toolConfig.authUrl,
        'Connect Tool',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
    } catch (err) {
      console.error('Error connecting tool:', err);
      setError(prev => ({ ...prev, [tool.id]: err instanceof Error ? err.message : 'Failed to connect tool' }));
    } finally {
      setRequesting(prev => ({ ...prev, [tool.id]: false }));
    }
  };

  // Filter to only show requested tools
  const requestedTools = tools.filter(tool => tool.isRequested);

  if (requestedTools.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          No tool access requests at this time.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Requested Tools</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {requestedTools.map((tool) => (
          <div
            key={tool.id}
            className="p-6 hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-medium text-gray-900">{tool.name}</h3>
                  {getStatusBadge(tool.status)}
                </div>
                {tool.description && (
                  <p className="mt-2 text-sm text-gray-500">{tool.description}</p>
                )}
                {error[tool.id] && (
                  <p className="mt-2 text-sm text-red-600">{error[tool.id]}</p>
                )}
              </div>
              {!tool.status && (
                <button
                  onClick={() => handleConnect(tool)}
                  disabled={requesting[tool.id]}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {requesting[tool.id] ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 