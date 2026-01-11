/**
 * Payment Method Selection Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page allows users to select their preferred payment method for future payments.
 */

import { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';
import PaymentMethodForm from  './payment-method-form'

/**
 * Metadata for the Payment Method page
 * Sets the page title for SEO purposes
 */
export const metadata: Metadata = {
  title: 'Select Payment Method',
};

/**
 * Payment Method Selection Page Component
 * 
 * Displays a form for users to select their preferred payment method (Stripe/PayPal).
 * Retrieves the user's current payment method preference and passes it to the form.
 * 
 * @returns {Promise<JSX.Element>} The rendered payment method selection page
 */
const PaymentMethodPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Select Payment Method</h1>
      <PaymentMethodForm preferredPaymentMethod={user.paymentMethod} />
    </>
  );
};

export default PaymentMethodPage;
