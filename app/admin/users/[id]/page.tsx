/**
 * Admin User Update Page
 * @module Admin
 * @group Admin Pages
 * 
 * This page provides an interface for administrators to edit user details,
 * including name, email, role, and other profile information.
 * It requires admin privileges to access.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import UpdateUserForm from './update-user-form';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * Metadata for the User Update page
 */
export const metadata: Metadata = {
  title: 'Update User',
};

/**
 * Admin User Update Page Component
 * 
 * This server component handles user editing functionality:
 * - Fetches user data by ID from the database
 * - Formats the user data for the form
 * - Renders the update form component
 * - Handles security through the requireAdmin middleware
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{id: string}>} props.params - URL path parameters
 * @returns {JSX.Element} User update form interface
 * @throws {notFound} If user is not found
 */
const AdminUserUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  // Verify admin access
  await requireAdmin();

  // Extract user ID from path parameter
  const { id } = await props.params;

  // Fetch user data from database
  const user = await getUserById(id);

  // Show 404 if user not found
  if (!user) notFound();

  // Transform the user object to match the expected format
  const formattedUser = {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    fullName: user.fullName || undefined,
    address: typeof user.address === 'string' ? user.address : undefined,
    phoneNumber: user.phoneNumber || undefined,
    companyId: user.companyId || undefined,
  };

  return (
    <div className='space-y-8 max-w-lg mx-auto'>
      <h1 className='h2-bold'>Update User</h1>
      <UpdateUserForm user={formattedUser} />
    </div>
  );
};

export default AdminUserUpdatePage;
