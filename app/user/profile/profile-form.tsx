'use client';

/**
 * User Profile Form Component
 * @module Components
 * @group Forms
 * 
 * This client-side component provides a form for users to update their profile information.
 * It handles form validation, submission, and syncing with the session data.
 */

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/actions/user.actions';
import { updateProfileSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ExtendedUser } from '@/types';
import UserRatings from './user-ratings';

/**
 * Profile Form Component
 * 
 * Renders a form for updating user profile information including:
 * - Account information (username, email)
 * - Personal information (full name, phone number)
 * - Address information
 * - Company ID
 * 
 * The form pre-populates with the user's current data from their session
 * and updates both the database and session upon successful submission.
 * 
 * @returns {JSX.Element} The rendered profile form
 */
const ProfileForm = () => {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  
  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? '',
      fullName: '',
      address: '',
      phoneNumber: '',
      companyId: '',
    },
  });

  // When session data arrives, update form values
  useEffect(() => {
    if (session?.user) {
      const user = session.user as ExtendedUser;
      
      // Set the core fields
      form.setValue('name', user.name || '');
      
      // Set the extended fields if they exist
      form.setValue('fullName', user.fullName || '');
      form.setValue('phoneNumber', user.phoneNumber || '');
      form.setValue('companyId', user.companyId || '');
      
      // Handle address which is stored as JSON in the database
      if (user.address) {
        try {
          let addressString = '';
          
          if (typeof user.address === 'string') {
            // Try to parse the JSON string
            const parsed = JSON.parse(user.address);
            addressString = parsed.address || '';
          } else if (typeof user.address === 'object') {
            // It's already an object
            addressString = (user.address as Record<string, unknown>).address as string || '';
          }
          
          form.setValue('address', addressString);
        } catch (error) {
          console.error('Error handling address:', error);
        }
      }
    }
  }, [session, form]);

  const { toast } = useToast();

  const onSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
    const res = await updateProfile(values);

    if (!res.success) {
      return toast({
        variant: 'destructive',
        description: res.message,
      });
    }

    const userUpdate: ExtendedUser = {
      ...session?.user as ExtendedUser,
      name: values.name,
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      companyId: values.companyId,
      // The address is handled in the server function
    };

    await update({
      ...session,
      user: userUpdate,
    });

    toast({
      description: res.message,
    });
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form
        className='flex flex-col gap-8'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* Display user ratings at the top of the form */}
        {session?.user && (
          <UserRatings user={session.user as ExtendedUser} />
        )}

        <div className='space-y-6'>
          <h3 className='text-lg font-medium'>Account Information</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Username'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='space-y-6'>
          <h3 className='text-lg font-medium'>Personal Information</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='fullName'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Full Name'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Phone Number'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name='address'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Address'
                    className='input-field'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='space-y-6'>
          <h3 className='text-lg font-medium'>Professional Information</h3>
          <FormField
            control={form.control}
            name='companyId'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Seller Legal ID Number (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Company/Business Registration Number'
                    className='input-field'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type='submit'
          size='lg'
          variant='success'
          className='button col-span-2 w-full mt-4'
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Submitting...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;
