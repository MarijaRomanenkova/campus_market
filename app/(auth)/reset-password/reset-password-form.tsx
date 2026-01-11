/**
 * Reset Password Form Component
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { resetPassword } from '@/lib/actions/user.actions';

// Form validation schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .refine(
      (password) => {
        // Count numbers and special characters
        const specialCharsCount = (password.match(/[0-9!@#$%^&*(),.?":{}|<>]/g) || []).length;
        return specialCharsCount >= 2;
      },
      { message: "Password must be at least 8 characters with at least 2 numbers or special characters" }
    ),
  confirmPassword: z
    .string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isRequired = searchParams.get('required') === '1';

  // Initialize the form with Zod validation
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  // After successful reset when it was required
  useEffect(() => {
    if (isSuccessful && isRequired) {
      // Since this was a required password change after reset,
      // we should redirect to a different page (typically dashboard)
      setTimeout(() => {
        router.push('/');
      }, 1500); // Small delay to allow the user to see the success message
    }
  }, [isSuccessful, isRequired, router]);

  // Handle form submission
  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "Missing reset token",
        description: "Your password reset link is invalid. Please request a new one.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the reset password server action
      const result = await resetPassword({
        token,
        password: data.password,
      });
      
      if (result.success) {
        setIsSuccessful(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been updated successfully.",
        });
      } else {
        toast({
          title: "Password reset failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Success message section */}
      {isSuccessful && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Password Reset Complete</h2>
          <p className="text-muted-foreground">
            {isRequired 
              ? "Your password has been successfully updated. You will be redirected to your dashboard."
              : "Your password has been successfully updated. You can now sign in with your new password."
            }
          </p>
          {!isRequired && (
            <div className="pt-4">
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Error for missing token */}
      {!isSuccessful && !token && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Invalid Reset Link</h2>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <div className="pt-4">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Request a new reset link
            </Link>
          </div>
        </div>
      )}

      {/* Password reset form for valid tokens */}
      {!isSuccessful && token && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold">Create New Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter a new strong password for your account
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      autoComplete="new-password" 
                      {...field} 
                    />
                  </FormControl>
                  {form.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">
                      Password must be at least 8 characters with at least 2 numbers or special characters.
                    </p>
                  )}
                  {!form.formState.errors.password && <FormMessage />}
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      autoComplete="new-password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default ResetPasswordForm; 
