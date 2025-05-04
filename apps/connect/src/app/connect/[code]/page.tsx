'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Notification from '@/components/Notification';

interface Tool {
  name: string;
  description: string;
  icon: string;
  authUrl: string;
  isConnected: boolean;
}

export default function ConnectPage() {
  const params = useParams();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        console.log('Component mounted, params:', params);
        console.log('Fetching tools for code:', params.code);
        
        // Ensure we have a code
        if (!params.code) {
          console.error('No connection code provided');
          setError('Invalid connection code');
          return;
        }

        // Construct the full URL
        const apiUrl = `/api/connect/${params.code}`;
        console.log('Making request to:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch tools');
        }
        
        const data = await response.json();
        console.log('API Response data:', data);

        if (!data.tools || !Array.isArray(data.tools)) {
          console.error('Invalid tools data:', data);
          throw new Error('Invalid response format');
        }

        console.log('Received tools:', data.tools);
        setTools(data.tools);
      } catch (err) {
        console.error('Error fetching tools:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [params.code]);

  const handleNotificationClose = () => {
    setShowNotification(false);
  };

  const handleConnect = (authUrl: string) => {
    console.log('Connect button clicked');
    console.log('Auth URL:', authUrl);
    
    if (!authUrl || authUrl === '/admin/settings') {
      console.error('Invalid auth URL:', authUrl);
      window.location.href = '/admin/settings';
      return;
    }
    
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    console.log('Opening OAuth window with URL:', authUrl);
    window.open(
      authUrl,
      'Connect Tool',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {showNotification && <Notification onClose={handleNotificationClose} />}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connect Your Tools</h1>
          <p className="mt-2 text-gray-600">
            Connect your accounts to enable Vokal to access the requested data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="space-y-6">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Tool Icon */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
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
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{tool.name}</h3>
                      <p className="text-sm text-gray-500">{tool.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      tool.isConnected 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tool.isConnected ? 'Connected' : 'Not Connected'}
                    </div>
                    <button
                      onClick={() => handleConnect(tool.authUrl)}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        tool.isConnected
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {tool.isConnected ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 