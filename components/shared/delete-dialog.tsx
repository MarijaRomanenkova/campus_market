'use client';

/**
 * Delete Dialog Component
 * @module Components
 * @group Shared/UI
 * 
 * This client-side component renders a confirmation dialog for delete operations.
 * It provides a standardized way to handle delete actions with confirmation.
 */

import { useState } from 'react';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

/**
 * Props for the DeleteDialog component
 * @interface DeleteDialogProps
 * @property {string} id - ID of the item to be deleted
 * @property {function} action - Server action function that performs the deletion
 * @property {string} [variant='default'] - Button variant (default, destructive, outline)
 */
type DeleteDialogProps = {
  id: string;
  action: (id: string) => Promise<{ success: boolean; message: string }>;
  variant?: 'default' | 'destructive' | 'outline';
};

/**
 * Delete Dialog Component
 * 
 * Renders a confirmation dialog for delete operations with:
 * - Delete button that triggers the dialog
 * - Confirmation message
 * - Cancel and confirm buttons
 * - Loading state during deletion
 * - Toast notifications for success/error states
 * 
 * Uses React's useTransition for optimistic UI updates during deletion.
 * 
 * @param {DeleteDialogProps} props - Component properties
 * @returns {JSX.Element} The rendered delete dialog
 */
const DeleteDialog = ({
  id,
  action,
  variant = 'default'
}: DeleteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  /**
   * Handles the delete confirmation
   * Executes the delete action and shows appropriate toast messages
   */
  const handleDeleteClick = () => {
    startTransition(async () => {
      const res = await action(id);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
      } else {
        setOpen(false);
        toast({
          description: res.message,
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant={variant} className='ml-2'>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant={variant}
            size='sm'
            disabled={isPending}
            onClick={handleDeleteClick}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
