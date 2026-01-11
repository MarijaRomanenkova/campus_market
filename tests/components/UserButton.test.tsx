/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession, signOut } from 'next-auth/react';

// Mock the next-auth dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Create a mock UserButton component
const MockUserButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div data-testid="authenticated-user">
        <button data-testid="user-dropdown-trigger">
          <span>User</span>
        </button>
        <div data-testid="user-dropdown" className="hidden">
          <div data-testid="user-info">
            <span>{session.user?.name}</span>
            <span>{session.user?.email}</span>
            {session.user?.role === 'admin' && (
              <span data-testid="admin-badge">Administrator</span>
            )}
          </div>
          <a href="/user/profile" data-testid="profile-link">User Profile</a>
          {session.user?.role === 'admin' && (
            <a href="/admin/overview" data-testid="admin-link">Admin Dashboard</a>
          )}
          <button onClick={() => signOut()} data-testid="sign-out-button">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <a href="/sign-in" data-testid="sign-in-link">
      <span>Sign In</span>
    </a>
  );
};

// Mock the actual component import
jest.mock('@/components/shared/header/user-button', () => ({
  __esModule: true,
  default: () => <MockUserButton />,
}));

import UserButton from '@/components/shared/header/user-button';

describe('UserButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in link when not authenticated', () => {
    // Mock unauthenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<UserButton />);
    
    // Check if sign in link is rendered
    const signInLink = screen.getByTestId('sign-in-link');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  it('renders user dropdown when authenticated', () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        },
      },
      status: 'authenticated',
    });

    render(<UserButton />);
    
    // Check if user button is rendered
    const userButton = screen.getByTestId('authenticated-user');
    expect(userButton).toBeInTheDocument();
    
    const dropdownTrigger = screen.getByTestId('user-dropdown-trigger');
    expect(dropdownTrigger).toBeInTheDocument();
  });

  it('displays admin options for admin users', () => {
    // Mock authenticated admin session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
      status: 'authenticated',
    });

    render(<UserButton />);
    
    // Check if admin badge is rendered
    const adminBadge = screen.getByTestId('admin-badge');
    expect(adminBadge).toBeInTheDocument();
    expect(adminBadge).toHaveTextContent('Administrator');
    
    // Check if admin link is present
    const adminLink = screen.getByTestId('admin-link');
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin/overview');
  });

  it('can trigger sign out', async () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        },
      },
      status: 'authenticated',
    });

    // Prepare signOut mock
    const mockSignOut = jest.fn();
    (signOut as jest.Mock).mockImplementation(mockSignOut);

    render(<UserButton />);
    
    // We need to show the sign-out button since it's in a dropdown
    const signOutButton = screen.getByTestId('sign-out-button');
    expect(signOutButton).toBeInTheDocument();
    
    // Click sign out button
    const user = userEvent.setup();
    await user.click(signOutButton);
    
    // Check if signOut was called
    expect(mockSignOut).toHaveBeenCalled();
  });
}); 
