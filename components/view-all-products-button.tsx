/**
 * View All Products Button Component
 * @module Components
 * @group Navigation
 * 
 * This component renders a prominent call-to-action button for viewing all products.
 * It's typically used on the homepage or landing pages to direct users to the search page.
 */

import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * View All Products Button Component
 * 
 * Renders a centered, prominent button that links to the products search page.
 * Uses the Next.js Link component for client-side navigation.
 * Styled with larger text and padding for emphasis.
 * 
 * @returns {JSX.Element} The rendered button component
 */
const ViewAllProductsButton = () => {
  return (
    <div className='flex justify-center items-center my-8'>
      <Button asChild className='px-8 py-4 text-lg font-semibold' variant="success-outline">
        <Link href='/search' className="flex items-center">
          More Products <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
};

export default ViewAllProductsButton;
