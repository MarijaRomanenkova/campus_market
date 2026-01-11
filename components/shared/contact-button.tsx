import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { getOrCreateConversation } from '@/lib/actions/conversation.actions';
import { useSession } from 'next-auth/react';

interface ContactButtonProps {
  productId: string;
  clientId: string;
  sellerId: string;
  viewType?: 'client' | 'seller';
}

export const ContactButton: React.FC<ContactButtonProps> = ({
  productId,
  clientId,
  sellerId,
  viewType = 'client'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  
  const handleContact = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a conversation.",
        variant: "destructive",
      });
      router.push('/auth/signin');
      return;
    }

    setIsLoading(true);
    try {
      // Log the IDs being passed
      console.log('Starting conversation with IDs:', {
        currentUserId: session.user.id,
        productId,
        clientId,
        sellerId
      });

      const result = await getOrCreateConversation(
        session.user.id,
        productId,
        clientId,
        sellerId
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.conversation) {
        throw new Error('Failed to create conversation');
      }

      // Navigate to the conversation
      router.push(`/user/dashboard/messages/${result.conversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not start conversation. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="success"
      onClick={handleContact}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : (
        <>
          <MessageSquare className="mr-1 h-4 w-4" />
          Contact
        </>
      )}
    </Button>
  );
}; 
