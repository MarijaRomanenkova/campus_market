'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyEmail } from '@/lib/actions/user.actions';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsVerifying(false);
        setError('Invalid verification link. Please request a new one.');
        return;
      }

      try {
        const result = await verifyEmail(token);
        
        setIsVerifying(false);
        
        if (result.success) {
          setIsSuccess(true);
          // Redirect to sign-in page after 3 seconds
          setTimeout(() => {
            router.push('/sign-in');
          }, 3000);
        } else {
          setError(result.message);
        }
      } catch (error) {
        setIsVerifying(false);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {isVerifying && (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            )}
            {!isVerifying && isSuccess && (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            )}
            {!isVerifying && !isSuccess && (
              <XCircle className="h-10 w-10 text-red-500" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isVerifying && 'Verifying your email...'}
            {!isVerifying && isSuccess && 'Email verified!'}
            {!isVerifying && !isSuccess && 'Verification failed'}
          </CardTitle>
          
          <CardDescription className="text-sm text-muted-foreground">
            {isVerifying && 'Please wait while we verify your email address.'}
            {!isVerifying && isSuccess && 'Your account has been successfully created.'}
            {!isVerifying && !isSuccess && error}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          {isSuccess && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You will be redirected to the sign-in page in a few seconds.
              </p>
              <Button asChild>
                <Link href="/sign-in">Sign In Now</Link>
              </Button>
            </div>
          )}
          
          {!isVerifying && !isSuccess && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please try signing up again or contact support for assistance.
              </p>
              <Button asChild>
                <Link href="/sign-up">Return to Sign Up</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
