'use client';
/**
 * @module DownloadInvoiceButton
 * @description A component that renders a button to download an invoice as PDF.
 */

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Link from 'next/link';

/**
 * @interface DownloadInvoiceButtonProps
 * @property {string} invoiceNumber - The invoice number to download
 */

/**
 * DownloadInvoiceButton component for downloading an invoice as PDF.
 * 
 * @param {Object} props - Component props
 * @param {string} props.invoiceNumber - The invoice number to download
 * @returns {JSX.Element} Button component that allows downloading the invoice PDF
 */
const DownloadInvoiceButton = ({ 
  invoiceNumber 
}: { 
  invoiceNumber: string;
}) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2"
      asChild
    >
      <Link href={`/api/invoices/${invoiceNumber}/download`} target="_blank">
        <Download className="h-4 w-4" />
        Download PDF
      </Link>
    </Button>
  );
};

export default DownloadInvoiceButton; 
