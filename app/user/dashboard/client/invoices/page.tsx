/**
 * Client Invoices Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all invoices received by the current user in their client role.
 * It shows a list of invoices with their details and payment status.
 */

import { auth } from '@/auth';
import InvoiceListTable from '@/components/shared/invoice/invoice-list-table';
import { redirect } from 'next/navigation';
import { getAllIncomingInvoices } from '@/lib/actions/invoice.actions';

/**
 * Client Invoices Page Component
 * 
 * Fetches and displays all invoices sent to the authenticated user.
 * Uses the shared InvoiceListTable component to display the invoices with
 * appropriate actions for the client role.
 * Includes authentication protection and redirects unauthenticated users.
 * 
 * @returns {Promise<JSX.Element>} The rendered client invoices page
 */
export default async function ClientInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const invoices = await getAllIncomingInvoices(session.user.id);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Invoices</h1>
      <InvoiceListTable invoices={invoices} userType="client" />
    </div>
  );
}

