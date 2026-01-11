/**
 * Product Action Button Component
 * @module Components
 * @group Shared/Products
 * 
 * A client-side component that conditionally renders either an edit button for product owners
 * or a contact button for other users. Features include:
 * - User role-based button rendering
 * - Session-based authentication check
 * - Consistent styling with shadcn/ui
 * - Seamless integration with product management
 * 
 * @example
 * ```tsx
 * <ProductActionButton
 *   productId="product123"
 *   productOwnerId="user456"
 *   className="custom-class"
 * />
 * ```
 */

'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ProductContactButton from './product-contact-button';
import { Pencil } from 'lucide-react';
import { useSession } from 'next-auth/react';

/**
 * Props for the ProductActionButton component
 * @interface ProductActionButtonProps
 */
interface ProductActionButtonProps {
  /** The unique identifier of the product */
  productId: string;
  /** The unique identifier of the product owner */
  productOwnerId: string;
  /** Optional CSS class names */
  className?: string;
}

/**
 * ProductActionButton component that conditionally renders different actions based on user role.
 * Shows edit button for product owners and contact button for other users.
 * 
 * @param {ProductActionButtonProps} props - Component properties
 * @returns {JSX.Element} Either an edit button or a contact button based on user role
 */
const ProductActionButton = ({ productId, productOwnerId, className }: ProductActionButtonProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Compare as strings for reliability
  const currentUserId = session?.user?.id ? String(session.user.id) : '';
  const ownerId = productOwnerId ? String(productOwnerId) : '';
  const isOwner = currentUserId && ownerId && currentUserId === ownerId;
  
  /**
   * Handles the edit button click by navigating to the product edit page
   */
  const handleEdit = () => {
    router.push(`/user/dashboard/client/products/${productId}/edit`);
  };
  
  if (isOwner) {
    return (
      <Button
        onClick={handleEdit}
        variant="success-outline"
        size="sm"
        className={`whitespace-nowrap flex items-center ${className}`}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </Button>
    );
  }
  
  return (
    <ProductContactButton
      productId={productId}
      productOwnerId={productOwnerId}
      size="sm"
      className={`whitespace-nowrap ${className}`}
    />
  );
};

export default ProductActionButton; 
