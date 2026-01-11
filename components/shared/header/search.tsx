'use client';

/**
 * Search Component
 * @module Components
 * @group Shared/Header
 * 
 * This client-side component renders a search form with category filtering
 * allowing users to search for content throughout the application.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Search category type definition
 * @typedef {Object} SearchCategory
 * @property {string} id - Unique identifier for the category
 * @property {string} name - Display name of the category
 */
type SearchCategory = {
  id: string;
  name: string;
};

/**
 * Props for the Search component
 * @interface SearchProps
 * @property {SearchCategory[]} initialCategories - Initial categories data for filtering
 */
interface SearchProps {
  initialCategories: SearchCategory[];
}

/**
 * Search Component
 * 
 * Renders a search form with:
 * - Text input for search queries
 * - Category dropdown filter
 * - Submit button with search icon
 * - Form submission to the search page
 * 
 * The component handles category-specific or general searches.
 * 
 * @param {SearchProps} props - Component properties
 * @returns {JSX.Element} The rendered search form
 */
const Search = ({ initialCategories }: SearchProps) => {
  const [categories, setCategories] = useState<SearchCategory[]>(initialCategories);

  return (
    <form action='/search' method='GET'>
      <div className='flex w-full items-center space-x-2'>
        <Select name='category' defaultValue="all">
          <SelectTrigger className='w-[220px] h-10'>
            <SelectValue placeholder='All' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            {categories.map((category: SearchCategory) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          name='q'
          type='text'
          placeholder='Search...'
          className='md:min-w-[120px] lg:w-[400px] h-10'
        />
        <Button variant="success" className="h-10">
          <SearchIcon className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default Search;
