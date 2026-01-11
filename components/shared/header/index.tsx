/**
 * Header Component
 * @module Components
 * @group Shared/Layout
 * 
 * This server component renders the application's main header with navigation,
 * search functionality, and authentication-related UI elements.
 */

import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import Menu from './menu';
import CategoriesDrawer from './categories-drawer';
import Search from './search';
import { Category } from '@/types';
import { getCategories } from '@/lib/actions/category.actions';
import { auth } from '@/auth';
import { LayoutDashboard } from 'lucide-react';

/**
 * Header Component
 * 
 * Renders the application's main header with:
 * - Logo and app name
 * - Categories drawer for mobile view
 * - Search functionality
 * - User dashboard link (for authenticated users)
 * - Navigation menu
 * 
 * Adapts layout based on screen size for optimal user experience.
 * 
 * @param {Object} props - Component properties
 * @param {Category[]} props.categories - List of available categories
 * @returns {Promise<JSX.Element>} The rendered header component
 */
const Header = async ({ categories }: { categories: Category[] }) => {
  // Ensure we have categories to work with
  const safeCategories = categories || [];
  
  // Get categories for search (simpler format)
  const allCategories = await getCategories();
  
  // Get authentication session
  const session = await auth();
  const isAuthenticated = !!session?.user;
  
  return (
    <header className='w-full bg-white dark:bg-black'>
      <div className='wrapper flex justify-between items-center'>
        {/* Left section - Logo and mobile categories */}
        <div className='flex-start items-center'>
           <div className="sm:hidden">
             <CategoriesDrawer initialCategories={safeCategories} />
           </div>
          <Link href='/' className='flex-start items-center'>
            <div className="relative w-8 h-8">
              <Image
                priority={true}
                src='/images/logo.svg'
                width={32}
                height={32}
                alt={`${APP_NAME} logo`}
                className="dark:invert"
              />
            </div>
            <span className='hidden lg:block font-bold text-4xl ml-3 dark:text-white'>
              {APP_NAME}
            </span>
          </Link>
        </div>
        
        {/* Center section - Search */}
        <div className='hidden md:flex justify-center flex-1 mx-4'>
          <Search initialCategories={allCategories} />
        </div>

        {/* Right section - Dashboard link and menu */}
        <div className='flex items-center gap-6'>
          {/* User Dashboard link - only visible to authenticated users */}
          {isAuthenticated && (
            <Link 
              href='/user/dashboard' 
              className='text-base font-semibold hover:text-primary transition-colors flex items-center'
            >
              <LayoutDashboard className="h-6 w-6 mr-2" />
              Dashboard
            </Link>
          )}
          
          {/* Menu component */}
          <Menu />
        </div>
      </div>
    </header>
  );
};

export default Header;
