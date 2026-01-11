/**
 * Product List Component
 * @module Components
 * @group Shared/Products
 * 
 * A component that renders a grid of product cards with configurable title,
 * limit, and empty state message. Features include:
 * - Responsive grid layout
 * - Optional title display
 * - Configurable product limit
 * - Customizable empty state message
 * - Consistent card styling
 * 
 * @example
 * ```tsx
 * <ProductList
 *   data={[
 *     {
 *       id: "product1",
 *       name: "Garden Maintenance",
 *       price: 100
 *     },
 *     {
 *       id: "product2",
 *       name: "House Cleaning",
 *       price: 150
 *     }
 *   ]}
 *   title="Available Products"
 *   limit={4}
 *   emptyMessage="No products available at the moment"
 * />
 * ```
 */

import ProductCard from './product-card';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * Props for the ProductList component
 * @interface ProductListProps
 */
interface ProductListProps {
  /** Array of product objects to display */
  data: Product[];
  /** Optional heading to display above the product list */
  title?: string;
  /** Optional maximum number of products to display */
  limit?: number;
  /** Message to display when there are no products */
  emptyMessage?: string;
}

/**
 * ProductList component for displaying a grid of product cards with optional title and limits.
 * Handles empty states with a configurable message.
 * 
 * @param {ProductListProps} props - Component properties
 * @returns {JSX.Element} A grid of product cards or an empty state message
 */
const ProductList = ({
  data,
  title,
  limit,
  emptyMessage = "No products found"
}: ProductListProps) => {
  // Apply limit if provided, otherwise show all products
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className='my-10'>
      
      
      {limitedData.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {limitedData.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
