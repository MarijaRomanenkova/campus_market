'use client';

/**
 * @module Components/Header
 */

import { Button } from '@/components/ui/button';
import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical, MessageSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserButton from './user-button';
import Search from './search';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/components/providers/socket-provider';
import { getUnreadMessageCount } from '@/lib/actions/messages.actions';

/**
 * Responsive navigation menu component with user controls and notifications
 * @returns {JSX.Element} The rendered menu component
 */
const Menu = () => {
  const { data: session, status } = useSession();
  const { unreadCount, resetUnreadCount, socket, isConnected } = useSocket();
  const [initialCount, setInitialCount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected || status !== 'authenticated') return;

    const handleNewMessage = () => {
      // Increment the unread count when a new message is received
      setInitialCount(prev => prev + 1);
    };

    const handleMessagesRead = () => {
      // Reset the unread count when messages are marked as read
      setInitialCount(0);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('messages-read', handleMessagesRead);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, isConnected, status]);

  // Only start counting after authentication is confirmed
  useEffect(() => {
    // Don't do anything if not authenticated
    if (status !== 'authenticated') {
      return;
    }

    // Don't do anything if we don't have a user ID
    if (!session?.user?.id) {
      return;
    }

    let isMounted = true;
    const fetchCount = async () => {
      try {
        setError(null);
        const count = await getUnreadMessageCount();
        if (isMounted) {
          setInitialCount(count);
        }
      } catch (err) {
        console.error('Error in fetchCount:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch unread messages'));
        }
      }
    };

    // Initial fetch with a small delay to ensure server is ready
    setTimeout(fetchCount, 1000);

    // Set up an interval to refresh the count every minute
    const interval = setInterval(fetchCount, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status, session?.user?.id]);

  // Only calculate total unread count if user is authenticated
  const totalUnreadCount = status === 'authenticated' ? initialCount + unreadCount : 0;
  const hasUnreadMessages = totalUnreadCount > 0;

  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        <ModeToggle />
        <div className="relative">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/user/dashboard/messages">
              <MessageSquare className="h-5 w-5" />
            </Link>
          </Button>
          {hasUnreadMessages && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 h-4 min-w-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px]"
            >
              {totalUnreadCount}
            </Badge>
          )}
        </div>
        <UserButton />
      </nav>
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle'>
            <EllipsisVertical className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start'>
            <div className='mt-10'>
              <Search initialCategories={[]} />
            </div>
            <SheetTitle>Menu</SheetTitle>
            <ModeToggle />
            <Button asChild variant='ghost' className="relative w-full justify-start">
              <Link href='/user/dashboard/messages'>
                <MessageSquare className="h-5 w-5 mr-2" /> 
                Messages
                {hasUnreadMessages && (
                  <Badge 
                    className="ml-2 px-1.5 h-4 min-w-4 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px]"
                  >
                    {totalUnreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
           
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
