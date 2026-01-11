/**
 * Messages Dashboard Page Component
 * @module Pages
 * @group Dashboard/Messages
 * 
 * This page displays all conversations for the logged-in user.
 * It shows a list of all message threads with other users.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat/message.types';
import UserRatingDisplay from '@/components/shared/ratings/user-rating-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    name: string | null;
    image: string | null;
    sellerRating?: number | null;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

/**
 * Messages Dashboard Page Component
 * 
 * Renders a list of all conversations the user is participating in.
 * Uses the ConversationList component to display message threads.
 * 
 * Security:
 * - Validates that the user is authenticated
 * - Redirects to login page if not authenticated
 * 
 * @returns {Promise<JSX.Element>} The rendered messages page with conversation list
 */
export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) throw new Error('Failed to fetch conversations');
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    if (session?.user) {
      fetchConversations();
    }
  }, [session]);

  const filteredConversations = conversations.filter(conv => {
    const otherParticipantName = conv.otherParticipant?.name || 'Unknown User';
    return otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view your messages.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No conversations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/user/dashboard/messages/${conversation.id}`}
              className="block"
            >
              <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={conversation.otherParticipant?.image || undefined}
                        alt={conversation.otherParticipant?.name || 'User'}
                      />
                      <AvatarFallback>
                        {conversation.otherParticipant?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {conversation.otherParticipant?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {conversation.lastMessage?.createdAt
                        ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                            addSuffix: true,
                          })
                        : ''}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 
