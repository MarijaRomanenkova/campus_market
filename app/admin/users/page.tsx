/**
 * Admin Users Management Page
 * @module Admin
 * @group Admin Pages
 * 
 * This page provides administrators with a comprehensive interface to manage users,
 * including listing, filtering, editing, and deleting user accounts.
 * It requires admin privileges to access.
 */

import { Metadata } from 'next';
import { getAllUsers, deleteUser } from '@/lib/actions/user.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * Metadata for the Admin Users page
 */
export const metadata: Metadata = {
  title: 'Admin Users',
};

/**
 * Admin Users Page Component
 * 
 * This server component displays a management interface for users with:
 * - User ID, name, email, and role
 * - Visual distinction between regular users and admins
 * - Filtering capabilities by search text
 * - Pagination for large result sets
 * - Links to edit individual users
 * - User deletion functionality
 * 
 * The page enforces admin-only access through the requireAdmin middleware.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Promise<{page: string, query: string}>} props.searchParams - URL search parameters
 * @returns {JSX.Element} Admin users management interface
 */
const AdminUserPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
  }>;
}) => {
  // Verify admin access
  await requireAdmin();

  const { page = '1', query: searchText } = await props.searchParams;

  // Fetch users with filtering and pagination
  const users = await getAllUsers({ page: Number(page), query: searchText });

  return (
    <div className='space-y-2'>
      {/* Page header with search filter info */}
      <div className='flex items-center gap-3'>
        <h1 className='h2-bold'>Users</h1>
        {searchText && (
          <div>
            Filtered by <i>&quot;{searchText}&quot;</i>{' '}
            <Link href='/admin/users'>
              <Button variant='outline' size='sm'>
                Remove Filter
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Users table */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{formatId(user.id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === 'user' ? (
                    <Badge variant='secondary'>User</Badge>
                  ) : (
                    <Badge variant='default'>Admin</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/users/${user.id}`}>Edit</Link>
                  </Button>
                  <DeleteDialog id={user.id} action={deleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination controls */}
        {users.totalPages > 1 && (
          <Pagination page={Number(page) || 1} totalPages={users?.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminUserPage;
