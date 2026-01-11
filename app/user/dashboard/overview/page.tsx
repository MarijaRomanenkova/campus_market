/**
 * User Dashboard Overview Page Component
 * @module Pages
 * @group Dashboard
 * 
 * This page displays an overview of the user's activity on the platform,
 * showing statistics for both client and seller roles.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPaymentSummaryByClientId, getPaymentSummaryBySellerId } from '@/lib/actions/payment.actions';
import { getAllProductAssignmentsByClientId, getAllProductAssignmentsBySellerId } from '@/lib/actions/product-assignment.actions';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, Barcode, CreditCard, Users, ClipboardList, FileSpreadsheet } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from '@/app/user/dashboard/overview/charts';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Metadata for the Dashboard Overview page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'User Dashboard',
};

/**
 * User Dashboard Overview Page Component
 * 
 * Displays a comprehensive overview of the user's platform activity including:
 * - Client role metrics (outgoing payments, assignments created)
 * - Seller role metrics (incoming payments, assignments received)
 * - Payment history charts
 * 
 * Fetches data from multiple sources and displays it in cards and charts.
 * Requires authentication, redirects to login if user is not authenticated.
 * 
 * @returns {Promise<JSX.Element>} The rendered dashboard overview page
 */
export default async function UserOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [
    incomingPayments,
    outgoingPayments,
    clientProductAssignments,
    sellerProductAssignments
  ] = await Promise.all([
    getPaymentSummaryByClientId(session.user.id),
    getPaymentSummaryBySellerId(session.user.id),
    getAllProductAssignmentsByClientId(session.user.id),
    getAllProductAssignmentsBySellerId(session.user.id)
  ]);

  return (
    <div className='space-y-4'>
      <h1 className='h2-bold'>Dashboard Overview</h1>
      
      {/* Client Stats */}
      <div className='space-y-2'>
        <h2 className='h3-bold'>As a Client</h2>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Outgoing Payments</CardTitle>
              <BadgeDollarSign className="text-red-500" />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-500'>
                {formatCurrency(outgoingPayments.totalAmount || 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                {formatNumber(outgoingPayments.count || 0)} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Assignments Created</CardTitle>
              <ClipboardList />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatNumber(clientProductAssignments.data.length)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seller Stats */}
      <div className='space-y-2'>
        <h2 className='h3-bold'>As a Seller</h2>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Incoming Payments</CardTitle>
              <BadgeDollarSign className="text-green-500" />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-500'>
                {formatCurrency(incomingPayments.totalAmount || 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                {formatNumber(incomingPayments.count || 0)} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Assignments</CardTitle>
              <FileSpreadsheet />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatNumber(sellerProductAssignments.data.length)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts 
              incomingData={incomingPayments.monthlyData}
              outgoingData={outgoingPayments.monthlyData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
