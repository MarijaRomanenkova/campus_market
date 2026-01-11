/**
 * Client Product Assignments Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all product assignments created by the current user in their client role.
 * It shows product assignments with seller details and status information.
 */

import { getAllProductAssignmentsByClientId } from '@/lib/actions/product-assignment.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import ProductAssignmentCard from '@/components/shared/product-assignment/product-assignment-card';
import Pagination from '@/components/shared/pagination';

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
  seller?: {
    id: string;
    name: string;
  };
  status: {
    name: string;
    color: string;
  };
  wasReviewed?: boolean;
  wasClientReviewed?: boolean;
}

const ClientProductAssignmentsPage = async ({ params, searchParams }: PageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = Number(resolvedSearchParams?.page) || 1;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id; // Store user ID for later use
  const productAssignments = await getAllProductAssignmentsByClientId(userId);

  // Convert Decimal objects to regular numbers for client components
  const serializedAssignments = productAssignments.data.map(assignment => ({
    ...assignment,
    product: {
      ...assignment.product,
      id: assignment.product.id || '',
      price: Number(assignment.product.price)
    }
  })) as SerializedProductAssignment[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Product Assignments</h1>
      </div>

      <div className="grid gap-6">
        {serializedAssignments.length > 0 ? (
          serializedAssignments.map((assignment) => (
            <ProductAssignmentCard
              key={assignment.id}
              id={assignment.id}
              productId={assignment.product.id}
              productName={assignment.product.name}
              productDescription={assignment.product.description}
              categoryName={assignment.product.category?.name}
              price={assignment.product.price}
              status={{
                name: assignment.status.name,
                color: assignment.status.color,
              }}
              clientId={userId}
              sellerId={assignment.seller?.id}
              sellerName={assignment.seller?.name}
              hasInvoice={false}
              isPaid={false}
              hasSellerAccepted={true}
              viewType="client"
              createdAt={assignment.createdAt}
              reviewedByClient={assignment.wasReviewed}
              reviewedBySeller={assignment.wasClientReviewed}
            />
          ))
        ) : (
          <div className="col-span-2 text-center p-6 border rounded-lg">
            <p className="text-muted-foreground">No product assignments found.</p>
          </div>
        )}
      </div>

      {productAssignments.totalPages > 1 && (
        <Pagination page={page} totalPages={productAssignments.totalPages} />
      )}
    </div>
  );
};

export default ClientProductAssignmentsPage;
