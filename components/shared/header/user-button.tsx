'use client';

/**
 * User Button Component
 * @module Components
 * @group Shared/Header
 * 
 * This client-side component provides user authentication controls
 * with dropdown menu for account actions and profile information.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

/**
 * User Button Component
 * 
 * Renders authentication controls with:
 * - User avatar with initials as trigger
 * - Profile information display 
 * - Sign out functionality
 * - Admin-specific navigation options
 * - Different states for authenticated/unauthenticated users
 * - Loading state with fallback handling
 * 
 * Manages session state and hydration with next-auth.
 * 
 * @returns {JSX.Element|null} The rendered user button or null during hydration
 */
const UserButton = () => {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Set client-side rendering flag and handle loading timeout
  useEffect(() => {
    setIsClient(true);
    
    // If loading takes more than 3 seconds, show the sign-in button anyway
    const timer = setTimeout(() => {
      if (status === 'loading') {
        setLoadingTimeout(true);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [status]);
   
  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }
  
  // Show fallback UI if loading takes too long
  if (status === 'loading' && !loadingTimeout) {
    return (
      <Button variant="ghost" size="sm" className="focus-visible:ring-0 focus-visible:ring-offset-0">
        <UserIcon className="h-5 w-5" />
      </Button>
    );
  }

  // If we have a session or loading timed out but we're authenticated
  if (session) {
    const firstInitial = session.user?.name?.charAt(0)?.toUpperCase() ?? 'U';
    const isAdmin = session?.user?.role === 'admin';
    
    /**
     * Handles user sign out
     * Redirects to home page after successful sign out
     */
    const handleSignOut = async () => {
      try {
        // Use the server URL environment variable
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '/';
        await signOut({ callbackUrl: baseUrl });
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

    return (
      <div className='flex gap-2 items-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size="sm"
              className='focus-visible:ring-0 focus-visible:ring-offset-0'
            >
              <UserIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='end'>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <div className='text-sm font-medium leading-none'>
                  {session.user?.name}
                </div>
                <div className='text-sm text-muted-foreground leading-none'>
                  {session.user?.email}
                </div>
                {isAdmin && (
                  <div className='text-xs text-primary mt-1'>
                    Administrator
                  </div>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem asChild>
              <Link href='/user/profile' className='w-full cursor-pointer'>
                <UserIcon className="h-5 w-5 mr-2" />
                User Profile
              </Link>
            </DropdownMenuItem>
            
            {/* Admin users see the admin dashboard */}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href='/admin/overview' className='w-full cursor-pointer'>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  // Otherwise show sign in button
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href='/sign-in'>
        <UserIcon className="h-5 w-5" />
      </Link>
    </Button>
  );
};

export default UserButton;
