/**
 * Sign Up Form Component
 * @module Authentication
 * @group Auth Components
 * 
 * This client component handles user registration with name, email, and password,
 * utilizing React Hook Form with Zod validation for form submission.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { signUpFormSchema } from '@/lib/validators';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Form for user registration with validation on submit
 * 
 * This component renders a form with name, email, password, and confirm password fields,
 * validates inputs upon submission, and handles form submission.
 * 
 * Features:
 * - Form validation upon submission
 * - Detailed error messages for each field
 * - User-friendly feedback
 * 
 * @component
 */
const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof signUpFormSchema> | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Initialize form with Zod validation
  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: signUpDefaultValues,
    mode: 'onSubmit',
  });
  
  // Handle form submission - just validate and show terms
  const onSubmit = async (data: z.infer<typeof signUpFormSchema>) => {
    setFormData(data);
    setShowTerms(true);
  };
  
  // Handle actual signup after terms are accepted
  const handleSignUp = async () => {
    if (!formData) return;
    
    setIsLoading(true);
    
    try {
      // Create FormData to submit with the server action
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('email', formData.email);
      formDataObj.append('password', formData.password);
      formDataObj.append('confirmPassword', formData.confirmPassword);
      formDataObj.append('callbackUrl', callbackUrl);
      
      // Submit the form using the server action
      const result = await signUpUser(null, formDataObj);
      
      if (!result.success) {
        // Show error message
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        });
        setShowTerms(false);
      } else {
        // Redirect to verification page
        router.push('/verify-email?email=' + encodeURIComponent(formData.email));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setShowTerms(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your full name" 
                    {...field} 
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="email@example.com" 
                    {...field} 
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Create a password" 
                    type="password" 
                    {...field} 
                    autoComplete="new-password"
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
                    placeholder="Confirm your password" 
                    type="password" 
                    {...field} 
                    autoComplete="new-password"
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
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
          
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" target="_self" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </Form>
      
      {/* Terms and Conditions Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Terms and Conditions</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Please read and agree to our terms of use
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-sm">
            <h3 className="font-medium mb-2">1. Introduction</h3>
            <p className="mb-4">
              Welcome to Campus Market. By accessing or using our service, you agree to be bound by these Terms and Conditions.
            </p>
            
            <h3 className="font-medium mb-2">2. User Registration</h3>
            <p className="mb-4">
              To use certain features of the service, you must register for an account. You agree to provide accurate information and keep it updated.
            </p>
            
            <h3 className="font-medium mb-2">3. Privacy Policy</h3>
            <p className="mb-4">
              Your use of Campus Market is also governed by our Privacy Policy, which can be found on our website.
            </p>
            
            <h3 className="font-medium mb-2">4. User Responsibilities</h3>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
            
            <h3 className="font-medium mb-2">5. Acceptable Use</h3>
            <p className="mb-4">
              You agree not to use the service for any illegal purpose or in violation of any local, state, national, or international law.
            </p>
            
            <h3 className="font-medium mb-2">6. Termination</h3>
            <p className="mb-4">
              We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms.
            </p>
            
            <h3 className="font-medium mb-2">7. Changes to Terms</h3>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Your continued use of the service constitutes agreement to such modifications.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)} 
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the terms and conditions
            </label>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowTerms(false)} 
              variant="outline" 
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSignUp} 
              disabled={!termsAccepted || isLoading}
            >
              {isLoading ? "Processing..." : "Agree and Sign Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignUpForm;
