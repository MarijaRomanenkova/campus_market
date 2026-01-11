/**
 * Next.js Middleware
 * @module Middleware
 * 
 * This middleware runs before rendering to handle authentication protection
 * for user and admin routes. It checks for authentication tokens and redirects
 * unauthenticated users to the sign-in page.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Authentication Middleware Function
 * 
 * Intercepts requests to protected routes (/user/* and /admin/*) and checks
 * for a valid authentication session. Redirects to the sign-in page if no
 * session token is found, preserving the original URL as a callback.
 * 
 * This provides route-based authentication protection at the middleware level,
 * which runs before any page components are rendered.
 * 
 * @param {NextRequest} request - The incoming Next.js request object
 * @returns {NextResponse} Either redirects to sign-in or continues to the requested page
 */
export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // Check if the pathname starts with /user or /admin
  if (pathname.startsWith('/user') || pathname.startsWith('/admin')) {
    // Get the session token from cookies
    const token = request.cookies.get('next-auth.session-token');
    
    // If not signed in
    if (!token) {
      // Redirect to sign-in page with callback URL
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return NextResponse.next();
}

/**
 * Middleware Configuration
 * 
 * Defines which routes the middleware should run on.
 * This config specifies that the middleware only runs on:
 * - /user/* routes (user dashboard)
 * - /admin/* routes (admin dashboard)
 */
export const config = {
  matcher: ['/user/:path*', '/admin/:path*']
};

