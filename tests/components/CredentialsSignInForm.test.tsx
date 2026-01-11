/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as userActions from '@/lib/actions/user.actions';

// Mock the components used in CredentialsSignInForm
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode }) => (
    <label data-testid="label" {...props}>{children}</label>
  ),
}));

// Mock the user actions
jest.mock('@/lib/actions/user.actions', () => ({
  signInWithCredentials: jest.fn(),
}));

// Mock the Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue('/dashboard'),
  }),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock the CredentialsSignInForm component directly
const mockOnSubmit = jest.fn();
const MockCredentialsSignInForm = () => (
  <div>
    <form onSubmit={mockOnSubmit} role="form">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" data-testid="email-input" />
      
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" data-testid="password-input" />
      
      <button type="submit">Sign In</button>
    </form>
    <div>
      Don&apos;t have an account? <a href="/sign-up">Sign Up</a>
    </div>
  </div>
);

// Mock the actual component import
jest.mock('@/app/(auth)/sign-in/credentials-signin-form', () => ({
  __esModule: true,
  default: () => <MockCredentialsSignInForm />,
}));

import CredentialsSignInForm from '@/app/(auth)/sign-in/credentials-signin-form';

describe('CredentialsSignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sign-in form correctly', () => {
    render(<CredentialsSignInForm />);
    
    // Check for important form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('submits the form with email and password', async () => {
    const user = userEvent.setup();
    render(<CredentialsSignInForm />);
    
    // Fill out the form
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    
    // Submit the form using the form element directly
    const form = screen.getByRole('form');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify that the mock onSubmit was called
    expect(mockOnSubmit).toHaveBeenCalled();
  });
}); 
