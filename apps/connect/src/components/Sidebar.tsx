import Link from 'next/link';
import { LayoutDashboard, Building2, Wrench, LineChart, Target, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';

const Sidebar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getLinkProps = (path: string) => {
    const isActive = pathname === path;
    return {
      href: `${path}${searchParams.get('businessId') ? `?businessId=${searchParams.get('businessId')}` : ''}`,
      className: cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
        isActive && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
      )
    };
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-[60px] items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg">Admin Portal</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto px-3">
        <div className="space-y-1">
          <Link {...getLinkProps('/admin')}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </Link>
          <Link {...getLinkProps('/admin/business-profile')}>
            <Building2 className="h-4 w-4" />
            <span>Business Profile</span>
          </Link>
          <Link {...getLinkProps('/admin/tools-metrics/requests')}>
            <Wrench className="h-4 w-4" />
            <span>Tool Requests</span>
          </Link>
          <Link {...getLinkProps('/admin/tools-metrics/workbook')}>
            <LineChart className="h-4 w-4" />
            <span>Metric Workbook</span>
          </Link>
          <Link {...getLinkProps('/admin/opportunities')}>
            <Target className="h-4 w-4" />
            <span>Opportunities</span>
          </Link>
          <Link {...getLinkProps('/admin/settings')}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 