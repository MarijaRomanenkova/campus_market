'use client';

/**
 * Pagination Component
 * @module Components
 * @group Shared/UI
 * 
 * This client-side component renders pagination controls for navigating between pages.
 * It provides next and previous buttons with appropriate disabled states.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { formUrlQuery } from '@/lib/utils';

/**
 * Props for the Pagination component
 * @interface PaginationProps
 * @property {number|string} page - Current page number
 * @property {number} totalPages - Total number of pages
 * @property {string} [urlParamName] - URL parameter name for the page (defaults to 'page')
 */
type PaginationProps = {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
};

/**
 * Pagination Component
 * 
 * Renders pagination controls with:
 * - Previous button (disabled on first page)
 * - Next button (disabled on last page)
 * 
 * Maintains URL structure when navigating between pages by updating
 * the query parameters without affecting other parameters.
 * Uses client-side navigation for seamless page transitions.
 * 
 * @param {PaginationProps} props - Component properties
 * @returns {JSX.Element} The rendered pagination controls
 */
const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Handles pagination button clicks
   * Updates the URL with the new page number and navigates to it
   * 
   * @param {string} btnType - Button type ('next' or 'prev')
   */
  const handleClick = (btnType: string) => {
    const pageValue = btnType === 'next' ? Number(page) + 1 : Number(page) - 1;
    const newUrl = formUrlQuery({
      params: searchParams,
      key: urlParamName || 'page',
      value: pageValue.toString(),
    });

    router.push(newUrl);
  };

  return (
    <div className='flex gap-2'>
      <Button
        size='lg'
        variant='outline'
        className='w-28'
        disabled={Number(page) <= 1}
        onClick={() => handleClick('prev')}
      >
        Previous
      </Button>
      <Button
        size='lg'
        variant='outline'
        className='w-28'
        disabled={Number(page) >= totalPages}
        onClick={() => handleClick('next')}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
