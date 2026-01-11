/**
 * User Profile Page Component
 * @module Pages
 * @group Profile
 * 
 * This page provides the interface for users to view and update their profile information.
 * It includes personal details, contact information, and account settings.
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileForm from './profile-form';

/**
 * Metadata for the Profile page
 * Sets the page title and description for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Profile Settings | Campus Market',
  description: 'Update your personal and business information and view your ratings'
};

/**
 * User Profile Page Component
 * 
 * Renders the user profile settings page with form for updating personal information.
 * Redirects unauthenticated users to the sign-in page.
 * 
 * @returns {Promise<JSX.Element>} The rendered profile page with settings form
 */
export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className="space-y-2">
        <h1 className='h2-bold'>Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information, account settings, and view your ratings as a seller and buyer
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
