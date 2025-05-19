'use client';

import { useParams, useRouter } from 'next/navigation';
import ToolAccess from "@/app/portal/[businessId]/ToolAccess";
import { NavigationButtons } from "@/app/portal/[businessId]/NavigationButtons";
import { getBusinessToolsAction } from '@/app/actions/serverActions';
import { useEffect, useState } from 'react';

type ToolStatus = "GRANTED" | "REQUESTED" | "DENIED" | null;

interface Tool {
  id: string;
  name: string;
  description: string | null;
  status: ToolStatus;
  isRequested: boolean;
}

export default function ToolsPage() {
  const { businessId } = useParams() as { businessId: string };
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const result = await getBusinessToolsAction(businessId);
        if (result.success && result.tools) {
          setTools(result.tools);
        }
      } catch (err) {
        setError('Failed to load tools');
        console.error('Error loading tools:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [businessId]);

  const handleSubmit = async (formData: FormData) => {
    try {
      router.push(`/portal/${businessId}/questions`);
    } catch (err) {
      setError('Failed to proceed to next step');
      console.error('Error proceeding to next step:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <form action={handleSubmit}>
      <div className="max-w-2xl mx-auto space-y-6">
        <ToolAccess businessId={businessId} tools={tools} />
        <NavigationButtons />
      </div>
    </form>
  );
} 