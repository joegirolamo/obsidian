"use client";

import { useStepNavigation } from "./PortalStepper";

type NavigationButtonsProps = {
  showBack?: boolean;
};

export function NavigationButtons({ showBack = true }: NavigationButtonsProps) {
  const { currentIndex, navigateToStep, nextStep, prevStep } = useStepNavigation();

  return (
    <div className="mt-8 flex justify-between">
      {showBack && prevStep && (
        <button
          type="button"
          onClick={() => navigateToStep(prevStep.id)}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          Back
        </button>
      )}
      {nextStep && (
        <button
          type="submit"
          className={`px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${!showBack ? 'ml-auto' : ''}`}
        >
          Continue
        </button>
      )}
    </div>
  );
} 