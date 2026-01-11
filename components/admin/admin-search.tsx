'use client';

/**
 * Admin Search Component
 * @module Components/Admin
 * 
 * This client-side component provides a search input for admin panels.
 * It automatically detects the current admin section (orders or users)
 * and submits the search to the appropriate endpoint.
 */

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Input } from '../ui/input';

/**
 * AdminSearch Component
 * 
 * Renders a search input field that:
 * - Automatically detects the current admin section (orders, users)
 * - Maintains search state across navigation
 * - Submits search queries to the appropriate admin endpoint
 * 
 * @returns {JSX.Element} The rendered search input with hidden submit button
 */
const AdminSearch = () => {
  const pathname = usePathname();
  const formActionUrl = pathname.includes('/admin/orders')
    ? '/admin/orders'
    : '/admin/users';

  const searchParams = useSearchParams();
  const [queryValue, setQueryValue] = useState(searchParams.get('query') || '');

  useEffect(() => {
    setQueryValue(searchParams.get('query') || '');
  }, [searchParams]);

  return (
    <form action={formActionUrl} method='GET'>
      <Input
        type='search'
        placeholder='Search...'
        name='query'
        value={queryValue}
        onChange={(e) => setQueryValue(e.target.value)}
        className='md:w-[100px] lg:w-[300px]'
      />
      <button className='sr-only' type='submit'>
        Search
      </button>
    </form>
  );
};

export default AdminSearch;
