/**
 * Sign Up Page
 * @module Authentication
 * @group Auth Pages
 * 
 * This page provides the user registration interface for the application,
 * displaying a card with the application logo and sign-up form.
 * It handles authentication state and redirects already authenticated
 * users to their requested destination.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SignUpForm from './sign-up-form';
import LogoWithTheme from '@/components/shared/logo-with-theme';

/**
 * Metadata for the Sign Up page
 * Sets the page title in the browser tab
 */
export const metadata: Metadata = {
  title: 'Sign Up',
};

/**
 * Sign Up Page Component
 * 
 * A server component that renders the user registration interface.
 * Features:
 * - Checks for existing authentication session
 * - Redirects authenticated users to callback URL or home
 * - Renders sign-up card with logo and registration form
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{callbackUrl: string}>} props.searchParams - Search parameters from the URL containing callback URL
 * @returns {JSX.Element|null} The sign-up page or a redirect
 * 
 * @example
 * ```tsx
 * <SignUpPage searchParams={Promise.resolve({callbackUrl: '/dashboard'})} />
 * ```
 */
const SignUpPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  // Extract callback URL from search parameters
  const { callbackUrl } = await props.searchParams;

  // Get current auth session
  const session = await auth();

  // Redirect authenticated users to callback URL or home page
  if (session) {
    return redirect(callbackUrl || '/');
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader className='space-y-4'>
          {/* Application logo with link to home page */}
          <div className='flex-center'>
            <LogoWithTheme 
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </div>
          <CardTitle className='text-center'>Create Account</CardTitle>
        
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Sign-up form component */}
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
