'use client';

import { useParams } from 'next/navigation';
import { NavigationButtons } from "@/app/portal/[businessId]/NavigationButtons";

export default function ThankYouPage() {
  const { businessId } = useParams() as { businessId: string };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Thank You!</h2>
        <p className="text-gray-600 mb-8">
          We've received your information and tool access requests. Our team will review them and get back to you shortly.
        </p>
      </div>
      <NavigationButtons showBack={false} />
    </div>
  );
} 