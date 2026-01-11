/**
 * Conversation management server actions
 * @module ConversationActions
 * @group API
 * 
 * Server actions for managing conversations between users.
 * These functions can be called from Client Components.
 */

'use server';

import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';

/**
 * Gets an existing conversation or creates a new one between two users for a specific product
 * 
 * @param currentUserId - The ID of the current user initiating the conversation
 * @param productId - The ID of the product this conversation is related to
 * @param clientId - The ID of the client (product creator)
 * @param sellerId - The ID of the seller
 * @returns Object containing either conversation data or an error message
 */
export const getOrCreateConversation = async (
  currentUserId: string,
  productId: string,
  clientId: string,
  sellerId: string
) => {
  try {
    // Log the incoming parameters
    console.log('Creating conversation with parameters:', {
      currentUserId,
      productId,
      clientId,
      sellerId
    });

    // Verify all users exist
    const [currentUser, client, seller] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId } }),
      prisma.user.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: sellerId } })
    ]);

    // Log which users were found/not found with their details
    console.log('User verification details:', {
      currentUser: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      } : 'not found',
      client: client ? {
        id: client.id,
        name: client.name,
        email: client.email
      } : 'not found',
      seller: seller ? {
        id: seller.id,
        name: seller.name,
        email: seller.email
      } : 'not found'
    });

    if (!currentUser || !client || !seller) {
      const missingUsers = [];
      if (!currentUser) missingUsers.push('current user');
      if (!client) missingUsers.push('client');
      if (!seller) missingUsers.push('seller');
      return { error: `One or more participants not found: ${missingUsers.join(', ')}` };
    }

    // Make sure client and seller are different users (can't have a conversation with yourself)
    if (clientId === sellerId) {
      return { error: 'Cannot create a conversation with yourself' };
    }

    // Check for existing conversation - find conversation with this productId
    // that has both clientId and sellerId as participants
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        productId,
        AND: [
          {
            participants: {
              some: {
                userId: clientId
              }
            }
          },
          {
            participants: {
              some: {
                userId: sellerId
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                sellerRating: true,
                clientRating: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (existingConversation) {
      // Serialize the conversation to handle Decimal types and Prisma metadata
      const serialized = convertToPlainObject(existingConversation) as any;
      // Ensure ID is preserved as a string
      if (serialized.id) {
        serialized.id = String(serialized.id);
      }
      // Convert Decimal ratings to numbers
      if (serialized.participants) {
        serialized.participants = serialized.participants.map((p: any) => ({
          ...p,
          user: {
            ...p.user,
            sellerRating: p.user.sellerRating ? Number(p.user.sellerRating) : null,
            clientRating: p.user.clientRating ? Number(p.user.clientRating) : null
          }
        }));
      }
      return { conversation: serialized };
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        productId,
        participants: {
          create: [
            { userId: clientId },
            { userId: sellerId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                sellerRating: true,
                clientRating: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Serialize the conversation to handle Decimal types and Prisma metadata
    const serialized = convertToPlainObject(newConversation) as any;
    // Ensure ID is preserved as a string
    if (serialized.id) {
      serialized.id = String(serialized.id);
    }
    // Convert Decimal ratings to numbers
    if (serialized.participants) {
      serialized.participants = serialized.participants.map((p: any) => ({
        ...p,
        user: {
          ...p.user,
          sellerRating: p.user.sellerRating ? Number(p.user.sellerRating) : null,
          clientRating: p.user.clientRating ? Number(p.user.clientRating) : null
        }
      }));
    }
    
    return { conversation: serialized };
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { error: 'Failed to get or create conversation' };
  }
};
