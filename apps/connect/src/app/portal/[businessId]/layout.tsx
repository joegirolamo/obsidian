import { ReactNode } from 'react';
import ObsidianLogo from '@/components/ObsidianLogo';
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 py-12">
            <ObsidianLogo className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Obsidian</h1>
          </div>
          <PortalStepper />
        </div>
        {children}
      </div>
    </div>
  );
} 