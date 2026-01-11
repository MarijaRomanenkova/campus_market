/**
 * Product Contact Button Component
 * @module Components
 * @group Shared/Products
 * 
 * A client-side component that provides a button to initiate conversation with a product owner.
 * Features include:
 * - Authentication check
 * - Existing conversation lookup
 * - New conversation creation
 * - Error handling with toast notifications
 * - Loading state management
 * 
 * @example
 * ```tsx
 * <ProductContactButton
 *   productId="product123"
 *   productOwnerId="user456"
 *   variant="default"
 *   size="default"
 *   className="custom-class"
 * />
 * ```
 */

'use client';

/**
 * @module ProductContactButton
 * @description A button component that initiates conversation with a product owner.
 * This component handles checking for existing conversations and creating new ones if needed.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Props for the ProductContactButton component
 * @interface ProductContactButtonProps
 */
interface ProductContactButtonProps {
  /** The unique identifier of the product */
  productId: string;
  /** The unique identifier of the product owner */
  productOwnerId: string;
  /** Button styling variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Optional CSS class names */
  className?: string;
}

/**
 * ProductContactButton component that allows users to initiate conversations with product owners.
 * Handles authentication check, existing conversation lookup, and creation of new conversations.
 * 
 * @param {ProductContactButtonProps} props - Component properties
 * @returns {JSX.Element} A button that initiates contact with the product owner
 */
const ProductContactButton = ({ 
  productId, 
  productOwnerId,
  variant = 'default',
  size = 'default',
  className = ''
}: ProductContactButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  
  /**
   * Handles the contact button click by checking authentication, validating the request,
   * checking for existing conversations, and creating a new one if needed.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleContact = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    
    // Prevent product owner from contacting themselves
    if (session.user.id === productOwnerId) {
      toast({
        variant: 'destructive',
        title: 'Cannot contact',
        description: 'This is your own product',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, check if a conversation already exists for this product
      const checkResponse = await fetch(`/api/conversations?productId=${productId}`);
      
      if (!checkResponse.ok) {
        throw new Error(`Failed to check for existing conversations: ${checkResponse.status} ${checkResponse.statusText}`);
      }
      
      let conversations = [];
      const checkText = await checkResponse.text();
      
      // Only try to parse as JSON if there's actual content
      if (checkText && checkText.trim()) {
        try {
          conversations = JSON.parse(checkText);
        } catch (parseError) {
          console.error('Error parsing conversations response:', parseError);
          throw new Error('Invalid response format when checking conversations');
        }
      }
      
      if (conversations.length > 0) {
        // Conversation exists, navigate to it
        router.push(`/user/dashboard/messages/${conversations[0].id}`);
      } else {
        // Create new conversation
        const createResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            participantIds: [productOwnerId]
          }),
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          let errorMessage = `Failed to create conversation: ${createResponse.status} ${createResponse.statusText}`;
          
          if (errorText && errorText.trim()) {
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.message || errorData.error) {
                errorMessage = errorData.message || errorData.error;
              }
            } catch (parseError) {
              console.error('Error parsing error response:', parseError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        let newConversation;
        const createText = await createResponse.text();
        
        if (!createText || !createText.trim()) {
          throw new Error('Empty response when creating conversation');
        }
        
        try {
          newConversation = JSON.parse(createText);
        } catch (parseError) {
          console.error('Error parsing new conversation response:', createText, parseError);
          throw new Error('Invalid response format when creating conversation');
        }
        
        router.push(`/user/dashboard/messages/${newConversation.id}`);
      }
    } catch (error: unknown) {
      console.error('Error starting conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start conversation',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleContact}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? 'Starting chat...' : 'Contact Client'}
    </Button>
  );
};

export default ProductContactButton; 
