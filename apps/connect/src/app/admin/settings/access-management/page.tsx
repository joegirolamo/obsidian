'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import Button from '@/packages/ui/src/components/Button';
import Card from '@/packages/ui/src/components/Card';

export default function AccessManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleGrantAllAccess = async () => {
    if (!confirm('Are you sure you want to grant all users access to all businesses? This action cannot be easily reversed.')) {
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/grant-all-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, error: data.error || 'Unknown error occurred' });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Access Management</h1>
      
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Global Access Controls</h2>
          <p className="text-gray-600 mb-6">
            Configure global access settings for all users in the system
          </p>
          
          <div className="space-y-6">
            <div className="border p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-800 dark:text-amber-400 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Warning: Global Access Change
              </h3>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                Granting all users access to all businesses will create access entries for every user
                in the system to view every business. This action is intended for team collaboration
                and internal usage, and should not be used in production environments with client data.
              </p>
            </div>
            
            <Button 
              onClick={handleGrantAllAccess} 
              disabled={isLoading}
              variant="primary"
            >
              {isLoading ? 'Processing...' : 'Grant All Users Access to All Businesses'}
            </Button>
            
            {result && (
              <div className={`p-4 rounded-md flex items-start ${
                result.success 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">
                    {result.success ? 'Success' : 'Error'}
                  </h3>
                  <div className="mt-1 text-sm">
                    {result.success ? result.message : result.error}
                  </div>
                </div>
                <button 
                  onClick={() => setResult(null)} 
                  className="ml-4 flex-shrink-0"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 