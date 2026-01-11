/**
 * NextAuth API Route
 * @module API
 * @group Authentication
 * 
 * This file exports the NextAuth.js API route handlers for authentication.
 * It's a catch-all route that handles all authentication-related API requests,
 * including sign-in, sign-out, session management, and callbacks.
 */

import { handlers } from '@/auth';
export const { GET, POST } = handlers;
