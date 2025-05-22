'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ObsidianLogo from '@/components/ObsidianLogo';

// Separate component to use search params
function ErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [errorDetail, setErrorDetail] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Try to parse the error message to make it more user-friendly
      if (errorParam.includes('user.update')) {
        setError('Authentication Error');
        setErrorDetail('There was a problem setting up your account. Please try again or contact support.');
      } else if (errorParam.includes('OAuthAccountNotLinked')) {
        setError('Account Not Linked');
        setErrorDetail('This email is already associated with a different sign-in method. Please use your original sign-in method.');
      } else if (errorParam.includes('AccessDenied')) {
        setError('Access Denied');
        setErrorDetail('Your email domain is not authorized to access this application.');
      } else {
        setError('Authentication Error');
        setErrorDetail('There was a problem signing you in. Please try again later.');
      }
      
      // Log the full error for debugging
      console.error('Auth error:', errorParam);
    }
  }, [searchParams]);

  return (
    <div className="text-center mb-6">
      <h2 className="text-xl font-semibold text-red-600">{error}</h2>
      <p className="mt-2 text-gray-600">{errorDetail}</p>
      
      <div className="mt-6 text-center">
        <details className="text-xs text-gray-500 cursor-pointer">
          <summary>Technical Details</summary>
          <div className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-left">
            <pre>{searchParams.get('error')}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}

// Loading fallback component
function ErrorLoading() {
  return (
    <div className="text-center mb-6">
      <h2 className="text-xl font-semibold text-gray-600">Loading...</h2>
      <p className="mt-2 text-gray-500">Please wait while we process your request.</p>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ObsidianLogo className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Obsidian</h1>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <Suspense fallback={<ErrorLoading />}>
            <ErrorContent />
          </Suspense>

          <div className="mt-8 text-center">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 