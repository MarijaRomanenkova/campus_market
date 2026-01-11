import { NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/lib/services/invoice-pdf-service';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { convertToPlainObject } from '@/lib/utils';

interface AddressData {
  address: string;
}

function isAddressData(data: unknown): data is AddressData {
  return typeof data === 'object' && data !== null && 'address' in data && typeof (data as AddressData).address === 'string';
}

/**
 * GET handler for downloading an invoice as PDF
 * 
 * @param request - The incoming request
 * @returns PDF file response or error
 */
export async function GET(request: Request) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Extract invoiceNumber from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const invoiceNumber = pathParts[pathParts.indexOf('invoices') + 1];

    // Get the invoice data
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        client: true,
        seller: true,
        items: {
          select: {
            id: true,
            invoiceId: true,
            productId: true,
            qty: true,
            price: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return new Response('Invoice not found', { status: 404 });
    }

    // Check authorization
    if (invoice.clientId !== userId && invoice.sellerId !== userId) {
      return new Response('Unauthorized', { status: 403 });
    }

    // Transform invoice data for PDF generation
    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      totalPrice: invoice.totalPrice.toString(),
      clientId: invoice.clientId,
      sellerId: invoice.sellerId,
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        address: invoice.client.address ? String(JSON.parse(invoice.client.address as string).address) : null
      },
      seller: {
        name: invoice.seller.name,
        email: invoice.seller.email,
        address: invoice.seller.address ? String(JSON.parse(invoice.seller.address as string).address) : null
      },
      items: invoice.items.map(item => ({
        id: item.id,
        invoiceId: item.invoiceId,
        productId: item.productId,
        name: item.product.name,
        quantity: item.qty || 1,
        price: item.price.toString()
      }))
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Return the PDF
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
} 
