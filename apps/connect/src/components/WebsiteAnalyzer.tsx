'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface WebsiteAnalyzerProps {
  websiteUrl: string;
  businessId: string;
  onAnalysisComplete: (data: any) => void;
}

export default function WebsiteAnalyzer({ 
  websiteUrl, 
  businessId, 
  onAnalysisComplete 
}: WebsiteAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();

  if (!websiteUrl) {
    return null;
  }

  const handleAnalyzeClick = async () => {
    setIsAnalyzing(true);
    setError(null);

    console.log('Analyzing website:', websiteUrl);
    console.log('Session status:', session.status);

    try {
      const response = await fetch('/api/admin/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include credentials to ensure cookies are sent with the request
        credentials: 'include',
        body: JSON.stringify({
          websiteUrl,
          businessId,
          // Include userId from session as fallback
          userId: session?.data?.user?.id,
        }),
      });

      console.log('Analysis response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Analysis error response:', errorData);
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      
      if (result.success && result.data) {
        onAnalysisComplete(result.data);
      } else {
        throw new Error('No analysis data received');
      }
    } catch (error) {
      console.error('Error analyzing website:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleAnalyzeClick}
        disabled={isAnalyzing}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium flex items-center gap-1 transition-colors"
        title="Analyze website with AI"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Analyze</span>
          </>
        )}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
} 