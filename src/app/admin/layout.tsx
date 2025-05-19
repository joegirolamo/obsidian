"use client";

import AdminNav from '@/components/admin/AdminNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <div className="fixed inset-y-0 left-0 w-64 overflow-hidden">
        <AdminNav />
      </div>
      <main className="flex-1 ml-64 bg-[#F8F9FA]">
        <div className="layout-container py-8 px-6">
          {children}
        </div>
      </main>
    </div>
  );
} 