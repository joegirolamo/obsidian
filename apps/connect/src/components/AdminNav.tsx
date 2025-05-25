'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Settings,
  BarChart2,
  FileText,
  Target,
  Building,
  Plus,
  Wrench,
  LineChart,
  Brain
} from 'lucide-react';
import ObsidianLogo from './ObsidianLogo';
import { getBusinessByAdminId } from '@/app/actions/business';

interface Business {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('AdminNav: Fetching businesses for user:', session.user.id);
        const result = await getBusinessByAdminId(session.user.id);
        
        if (result.success && result.businesses) {
          // Sort businesses by creation date (newest first)
          const formattedBusinesses = result.businesses
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(business => ({
              id: business.id,
              name: business.name,
              createdAt: business.createdAt.toString()
            }));
            
          setBusinesses(formattedBusinesses);
          console.log('AdminNav: Businesses fetched:', formattedBusinesses.length);
          
          // Get the business ID from URL params
          const businessId = searchParams.get('businessId');
          console.log('AdminNav: URL businessId param:', businessId);
          
          // If there's a business ID in the URL and it exists in our businesses list
          if (businessId && formattedBusinesses.some(b => b.id === businessId)) {
            const business = formattedBusinesses.find(b => b.id === businessId);
            if (business) {
              console.log('AdminNav: Setting selected business from URL param:', business.id);
              setSelectedBusiness(business);
            }
          }
          // If no business ID in URL but we have businesses, select the first one (most recent)
          // Don't redirect if we're on the new workspace page
          else if (formattedBusinesses.length > 0 && !businessId && !pathname.includes('/admin/new')) {
            console.log('AdminNav: No businessId in URL, selecting most recent:', formattedBusinesses[0].id);
            setSelectedBusiness(formattedBusinesses[0]);
            
            // Only update URL if we're on a business-related page
            if (pathname.startsWith('/admin')) {
              // Update URL with the first business ID
              console.log('AdminNav: Redirecting to business profile with most recent business');
              router.push(`/admin/business-profile?businessId=${formattedBusinesses[0].id}`);
            }
          }
        } else {
          console.log('AdminNav: No businesses found or error fetching businesses', result.error);
        }
      } catch (error) {
        console.error('AdminNav: Error fetching businesses:', error);
      }
      
      setIsLoading(false);
    };

    fetchBusinesses();
  }, [session, searchParams, pathname, router]);

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

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setIsOpen(false);
    
    // Update URL with selected business ID
    console.log('AdminNav: User selected business:', business.id);
    
    // If we're already on the business profile page, force a reload to clear any cached data
    if (pathname.includes('/admin/business-profile')) {
      console.log('AdminNav: Already on business profile, forcing reload with new business');
      // Use a navigation pattern that ensures complete reset
      const navigateWithReset = async () => {
        // First navigate away
        router.push('/admin');
        // Then wait a bit
        await new Promise(resolve => setTimeout(resolve, 50));
        // Then navigate back with new ID
        router.push(`/admin/business-profile?businessId=${business.id}`);
      };
      
      // Execute the navigation
      navigateWithReset();
    } else {
      // Regular navigation to business profile
      router.push(`/admin/business-profile?businessId=${business.id}`);
    }
  };

  const getNavItems = () => {
    const items = [
      {
        label: 'BUSINESS',
        href: '/admin/business-profile',
        subItems: [
          { label: 'Profile', href: '/admin/business-profile', icon: Building },
          { label: 'Goals & KPIs', href: '/admin/business-profile/goals', icon: Target }
        ]
      },
      {
        label: 'INTAKE & ACCESS',
        href: '/admin/tools-metrics/requests',
        subItems: [
          { label: 'Tool Access', href: '/admin/tools-metrics/requests', icon: Wrench },
          { label: 'Metric Requests', href: '/admin/tools-metrics/workbook', icon: LineChart },
          { label: 'Intake Questions', href: '/admin/tools-metrics/intake-questions', icon: FileText }
        ]
      },
      {
        label: 'DVCP',
        href: '/admin/dvcp/scorecards',
        subItems: [
          { label: 'Scorecards', href: '/admin/dvcp/scorecards', icon: Target },
          { label: 'Opportunities', href: '/admin/dvcp/opportunities', icon: BarChart2 }
        ]
      },
      {
        label: 'AI SETUP',
        href: '/admin/ai-brain',
        subItems: [
          { label: 'AI Brain', href: '/admin/ai-brain', icon: Brain }
        ]
      }
    ];

    // Add businessId to all navigation links
    if (selectedBusiness) {
      items.forEach(item => {
        item.subItems.forEach(subItem => {
          const params = new URLSearchParams();
          params.set('businessId', selectedBusiness.id);
          subItem.href = `${subItem.href}?${params.toString()}`;
        });
      });
    }

    return items;
  };

  const isActivePath = (href: string) => {
    // Remove query parameters for path comparison
    const cleanHref = href.split('?')[0];
    const cleanPathname = pathname.split('?')[0];
    
    // For the root admin path, do exact match
    if (cleanHref === '/admin') {
      return cleanPathname === '/admin';
    }
    
    // For other paths, do exact match
    return cleanPathname === cleanHref;
  };

  return (
    <nav className="nav-container flex flex-col bg-gray-900 text-gray-300">
      <div className="flex-1">
        <div className="py-6">
          <div className="px-4">
            <div className="flex items-center gap-3">
              <ObsidianLogo className="w-8 h-8 text-white" />
              <h2 className="text-xl font-semibold text-white">Obsidian</h2>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div 
            ref={dropdownRef}
            className="relative border border-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {selectedBusiness ? (
                  <>
                    <p className="text-sm font-medium text-gray-300 truncate">
                      {selectedBusiness.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {formatDate(selectedBusiness.createdAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-gray-300 truncate">
                    Select a workspace
                  </p>
                )}
              </div>
              <div className="ml-2">
                <svg
                  className={`h-5 w-5 text-gray-500 transform transition-transform ${
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

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 -mx-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {businesses.length > 0 ? (
                    businesses.map(business => (
                      <button
                        key={business.id}
                        className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                          selectedBusiness?.id === business.id 
                            ? 'bg-gray-700 text-white' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        onClick={() => handleBusinessSelect(business)}
                      >
                        <span className="truncate">{business.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No workspaces found
                    </div>
                  )}
                  <Link
                    href="/admin/new"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 border-t border-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    <Plus className="mr-3 h-4 w-4 text-gray-500" />
                    Create Workspace
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="nav-section space-y-6">
          {getNavItems().map((item) => {
            const isActive = isActivePath(item.href);
            
            return (
              <div key={item.href} className="px-3">
                <div className="mb-2">
                  <span className="text-xs font-medium tracking-wider text-gray-500">
                    {item.label}
                  </span>
                </div>
                {item.subItems && (
                  <div className="space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          isActivePath(subItem.href)
                            ? 'bg-gray-800 text-white' 
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <subItem.icon className={`w-4 h-4 mr-3 ${
                          isActivePath(subItem.href) ? 'text-white' : 'text-gray-500'
                        }`} />
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-300">
                  {session?.user?.name?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email || 'user@example.com'}
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 