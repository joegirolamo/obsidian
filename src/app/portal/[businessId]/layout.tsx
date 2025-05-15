import { ReactNode } from 'react';
import { PortalStepper } from './PortalStepper';

export default function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { businessId: string };
}) {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <PortalStepper />
        </div>
        {children}
      </div>
    </div>
  );
} 