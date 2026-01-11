/**
 * Complete NextAuth configuration and authentication system
 * @module Auth
 * @group Authentication
 * 
 * This file extends the base authentication configuration from auth.config.ts
 * and implements the full authentication system including:
 * - Credential-based authentication (email/password)
 * - Session management with JWT strategy
 * - Custom callbacks for session and token handling
 * - Database integration with Prisma adapter
 * - Shopping cart merging during authentication
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';
import { compare } from 'bcrypt-ts';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Complete authentication configuration
 * 
 * Extends the base configuration from auth.config.ts with:
 * - Session configuration (JWT strategy)
 * - Prisma adapter for database integration
 * - Cookie settings for various authentication tokens
 * - Credential provider for email/password login
 * - Callbacks for session and JWT handling
 */
export const config = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  adapter: PrismaAdapter(prisma),
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    /**
     * Credentials provider for email/password authentication
     * 
     * Validates user credentials against the database:
     * 1. Finds user by email
     * 2. Compares password hash
     * 3. Returns user data or null if authentication fails
     */
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        // Find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // Check if user exists and if the password matches
        if (user && user.password) {
          const isMatch = await compare(
            credentials.password as string,
            user.password
          );

          // If password is correct, return user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // If user does not exist or password does not match return null
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Callback to customize session object
     * 
     * Runs when a session is checked.
     * Enhances the session with user data from the token:
     * - Sets user ID (sub claim from token)
     * - Sets user role
     * - Updates name if session was updated
     * 
     * @param session - Current session object
     * @param user - User object from the database
     * @param trigger - What triggered this callback (e.g., 'update')
     * @param token - JWT token containing user data
     * @returns Enhanced session object
     */
    async session({ session, user, trigger, token }: any) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // If there is an update, set the user name
      if (trigger === 'update') {
        session.user.name = user.name;
      }

      return session;
    },
    /**
     * Callback to customize JWT token
     * 
     * Runs when a JWT is created or updated.
     * Enhances the token with additional user data:
     * - Sets user ID and role
     * - Handles default name (using email if name is 'NO_NAME')
     * - Merges shopping carts during sign-in/sign-up
     * - Updates token on session updates
     * 
     * @param token - Current token object
     * @param user - User object from database or credentials
     * @param trigger - What triggered this callback (e.g., 'signIn', 'update')
     * @param session - Current session object
     * @returns Enhanced token object
     */
    async jwt({ token, user, trigger, session }: any) {
      // Assign user fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;

        // If user has no name then use the email
        if (user.name === 'NO_NAME') {
          token.name = user.email!.split('@')[0];

          // Update database to reflect the token name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }

        if (trigger === 'signIn' || trigger === 'signUp') {
          const cookiesObject = await cookies();
          const sessionCartId = cookiesObject.get('sessionCartId')?.value;

          if (sessionCartId) {
            const sessionCart = await prisma.cart.findFirst({
              where: { sessionCartId },
            });

            if (sessionCart) {
              // Delete current user cart
              await prisma.cart.deleteMany({
                where: { userId: user.id },
              });

              // Assign new cart
              await prisma.cart.update({
                where: { id: sessionCart.id },
                data: { userId: user.id },
              });
            }
          }
        }
      }

      // Handle session updates
      if (session?.user.name && trigger === 'update') {
        token.name = session.user.name;
      }

      return token;
    },
  },
};

/**
 * NextAuth handlers and utility functions
 * 
 * - handlers: API route handlers for NextAuth
 * - auth: Function to get the session and user
 * - signIn: Function to programmatically sign in
 * - signOut: Function to programmatically sign out
 */
export const { handlers, auth, signIn, signOut } = NextAuth(config);
