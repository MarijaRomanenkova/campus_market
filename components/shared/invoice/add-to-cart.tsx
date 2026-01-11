'use client';
/**
 * @module AddToCart
 * @description A versatile component that renders a button for toggling an invoice in the cart.
 * This component handles both adding and removing invoices from the cart with proper visual feedback.
 */

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Cart, Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { addInvoiceToCart, removeInvoiceFromCart } from '@/lib/actions/cart.actions';
import { useTransition } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';

/**
 * @interface AddToCartProps
 * @property {Cart} [cart] - The current cart object to check if the invoice is already added
 * @property {Invoice} invoice - The invoice to be toggled in the cart
 * @property {string} [variant="outline"] - The button variant style ("outline" or "ghost")
 * @property {string} [size="default"] - The button size ("default" or "icon")
 */

/**
 * AddToCart component for toggling an invoice in the shopping cart.
 * Shows different icons based on the current state (loading, in cart, not in cart).
 * 
 * @param {Object} props - Component props
 * @param {Cart} [props.cart] - The current cart for checking if invoice is already added
 * @param {Invoice} props.invoice - The invoice object to toggle in the cart
 * @param {"outline" | "ghost"} [props.variant="outline"] - The button variant style
 * @param {"default" | "icon"} [props.size="default"] - The button size
 * @returns {JSX.Element} Button component with dynamic icon based on state
 */
const AddToCart = ({ 
  cart, 
  invoice,
  variant = "outline",
  size = "default"
}: { 
  cart?: Cart; 
  invoice: Invoice;
  variant?: "outline" | "ghost";
  size?: "default" | "icon";
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isInCart = cart?.invoices.find((i) => i.id === invoice.id);

  /**
   * Handles adding the invoice to the cart.
   * Displays a toast notification on success with an action to navigate to the cart.
   */
  const handleAddToCart = async () => {
    startTransition(async () => {
      const res = await addInvoiceToCart(invoice.id);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      toast({
        description: res.message,
        action: (
          <ToastAction
            className='bg-primary text-white hover:bg-gray-800'
            altText='Go To Cart'
            onClick={() => router.push('/cart')}
          >
            Go To Cart
          </ToastAction>
        ),
      });
    });
  };

  /**
   * Handles removing the invoice from the cart.
   * Displays a toast notification to indicate success or failure.
   */
  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      const res = await removeInvoiceFromCart(invoice.id);
      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });
    });
  };

  return (
    <Button
      onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
      disabled={isPending}
      variant={variant}
      size={size}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isInCart ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );
};

export default AddToCart;
