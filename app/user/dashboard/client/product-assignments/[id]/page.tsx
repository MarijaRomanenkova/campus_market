import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardHeader from '@/components/shared/dashboard-header';
import { getProductAssignmentById } from '@/lib/actions/product-assignment.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import GoBackButton from '@/components/shared/go-back-button';
import ReviewProductDialog from '@/components/shared/product-assignment/review-product-dialog';
import { ProductAssignment, ProductAssignmentInvoice } from '@/types';
import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import AcceptProductButton from '@/components/shared/product-assignment/accept-product-button';

export default async function ProductAssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  const { id } = await params;
  const productAssignment = await getProductAssignmentById(id);
  
  if (!productAssignment?.success || !productAssignment.data) {
    return (
      <div className="container mx-auto py-10">
        <DashboardHeader
          heading="Product Assignment"
          text="Product assignment not found"
        />
        <Card>
          <CardContent className="pt-6">
            <p>The requested product assignment could not be found or you don&apos;t have permission to view it.</p>
            <div className="mt-4">
              <GoBackButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const assignment = productAssignment.data as ProductAssignment;
  const latestInvoice = assignment.invoices && assignment.invoices.length > 0 
    ? [...assignment.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] as ProductAssignmentInvoice
    : null;
  
  const canReviewProduct = 
    assignment.status.name === 'COMPLETED' && 
    !assignment.wasReviewed;
    
  const canAcceptProduct = assignment.status.name === 'COMPLETED';

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

  // Format dates for display
  const formattedDates = {
    createdAt: safeFormatDate(assignment.createdAt, 'PPP'),
    updatedAt: safeFormatDate(assignment.updatedAt, 'PPP'),
    completedAt: assignment.completedAt ? safeFormatDate(assignment.completedAt, 'PPP') : null,
  };

  return (
    <div className="container mx-auto py-10">
      <DashboardHeader
        heading="Product Assignment Details"
        text={`Details for product: ${assignment.product.name}`}
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
              Product assigned on {formattedDates.createdAt}
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

        {/* Seller Information */}
        <Card>
          <CardHeader>
            <CardTitle>Seller</CardTitle>
            <CardDescription>The seller assigned to this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={assignment.seller?.image || ''} alt={assignment.seller?.name || 'Seller'} />
                <AvatarFallback>{assignment.seller?.name?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{assignment.seller?.name || 'Unnamed Seller'}</p>
                <p className="text-sm text-muted-foreground">{assignment.seller?.email || 'No email provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Information about payment for this product</CardDescription>
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
                <Link href={`/user/dashboard/client/invoices/${latestInvoice.id}`} className="w-full mt-2 inline-block">
                  <button className="w-full bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                    View Invoice
                  </button>
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
            <CardDescription>Message your seller about this product</CardDescription>
          </CardHeader>
          <CardContent>
            {assignment.conversation ? (
              <Link href={`/user/dashboard/messages/${assignment.conversation.id}`} className="w-full inline-block">
                <button className="w-full bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Messages
                </button>
              </Link>
            ) : (
              <p>No conversation has been created for this product yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Product Review */}
        <Card>
          <CardHeader>
            <CardTitle>Product Review</CardTitle>
            <CardDescription>
              {canReviewProduct 
                ? "Provide feedback on product completion" 
                : assignment.wasReviewed
                  ? "You've already reviewed this product"
                  : "Product must be completed before you can review it"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canReviewProduct ? (
              <ReviewProductDialog 
                productAssignmentId={assignment.id}
                productName={assignment.product.name}
              />
            ) : assignment.wasReviewed ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <StarRatingDisplay 
                    value={assignment.reviewRating || 0} 
                    size={20}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Rating: {assignment.reviewRating || 0}/5
                  </span>
                </div>
                {assignment.reviewFeedback && (
                  <div className="mt-2 p-3 bg-secondary rounded-md text-sm">
                    &ldquo;{assignment.reviewFeedback}&rdquo;
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This product must be marked as completed before you can submit a review.
              </p>
            )}
          </CardContent>
        </Card>

        <CardFooter className="flex justify-between pt-6">
          <GoBackButton />
        </CardFooter>
      </div>
    </div>
  );
} 
