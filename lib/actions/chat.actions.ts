/**
 * Chat and conversation management functions
 * @module ChatActions
 * @group API
 * 
 * This module provides server-side functions for managing chat conversations:
 * - Creating new conversations between users
 * - Retrieving existing conversations
 * - Managing conversation participants
 */

// Chat and conversation management functions
// Note: getOrCreateConversation has been moved to conversation.actions.ts
// to avoid importing auth (which uses next/headers) in Client Component contexts

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { convertToPlainObject } from '@/lib/utils';
import { Prisma } from '@prisma/client';

/**
 * Gets a conversation by ID
 * 
 * @param conversationId - The ID of the conversation to fetch
 * @returns The conversation object with participants and product details
 * 
 * @example
 * // In a conversation detail page
 * const conversation = await getConversationById(conversationId);
 * 
 * if (conversation) {
 *   return (
 *     <div>
 *       <h1>Conversation with {conversation.participants[0].user.name}</h1>
 *       <ChatInterface conversationId={conversation.id} />
 *     </div>
 *   );
 * }
 */
export async function getConversationById(conversationId: string): Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  productId: string | null;
  participants: Array<{
    id: string;
    userId: string;
    conversationId: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string;
      image: string | null;
      sellerRating: Prisma.Decimal;
      clientRating: Prisma.Decimal;
    };
  }>;
  product: {
    id: string;
    name: string;
    createdById: string;
    status?: {
      name: string;
    };
    assignments: Array<{
      id: string;
      status: { name: string };
      reviewedByClient: boolean;
      reviews: Array<{
        id: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
  } | null;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id
          }
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
        product: {
          select: {
            id: true,
            name: true,
            createdById: true,
            assignments: {
              select: {
                id: true,
                status: {
                  select: {
                    name: true
                  }
                },
                reviews: {
                  where: {
                    reviewType: {
                      name: 'Client Review'
                    }
                  },
                  select: {
                    id: true,
                    description: true,
                    createdAt: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Transform the data to match the expected structure
    const transformedConversation = {
      ...conversation,
      product: conversation.product ? {
        ...conversation.product,
        assignments: conversation.product.assignments.map((assignment: { 
          id: string; 
          status: { name: string }; 
          reviews: Array<{ 
            id: string; 
            description: string; 
            createdAt: Date; 
          }>; 
        }) => ({
          ...assignment,
          reviewedByClient: assignment.reviews.length > 0,
          reviews: assignment.reviews.map((review: { 
            id: string; 
            description: string; 
            createdAt: Date; 
          }) => ({
            id: review.id,
            content: review.description,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.createdAt.toISOString() // Using createdAt as updatedAt since we don't have it
          }))
        }))
      } : null
    };

    return transformedConversation;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
} 
