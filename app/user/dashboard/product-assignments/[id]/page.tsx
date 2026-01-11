import { getProductAssignmentById } from '@/lib/actions/product-assignment.actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProductAssignmentDetails from '@/components/shared/product-assignment/product-assignment-details';
import { Card, CardContent } from '@/components/ui/card';
import DashboardHeader from '@/components/shared/dashboard-header';
import GoBackButton from '@/components/shared/go-back-button';
import { ProductAssignment } from '@/types';
import { prisma } from '@/db/prisma';
import { formatDateTime } from '@/lib/utils';

/**
 * Helper function to deeply clone and clean objects for client component consumption
 * Removes any non-JSON-serializable values like functions, etc.
 */
function sanitizeForClient<T>(data: T): T {
  // First, check if the data is null or undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitive types directly
  if (
    typeof data !== 'object' || 
    data instanceof Date || 
    data instanceof RegExp ||
    data instanceof String ||
    data instanceof Number ||
    data instanceof Boolean
  ) {
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForClient(item)) as unknown as T;
  }
  
  // Handle objects
  const result = {} as Record<string, unknown>;
  for (const key in data) {
    // Skip functions or other non-serializable types
    const value = (data as Record<string, unknown>)[key];
    if (typeof value !== 'function' && key !== 'symbol') {
      result[key] = sanitizeForClient(value);
    }
  }
  
  return result as T;
}

/**
 * Unified Product Assignment Details Page
 * This page can be accessed by both clients and sellers
 * and will show relevant information based on the user's role
 */
export default async function UnifiedProductAssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }
  
  // Get the product assignment ID from params
  const { id: assignmentId } = await params;
  
  // First, we'll make a direct database query to determine the user's role
  // This is more reliable than depending on the data from getProductAssignmentById
  const productAssignment = await prisma.productAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      clientId: true,
      sellerId: true
    }
  });
  
  if (!productAssignment) {
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
  
  // Determine user role directly from database IDs
  let userRole: 'client' | 'seller' | null = null;
  
  if (productAssignment.clientId === session.user.id) {
    userRole = 'client';
  } else if (productAssignment.sellerId === session.user.id) {
    userRole = 'seller';
  }
  
  // Redirect if user is neither client nor seller
  if (!userRole) {
    redirect('/user/dashboard');
  }
  
  // Now fetch the complete product assignment details
  const result = await getProductAssignmentById(assignmentId);
  
  if (!result.success) {
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
  
  // First stringify and then parse to remove any functions and ensure clean data
  const jsonString = JSON.stringify(result.data);
  // Then, use our custom sanitizer as a second defense
  const sanitizedAssignment = sanitizeForClient(JSON.parse(jsonString)) as ProductAssignment;
  
  return <ProductAssignmentDetails assignment={sanitizedAssignment} userRole={userRole} />;
} 
