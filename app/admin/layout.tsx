/**
 * Admin Layout Component
 * @module Admin
 * @group Admin Layout
 * 
 * This layout component provides the admin panel structure with navigation,
 * search, and user menu. It serves as the base layout for all admin pages.
 */

import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import MainNav from './main-nav';
import AdminSearch from '@/components/admin/admin-search';
import LogoWithTheme from '@/components/shared/logo-with-theme';

/**
 * Admin Layout Component
 * 
 * This component creates the admin dashboard layout with:
 * - Top navigation bar with app logo
 * - Main navigation menu with admin section links
 * - Admin search functionality
 * - User menu for account management
 * - Container for child page content
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the content area
 * @returns {JSX.Element} Admin dashboard layout with header and content area
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className='flex flex-col'>
        {/* Admin header with navigation */}
        <div className='border-b container mx-auto'>
          <div className='flex items-center h-16 px-4'>
            <LogoWithTheme
              width={36}
              height={36}
              alt={APP_NAME}
            />
            <MainNav className='mx-6' />
            <div className='ml-auto items-center flex space-x-4'>
              <AdminSearch />
              <Menu />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className='flex-1 space-y-4 p-8 pt-6 container mx-auto'>
          {children}
        </div>
      </div>
    </>
  );
}
