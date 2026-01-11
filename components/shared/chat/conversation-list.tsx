'use client';

/**
 * Conversation List Component
 * @module Components
 * @group Shared/Chat
 * 
 * This client-side component renders a list of user conversations with
 * real-time updates, unread message indicators, and conversation previews.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/chat/message.types';
import UserRatingDisplay from '../ratings/user-rating-display';

// Add interface for user with rating
interface UserWithRating {
  id: string;
  name?: string | null;
  image?: string | null;
  sellerRating?: number | null;
}

/**
 * Conversation List Component
 * 
 * Renders a list of user conversations with:
 * - Real-time conversation updates with periodic polling
 * - Visual indicators for unread messages
 * - Conversation previews with last message and timestamp
 * - Product context display when conversations are product-related
 * - Loading and empty states
 * 
 * @returns {JSX.Element} The rendered conversation list
 */
export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    fetchConversations();
    
    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Fetches conversations from the API
   * Updates the conversations state and handles loading states
   */
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return <div className="p-4 text-muted-foreground">No conversations yet</div>;
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParticipants = conversation.participants
          .filter((p) => p.user.id !== session?.user?.id)
          .map((p) => p.user);
        
        const lastMessage = conversation.messages?.[0];
        
        // Check if there's an unread message not sent by the current user
        const hasUnreadMessage = lastMessage && 
          lastMessage.senderId !== session?.user?.id && 
          lastMessage.readAt === null;
        
        return (
          <Link
            key={conversation.id}
            href={`/user/dashboard/messages/${conversation.id}`}
            className="block"
          >
            <div className={cn(
              "p-3 rounded-lg hover:bg-muted flex items-center gap-3",
              hasUnreadMessage && "bg-muted/70 border-l-4 border-primary"
            )}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParticipants[0]?.image || ''} />
                <AvatarFallback>
                  {otherParticipants[0]?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    <h3 className={cn(
                      "font-medium truncate",
                      hasUnreadMessage && "font-semibold"
                    )}>
                      {otherParticipants.length > 1
                        ? `${otherParticipants[0]?.name} and ${otherParticipants.length - 1} others`
                        : otherParticipants[0]?.name || 'Unknown'}
                    </h3>
                    {otherParticipants[0]?.id && (otherParticipants[0] as UserWithRating).sellerRating && (
                      <UserRatingDisplay 
                        rating={(otherParticipants[0] as UserWithRating).sellerRating} 
                        size="sm"                       
                        tooltipText="Seller Rating"
                      />
                    )}
                  </div>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                <div className={cn(
                  "text-sm text-muted-foreground truncate",
                  hasUnreadMessage && "text-foreground font-medium"
                )}>
                  {conversation.product?.name && (
                    <span className="font-medium text-primary">
                      {conversation.product.name}:
                    </span>
                  )}{' '}
                  {lastMessage 
                    ? (lastMessage.senderId === session?.user?.id 
                      ? `You: ${lastMessage.content}` 
                      : `${lastMessage.sender.name || 'User'}: ${lastMessage.content}`)
                    : 'No messages yet'}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 
