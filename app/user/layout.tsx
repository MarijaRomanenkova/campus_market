/**
 * User Layout Component
 * @module Layouts
 * @group User
 * 
 * This layout component provides the common structure for all user-related pages,
 * including the navigation bar, logo, and user menu.
 */

import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import MainNav from './main-nav';
import LogoWithTheme from '@/components/shared/logo-with-theme';

/**
 * User Layout Component
 * 
 * Renders the common layout for all pages in the user section including:
 * - Top navigation bar with app logo
 * - Main navigation for user dashboard sections
 * - User menu for account management
 * - Container for the page content
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render within the layout
 * @returns {JSX.Element} The rendered layout
 */
export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className='flex flex-col'>
        <div className='border-b container mx-auto'>
          <div className='flex items-center h-16 px-4'>
            <LogoWithTheme
              width={36}
              height={36}
              alt={APP_NAME}
            />
            <MainNav className='mx-6' />
            <div className='ml-auto items-center flex space-x-4'>
              <Menu />
            </div>
          </div>
        </div>

        <div className='flex-1 space-y-4 p-8 pt-6 container mx-auto'>
          {children}
        </div>
      </div>
    </>
  );
}
