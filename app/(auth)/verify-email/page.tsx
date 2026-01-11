import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

export const metadata = {
  title: 'Verify Your Email | Campus Market',
  description: 'Complete your account registration by verifying your email address',
};

/**
 * Verify Email Page Component
 * 
 * This page is displayed after a user signs up, instructing them to check their email
 * for a verification link to complete the registration process.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{email?: string}>} props.searchParams - URL search parameters containing optional email
 * @returns {JSX.Element} The verify email page
 */
export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email: emailParam } = await props.searchParams;
  const email = emailParam || 'your email';

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-sm text-muted-foreground">
            Please check your inbox and click on the verification link to complete your registration.
            If you don&apos;t see the email, check your spam folder.
          </p>
          
          <div className="space-y-2 text-sm">
            <p>
              <Link href="/sign-in" className="text-primary hover:underline">
                Return to sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
