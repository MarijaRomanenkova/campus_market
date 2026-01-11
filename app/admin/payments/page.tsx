/**
 * Admin Payments Management Page
 * @module Admin
 * @group Admin Pages
 * 
 * This page provides administrators with a view of all payment transactions,
 * allowing them to monitor, filter, and manage payment records.
 * It requires admin privileges to access.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAllPayments } from '@/lib/actions/payment.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * Metadata for the Admin Payments page
 */
export const metadata: Metadata = {
  title: 'Admin   ',
};

/**
 * Admin Payments Page Component
 * 
 * This server component displays a list of all payment transactions with:
 * - Payment ID and date
 * - Buyer information
 * - Payment amount
 * - Payment status
 * - Pagination for large result sets
 * - Search filtering capabilities
 * 
 * The page enforces admin-only access through the requireAdmin middleware.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{page: string, query: string}>} props.searchParams - URL search parameters
 * @returns {JSX.Element} Admin payments management interface
 */
const AdminPaymentsPage = async (props: {
  searchParams: Promise<{ page: string; query: string }>;
}) => {
  const { page = '1', query: searchText } = await props.searchParams;

  // Verify admin access
  await requireAdmin();

  // Fetch payments with pagination and search
  const payments = await getAllPayments({
    page: Number(page),
    query: searchText,
  });

  return (
    <div className='space-y-2'>
      {/* Page header with search filter info */}
      <div className='flex items-center gap-3'>
        <h1 className='h2-bold'>Payments</h1>
        {searchText && (
          <div>
            Filtered by <i>&quot;{searchText}&quot;</i>{' '}
            <Link href='/admin/payments'>
              <Button variant='outline' size='sm'>
                Remove Filter
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Payments table */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.data.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatId(payment.id)}</TableCell>
                <TableCell>
                  {formatDateTime(payment.createdAt)}
                </TableCell>
               
                <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                <TableCell>
                  {payment.isPaid && payment.paidAt
                    ? formatDateTime(payment.paidAt)
                    : 'Not Paid'}
                </TableCell>
           
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination controls */}
        {payments.totalPages > 1 && (
          <Pagination
            page={Number(page) || 1}
            totalPages={payments?.totalPages}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
