'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brain, Download, Copy } from 'lucide-react';
import Button from '@/components/Button';

export default function AIBrainPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/business/${businessId}/ai-brain`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch business data');
        }

        const data = await response.json();
        setBusinessData(data);
      } catch (error) {
        console.error('Error fetching business data:', error);
        setBusinessData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [businessId]);

  const handleCopyJSON = () => {
    if (businessData) {
      navigator.clipboard.writeText(JSON.stringify(businessData, null, 2))
        .then(() => {
          setCopySuccess('Copied!');
          setTimeout(() => setCopySuccess(''), 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          setCopySuccess('Failed to copy');
        });
    }
  };

  const handleDownloadJSON = () => {
    if (businessData) {
      const dataStr = JSON.stringify(businessData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `business-brain-${businessData.business?.name || 'data'}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Brain className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold">No Business Data Available</h2>
        <p>Please select a business to view its structured data.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Brain className="w-8 h-8 mr-3 text-blue-500" />
          <h1 className="text-2xl font-bold">Business Brain</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleCopyJSON}
            className="btn-secondary flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copySuccess || 'Copy JSON'}
          </Button>
          <Button 
            onClick={handleDownloadJSON}
            className="btn-primary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="heading-2">Structured Business Data</h2>
          <p className="text-gray-500 text-sm mt-1">
            This is the structured data collected from all parts of your business profile.
            You can use this data to feed AI models or other applications.
          </p>
        </div>
        <div className="card-body">
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[80vh] whitespace-pre-wrap">
            <code className="text-sm">{JSON.stringify(businessData, null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
} 