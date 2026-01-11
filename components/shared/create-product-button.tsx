'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Create Product Button Component
 * @module Components
 * @group Shared/Products
 * 
 * A reusable button component for creating new products across the application.
 * Features include:
 * - Consistent styling with success variant
 * - Plus icon for visual clarity
 * - Configurable size and variant
 * - Direct navigation to product creation
 * 
 * @example
 * ```tsx
 * <CreateProductButton
 *   className="custom-class"
 *   variant="success"
 *   size="default"
 * />
 * ```
 */

/**
 * Props for the CreateProductButton component
 * @interface CreateProductButtonProps
 */
interface CreateProductButtonProps {
  /** Optional CSS class names */
  className?: string;
  /** Button styling variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * CreateProductButton component that provides a consistent button for creating new products.
 * Uses success variant by default with the plus icon for visual consistency.
 * 
 * @param {CreateProductButtonProps} props - Component properties
 * @returns {JSX.Element} A button that navigates to the product creation page
 */
const CreateProductButton: React.FC<CreateProductButtonProps> = ({ 
  className = "",
  variant = "success",
  size = "default" 
}) => {
  return (
    <Button 
      variant={variant} 
      size={size}
      asChild 
      className={`whitespace-nowrap flex items-center ${className}`}
    >
      <Link href="/user/dashboard/client/product/create">
        <Plus className="mr-2 h-4 w-4" /> Create Product
      </Link>
    </Button>
  );
};

export default CreateProductButton; 
