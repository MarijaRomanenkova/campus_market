/**
 * PayPal Payment Capture API Route
 * @module API
 * @group Payments
 * 
 * This API endpoint handles the second step in the PayPal payment flow.
 * It captures (finalizes) a payment after a user has approved it on PayPal.
 * It receives the PayPal order ID from the client and completes the payment process.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { paypal } from '@/lib/paypal';
import { revalidatePath } from 'next/cache';

/**
 * POST handler for PayPal payment capture
 * 
 * Finalizes a PayPal payment after user approval.
 * This is called after the user has approved the payment on PayPal's site
 * and returns to our application. It completes the payment process by
 * capturing the funds and updating the payment status in our database.
 * 
 * Security:
 * - Requires authentication
 * - Validates that the payment belongs to the authenticated user
 * - Verifies the PayPal order ID matches our records
 * 
 * @param {Request} request - The incoming request containing the PayPal order ID
 * @returns {Promise<NextResponse>} JSON response with success status or error details
 * @example
 * // Request body format
 * // { "paypalOrderId": "5O190127TN364715T" }
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract payment ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const paymentId = pathParts[pathParts.indexOf('payments') + 1];
    
    // Get PayPal order ID from request body
    const { paypalOrderId } = await request.json();
    
    if (!paypalOrderId) {
      return NextResponse.json(
        { error: 'PayPal order ID is required' },
        { status: 400 }
      );
    }
    
    // Find the payment in our database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Verify that the provided PayPal order ID matches our records
    if (
      payment.paymentResult &&
      typeof payment.paymentResult === 'object' &&
      'id' in payment.paymentResult &&
      payment.paymentResult.id !== paypalOrderId
    ) {
      return NextResponse.json(
        { error: 'PayPal order ID mismatch' },
        { status: 400 }
      );
    }
    
    // Capture the payment via PayPal API
    const captureResponse = await paypal.capturePayment(paypalOrderId);
    // Update payment status in our database
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult: captureResponse,
      },
    });
    
    // Revalidate the payment page to update UI
    revalidatePath(`/payments/${paymentId}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal payment', details: String(error) },
      { status: 500 }
    );
  }
} 
