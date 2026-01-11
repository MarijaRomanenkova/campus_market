/**
 * Invoice Details Component
 * @module Components
 * @group Shared/Invoice
 * 
 * A client-side component that renders a detailed view of an invoice, including:
 * - Invoice header with number and issue date
 * - Client and seller information
 * - Itemized list of services/products with quantities and prices
 * - Total amount calculation
 * - Payment status and date information
 * 
 * @example
 * ```tsx
 * <InvoiceDetails
 *   invoice={{
 *     id: "inv-123",
 *     invoiceNumber: "INV-001",
 *     totalPrice: "100.00",
 *     items: [{
 *       id: "item-1",
 *       name: "Service A",
 *       price: "50.00",
 *       qty: 2
 *     }],
 *     isPaid: false,
 *     createdAt: new Date()
 *   }}
 * />
 * ```
 */

'use client';

import { Invoice } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Props for the InvoiceDetails component
 * @interface InvoiceDetailsProps
 */
interface InvoiceDetailsProps {
  /** The invoice data to display */
  invoice: Invoice;
}

/**
 * Invoice Details Component
 * 
 * Renders a comprehensive invoice view with:
 * - Invoice header with number and issue date
 * - Client and seller information
 * - Itemized list of services/products with quantities and prices
 * - Total amount calculation
 * - Payment status and date information
 * 
 * @param {InvoiceDetailsProps} props - Component properties
 * @returns {JSX.Element} The rendered invoice details
 */
const InvoiceDetails = ({ invoice }: InvoiceDetailsProps) => {
  // Convert Decimal to number for calculations
  const total = Number(invoice.totalPrice);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="text-xl font-semibold">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Date Issued</p>
            <p>{formatDateTime(invoice.createdAt)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Client and Seller Information */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium">From</p>
            <p className="text-sm text-muted-foreground">{invoice.seller.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.seller.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">To</p>
            <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => {
                const itemPrice = Number(item.price);
                const itemTotal = itemPrice * (item.qty || 1);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(itemPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(itemTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between font-semibold">
            <p>Total</p>
            <p>{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Payment Status: {invoice.isPaid ? 'Paid' : 'Pending'}
          </p>
          {invoice.paidAt && (
            <p className="text-sm text-muted-foreground">
              Paid on: {formatDateTime(invoice.paidAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetails;
