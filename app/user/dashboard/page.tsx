/**
 * User Dashboard Page Component
 * @module Pages
 * @group Dashboard
 * 
 * This page serves as the main entry point to the user dashboard.
 * It handles authentication checks and redirects to the overview page.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OverviewPage from './overview/page';

/**
 * User Dashboard Page Component
 * 
 * Acts as a wrapper for the dashboard overview page with authentication protection.
 * Redirects unauthenticated users to the sign-in page.
 * 
 * @returns {Promise<JSX.Element>} The rendered dashboard page (overview)
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  return <OverviewPage />;
}
