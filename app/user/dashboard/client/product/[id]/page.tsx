/**
 * Product Details Page
 * @module Pages
 * @group Client Dashboard
 */

import { getProductById } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductPrice from '@/components/shared/product/product-price';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, ArrowLeft, Pencil } from 'lucide-react';
import { auth } from '@/auth';
import ProductContactButton from '@/components/shared/product/product-contact-button';
import ProductImageGallery from '@/components/shared/product/product-image-gallery';
import ProductArchiveButton from '@/components/shared/product/product-archive-button';

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Product Details Page Component
 * 
 * Displays detailed information about a specific product including:
 * - Product name and description
 * - Price information
 * - Creator details
 * - Edit button (if user is the product creator)
 * - Contact button (if user is not the product creator)
 */
export default async function ProductDetailsPage({ params, searchParams }: Props) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const product = await getProductById(id);
  const session = await auth();

  if (!product) {
    notFound();
  }

  const isCreator = session?.user?.id === product.author?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/user/dashboard/client/product">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        {isCreator ? (
          <div className="flex items-center justify-end space-x-2">
            <Link href={`/user/dashboard/client/product/${product.id}/edit`}>
              <Button
                size="sm"
                variant="success-outline"
                className="flex items-center whitespace-nowrap"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            {!product.isArchived && (
              <ProductArchiveButton productId={product.id} />
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <ProductContactButton 
              productId={product.id} 
              productOwnerId={product.author?.id || ''} 
              size="sm"
              className="whitespace-nowrap"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            {product.price && (
              <ProductPrice value={Number(product.price)} className="text-xl" />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description || 'No description provided'}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Created By</h3>
              <p className="text-muted-foreground">{product.author?.name || 'Anonymous'}</p>
            </div>

            {product.category && (
              <div>
                <h3 className="font-medium mb-2">Category</h3>
                <p className="text-muted-foreground">{product.category.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {product.images && product.images.length > 0 && (
          <Card className="md:w-[400px]">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Images</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ProductImageGallery images={product.images} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
