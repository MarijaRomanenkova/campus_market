/**
 * Edit Page Component
 * @module Pages
 * @group Dashboard/Products
 * 
 * This page allows users to edit their existing products.
 */

import { getProductById } from '@/lib/actions/product.actions';
import { getAllCategories } from '@/lib/actions/product.actions';
import ProductForm from '@/components/shared/product/product-form';
import { redirect, notFound } from 'next/navigation';
import { Category, Product } from '@/types';
import { auth } from '@/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Edit Page Component
 * 
 * Provides a form for users to edit product details such as name, price, 
 * description, category, and images. Only accessible to the product owner.
 * 
 * @returns {JSX.Element} The edit product page component
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductById(id),
    getAllCategories()
  ]);

  if (!product) {
    notFound();
  }

  const productWithNumberPrice = {
    ...product,
    price: Number(product.price)
  };

  return (
    <div className="container max-w-4xl py-6">
      <Link
        href={`/user/dashboard/client/product/${id}`}
        className="flex items-center text-sm text-muted-foreground mb-4 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to product details
      </Link>
      
      <h1 className="text-2xl font-bold mb-4">Edit</h1>
      
      <div className="bg-card rounded-lg shadow-sm p-6">
        <ProductForm 
          type="Update" 
          product={productWithNumberPrice as Product}
          productId={id}
          categories={categories}
          userId={session.user.id}
        />
      </div>
    </div>
  );
} 
