'use client';

/**
 * Product Card Component
 * @module Components
 * @group Shared/Products
 * 
 * A client-side component that renders a card displaying product information in a compact format.
 * Features include:
 * - Product name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information with rating
 * - Image display with fallback
 * - Action buttons (edit/contact) based on user role
 * - Archive functionality for product owners
 * 
 * @example
 * ```tsx
 * <ProductCard
 *   product={{
 *     id: "product123",
 *     name: "Garden Maintenance",
 *     description: "Weekly garden maintenance required",
 *     price: 100,
 *     images: ["image1.jpg"],
 *     author: {
 *       name: "John Doe",
 *       clientRating: 4.5
 *     }
 *   }}
 * />
 * ```
 */

import Image from 'next/image';
import Link from 'next/link';
import ProductPrice from './product-price';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Product } from '@/types';
import { UserIcon, ArrowRight, Pencil, MoveRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProductArchiveButton from './product-archive-button';
import UserRatingDisplay from '../ratings/user-rating-display';

/**
 * Product Card Component
 * 
 * Renders a card UI for a product with:
 * - Product name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information with rating
 * - Image display with fallback
 * - Action buttons (edit/contact) based on user role
 * - Archive functionality for product owners
 * 
 * Uses shadcn/ui Card components for consistent styling.
 * 
 * @param {Object} props - Component properties
 * @param {Product} props.product - Product data to display
 * @returns {JSX.Element} The rendered product card
 */
const ProductCard = ({ product }: { product: Product }) => {
  const { data: session, status } = useSession();
  // Ensure we're comparing by ID (not by name) and handle potential undefined values
  const isOwner = !!session?.user?.id && !!product.author?.id && session.user.id === product.author.id;
  const isAuthenticated = status === 'authenticated';

  return (
    <Card className='w-full max-w-m'>
      <CardHeader className='p-0 relative'>
        {/* Price positioned in top right corner */}
        <div className='absolute top-2 right-2 p-2 text-right'>
          {product.price ? (
            <ProductPrice value={Number(product.price)} className="text-xl font-medium" />
          ) : (
            <p className="text-xl font-medium">For negotiation</p>
          )}
        </div>
      </CardHeader>
      <CardContent className='p-4 grid gap-4'>
        <div className="space-y-2 min-w-0">
          <Link href={`/user/dashboard/client/product/${product.id}`}>
            <h2 className='text-xl font-medium line-clamp-1'>{product.name}</h2>
          </Link>
          <div className="h-[2.5rem]">
            {product.description ? (
              <p className="text-sm text-muted-foreground line-clamp-2 break-words">{product.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-0 flex justify-between items-center gap-2">
        {/* Author information - only shown to authenticated users */}
        {isAuthenticated ? (
          <div className="flex items-center text-base text-muted-foreground">
            <UserIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate font-medium">
              {isOwner ? "My product" : (product.author?.name || 'Anonymous')}
            </span>
            {!isOwner && product.author?.clientRating && Number(product.author.clientRating) > 0 ? (
              <div className="ml-1.5 flex items-center">
                <UserRatingDisplay 
                  rating={typeof product.author.clientRating === 'number' ? product.author.clientRating : Number(product.author.clientRating)} 
                  size="sm" 
                  tooltipText="Client rating" 
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1"></div> /* Spacer when not authenticated */
        )}
        
        <div className="flex gap-2">
          {isAuthenticated && isOwner && !product.isArchived && (
            <ProductArchiveButton productId={product.id} />
          )}
          <Button 
            variant={isOwner ? "success-outline" : "success"}
            size="sm" 
            asChild
            className="whitespace-nowrap flex items-center"
          >
            <Link 
              href={isOwner 
                ? `/user/dashboard/client/product/${product.id}/edit` 
                : `/user/dashboard/client/product/${product.id}`}
              aria-label={isOwner 
                ? `Edit ${product.name}` 
                : `See details for ${product.name}`}
            >
              {isOwner ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  View <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
