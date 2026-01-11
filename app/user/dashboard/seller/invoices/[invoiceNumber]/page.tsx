/**
 * Seller Invoice Detail Page Component
 * @module Pages
 * @group Dashboard/Seller
 * 
 * This page displays detailed information about a specific invoice created by the seller.
 * It includes invoice items, totals, and payment status.
 */

import { getInvoiceByNumber } from '@/lib/actions/invoice.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import InvoiceDetails from '@/components/shared/invoice/invoice';
import DownloadInvoiceButton from '@/components/shared/invoice/download-invoice-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from '@/types';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

/**
 * Props for the SellerInvoicePage component
 * @interface Props
 * @property {Promise<{invoiceNumber: string}>} params - Route parameters containing the invoice number
 */
interface Props {
  params: Promise<{
    invoiceNumber: string;
  }>;
}

/**
 * Generate metadata for the invoice page
 * Sets the page title based on the invoice number
 * 
 * @param {Props} props - Component properties containing route parameters
 * @returns {Promise<Metadata>} Metadata for the page with appropriate title
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceNumber } = await params;
  return {
    title: `Invoice ${invoiceNumber}`,
  };
}

/**
 * Seller Invoice Page Component
 * 
 * This server component renders the invoice detail view with:
 * - Invoice information and items
 * - Payment status
 * - Download functionality
 * - Navigation back to invoices list
 * 
 * @component
 * @param {Props} props - Component properties
 * @returns {Promise<JSX.Element>} Invoice detail page
 */
export default async function SellerInvoicePage({ params }: Props) {
  const { invoiceNumber } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return notFound();
  }

  const invoice = await getInvoiceByNumber(invoiceNumber);
  
  if (!invoice || invoice.sellerId !== session.user.id) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/user/dashboard/seller/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <InvoiceDetails invoice={invoice} />
        
        <div className="flex justify-end">
          <DownloadInvoiceButton invoiceNumber={invoice.invoiceNumber} />
        </div>
      </div>
    </div>
  );
}
