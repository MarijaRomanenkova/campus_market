/**
 * Seller Product Assignments Page Component
 * @module Pages
 * @group Dashboard/Seller
 * 
 * This page displays all product assignments for the logged-in seller.
 * It shows product assignments with client details, invoice status, and payment information.
 */

import Link from 'next/link';
import { getAllProductAssignmentsBySellerId } from '@/lib/actions/product-assignment.actions';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProductAssignmentList from '@/components/shared/product-assignment/product-assignment-list';

interface PageProps {
  params: Promise<{ [key: string]: string | string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define the type for serialized product assignments
interface SerializedProductAssignment {
  id: string;
  createdAt?: string | Date;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category?: {
      name: string;
    };
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
  status: {
    name: string;
    color: string;
  };
  invoiceItems?: Array<{
    invoice: {
      id: string;
      invoiceNumber: string;
      paymentId: string | null;
      payment?: {
        isPaid: boolean;
      };
    };
  }>;
  wasReviewed?: boolean;
  wasClientReviewed?: boolean;
}

const SellerProductAssignmentsPage = async ({ params, searchParams }: PageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = Number(resolvedSearchParams?.page) || 1;
  const searchText = resolvedSearchParams?.query?.toString() || '';
  const category = resolvedSearchParams?.category?.toString() || '';

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const productAssignments = await getAllProductAssignmentsBySellerId(session.user.id);

  // Convert Decimal objects to regular numbers for client components
  const serializedAssignments = productAssignments.data.map(assignment => ({
    ...assignment,
    product: {
      ...assignment.product,
      price: Number(assignment.product.price)
    }
  })) as SerializedProductAssignment[];

  return (
    <div className='space-y-6'>
      <div className='flex-between'>
        <div className='flex items-center gap-3'>
          <h1 className='h2-bold'>Product Assignments</h1>
          {searchText && (
            <div>
              Filtered by <i>&quot;{searchText}&quot;</i>{' '}
              <Link href='/user/dashboard/seller/assignments'>
                <Button variant='outline' size='sm'>
                  Remove Filter
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <ProductAssignmentList 
        assignments={serializedAssignments}
        totalPages={productAssignments.totalPages}
        currentPage={page}
        viewType="seller"
      />
    </div>
  );
};

export default SellerProductAssignmentsPage;
