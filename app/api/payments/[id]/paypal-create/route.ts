/**
 * PayPal Payment Creation API Route
 * @module API
 * @group Payments
 * 
 * This API endpoint handles the first step in the PayPal payment flow.
 * It creates a PayPal order for an existing payment record in our system.
 * This endpoint is called when a user selects PayPal as their payment method.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { paypal } from '@/lib/paypal';

/**
 * POST handler for PayPal order creation
 * 
 * Creates a PayPal order for an existing payment.
 * This is the initial step in processing a PayPal payment,
 * which returns a PayPal order ID that the client will use
 * to redirect the user to PayPal's approval page.
 * 
 * Security:
 * - Requires authentication
 * - Validates that the payment belongs to the authenticated user
 * - Verifies the payment is in an unpaid state
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with PayPal order ID or error details
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
    
    // Get payment from database
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
    
    // Check if payment is already paid
    if (payment.isPaid) {
      return NextResponse.json(
        { error: 'Payment is already processed' },
        { status: 400 }
      );
    }
    
    // Create PayPal order
    const order = await paypal.createPayment(Number(payment.amount)); 
    // Update payment with PayPal order ID
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentResult: {
          id: order.id,
          status: order.status,
        },
      },
    });
    
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order', details: String(error) },
      { status: 500 }
    );
  }
} 
