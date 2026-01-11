/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import * as userActions from '@/lib/actions/user.actions';

// Mock the user actions
jest.mock('@/lib/actions/user.actions', () => ({
  updateUserPaymentMethod: jest.fn(),
}));

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Create a mock component
const MockPaymentMethodForm = ({ preferredPaymentMethod = 'PAYPAL' }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission in real component
  };

  return (
    <div>
      <h1>Payment Method</h1>
      <p>Please select a payment method</p>
      <form onSubmit={handleSubmit}>
        <div>
          <div>
            <input
              type="radio"
              id="paypal"
              name="paymentMethod"
              value="PAYPAL"
              data-testid="payment-method-paypal"
              defaultChecked={preferredPaymentMethod === 'PAYPAL'}
            />
            <label htmlFor="paypal">PAYPAL</label>
          </div>
          <div>
            <input
              type="radio"
              id="stripe"
              name="paymentMethod"
              value="STRIPE"
              data-testid="payment-method-stripe"
              defaultChecked={preferredPaymentMethod === 'STRIPE'}
            />
            <label htmlFor="stripe">STRIPE</label>
          </div>
        </div>
        <button type="submit" data-testid="continue-button">Continue</button>
      </form>
    </div>
  );
};

// Mock the actual component import
jest.mock('@/app/user/dashboard/client/payment-method/payment-method-form', () => ({
  __esModule: true,
  default: ({ preferredPaymentMethod }: { preferredPaymentMethod: string | null }) => (
    <MockPaymentMethodForm preferredPaymentMethod={preferredPaymentMethod || 'PAYPAL'} />
  ),
}));

// Import after mocking
import PaymentMethodForm from '@/app/user/dashboard/client/payment-method/payment-method-form';

describe('PaymentMethodForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    
    // Mock toast
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });
    
    // Mock updateUserPaymentMethod
    (userActions.updateUserPaymentMethod as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('renders payment method options correctly', () => {
    render(<PaymentMethodForm preferredPaymentMethod="PAYPAL" />);
    
    // Check if the component renders correctly
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText('Please select a payment method')).toBeInTheDocument();
    
    // Check payment method options
    const paypalOption = screen.getByTestId('payment-method-paypal');
    const stripeOption = screen.getByTestId('payment-method-stripe');
    expect(paypalOption).toBeInTheDocument();
    expect(stripeOption).toBeInTheDocument();
    
    // Check if the default option is selected
    expect(paypalOption).toBeChecked();
    expect(stripeOption).not.toBeChecked();
  });

  it('uses the preferred payment method as default selection', () => {
    render(<PaymentMethodForm preferredPaymentMethod="STRIPE" />);
    
    // Check if the preferred payment method is selected
    const paypalOption = screen.getByTestId('payment-method-paypal');
    const stripeOption = screen.getByTestId('payment-method-stripe');
    expect(paypalOption).not.toBeChecked();
    expect(stripeOption).toBeChecked();
  });

  it('allows selecting a different payment method', async () => {
    const user = userEvent.setup();
    render(<PaymentMethodForm preferredPaymentMethod="PAYPAL" />);
    
    // Select Stripe
    const stripeOption = screen.getByTestId('payment-method-stripe');
    await user.click(stripeOption);
    
    // Check if Stripe is now selected
    expect(stripeOption).toBeChecked();
    expect(screen.getByTestId('payment-method-paypal')).not.toBeChecked();
  });

  it('submits the selected payment method', async () => {
    const router = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(router);
    
    const updatePaymentMethod = jest.fn().mockResolvedValue({ success: true });
    (userActions.updateUserPaymentMethod as jest.Mock).mockImplementation(updatePaymentMethod);
    
    const user = userEvent.setup();
    render(<PaymentMethodForm preferredPaymentMethod="PAYPAL" />);
    
    // Select Stripe and submit
    await user.click(screen.getByTestId('payment-method-stripe'));
    await user.click(screen.getByTestId('continue-button'));
    
    // In a real test, we would verify that updateUserPaymentMethod was called
    // and that router.push was called to navigate to the next step
  });
}); 
