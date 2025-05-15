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

  const handleToggle = () => {
    console.log('[DEBUG] PublishToggle clicked, current state:', { isPublished, isLoading });
    onToggle();
  };

  // Log every render
  console.log('[DEBUG] PublishToggle rendering:', { isPublished, isLoading });

  return (
    <div 
      className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200"
      onClick={(e) => {
        console.log('[DEBUG] PublishToggle container clicked');
        // Prevent click from bubbling up
        e.stopPropagation();
      }}
    >
      <Switch
        checked={isPublished}
        onChange={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isPublished ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="sr-only">
          {isPublished ? 'Unpublish from portal' : 'Publish to portal'}
        </span>
        <span
          className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            isPublished ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </Switch>
      <span className="text-sm font-medium text-gray-900">
        {isLoading ? 'Updating...' : 'TEST PUBLISH'}
      </span>
    </div>
  );
} 