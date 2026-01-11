/**
 * Type declaration file for extending NextAuth types with custom properties
 * @module NextAuthTypes
 * @group Types
 */

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the default NextAuth Session type with custom user properties
   * Used throughout the application to provide type safety for session object access
   */
  export interface Session {
    user: {
      /** Unique identifier for the user */
      id: string;
      
      /** User role (e.g., 'user', 'admin', 'seller', 'client') */
      role: string;
      
      /** User's full name if provided */
      fullName?: string | null;
      
      /** User's contact phone number if provided */
      phoneNumber?: string | null;
      
      /** Reference to the company ID if the user is associated with a company */
      companyId?: string | null;
      
      /** User's address information, stored as a JSON object or string */
      address?: Record<string, unknown> | string | null;
      
      /** User's token if provided */
      token?: string;
    } & DefaultSession['user'];
  }

  /**
   * Extends the default NextAuth User type with custom user properties
   * Used throughout the application to provide type safety for user object access
   */
  export interface User {
    id: string;
    role: string;
    token?: string;
  }
}
