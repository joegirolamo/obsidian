'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '../../../packages/utils';

const subNavigation = [
  { name: 'General', href: '/admin/settings' },
  { name: 'Access Management', href: '/admin/settings/access-management' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {subNavigation.map((item) => (
            <Link
              key={item.name}
              href={`${item.href}${searchParams.get('businessId') ? `?businessId=${searchParams.get('businessId')}` : ''}`}
              className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                pathname === item.href
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
} 