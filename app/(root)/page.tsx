/**
 * Homepage Component
 * @module Pages
 * @group Root Pages
 * 
 * This page serves as the main landing page for the application,
 * displaying the newest products and a button to view all available products.
 */

import {
  getLatestProducts,
} from '@/lib/actions/product.actions';
import ViewAllProductsButton from '@/components/view-all-products-button';
import CreateProductButton from '@/components/shared/create-product-button';
import ProductList from '@/components/shared/product/product-list';

/**
 * Homepage Component
 * 
 * This server component renders the application's landing page,
 * fetching and displaying the most recent products.
 * 
 * Features:
 * - Displays a limited number of newest products
 * - Provides a button to navigate to the full products page
 * 
 * @component
 * @returns {JSX.Element} Homepage with product list and navigation button
 */
const Homepage = async () => {
  // Fetch the latest products for the homepage
  const latestproducts = await getLatestProducts();

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <CreateProductButton size="lg" />
      </div>
      <ProductList data={latestproducts} title='Newest Products' limit={12} />
      <ViewAllProductsButton />
    </>
  );
};

export default Homepage;
