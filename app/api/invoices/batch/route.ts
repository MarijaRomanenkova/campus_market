/**
 * Invoice Batch API Route
 * @module API
 * @group Invoices
 * 
 * This API endpoint provides batch operations for invoices.
 * It allows retrieving multiple invoices in a single request,
 * particularly for payment processing purposes.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';

/**
 * POST handler for batch invoice retrieval
 * 
 * Retrieves multiple invoices by their IDs in a single request.
 * Only returns invoices that:
 * - Belong to the authenticated user (as client)
 * - Are not already attached to a payment
 * 
 * Includes related client and seller information.
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with invoices or error details
 * @example
 * // Request body format
 * // { "ids": ["invoice1", "invoice2", "invoice3"] }
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
    
    // Get invoice IDs from request body
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invoice IDs' },
        { status: 400 }
      );
    }
    
    // Fetch invoices - only those that aren't part of a payment yet
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: ids },
        clientId: userId as string,
        paymentId: null, // Only invoices that haven't been paid yet
      },
      select: {
        id: true,
        invoiceNumber: true, 
        totalPrice: true,
        clientId: true,
        sellerId: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Convert Prisma objects to plain JS objects
    const plainInvoices = convertToPlainObject(invoices);
    
    // Ensure totalPrice is properly formatted as a number for JavaScript
    const formattedInvoices = plainInvoices.map(invoice => ({
      ...invoice,
      totalPrice: Number(invoice.totalPrice)
    }));
    
    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
