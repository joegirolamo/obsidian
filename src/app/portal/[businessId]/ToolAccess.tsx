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

  // Filter to only show requested tools
  const requestedTools = tools.filter(tool => tool.isRequested);

  if (requestedTools.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="text-center text-gray-500">
          No tool access requests at this time.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <div className="space-y-6">
        {requestedTools.map((tool) => (
          <div
            key={tool.id}
            className="grid grid-cols-2 gap-8 items-start p-4 border rounded-lg"
          >
            <div>
              <h3 className="text-base font-medium text-gray-900">{tool.name}</h3>
              {tool.description && (
                <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
              )}
              {error[tool.id] && (
                <p className="mt-1 text-sm text-red-600">{error[tool.id]}</p>
              )}
            </div>
            <div className="flex items-center justify-end space-x-4">
              {getStatusBadge(tool.status)}
              {!tool.status && tool.authUrl && (
                <a
                  href={tool.authUrl}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Authenticate
                </a>
              )}
              {!tool.status && !tool.authUrl && (
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name={tool.id}
                    className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Request Access</span>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 