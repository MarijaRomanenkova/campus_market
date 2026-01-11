/**
 * Admin Dashboard Overview Page
 * @module Admin
 * @group Admin Pages
 * 
 * This page serves as the main dashboard for administrators,
 * displaying key metrics, summary statistics, and recent sales data.
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPaymentSummary } from '@/lib/actions/payment.actions';
import { getProductStatistics } from '@/lib/actions/product.actions';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, Barcode, CreditCard, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * Metadata for the Admin Dashboard page
 */
export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

/**
 * Admin Dashboard Overview Page Component
 * 
 * This server component displays a comprehensive dashboard with:
 * - Key performance metrics (revenue, sales, customers, products)
 * - Sales trend chart over time
 * - Recent sales transactions table
 * 
 * The page enforces admin-only access through the requireAdmin middleware.
 * 
 * @component
 * @returns {JSX.Element} Admin dashboard with metrics, charts, and recent sales
 */
const AdminOverviewPage = async () => {
  // Verify admin access
  await requireAdmin();

  // Fetch dashboard summary data
  const summary = await getPaymentSummary();
  const productStats = await getProductStatistics();

  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>Dashboard</h1>
      
      {/* KPI metrics cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <BadgeDollarSign />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(
                typeof summary.totalSales._sum.amount === 'string'
                  ? parseFloat(summary.totalSales._sum.amount || '0')
                  : Number(summary.totalSales._sum.amount || 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Sales</CardTitle>
            <CreditCard />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.paymentsCount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Customers</CardTitle>
            <Users />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.usersCount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Open Products</CardTitle>
            <Barcode />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(productStats.openProductsCount)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and recent sales */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        {/* Sales chart */}
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts
              data={{
                salesData: summary.salesData,
                productData: productStats.weeklyData
              }}
            />
          </CardContent>
        </Card>
        
        {/* Recent sales table */}
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BUYER</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestSales.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                    <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                    <TableCell>
                      <Link href={`/payment/${payment.id}`}>
                        <span className='px-2'>Details</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
