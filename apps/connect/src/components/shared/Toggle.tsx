import { useEffect } from 'react';

interface ToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  label?: string;
}

export default function Toggle({
  isEnabled,
  onToggle,
  isLoading = false,
  label = 'Publish'
}: ToggleProps) {
  // Log on mount and prop changes
  useEffect(() => {
    console.log('[DEBUG] Toggle mounted/updated:', { isEnabled, isLoading, label });
  }, [isEnabled, isLoading, label]);

  const handleClick = () => {
    console.log('[DEBUG] Toggle clicked, current state:', { isEnabled, isLoading, label });
    if (!isLoading) {
      onToggle();
    }
  };

  // Log every render
  console.log('[DEBUG] Toggle rendering:', { isEnabled, isLoading, label });

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm">
      <span className="mr-2 font-medium">{label}</span>
      <button 
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
          isEnabled ? 'bg-blue-600' : 'bg-gray-200'
        } ${isLoading ? 'opacity-75' : ''} cursor-pointer`}
        onClick={handleClick}
        disabled={isLoading}
        aria-checked={isEnabled}
        role="switch"
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
} 