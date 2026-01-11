/**
 * User Update Form Component
 * @module Admin
 * @group Admin Components
 * 
 * This client component provides a form interface for updating user information,
 * including name, email, and role, with validation and error handling.
 */

'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/lib/actions/user.actions';
import { USER_ROLES } from '@/lib/constants';
import { updateUserSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

/**
 * Update User Form Component
 * 
 * A form for editing user information with:
 * - Email field (read-only)
 * - Editable name field
 * - Role selection dropdown
 * - Form validation using Zod schema
 * - Success/error toast notifications
 * - Navigation back to users list on success
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.user - User data object matching the updateUserSchema
 * @returns {JSX.Element} User update form with validation
 */
const UpdateUserForm = ({
  user,
}: {
  user: z.infer<typeof updateUserSchema>;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  /**
   * React Hook Form instance with Zod validation
   */
  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user,
  });

  /**
   * Form submission handler
   * 
   * Sends updated user data to the server, displays appropriate
   * toast messages, and redirects on success.
   * 
   * @param {Object} values - Form values validated by Zod schema
   */
  const onSubmit = async (values: z.infer<typeof updateUserSchema>) => {
    try {
      // Call the server action to update the user
      const res = await updateUser({
        ...values,
        id: user.id,
      });

      // Handle error response
      if (!res.success) {
        return toast({
          variant: 'destructive',
          description: res.message,
        });
      }

      // Handle success
      toast({
        description: res.message,
      });
      form.reset();
      router.push('/admin/users');
    } catch (error) {
      // Handle unexpected errors
      toast({
        variant: 'destructive',
        description: (error as Error).message,
      });
    }
  };

  return (
    <Form {...form}>
      <form method='POST' onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email field (read-only) */}
        <div>
          <FormField
            control={form.control}
            name='email'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'email'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={true}
                    placeholder='Enter user email'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Name field */}
        <div>
          <FormField
            control={form.control}
            name='name'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'name'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter user name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Role selection dropdown */}
        <div>
          <FormField
            control={form.control}
            name='role'
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof updateUserSchema>,
                'role'
              >;
            }) => (
              <FormItem className='w-full'>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Submit button */}
        <div className='flex-between mt-6'>
          <Button
            type='submit'
            className='w-full'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Submitting...' : 'Update User'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateUserForm;
