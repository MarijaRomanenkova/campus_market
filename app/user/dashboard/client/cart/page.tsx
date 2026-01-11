/**
 * Client Cart Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays the user's shopping cart with invoices waiting to be paid.
 * It serves as a staging area before proceeding to payment.
 */

import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

/**
 * Metadata for the Cart page
 * Sets the page title for SEO purposes
 */
export const metadata = {
  title: 'Shopping Cart',
};

/**
 * Client Cart Page Component
 * 
 * Fetches the user's current cart contents and renders them in a table.
 * Handles error states if the cart data cannot be loaded.
 * The cart contains invoices that have been added for payment but not yet processed.
 * 
 * @returns {Promise<JSX.Element>} The rendered cart page
 */
const CartPage = async () => {
  try {
    const cart = await getMyCart();
    
    return (
      <>
        {/* @ts-ignore - Cart is properly converted in the server action */}
        <CartTable cart={cart} />
      </>
    );
  } catch (error) {
    console.error('Error loading cart:', error);
    return (
      <div className="py-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Error loading cart data</h2>
        <p>We encountered a problem loading your shopping cart. Please try again later.</p>
      </div>
    );
  }
};

export default CartPage;
