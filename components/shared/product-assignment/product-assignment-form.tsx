'use client';

/**
 * @module ProductAssignmentForm
 * @description A form component for creating or updating product assignments.
 * This component handles assigning products to sellers with specific statuses.
 * It supports both creation and update modes.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertProductAssignmentSchema } from '@/lib/validators';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createProductAssignment } from '@/lib/actions/product-assignment.actions';
import { Prisma } from '@prisma/client';

/**
 * @interface ProductAssignmentFormProps
 * @property {string} [productId] - Optional ID of the product to be assigned
 * @property {string} [clientId] - Optional ID of the client who created the product
 * @property {Array<{id: string; name: string}>} sellers - List of available sellers to assign the product to
 * @property {Array<{id: string; name: string}>} statuses - List of available statuses for the assignment
 * @property {'Create' | 'Update'} type - Determines if the form is for creating or updating an assignment
 * @property {Prisma.ProductAssignmentGetPayload} [assignment] - Optional existing assignment data when updating
 * @property {string} [assignmentId] - Optional ID of the assignment when updating
 */
type ProductAssignmentFormProps = {
  productId?: string;
  clientId?: string;
  sellers: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
  type: 'Create' | 'Update';
  assignment?: Prisma.ProductAssignmentGetPayload<{
    include: {
      product: {
        select: {
          name: true;
          price: true;
          description: true;
          images: true;
          category: { select: { name: true } }
        }
      };
      status: { select: { name: true; color: true } };
      client: { select: { name: true; email: true } };
      seller: { select: { name: true; email: true } };
    }
  }>;
  assignmentId?: string;
};

/**
 * ProductAssignmentForm component for creating or updating product assignments.
 * Renders a form with seller and status selection fields.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.productId] - ID of the product to be assigned
 * @param {string} [props.clientId] - ID of the client who created the product
 * @param {Array<{id: string; name: string}>} props.sellers - Available sellers
 * @param {Array<{id: string; name: string}>} props.statuses - Available assignment statuses
 * @param {'Create' | 'Update'} props.type - Whether creating or updating an assignment
 * @param {Prisma.ProductAssignmentGetPayload} [props.assignment] - Existing assignment data (for updates)
 * @param {string} [props.assignmentId] - ID of the assignment (for updates)
 * @returns {JSX.Element} A form for product assignment creation or management
 */
export function ProductAssignmentForm({ 
  productId, 
  clientId, 
  sellers, 
  statuses,
  type,
  assignment,
  assignmentId 
}: ProductAssignmentFormProps) {
  const { toast } = useToast();
  
  // Initialize form with zod validation schema
  const form = useForm<z.infer<typeof insertProductAssignmentSchema>>({
    resolver: zodResolver(insertProductAssignmentSchema),
    defaultValues: {
      productId: productId,
      clientId,
      sellerId: '',
      statusId: ''
    }
  });

  /**
   * Handles form submission to create a product assignment.
   * Shows appropriate toast messages on success or failure.
   * 
   * @async
   * @param {z.infer<typeof insertProductAssignmentSchema>} data - The validated form data
   * @returns {Promise<void>}
   */
  async function onSubmit(data: z.infer<typeof insertProductAssignmentSchema>) {
    try {
      const result = await createProductAssignment(data);
      
      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.message
        });
        return;
      }
  
      toast({
        description: result.message
      });
      
      form.reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: 'destructive',
        description: errorMessage
      });
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sellerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seller</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? 'Assigning...' : 'Assign Product'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
