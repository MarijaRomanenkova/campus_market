/**
 * Client Products Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all products created by the current user in their client role.
 * It shows a list of products with options to view details, edit, or delete each product.
 */

import Link from 'next/link';
import { deleteProduct, getAllProductsByClientId } from '@/lib/actions/product.actions';
import { formatCurrency, formatId } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/shared/pagination';
import DeleteDialog from '@/components/shared/delete-dialog';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProductList from '@/components/shared/product/product-list';
import CreateProductButton from '@/components/shared/create-product-button';

/**
 * Client Products Page Component
 * 
 * Fetches and displays all products created by the authenticated user.
 * Provides options to create new products and manage existing ones.
 * Includes authentication protection and redirects unauthenticated users.
 * 
 * @returns {Promise<JSX.Element>} The rendered client products page
 */
export default async function ClientProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const products = await getAllProductsByClientId(session.user.id);


  const productsWithNumberPrice = products.data.map(product => ({
    ...product,
    price: Number(product.price)
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <CreateProductButton size="lg" />
      </div>
      
      <ProductList 
        data={productsWithNumberPrice} 
        emptyMessage="You haven't created any products yet" 
      />
    </div>
  );
}
