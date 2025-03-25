'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings } from 'lucide-react';
import ObsidianLogo from './ObsidianLogo';
import { getBusinessByAdminId } from '@/app/actions/business';

interface Business {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      
      const result = await getBusinessByAdminId(session.user.id);
      if (result.success && result.business) {
        setBusiness({
          id: result.business.id,
          name: result.business.name,
          createdAt: result.business.createdAt.toString()
        });
      }
      setIsLoading(false);
    };

    fetchBusiness();
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getNavItems = () => {
    const items = [
      {
        label: 'Overview',
        href: '/admin',
      }
    ];

    // Only add business-related nav items if we have a business
    if (business) {
      items.push(
        {
          label: 'Business Details',
          href: `/admin/business-details/${business.id}`,
        },
        {
          label: 'Assessments',
          href: '/admin/assessments',
        },
        {
          label: 'Scorecard',
          href: '/admin/scorecard',
        },
        {
          label: 'Opportunities',
          href: '/admin/opportunities',
        }
      );
    }

    return items;
  };

  const isActivePath = (href: string) => {
    if (href === '/admin' && pathname === '/admin') {
      return true;
    }
    return href !== '/admin' && pathname.startsWith(href);
  };

  return (
    <nav className="nav-container flex flex-col">
      <div className="flex-1">
        <div className="py-6">
          <div className="px-4">
            <div className="flex items-center gap-3">
              <ObsidianLogo className="w-8 h-8" />
              <h2 className="text-xl font-semibold">Obsidian</h2>
            </div>
          </div>
        </div>

        {business && (
          <div className="px-4 mb-4">
            <div 
              ref={dropdownRef}
              className="relative border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {business.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {formatDate(business.createdAt)}
                  </p>
                </div>
                <div className="ml-2">
                  <svg
                    className={`h-5 w-5 text-gray-400 transform transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute left-0 right-0 mt-2 -mx-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <Link
                      href="/admin/new"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <svg
                        className="mr-3 h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create Workspace
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="nav-section">
          {getNavItems().map((item) => {
            const isActive = isActivePath(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {session?.user?.name?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email || 'user@example.com'}
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 