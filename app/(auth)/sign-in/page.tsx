/**
 * Sign In Page
 * @module Authentication
 * @group Auth Pages
 * 
 * This page provides the main sign-in interface for the application,
 * displaying a card with the application logo and a sign-in form.
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
import CredentialsSignInForm from './credentials-signin-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LogoWithTheme from '@/components/shared/logo-with-theme';

/**
 * Metadata for the Sign In page
 * Sets the page title in the browser tab
 */
export const metadata: Metadata = {
  title: 'Sign In',
};

/**
 * Sign In Page Component
 * 
 * A server component that renders the sign-in interface.
 * Features:
 * - Checks for existing authentication session
 * - Redirects authenticated users to callback URL or home
 * - Renders sign-in card with logo and form
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{callbackUrl: string}>} props.searchParams - Search parameters from the URL containing callback URL
 * @returns {JSX.Element|null} The sign-in page or a redirect
 * 
 * @example
 * ```tsx
 * <SignInPage searchParams={Promise.resolve({callbackUrl: '/dashboard'})} />
 * ```
 */
const SignInPage = async (props: {
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
          <CardTitle className='text-center'>Sign In</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Credentials sign-in form component */}
          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
