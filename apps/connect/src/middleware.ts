import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth } from "next-auth/middleware";

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  
  // Log token and cookies for debugging
  const cookies = request.cookies.getAll().map(c => c.name);
  console.log('Middleware request path:', request.nextUrl.pathname);
  console.log('Token present:', !!token);
  console.log('Available cookies:', cookies);
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isConnectPage = request.nextUrl.pathname.startsWith('/connect');
  const isConnectApi = request.nextUrl.pathname.startsWith('/api/connect');
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');
  const isRootAdminPage = request.nextUrl.pathname === '/admin' || request.nextUrl.pathname === '/admin/'; 

  // Allow access to connect pages and API
  if (isConnectPage || isConnectApi) {
    return NextResponse.next();
  }

  // For admin API routes, let the route handlers handle authentication
  if (isAdminApi) {
    console.log('Admin API route detected in middleware, passing through', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Redirect to admin if authenticated user tries to access auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/admin/business-profile', request.url));
  }

  // Redirect root admin page to business profile
  if (isRootAdminPage && token) {
    // Create a URL that preserves existing query parameters
    const url = new URL(request.url);
    url.pathname = '/admin/business-profile';
    return NextResponse.redirect(url);
  }

  // Redirect to login if unauthenticated user tries to access admin pages
  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Check for admin role on admin pages
  if (isAdminPage && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*', '/connect/:path*', '/api/connect/:path*', '/api/admin/:path*'],
}; 