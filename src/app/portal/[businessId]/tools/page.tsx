'use client';

import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import ToolAccess from "@/app/portal/[businessId]/ToolAccess";
import { NavigationButtons } from "@/app/portal/[businessId]/NavigationButtons";
import { getBusinessToolsAction, createToolAccessAction } from '@/app/actions/serverActions';
import { useEffect, useState } from 'react';

type ToolStatus = "GRANTED" | "REQUESTED" | "DENIED" | null;

interface Tool {
  id: string;
  name: string;
  description: string | null;
  status: ToolStatus;
}

export default function ToolsPage() {
  const { businessId } = useParams() as { businessId: string };
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
      const toolIds = Array.from(formData.keys());
      const updates = toolIds.map(async (toolId) => {
        return await createToolAccessAction(businessId, toolId);
      });

      await Promise.all(updates);
      redirect(`/portal/${businessId}/thank-you`);
    } catch (err) {
      setError('Failed to request tool access');
      console.error('Error requesting tool access:', err);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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