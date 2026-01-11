'use client';

/**
 * Chat Interface Component
 * @module Components
 * @group Shared/Chat
 * 
 * This client-side component provides a real-time chat interface with message history,
 * message input, and WebSocket-based delivery for instant messaging.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/components/providers/socket-provider';
import MessageImageUpload from './message-image-upload';
import Image from 'next/image';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, ExtendedMessage } from '@/types/chat/message.types';
import UserRatingDisplay from '../ratings/user-rating-display';
import { markMessageAsRead, getConversationMessages, createMessage } from '@/lib/actions/messages.actions';
import { UserWithRating } from '@/types/user.types';

/**
 * Props for the ChatInterface component
 * @interface ChatInterfaceProps
 * @property {string} conversationId - ID of the current conversation
 * @property {Message[]} initialMessages - Initial set of messages to display
 */
interface ChatInterfaceProps {
  conversationId: string;
  initialMessages: Message[];
}

/**
 * Chat Interface Component
 * 
 * Renders a full-featured chat interface with:
 * - Message history display with sender avatars
 * - Real-time message updates via WebSockets
 * - Message timestamp formatting
 * - Message input with keyboard shortcuts
 * - Automatic scrolling to new messages
 * - Read receipts functionality
 * 
 * @param {ChatInterfaceProps} props - Component properties
 * @returns {JSX.Element} The rendered chat interface
 */
export default function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected, decrementUnreadCount } = useSocket();
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  // Fetch messages when component mounts or conversationId changes
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const fetchedMessages = await getConversationMessages(conversationId);
        // Convert Decimal to number for ratings
        const convertedMessages = fetchedMessages.map(msg => ({
          ...msg,
          sender: {
            ...msg.sender,
            sellerRating: Number(msg.sender.sellerRating),
            clientRating: Number(msg.sender.clientRating)
          }
        })) as ExtendedMessage[];
        setMessages(convertedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    // If we have initial messages, use them first
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages as ExtendedMessage[]);
    }
    
    // Then fetch the latest messages
    fetchMessages();
  }, [conversationId, toast, initialMessages]);

  // Track unread messages
  useEffect(() => {
    const unread = new Set(
      messages
        .filter(m => !m.readAt && m.senderId !== session?.user?.id)
        .map(m => m.id)
    );
    setUnreadMessages(unread);
  }, [messages, session?.user?.id]);

  // Mark messages as read when they're scrolled into view
  useEffect(() => {
    if (!session?.user || unreadMessages.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && unreadMessages.has(messageId)) {
              // Add a small delay to ensure the user has actually seen the message
              setTimeout(() => {
                markMessageAsRead(messageId);
                setUnreadMessages(prev => {
                  const next = new Set(prev);
                  next.delete(messageId);
                  
                  // Emit messages-read event when all messages are read
                  if (next.size === 0 && socket && isConnected) {
                    socket.emit('messages-read', { conversationId });
                  }
                  
                  return next;
                });
                decrementUnreadCount(); // Decrement the global unread count
              }, 1000);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      }
    );

    // Observe all unread messages
    unreadMessages.forEach(messageId => {
      const element = document.querySelector(`[data-message-id="${messageId}"]`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [unreadMessages, session?.user, decrementUnreadCount, socket, isConnected, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Join the conversation room
    socket.emit('join-conversation', conversationId);
    
    // Handler for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists in the previous state
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message as ExtendedMessage];
      });
    };
    
    // Listen for new messages
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.emit('leave-conversation', conversationId);
    };
  }, [socket, isConnected, conversationId]);

  /**
   * Scrolls the message container to the bottom
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handles keyboard events in the message input
   * Sends the message when Enter is pressed without Shift
   * 
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(newMessage, imageUrl);
    }
  };

  /**
   * Toggles the image upload interface
   */
  const toggleImageUpload = () => {
    setShowImageUpload(!showImageUpload);
    if (showImageUpload && imageUrl) {
      setImageUrl(null);
    }
  };

  /**
   * Handles image upload completion
   * 
   * @param {string} url - URL of the uploaded image
   */
  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  /**
   * Cancels the current image upload
   */
  const cancelImageUpload = () => {
    setImageUrl(null);
  };

  /**
   * Handles sending a new message
   * 
   * @param {string} content - The text content of the message
   * @param {string} imageUrl - The URL of the uploaded image
   */
  const handleSendMessage = async (content: string, imageUrl?: string | null) => {
    if (!content.trim() && !imageUrl || loading || !session?.user) return;

    setLoading(true);
    try {
      const message = await createMessage(content, conversationId, imageUrl || undefined);
      // Convert Decimal to number for ratings
      const convertedMessage = {
        ...message,
        sender: {
          ...message.sender,
          sellerRating: Number(message.sender.sellerRating),
          clientRating: Number(message.sender.clientRating)
        }
      } as ExtendedMessage;
      
      setMessages(prev => [...prev, convertedMessage]);
      setNewMessage('');
      setImageUrl(null);
      setShowImageUpload(false);

      // If socket is connected, emit the message
      if (socket && isConnected) {
        socket.emit('send-message', { conversationId, message: convertedMessage });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === session?.user?.id;
            const messageDate = new Date(message.createdAt);
            
            // Special display for system messages
            if (message.isSystemMessage) {
              return (
                <div key={message.id} className="flex justify-center my-4">
                  <div className={cn(
                    "border rounded-md px-4 py-2 text-sm max-w-[90%] text-center",
                    message.metadata?.eventType === 'status-update' && 
                      "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300",
                    message.metadata?.eventType === 'invoice-created' && 
                      "bg-green-100 border-green-200 text-green-800 dark:bg-success/20 dark:border-success/30 dark:text-success-foreground/80",
                    message.metadata?.eventType === 'review-submitted' &&
                      "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300"
                  )}>
                    <div className="font-medium">
                      {message.content}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(messageDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            }
            
            // Regular message display
            return (
              <div
                key={message.id}
                data-message-id={message.id}
                className={cn(
                  "flex gap-3",
                  message.senderId === session?.user?.id ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.image || ''} alt={message.sender.name || 'User'} />
                    <AvatarFallback>
                      {message.sender.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div>
                  {!isCurrentUser && (
                    <div className="flex gap-2 items-center mb-1">
                      <p className="text-sm font-medium">{message.sender.name}</p>
                      {message.sender.sellerRating && (
                        <UserRatingDisplay 
                          rating={message.sender.sellerRating} 
                          size="sm"
                          tooltipText="Seller Rating" 
                        />
                      )}
                    </div>
                  )}
                  
                  <div className={`${
                    isCurrentUser 
                    ? 'bg-primary text-primary-foreground rounded-tl-lg rounded-tr-none' 
                    : 'bg-muted rounded-tr-lg rounded-tl-none'
                  } p-3 rounded-bl-lg rounded-br-lg text-sm`}>
                    {message.content}
                    
                    {/* Render image if present */}
                    {message.imageUrl && (
                      <div className="mt-2">
                        <div className="relative rounded-md overflow-hidden h-48 w-full max-w-sm">
                          <Image 
                            src={message.imageUrl} 
                            alt="Message image" 
                            className="object-contain cursor-pointer"
                            fill
                            sizes="(max-width: 768px) 100vw, 384px"
                            onClick={() => window.open(message.imageUrl || '', '_blank')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 flex gap-1">
                    {formatDistanceToNow(messageDate, { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        {showImageUpload && (
          <div className="mb-4">
            <MessageImageUpload
              onImageUpload={handleImageUpload}
              onCancel={cancelImageUpload}
              currentImage={imageUrl}
            />
          </div>
        )}
      
        <div className="flex items-start space-x-2">
          <Button
            type="button"
            size="icon"
            variant={showImageUpload ? "secondary" : "ghost"}
            onClick={toggleImageUpload}
            className="rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center"
            title="Add Image"
          >
            {imageUrl ? (
              <div className="relative h-9 w-9 flex items-center justify-center">
                <div className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-background" />
                <ImageIcon className="h-9 w-9" style={{ width: '2.25rem', height: '2.25rem' }} />
              </div>
            ) : (
              <ImageIcon className="h-9 w-9" style={{ width: '2.25rem', height: '2.25rem' }} />
            )}
          </Button>
          
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-10 resize-none"
            disabled={loading}
          />
          
          <Button
            onClick={() => handleSendMessage(newMessage, imageUrl)}
            disabled={(!newMessage.trim() && !imageUrl) || loading}
            className="bg-primary text-primary-foreground"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
} 
