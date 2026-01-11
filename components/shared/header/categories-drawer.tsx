'use client';

/**
 * Categories Drawer Component
 * @module Components
 * @group Shared/Header
 * 
 * This client-side component renders a mobile-friendly drawer menu
 * displaying all available categories with navigation links.
 */

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { Category } from '@/types';
import { useState, useEffect } from 'react';
import { getCategories } from '@/lib/actions/category.actions';

/**
 * Props for the CategoriesDrawer component
 * @interface CategoriesDrawerProps
 * @property {Category[]} [initialCategories] - Initial categories data to display
 */
interface CategoriesDrawerProps {
  initialCategories?: Category[];
}

/**
 * Categories Drawer Component
 * 
 * Renders a side drawer for category navigation with:
 * - Hamburger menu trigger button
 * - List of categories with counts
 * - Client-side data fetching with fallback to server data
 * - Loading and empty states
 * 
 * Optimized for mobile navigation to browse categories.
 * 
 * @param {CategoriesDrawerProps} props - Component properties
 * @returns {JSX.Element|null} The rendered drawer or null during hydration
 */
const CategoriesDrawer = ({ initialCategories = [] }: CategoriesDrawerProps) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(initialCategories.length === 0);
  const [isClient, setIsClient] = useState(false);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    
    // Force hydration with the initialCategories
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setIsLoading(false);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (isClient && initialCategories.length === 0) {
      /**
       * Fetches categories from the API when no initial data is provided
       */
      const fetchCategories = async () => {
        try {
          const data = await getCategories();
          setCategories(data);
        } catch (error) {
          // Handle error
        }
      };

      fetchCategories();
    }
  }, [isClient, initialCategories]);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button variant='ghost' size="sm" className="px-2">
          <MenuIcon className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-xs'>
        <DrawerHeader>
          <DrawerTitle className="text-center">Categories</DrawerTitle>
          <div className='pt-4 space-y-1'>
            {isLoading ? (
              <div className="text-center py-4">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-4">No categories found</div>
            ) : (
              categories.map((category: Category) => (
                <Button
                  className='w-full justify-start text-base py-3'
                  variant='ghost'
                  key={category.id}
                  asChild
                >
                  <DrawerClose asChild>
                    <Link href={`/search?category=${category.name}`}>
                      {category.name} {category._count?.products !== undefined && `(${category._count.products})`}
                    </Link>
                  </DrawerClose>
                </Button>
              ))
            )}
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoriesDrawer;
