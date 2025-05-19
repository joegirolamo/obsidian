"use client";

import { usePathname, useRouter } from 'next/navigation';

export const steps = [
  { id: 'metrics', label: 'Business Metrics' },
  { id: 'tools', label: 'Tool Access' },
  { id: 'questions', label: 'Questions' },
];

export function useStepNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentStep = pathname.split('/').pop() || 'metrics';
  const businessId = pathname.split('/')[2];
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const isThankYouPage = currentStep === 'thank-you';

  const navigateToStep = (stepId: string) => {
    router.push(`/portal/${businessId}/${stepId}`);
  };

  return {
    currentStep,
    currentIndex,
    businessId,
    navigateToStep,
    isThankYouPage,
    nextStep: currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null,
    prevStep: currentIndex > 0 ? steps[currentIndex - 1] : null,
  };
}

export function PortalStepper() {
  const { currentStep, currentIndex, navigateToStep, isThankYouPage } = useStepNavigation();

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8">
      <div className="grid grid-cols-3 gap-4">
        {/* The line that connects the steps */}
        <div className="absolute top-12 col-span-3 mx-auto w-[calc(66.666%-2rem)] h-0.5 bg-gray-200" style={{ left: 'calc(16.666% + 1rem)' }} />
        
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          // Mark all steps as past (completed) when on the thank-you page
          const isPast = isThankYouPage || currentIndex > index;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => navigateToStep(step.id)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  relative z-10 transition-colors border border-gray-200 bg-white
                  ${isActive ? 'text-gray-900' : 'text-gray-500'}
                  hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                `}
              >
                {isPast ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </button>
              <span className={`
                mt-2 text-sm font-medium
                ${isActive ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
} 