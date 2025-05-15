'use client';

import { ReactNode, useEffect, use } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PortalStepper } from './PortalStepper';

const INTAKE_PATHS = ['metrics', 'tools', 'questions'];
const EXCLUDED_PATHS = ['dashboard', 'thank-you'];

export default function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  // Properly unwrap params using React.use()
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;
  
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname.split('/').pop() || '';
  const showStepper = INTAKE_PATHS.includes(currentPath);

  useEffect(() => {
    // Don't check on dashboard or thank-you page
    if (EXCLUDED_PATHS.includes(currentPath)) {
      return;
    }

    async function checkPublishStatus() {
      try {
        const response = await fetch(`/api/portal/${businessId}/publish-status`);

        if (!response.ok) {
          throw new Error('Failed to check publish status');
        }

        const data = await response.json();
        
        // If either scorecard or opportunities are published, redirect to dashboard
        if (data.publishedTypes?.scorecard || data.publishedTypes?.opportunities) {
          router.replace(`/portal/${businessId}/dashboard`);
        }
      } catch (error) {
        console.error('Error checking publish status:', error);
      }
    }

    checkPublishStatus();
  }, [currentPath, businessId, router]);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {showStepper && <PortalStepper />}
        </div>
        <div className="pb-[50px]">
          {children}
        </div>
      </div>
    </div>
  );
} 