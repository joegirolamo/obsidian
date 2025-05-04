import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth } from "next-auth/middleware";

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isConnectPage = request.nextUrl.pathname.startsWith('/connect');
  const isConnectApi = request.nextUrl.pathname.startsWith('/api/connect');

  // Allow access to connect pages and API
  if (isConnectPage || isConnectApi) {
    return NextResponse.next();
  }

  // Redirect to admin if authenticated user tries to access auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
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
  matcher: ['/admin/:path*', '/auth/:path*', '/connect/:path*', '/api/connect/:path*'],
}; 