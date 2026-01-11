/**
 * Product Assignment List Component
 * @module Components
 * @group Shared/ProductAssignment
 * 
 * A component that renders a list of product assignment cards with pagination support.
 * Handles both client and seller views, displaying relevant information and actions
 * based on the user type.
 * 
 * @example
 * ```tsx
 * <ProductAssignmentList
 *   assignments={assignments}
 *   totalPages={5}
 *   currentPage={1}
 *   viewType="client"
 * />
 * ```
 */

'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Check, Clock } from 'lucide-react';
import ProductCompleteButton from './product-complete-button';
import AddInvoiceDialog from './add-invoice-dialog';
import AcceptProductButton from './accept-product-button';
import ProductAssignmentCard from './product-assignment-card';
import Pagination from '@/components/shared/pagination';

/**
 * Type definition for a serialized product assignment
 * @interface SerializedProductAssignment
 */
interface SerializedProductAssignment {
  /** Unique identifier for the product assignment */
  id: string;
  /** Creation date of the product assignment */
  createdAt?: string | Date;
  /** Last update date of the product assignment */
  updatedAt?: string | Date;
  /** Completion date of the product assignment */
  completedAt?: string | Date | null;
  /** Whether the product has been reviewed by the client */
  wasReviewed?: boolean;
  /** Whether the client has been reviewed by the seller */
  wasClientReviewed?: boolean;
  /** Associated product information */
  product: {
    /** Unique identifier for the product */
    id: string;
    /** Name of the product */
    name: string;
    /** Description of the product */
    description: string | null;
    /** Price of the product */
    price: number;
    /** Optional category information */
    category?: {
      /** Name of the category */
      name?: string | null;
    } | null;
  };
  /** Status information for the product assignment */
  status: {
    /** Current status name */
    name: string;
    /** Color theme for the status */
    color: string;
  };
  /** Optional seller information */
  seller?: {
    /** Unique identifier for the seller */
    id: string;
    /** Name of the seller */
    name?: string;
  } | null;
  /** Seller ID (direct field from assignment) */
  sellerId?: string;
  /** Client ID (direct field from assignment) */
  clientId?: string;
  /** Optional client information */
  client?: {
    /** Unique identifier for the client */
    id?: string;
    /** Name of the client */
    name?: string;
    /** Email of the client */
    email: string;
  } | null;
  /** Optional invoice items associated with the product */
  invoiceItems?: Array<{
    /** Invoice information */
    invoice: {
      /** Unique identifier for the invoice */
      id: string;
      /** Invoice number */
      invoiceNumber: string;
      /** Optional payment identifier */
      paymentId: string | null;
      /** Optional payment information */
      payment?: {
        /** Whether the invoice has been paid */
        isPaid: boolean;
      };
    };
  }> | null;
}

/**
 * Props for the ProductAssignmentList component
 * @interface ProductAssignmentListProps
 */
interface ProductAssignmentListProps {
  /** Array of product assignments to display */
  assignments: SerializedProductAssignment[];
  /** Total number of pages for pagination */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Type of user viewing the list ("client" or "seller") */
  viewType: 'client' | 'seller';
}

export default function ProductAssignmentList({
  assignments,
  totalPages,
  currentPage,
  viewType,
}: ProductAssignmentListProps) {
  const isClient = viewType === 'client';
  const isSeller = viewType === 'seller';

  if (!assignments || assignments.length === 0) {
    return (
      <div className="col-span-2 text-center p-6 border rounded-lg">
        <p className="text-muted-foreground">No product assignments found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {assignments.map((assignment) => {
          // Extract common properties
          const id = assignment.id;
          const productId = assignment.product.id;
          const productName = assignment.product.name;
          const productDescription = assignment.product.description;
          const price = assignment.product.price; // Already a number
          const status = {
            name: assignment.status.name,
            color: assignment.status.color,
          };
          const categoryName = assignment.product.category?.name;
          
          // Always extract both client and seller IDs/names regardless of view type
          // Use direct sellerId/clientId fields if available, otherwise fall back to nested objects
          const sellerId = assignment.sellerId || assignment.seller?.id;
          const sellerName = assignment.seller?.name;
          const clientId = assignment.clientId || assignment.client?.id;
          const clientName = assignment.client?.name;
          
          // Extract invoice properties
          const hasInvoice = Boolean(assignment.invoiceItems && assignment.invoiceItems.length > 0);
          let invoiceId: string | undefined = undefined;
          let isPaid = false;
          
          if (hasInvoice && assignment.invoiceItems && assignment.invoiceItems.length > 0) {
            const invoice = assignment.invoiceItems[0].invoice;
            invoiceId = invoice.id;
            // Explicitly convert to boolean with Boolean()
            isPaid = Boolean(invoice.payment?.isPaid);
          }
          
          // Product status
          const isCompleted = status.name === "COMPLETED";
          const hasSellerAccepted = true; // Assume accepted unless a specific field says otherwise
          
          // Create the product assignment card
          return (
            <ProductAssignmentCard
              key={id}
              id={id}
              productId={productId}
              productName={productName}
              productDescription={productDescription}
              categoryName={categoryName}
              price={price}
              status={status}
              clientId={clientId}
              clientName={clientName}
              sellerId={sellerId}
              sellerName={sellerName}
              hasInvoice={hasInvoice}
              isPaid={isPaid}
              invoiceId={invoiceId}
              hasSellerAccepted={true}
              viewType={viewType}
              createdAt={assignment.createdAt}
              reviewedByClient={assignment.wasReviewed}
              reviewedBySeller={assignment.wasClientReviewed}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} />
      )}
    </div>
  );
} 
