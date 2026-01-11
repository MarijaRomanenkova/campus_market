'use client';

/**
 * @module ProductArchiveButton
 * @description A button component that allows product owners to archive their products.
 * Includes a confirmation dialog to prevent accidental archiving.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { archiveProduct } from '@/lib/actions/product.actions';
import { cn } from '@/lib/utils';

interface ProductArchiveButtonProps {
  productId: string;
  className?: string;
  onArchived?: () => void;
}

export default function 
ProductArchiveButton({
  productId,
  className = '',
  onArchived
}: ProductArchiveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleArchive = async () => {
    if (isArchiving) return;
    
    try {
      setIsArchiving(true);
      
      const result = await archiveProduct(productId);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: 'Success',
        description: 'Product archived successfully!',
      });
      
      setIsOpen(false);
      router.refresh();
      
      // Redirect to product list
      router.push('/user/dashboard/client/product');
      
      if (onArchived) {
        onArchived();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive product',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div>
      <Button
        size="sm"
        variant="danger-outline"
        onClick={() => setIsOpen(true)}
        className={cn("whitespace-nowrap", className)}
      >
        <Archive className="h-4 w-4 mr-2" />
        Archive
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive this product? This will hide it from the public listings.
              You can still view it in your archived products.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              disabled={isArchiving}
              onClick={handleArchive}
            >
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
