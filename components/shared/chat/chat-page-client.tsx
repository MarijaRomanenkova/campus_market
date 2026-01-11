'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/components/providers/socket-provider';
import ChatInterface from '@/components/shared/chat/chat-interface';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Clipboard } from 'lucide-react';
import ProductAssignButton from '@/components/shared/chat/product-assign-button';
import { Button } from '@/components/ui/button';
import UserRatingDisplay from '@/components/shared/ratings/user-rating-display';
import { SocketProvider } from '@/components/providers/socket-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { markMessageAsRead } from '@/lib/actions/messages.actions';
import AcceptProductButton from '@/components/shared/product-assignment/accept-product-button';
import ReviewProductDialog from '@/components/shared/product-assignment/review-product-dialog';
import ProductCompleteButton from '@/components/shared/product-assignment/product-complete-button';
import ReviewClientDialog from '@/components/shared/product-assignment/review-client-dialog';

interface ChatPageClientProps {
  initialConversation: {
    participants: {
      user: {
        id: string;
        name: string | null;
        image: string | null;
        sellerRating: number | null;
        clientRating: number | null;
      };
    }[];
    product?: {
      id: string;
      name: string;
      createdById: string;
      status?: {
        name: string;
      };
      assignments: {
        id: string;
        status: {
          name: string;
        };
        reviewedByClient: boolean;
        reviews: {
          id: string;
          content: string;
          createdAt: string;
          updatedAt: string;
        }[];
      }[];
    } | null;
  };
  id: string;
}

export function ChatPageClient({ initialConversation, id }: ChatPageClientProps) {
  const { data: session } = useSession();
  const { resetUnreadCount } = useSocket();
  const [conversation, setConversation] = useState(initialConversation);

  // Mark all messages as read when entering the conversation
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        const response = await fetch('/api/messages/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ conversationId: id }),
        });
        
        if (response.ok) {
          resetUnreadCount();
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    if (session?.user) {
      markAllAsRead();
    }
  }, [id, session?.user, resetUnreadCount]);

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

  const otherParticipant = conversation?.participants.find(
    p => p.user.id !== session.user.id
  )?.user;

  const fallback = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Chat Service Unavailable</AlertTitle>
        <AlertDescription>
          The chat service is currently unavailable. You can still view your message history.
          Please try refreshing the page in a few moments.
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Retry Connection
        </Button>
        <Button asChild variant="outline">
          <Link href="/user/dashboard/messages">
            Return to Messages
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <SocketProvider
      userId={session.user.id}
      conversationId={id}
      fallback={fallback}
    >
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <Link 
            href="/user/dashboard/messages" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to messages</span>
          </Link>
          
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {conversation?.product?.name ? (
                  <>
                    <Clipboard className="h-5 w-5" />
                    {conversation.product.name}
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5" />
                    {otherParticipant?.name || 'Conversation'}
                  </>
                )}
              </h1>
              {otherParticipant && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">
                    {otherParticipant.name}
                  </span>
                  {otherParticipant.sellerRating && (
                    <UserRatingDisplay 
                      rating={Number(otherParticipant.sellerRating)} 
                      size="sm"
                      tooltipText="Seller Rating"
                    />
                  )}
                </div>
              )}
            </div>
            {conversation?.product && (
              <div className="flex-shrink-0">
                {session.user.id === conversation.product.createdById ? (
                  // Client view
                  <>
                    {conversation.product.assignments?.[0]?.status.name === 'COMPLETED' ? (
                      <AcceptProductButton 
                        productAssignmentId={conversation.product.assignments[0].id}
                        className="ml-4"
                      />
                    ) : conversation.product.assignments?.[0]?.status.name === 'ACCEPTED' ? (
                      <ReviewProductDialog 
                        productAssignmentId={conversation.product.assignments[0].id}
                        productName={conversation.product.name}
                        isEditMode={conversation.product.assignments[0].reviews.length > 0}
                      >
                        <Button
                          variant="warning"
                          size="sm"
                          className="ml-4"
                        >
                          <span className="mr-1">★</span>
                          {conversation.product.assignments[0].reviews.length > 0 ? "Edit Review" : "Submit Review"}
                        </Button>
                      </ReviewProductDialog>
                    ) : (
                      <ProductAssignButton
                        productId={conversation.product.id}
                        productOwnerId={conversation.product.createdById}
                        sellerId={otherParticipant?.id || ''}
                        className="ml-4"
                      />
                    )}
                  </>
                ) : (
                  // Seller view
                  <>
                    {conversation.product.assignments?.[0]?.status.name === 'IN_PROGRESS' ? (
                      <ProductCompleteButton
                        productAssignmentId={conversation.product.assignments[0].id}
                        className="ml-4"
                      />
                    ) : conversation.product.assignments?.[0]?.status.name === 'ACCEPTED' ? (
                      <ReviewClientDialog 
                        productAssignmentId={conversation.product.assignments[0].id}
                        clientName={conversation.product.createdById === session.user.id ? otherParticipant?.name || 'Client' : 'Client'}
                        isEditMode={conversation.product.assignments[0].reviews.length > 0}
                      >
                        <Button
                          variant="warning"
                          size="sm"
                          className="ml-4"
                        >
                          <span className="mr-1">★</span>
                          {conversation.product.assignments[0].reviews.length > 0 ? "Edit Review" : "Review Client"}
                        </Button>
                      </ReviewClientDialog>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* New feature notification */}
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-md mb-4 flex items-start gap-2 text-sm">
            <MessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">New Feature: Image Sharing</p>
              <p>You can now share images in your messages! Click the image button next to the message input to upload.</p>
            </div>
          </div>
        </div>
        
        <ChatInterface 
          conversationId={id} 
          initialMessages={[]} 
        />
      </div>
    </SocketProvider>
  );
} 
