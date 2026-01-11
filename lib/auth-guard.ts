/**
 * Authentication Guards Module
 * @module Lib/AuthGuard
 * 
 * This module provides authentication and authorization guard functions
 * that can be used to protect routes and API endpoints.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Requires authenticated user
 * 
 * Checks if a user is authenticated and redirects to sign-in page if not.
 * Use this function at the beginning of page components or server actions
 * that should only be accessible to authenticated users.
 * 
 * @returns {Promise<Session>} The user's session if authenticated
 * @throws {Redirect} Redirects to sign-in page if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  return session
}

/**
 * Requires admin privileges
 * 
 * Checks if a user has admin role and redirects to unauthorized page if not.
 * Use this function at the beginning of page components or server actions
 * that should only be accessible to administrators.
 * 
 * @returns {Promise<Session>} The user's session if they have admin privileges
 * @throws {Redirect} Redirects to unauthorized page if user is not an admin
 */
export async function requireAdmin() {
  const session = await auth()

  if (session?.user?.role !== 'admin') {
    redirect('/unauthorized')
  }

  return session
}
