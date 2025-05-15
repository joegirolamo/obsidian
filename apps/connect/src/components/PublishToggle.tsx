import { Switch } from '@headlessui/react';
import { useEffect } from 'react';

interface PublishToggleProps {
  isPublished: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export default function PublishToggle({
  isPublished,
  onToggle,
  isLoading = false
}: PublishToggleProps) {
  // Log on mount and prop changes
  useEffect(() => {
    console.log('[DEBUG] PublishToggle mounted/updated:', { isPublished, isLoading });
  }, [isPublished, isLoading]);

  // Log every render
  console.log('[DEBUG] PublishToggle rendering:', { isPublished, isLoading });

  return (
    <button
      onClick={() => {
        console.log('[DEBUG] PublishToggle clicked, current state:', { isPublished, isLoading });
        onToggle();
      }}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg"
    >
      <div 
        className={`w-4 h-4 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-300'}`} 
      />
      <span>{isPublished ? 'TEST PUBLISHED' : 'TEST UNPUBLISHED'}</span>
      {isLoading && <span>(Loading...)</span>}
    </button>
  );
} 