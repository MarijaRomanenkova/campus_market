/**
 * Product Assignment Card Component
 * @module Components
 * @group Shared/ProductAssignment
 * 
 * A card component that displays product assignment information with status badges,
 * action buttons, and user-specific views for both clients and sellers.
 * 
 * @example
 * ```tsx
 * <ProductAssignmentCard
 *   id="123"
 *   productId="456"
 *   productName="Garden Maintenance"
 *   status={{ name: "IN_PROGRESS", color: "blue" }}
 *   viewType="client"
 * />
 * ```
 */

'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Check, Clock, Receipt, MessageSquare, Calendar } from "lucide-react";
import ProductCompleteButton from "./product-complete-button";
import AddInvoiceDialog from "./add-invoice-dialog";
import AcceptProductButton from "./accept-product-button";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getOrCreateConversation } from "@/lib/actions/conversation.actions";
import { updateProductAssignmentStatus } from "@/lib/actions/product-assignment-status.actions";
import ReviewProductDialog from "./review-product-dialog";
import ReviewClientDialog from "./review-client-dialog";

// Simple function to format dates in DD-MM-YYYY format
const formatDateAsDDMMYYYY = (date: string | Date | number | object | undefined): string => {
  try {
    // If it's a date string with ISO format (2023-01-15T...)
    if (typeof date === 'string' && date.includes('-')) {
      const parts = date.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // For any other case, try new Date() with type checking
    if (date !== undefined) {
      const jsDate = new Date(date as string | number | Date);
      if (!isNaN(jsDate.getTime())) {
        const day = String(jsDate.getDate()).padStart(2, '0');
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const year = jsDate.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    
    return "Today";
  } catch (error) {
    return "Today";
  }
};

/**
 * Type definition for the status badge variants
 */
type StatusBadgeVariant = 
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'paid'
  | 'unpaid'
  | 'pending'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'archived';

/**
 * Props for the ProductAssignmentCard component
 * @interface ProductAssignmentCardProps
 */
interface ProductAssignmentCardProps {
  /** Unique identifier for the product assignment */
  id: string;
  /** Unique identifier for the associated product */
  productId: string;
  /** Name of the product */
  productName: string;
  /** Optional description of the product */
  productDescription?: string | null;
  /** Optional category name for the product */
  categoryName?: string | null;
  /** Price of the product */
  price: number;
  /** Status information for the product assignment */
  status: {
    /** Current status name (e.g., "IN_PROGRESS", "COMPLETED") */
    name: string;
    /** Color theme for the status badge */
    color: string;
  };
  /** Optional client identifier (for seller view) */
  clientId?: string;
  /** Optional client name (for seller view) */
  clientName?: string;
  /** Optional seller identifier (for client view) */
  sellerId?: string;
  /** Optional seller name (for client view) */
  sellerName?: string;
  /** Whether the product has an associated invoice */
  hasInvoice?: boolean;
  /** Whether the invoice has been paid */
  isPaid?: boolean;
  /** Optional invoice identifier */
  invoiceId?: string;
  /** Whether the seller has accepted the product */
  hasSellerAccepted?: boolean;
  /** Type of user viewing the card ("client" or "seller") */
  viewType: 'client' | 'seller';
  /** Optional creation date of the product assignment */
  createdAt?: string | Date;
  /** Whether the client has reviewed the product */
  reviewedByClient?: boolean;
  /** Whether the seller has reviewed the client */
  reviewedBySeller?: boolean;
}

/**
 * ContactButton Component for product assignments
 * 
 * A button that handles navigation to the appropriate conversation
 * for a specific product assignment between a client and seller.
 */
function ContactButton({ 
  productId, 
  clientId, 
  sellerId, 
  viewType 
}: { 
  productId: string; 
  clientId?: string; 
  sellerId?: string; 
  viewType: 'client' | 'seller' 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleContact = async () => {
    try {
      // Verify that we have the required IDs before proceeding
      if (!clientId || !sellerId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Missing user information. Contact your administrator.',
        });
        return;
      }

      if (!session?.user?.id) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please sign in to start a conversation.',
        });
        router.push('/auth/signin');
        return;
      }
      
      setIsLoading(true);
      
      // Use the server action to get or create conversation
      const result = await getOrCreateConversation(
        session.user.id,
        productId,
        clientId,
        sellerId
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.conversation || !result.conversation.id) {
        console.error('Invalid conversation result:', result);
        throw new Error('Failed to create conversation: missing conversation ID');
      }

      // Ensure the conversation ID is a string
      const conversationId = String(result.conversation.id);
      
      if (!conversationId || conversationId === 'undefined') {
        console.error('Invalid conversation ID:', conversationId, 'from result:', result);
        throw new Error('Failed to get conversation ID');
      }

      // Navigate to the conversation
      router.push(`/user/dashboard/messages/${conversationId}`);
    } catch (error) {
      console.error('Error navigating to conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open conversation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="success"
      onClick={handleContact}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : (
        <>
          <MessageSquare className="mr-1 h-4 w-4" />
          Contact
        </>
      )}
    </Button>
  );
}

// Function to determine which badge variant to use based on status name
const getStatusVariant = (statusName: string): StatusBadgeVariant => {
  const normalizedStatus = statusName.toLowerCase().replace(/\s+/g, '');
  
  switch (normalizedStatus) {
    case 'pending':
      return 'pending';
    case 'inprogress':
    case 'in-progress':
    case 'in_progress':
      return 'inProgress';
    case 'completed':
    case 'complete':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'archived':
      return 'archived';
    default:
      return 'secondary';
  }
};

export default function ProductAssignmentCard({
  id,
  productId,
  productName,
  productDescription,
  categoryName,
  price,
  status,
  clientId,
  clientName,
  sellerId,
  sellerName,
  hasInvoice,
  isPaid = false,
  invoiceId,
  hasSellerAccepted,
  viewType,
  createdAt,
  reviewedByClient,
  reviewedBySeller,
}: ProductAssignmentCardProps) {
  // Check for status values using direct comparison with uppercase status names
  const isCompleted = status.name === "COMPLETED";
  // Check for accepted status directly from status name
  const isAccepted = status.name === "ACCEPTED";
  // Check if the product is in progress (the only state where we should show the Complete button)
  const isInProgress = status.name === "IN_PROGRESS";
  const isSellerView = viewType === 'seller';
  const isClientView = viewType === 'client';
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Function to handle completing a product as client
  const completeProduct = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Use the server action instead of fetch API call
      const result = await updateProductAssignmentStatus(id, 'completed');
      
      if (!result) {
        throw new Error('Failed to complete product');
      }
      
      toast({
        title: "Product completed successfully",
        description: "The product has been marked as completed.",
        variant: "default",
      });
      
      router.refresh();
    } catch (error) {
      toast({
        title: "Error completing product",
        description: error instanceof Error ? error.message : "There was a problem completing this product. Please try again.",
        variant: "destructive",
      });
      console.error('Error completing product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-0.5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1">{productName}</CardTitle>
          <div className="flex items-center gap-2 max-w-[50%]">
            {hasInvoice && isSellerView && (
              <Badge
                variant={isPaid ? "paid" : "unpaid"}
                className="px-2.5 py-1 rounded-md shadow-sm whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {isPaid ? (
                  <>
                    <Check className="mr-1 h-3 w-3" /> Paid
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" /> Invoice Sent
                  </>
                )}
              </Badge>
            )}
            <Badge
              variant={getStatusVariant(status.name)}
              className="px-2.5 py-1 rounded-md shadow-sm whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {status.name}
            </Badge>
          </div>
        </div>
        {createdAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Assigned on {formatDateAsDDMMYYYY(createdAt)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1 py-2">
        {productDescription ? (
          <p className="text-sm line-clamp-2">{productDescription}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description available</p>
        )}
        
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Category: <span className="text-muted-foreground">{categoryName || "Uncategorized"}</span>
          </p>
        </div>
        
        {isClientView && isCompleted && (
          <div className="flex items-center gap-2 mt-1">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">
              Marked as completed by seller
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <div className="flex items-center">
          {isSellerView && clientName && (
            <div className="flex items-center text-base">
              <span className="font-medium mr-1.5">Client:</span>
              <span className="text-muted-foreground">{clientName}</span>
            </div>
          )}
          {isClientView && sellerName && (
            <div className="flex items-center text-base">
              <span className="font-medium mr-1.5">Seller:</span>
              <span className="text-muted-foreground">{sellerName}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Invoice functionality - independent of status flow */}
          {isSellerView && (
            <>
              {hasInvoice ? (
                <AddInvoiceDialog
                  key={`invoice-dialog-${id}`}
                  productId={productId}
                  clientId={clientId || ''}
                  productAssignmentId={id}
                >
                  <Button
                    variant="warning-outline"
                    size="sm"
                  >
                    <Receipt className="mr-1 h-4 w-4" />
                    Issue Invoice
                  </Button>
                </AddInvoiceDialog>
              ) : (
                <Button
                  asChild
                  variant="warning"
                  size="sm"
                >
                  <Link href={`/user/dashboard/seller/invoices/create?productAssignmentId=${id}&clientId=${clientId || ''}&productId=${productId}`}>
                    <Receipt className="mr-1 h-4 w-4" />
                    Issue Invoice
                  </Link>
                </Button>
              )}
            </>
          )}

          {/* Step 1: Seller can mark product as complete only if it's in IN_PROGRESS status */}
          {isSellerView && isInProgress && (
            <Button
              onClick={completeProduct}
              variant="success"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Complete"}
            </Button>
          )}
          
          {/* Step 2: Client can accept a completed product */}
          {isClientView && isCompleted && (
            <AcceptProductButton 
              productAssignmentId={id} 
              className="" 
            />
          )}

          {/* Step 3: After product is accepted, both parties can submit reviews */}
          {/* Review Button for clients */}
          {isClientView && isAccepted && (
            <ReviewProductDialog 
              productAssignmentId={id}
              productName={productName}
              isEditMode={reviewedByClient}
            >
              <Button
                variant="warning"
                size="sm"
              >
                <span className="mr-1">★</span>
                {reviewedByClient ? "Edit Review" : "Submit Review"}
              </Button>
            </ReviewProductDialog>
          )}

          {/* Review Button for sellers */}
          {isSellerView && isAccepted && (
            <ReviewClientDialog 
              productAssignmentId={id}
              clientName={clientName || 'Client'}
              isEditMode={reviewedBySeller}
            >
              <Button
                variant="warning"
                size="sm"
              >
                <span className="mr-1">★</span>
                {reviewedBySeller ? "Edit Review" : "Review Client"}
              </Button>
            </ReviewClientDialog>
          )}
          
          <Button asChild variant="success-outline" size="sm">
            <Link href={`/user/dashboard/product-assignments/${id}`}>View Details</Link>
          </Button>

          {/* Always show the contact button with available IDs */}
          <ContactButton
            productId={productId}
            clientId={clientId}
            sellerId={sellerId}
            viewType={viewType}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
