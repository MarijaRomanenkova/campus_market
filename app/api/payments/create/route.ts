/**
 * Payment Creation API Route
 * @module API
 * @group Payments
 * 
 * This API endpoint handles the creation of new payment records.
 * It creates a payment linked to multiple invoices and sets up the payment
 * for processing with the selected payment method (Stripe or PayPal).
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST handler for payment creation
 * 
 * Creates a new payment record linked to multiple invoices.
 * This is the first step in the payment process, creating the database record
 * before redirecting to the appropriate payment processor.
 * 
 * Security:
 * - Requires authentication
 * - Validates that invoices belong to the authenticated user
 * - Only allows unpaid invoices to be included
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with payment ID or error details
 * @example
 * // Request body format
 * // { "invoiceIds": ["invoice1", "invoice2"], "paymentMethod": "Stripe" }
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
    
    // Get invoice IDs and payment method from request body
    const { invoiceIds, paymentMethod } = await request.json();
  
    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invoice IDs' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['Stripe', 'PayPal'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }
    
    // Get all invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: invoiceIds,
        },
      },
      include: {
        client: true,
        seller: true,
      },
    });

    // Check if any invoices are already paid
    const paidInvoices = invoices.filter(invoice => invoice.paymentId !== null);
    if (paidInvoices.length > 0) {
      return NextResponse.json(
        { success: false, message: 'One or more invoices are already paid' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.totalPrice), 0);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: totalAmount,
        paymentMethod,
        userId: invoices[0].clientId,
        paymentResult: {
          status: 'PENDING',
          id: '',
          email_address: '',
          amount: totalAmount
        }
      },
    });

    // Update invoices with payment ID
    const updatedInvoices = await Promise.all(
      invoices.map(invoice =>
        prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paymentId: payment.id,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        payment,
        invoices: updatedInvoices,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Some invoices are already associated with a payment' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create payment' },
      { status: 500 }
    );
  }
} 
