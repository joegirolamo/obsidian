'use client';

import { useParams } from 'next/navigation';
import { NavigationButtons } from "@/app/portal/[businessId]/NavigationButtons";
import { useStepNavigation } from '../PortalStepper';

export default function ThankYouPage() {
  const { businessId } = useParams() as { businessId: string };
  const { navigateToStep } = useStepNavigation();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            We've received your information – our team will review and get back to you shortly.
          </p>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => navigateToStep('questions')}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          Back to Questions
        </button>
        <button
          type="button" 
          onClick={() => navigateToStep('metrics')}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          Back to Start
        </button>
      </div>
    </div>
  );
} 