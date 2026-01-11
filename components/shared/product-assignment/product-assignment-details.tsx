/**
 * Product Assignment Details Component
 * @module Components
 * @group Shared/ProductAssignment
 * 
 * A detailed view component for product assignments that displays comprehensive information
 * about a product, including status, client/seller details, invoice information,
 * and review functionality. The component adapts its display and available actions
 * based on whether the user is a client or seller.
 * 
 * @example
 * ```tsx
 * <ProductAssignmentDetails
 *   assignment={productAssignment}
 *   userRole="client"
 * />
 * ```
 */

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardHeader from '@/components/shared/dashboard-header';
import GoBackButton from '@/components/shared/go-back-button';
import StatusUpdateButtons from './status-update-buttons';
import AcceptProductButton from './accept-product-button';
import ReviewProductDialog from './review-product-dialog';
import ReviewClientDialog from './review-client-dialog';
import ReviewStudentDialog from './review-student-dialog';
import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import { ProductAssignment, ProductAssignmentInvoice } from '@/types';
import { Button } from '@/components/ui/button';

/**
 * Configuration flag for enabling student reviews
 * @constant
 */
const ENABLE_STUDENT_REVIEWS = true;

/**
 * Props for the ProductAssignmentDetails component
 * @interface ProductAssignmentDetailsProps
 */
interface ProductAssignmentDetailsProps {
  /** The product assignment data to display */
  assignment: ProductAssignment;
  /** The role of the user viewing the details ("client" or "seller") */
  userRole: 'client' | 'seller';
}

export default function ProductAssignmentDetails({ assignment, userRole }: ProductAssignmentDetailsProps) {
  const isClient = userRole === 'client';
  const isSeller = userRole === 'seller';
  
  const latestInvoice = assignment.invoices && assignment.invoices.length > 0 
    ? [...assignment.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] as ProductAssignmentInvoice
    : null;
  
  // Client-specific conditions
  const canReviewProduct = isClient && 
    assignment.status.name === 'COMPLETED' && 
    !assignment.wasReviewed;
    
  const canAcceptProduct = isClient && assignment.status.name === 'COMPLETED';
  
  // Seller-specific conditions
  const canCreateInvoice = isSeller && 
    assignment.status.name === 'COMPLETED' && 
    !assignment.invoices?.some((invoice: ProductAssignmentInvoice) => ['PENDING', 'PAID'].includes(invoice.status));

  // Helper function to safely format dates with fallback
  const safeFormatDate = (dateString: string | Date | null | undefined, formatStr: string) => {
    if (!dateString) return 'Not specified';
    try {
      // Handle various date formats
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try parsing the date string
        if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
          // ISO format
          date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
          // YYYY-MM-DD format
          date = new Date(dateString);
        } else {
          // Try converting timestamp to number if it's a numeric string
          const timestamp = Number(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            console.error('Unrecognized date format:', dateString);
            return 'Invalid date format';
          }
        }
      } else {
        console.error('Unsupported date type:', typeof dateString);
        return 'Invalid date type';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      return format(date, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Date error';
    }
  };

  // Helper function for safe distance formatting
  const safeFormatDistance = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Unknown time';
    try {
      // Handle various date formats
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Try parsing the date string
        if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
          // ISO format
          date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
          // YYYY-MM-DD format
          date = new Date(dateString);
        } else {
          // Try converting timestamp to number if it's a numeric string
          const timestamp = Number(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            console.error('Unrecognized date format:', dateString);
            return 'Invalid date format';
          }
        }
      } else {
        console.error('Unsupported date type:', typeof dateString);
        return 'Invalid date type';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Distance formatting error:', error, 'for date:', dateString);
      return 'Date error';
    }
  };

  function formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      if (typeof dateString === 'string') {
        return format(new Date(dateString), 'PPP');
      }
      if (dateString instanceof Date) {
        return format(dateString, 'PPP');
      }
      return 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  }

  function formatDistance(distance: number | null | undefined): string {
    if (distance === null || distance === undefined) return 'N/A';
    
    try {
      return `${distance.toFixed(1)} km`;
    } catch (error) {
      return 'Invalid distance';
    }
  }

  return (
    <div className="container mx-auto py-10">
      <DashboardHeader
        heading="Product Assignment Details"
        text={`Details for product assignment: ${assignment.product.name}`}
      />

      <div className="grid gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product Information</CardTitle>
              <Badge variant={
                assignment.status.name === 'COMPLETED' ? 'success' :
                assignment.status.name === 'IN_PROGRESS' ? 'warning' : 'default'
              }>
                {assignment.status.name}
              </Badge>
            </div>
            <CardDescription>
              Product assigned on {safeFormatDate(assignment.createdAt, 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{assignment.product.name}</h3>
              <p className="text-muted-foreground mt-2">{assignment.product.description}</p>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due: {safeFormatDate(assignment.product.dueDate, 'PPP')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {safeFormatDistance(assignment.updatedAt)}</span>
            </div>
            
            {canAcceptProduct && (
              <div className="mt-4">
                <AcceptProductButton productAssignmentId={assignment.id} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client/Seller Information */}
        {isClient ? (
          <Card>
            <CardHeader>
              <CardTitle>Student</CardTitle>
              <CardDescription>The student assigned to this product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignment.seller?.image || ''} alt={assignment.seller?.name || 'Student'} />
                  <AvatarFallback>{assignment.seller?.name?.charAt(0) || 'N'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{assignment.seller?.name || 'Unnamed Student'}</p>
                  <p className="text-sm text-muted-foreground">{assignment.seller?.email || 'No email provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
              <CardDescription>The client who requested this product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignment.client.image || ''} alt={assignment.client.name} />
                  <AvatarFallback>{assignment.client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{assignment.client.name}</p>
                  <p className="text-sm text-muted-foreground">{assignment.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Information about payment for this product</CardDescription>
              </div>
              {canCreateInvoice && (
                <Link 
                  href={`/user/dashboard/seller/invoices/create?productAssignmentId=${assignment.id}${
                    assignment.client && 'id' in assignment.client ? `&clientId=${assignment.client.id}` : ''
                  }&productId=${assignment.product.id}`} 
                  className="inline-block"
                >
                  <Button className="flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {latestInvoice ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Invoice #{latestInvoice.id.substring(0, 8)}</span>
                  </div>
                  <Badge variant={
                    latestInvoice.status === 'PAID' ? 'success' :
                    latestInvoice.status === 'PENDING' ? 'warning' : 'default'
                  }>
                    {latestInvoice.status}
                  </Badge>
                </div>
                <p>Amount: ${typeof latestInvoice.amount === 'number' ? latestInvoice.amount.toFixed(2) : 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Created: {safeFormatDate(latestInvoice.createdAt, 'PPP')}
                </p>
                <Link 
                  href={isClient 
                    ? `/user/dashboard/client/invoices/${latestInvoice.id}` 
                    : `/user/dashboard/seller/invoices/${latestInvoice.id}`
                  } 
                  className="w-full mt-2 inline-block"
                >
                  <Button className="w-full">View Invoice</Button>
                </Link>
              </div>
            ) : (
              <p>No invoices have been issued for this product yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Communication */}
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
            <CardDescription>Message about this product</CardDescription>
          </CardHeader>
          <CardContent>
            {assignment.conversation ? (
              <Link href={`/user/dashboard/messages/${assignment.conversation.id}`} className="w-full inline-block">
                <Button className="w-full flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Open Messages
                </Button>
              </Link>
            ) : (
              <p>No conversation has been created for this product yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Role-specific sections */}
        {isClient && canReviewProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Review Product</CardTitle>
              <CardDescription>Leave a review for the student</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewStudentDialog 
                productAssignmentId={assignment.id}
                studentName={assignment.seller?.name || 'Student'} 
              />
            </CardContent>
          </Card>
        )}

        {isClient && assignment.reviewRating && (
          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>Your review for this student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StarRatingDisplay value={assignment.reviewRating} />
              {assignment.reviewFeedback && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{assignment.reviewFeedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isSeller && assignment.status.name !== 'COMPLETED' && (
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
              <CardDescription>Update the status of this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Current status: {assignment.status.name}</p>
              <StatusUpdateButtons 
                productId={assignment.product.id} 
                currentStatus={assignment.status.name} 
              />
            </CardContent>
          </Card>
        )}

        {isSeller && assignment.status.name === 'ACCEPTED' && !assignment.wasClientReviewed && (
          <Card>
            <CardHeader>
              <CardTitle>Review Client</CardTitle>
              <CardDescription>Leave a review for the client</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewClientDialog 
                productAssignmentId={assignment.id}
                clientName={assignment.client.name} 
              />
            </CardContent>
          </Card>
        )}

        {isSeller && assignment.wasClientReviewed && (
          <Card>
            <CardHeader>
              <CardTitle>Your Review of Client</CardTitle>
              <CardDescription>Your review for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StarRatingDisplay value={assignment.clientReviewRating || 0} />
              {assignment.clientReviewFeedback && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{assignment.clientReviewFeedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <CardFooter className="flex justify-between pt-6">
          <GoBackButton />
        </CardFooter>
      </div>
    </div>
  );
} 
