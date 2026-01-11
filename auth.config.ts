/**
 * Base NextAuth configuration
 * @module AuthConfig
 * @group Authentication
 * 
 * This file defines the minimal required configuration for NextAuth.
 * It is imported by auth.ts which extends it with additional configuration.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';

/**
 * Base authentication configuration
 * 
 * Contains the minimal configuration required by NextAuth:
 * - Custom pages (like sign-in)
 * - Empty callbacks (extended in auth.ts)
 * - Empty providers array (populated in auth.ts)
 */
export const authConfig = {
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    // Empty callbacks object
  },
  providers: [], // Required by NextAuthConfig type
} satisfies NextAuthConfig;
