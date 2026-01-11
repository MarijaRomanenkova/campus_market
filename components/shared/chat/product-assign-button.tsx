'use client';

/**
 * Product Assignment Button Component
 * @module Components
 * @group Shared/Chat
 * 
 * This client-side component provides a button and confirmation dialog
 * for product owners to assign products to sellers.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { UserCheck } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { archiveProduct } from '@/lib/actions/product.actions';
import { createProductAssignment } from '@/lib/actions/product-assignment.actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

/**
 * Props for the ProductAssignButton component
 * @interface ProductAssignButtonProps
 * @property {string} productId - ID of the product to be assigned
 * @property {string} productOwnerId - ID of the product owner (client)
 * @property {string} sellerId - ID of the seller to assign the product to
 * @property {string} [className] - Optional CSS class names
 * @property {Function} [onAssigned] - Optional callback function after successful assignment
 */
interface ProductAssignButtonProps {
  productId: string;
  productOwnerId: string;
  sellerId: string;
  className?: string;
  onAssigned?: () => void;
}

/**
 * Product Assignment Button Component
 * 
 * Renders a button with confirmation dialog for product assignment with:
 * - Authorization check to ensure only product owners can assign products
 * - Confirmation dialog with details about assignment implications
 * - API integration to update product status and create assignment record
 * - Loading state during assignment process
 * - Success/error notifications via toast
 * 
 * @param {ProductAssignButtonProps} props - Component properties
 * @returns {JSX.Element|null} The rendered button or null if user is not authorized
 */
export default function ProductAssignButton({ 
  productId, 
  productOwnerId,
  sellerId,
  className = '',
  onAssigned
}: ProductAssignButtonProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [shouldArchive, setShouldArchive] = useState(false);

  // Only show if the current user is the product owner
  if (!session?.user?.id || session.user.id !== productOwnerId) {
    return null;
  }

  /**
   * Handles the product assignment process
   * Fetches product status, creates assignment record, and manages UI states
   */
  const handleAssignProduct = async () => {
    if (isAssigning) return;
    
    try {
      setIsAssigning(true);
      
      // Create product assignment using server action
      const result = await createProductAssignment({
        productId: productId,
        clientId: productOwnerId,
        sellerId: sellerId,
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to assign product');
      }

      // Archive the product if checkbox is checked
      if (shouldArchive) {
        const archiveResult = await archiveProduct(productId);
        if (!archiveResult.success) {
          throw new Error(archiveResult.message || 'Failed to archive product');
        }
      }
      
      toast({
        title: 'Success',
        description: `Product ${shouldArchive ? 'assigned and archived' : 'assigned'} successfully!`,
      });
      
      setIsOpen(false);
      router.refresh();
      
      // Notify parent component of assignment
      if (onAssigned) {
        onAssigned();
      }
    } catch (error) {
      console.error('Error assigning product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign product',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="success"
          className={className}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Assign Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Product</DialogTitle>
          <DialogDescription>
            This will assign the product to the seller and change its status to &quot;In Progress&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p>Are you sure you want to assign this product to this seller?</p>
          <p className="text-sm text-muted-foreground">
            Once assigned, they will be responsible for completing this product and you will be able to create invoices.
          </p>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="archive"
              checked={shouldArchive}
              onCheckedChange={(checked) => setShouldArchive(checked as boolean)}
            />
            <Label htmlFor="archive">
              Archive this product after assignment
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignProduct} 
            disabled={isAssigning}
            variant="success"
          >
            {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
