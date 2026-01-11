/**
 * Create Product Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page provides a form for creating new products.
 * It allows clients to specify product details, category, and budget.
 */

import { Metadata } from 'next';
import { getCategories } from '@/lib/actions/category.actions';
import ProductForm from '@/components/shared/product/product-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Metadata for the Create Product page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Create product',
};

/**
 * Create Product Page Component
 * 
 * Renders a form for creating new products with all necessary fields.
 * Fetches available categories for product categorization.
 * Includes authentication protection and redirects unauthenticated users.
 * 
 * @returns {Promise<JSX.Element>} The rendered product creation page with form
 */
export default async function CreateProductPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const categories = await getCategories();
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Product</h1>
      <ProductForm 
        type="Create" 
        product={null}
        categories={categories}
        userId={session.user.id}
      />
    </div>
  );
}
