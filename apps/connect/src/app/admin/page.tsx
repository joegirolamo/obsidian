'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBusinessByAdminId } from '@/app/actions/business';
import { useSession } from 'next-auth/react';

export default function AdminOverviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  // The main purpose of this page is to redirect to business profile
  useEffect(() => {
    const fetchBusinessAndRedirect = async () => {
      console.log('AdminPage: Checking for businesses to redirect');
      
      if (!session?.user?.id) {
        if (status === 'unauthenticated') {
          router.push('/auth/signin');
        }
        return;
      }
      
      try {
        console.log('AdminPage: Fetching businesses for user:', session.user.id);
        const result = await getBusinessByAdminId(session.user.id);
        
        if (result.success && result.businesses && result.businesses.length > 0) {
          // Sort businesses by creation date (newest first)
          const sortedBusinesses = [...result.businesses].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          // Get the most recent business
          const mostRecentBusiness = sortedBusinesses[0];
          console.log('AdminPage: Most recent business found:', mostRecentBusiness.id);
          
          // Redirect to the business profile page with the business ID
          const redirectUrl = `/admin/business-profile?businessId=${mostRecentBusiness.id}`;
          console.log('AdminPage: Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        } else {
          console.log('AdminPage: No businesses found or error in response:', result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AdminPage: Error fetching businesses:', error);
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchBusinessAndRedirect();
    }
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This content will only show if there are no businesses
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Dashboard</h1>
            <p className="text-body mt-2">
              Create your first workspace to get started
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="heading-2">Getting Started</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-4">
            You don't have any workspaces yet. Create your first workspace to start using Obsidian.
          </p>
          <button 
            onClick={() => router.push('/admin/new')}
            className="btn-primary"
          >
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
} 