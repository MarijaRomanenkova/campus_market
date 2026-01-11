/**
 * Credentials Sign-In Form Component
 * @module Authentication
 * @group Auth Components
 * 
 * This client component handles user authentication with email and password,
 * utilizing React Server Actions for form submission and state management.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithCredentials } from '@/lib/actions/user.actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Form for signing in with credentials (email/password)
 * 
 * This component renders a form with email and password fields,
 * handles form submission via React Server Actions, displays error messages,
 * and redirects to the requested page on successful authentication.
 * 
 * Features:
 * - Email and password input fields with validation
 * - Form submission state management
 * - Error message display
 * - Redirection to callback URL on success
 * - Link to sign-up page for new users
 * 
 * @component
 * @example
 * ```tsx
 * <CredentialsSignInForm />
 * ```
 */
const CredentialsSignInForm = () => {
  /**
   * Action state from the signInWithCredentials server action
   * 
   * @type {[{ success: boolean, message: string }, Function]}
   */
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: '',
  });
  const router = useRouter();
  
  /**
   * Search parameters from the URL, used to extract callback URL
   * @type {URLSearchParams}
   */
  const searchParams = useSearchParams();
  
  /**
   * URL to redirect to after successful sign-in
   * Defaults to home page if not specified
   * @type {string}
   */
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  /**
   * Effect to handle successful authentication
   * Forces a full page reload to initialize the session properly
   */
  useEffect(() => {
    if (data?.success) {
      if (data.requirePasswordChange && data.resetToken) {
        // If password change is required, redirect to reset password page
        router.push(`/reset-password?token=${data.resetToken}&required=1`);
      } else {
        // Standard login - force a full page reload to initialize the session
        window.location.href = callbackUrl;
      }
    }
  }, [data?.success, callbackUrl, data?.requirePasswordChange, data?.resetToken, router]);

  /**
   * Sign-in button component with loading state
   * 
   * Displays "Signing In..." when the form is submitting
   * and disables the button to prevent multiple submissions
   * 
   * @component
   */
  const SignInButton = () => {
    /**
     * Form submission status from React's useFormStatus hook
     * @type {Object}
     * @property {boolean} pending - Whether the form is currently submitting
     */
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='success'>
        {pending ? 'Signing In...' : 'Sign In'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            required
            autoComplete='email'
            defaultValue={signInDefaultValues.email}
          />
        </div>
        <div>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='password'
            defaultValue={signInDefaultValues.password}
          />
          <div className="text-sm text-right mt-1">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <div>
          <SignInButton />
        </div>

        {/* Error message display */}
        {data && !data.success && (
          <div className='text-center text-destructive'>{data.message}</div>
        )}

        <div className='text-sm text-center text-muted-foreground'>
          Don&apos;t have an account?{' '}
          <Link href='/sign-up' target='_self' className='text-primary hover:underline'>
            Sign Up
          </Link>
        </div>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
