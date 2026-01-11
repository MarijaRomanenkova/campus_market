'use server';

/**
 * Message and notification functions for system-generated messages
 * @module MessageActions
 * @group API
 * 
 * This module provides server-side functions for handling message operations including:
 * - Sending system notifications
 * - Managing product-related communications
 * - Handling payment notifications
 * - Archiving messages
 */

import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { formatError } from '../utils';

/**
 * Create a system message in a conversation related to a product assignment
 * Used for automated notifications about status changes and invoices
 * 
 * @param productAssignmentId - ID of the product assignment
 * @param message - Content of the message
 * @param eventType - Type of event (e.g., 'status-update', 'invoice-created', 'review-submitted')
 * @param metadata - Optional additional metadata (review rating, feedback, etc.)
 * @returns The created message or null if creation fails
 */
export async function createProductAssignmentNotification(
  productAssignmentId: string,
  message: string,
  eventType: 'status-update' | 'invoice-created' | 'review-submitted',
  metadata?: {
    reviewRating?: number;
    reviewFeedback?: string;
  }
) {
  try {
    // Get product assignment to find the client and seller
    const productAssignment = await prisma.productAssignment.findUnique({
      where: { 
        id: productAssignmentId 
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true
          }
        },
        seller: {
          select: {
            id: true
          }
        }
      }
    });

    if (!productAssignment) {
      console.error(`Product assignment not found: ${productAssignmentId}`);
      return null;
    }

    // Find the conversation between the client and seller about this product
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { productId: productAssignment.product.id },
          {
            participants: {
              some: {
                userId: productAssignment.clientId
              }
            }
          },
          {
            participants: {
              some: {
                userId: productAssignment.sellerId
              }
            }
          }
        ]
      }
    });

    if (!conversation) {
      console.error(`No conversation found for product assignment: ${productAssignmentId}`);
      return null;
    }

    // Create the system message - use try/catch to handle schema compatibility issues
    let systemMessage;
    try {
      // Prepare metadata object
      const messageMetadata = {
        eventType,
        productAssignmentId,
        productName: productAssignment.product.name,
        ...metadata // Add any additional metadata that was passed
      };
      
      // Try with full system message properties
      systemMessage = await prisma.message.create({
        data: {
          content: message,
          conversationId: conversation.id,
          senderId: eventType === 'review-submitted' ? productAssignment.clientId : productAssignment.sellerId,
          isSystemMessage: true,
          metadata: messageMetadata
        }
      });
    } catch (err) {
      console.log("Could not create system message with metadata, falling back to standard message", err);
      // Fallback to standard message if metadata creation fails
      systemMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: eventType === 'review-submitted' ? productAssignment.clientId : productAssignment.sellerId,
          content: message,
          isSystemMessage: true
        }
      });
    }

    // Update conversation's last activity timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return convertToPlainObject(systemMessage);
  } catch (error) {
    console.error("Error creating product assignment notification:", error);
    return null;
  }
}

/**
 * Sends a system notification to a user
 * 
 * @param userId - The ID of the user to notify
 * @param message - The notification message
 * @param type - The type of notification
 * @returns Result with success status and message
 * 
 * @example
 * // In a product assignment handler
 * const result = await sendSystemNotification(
 *   sellerId,
 *   'You have been assigned a new product',
 *   'PRODUCT_ASSIGNED'
 * );
 */
export async function sendSystemNotification(
  userId: string,
  message: string,
  type: 'PRODUCT_ASSIGNED' | 'PRODUCT_COMPLETED' | 'PAYMENT_RECEIVED' | 'REVIEW_REQUESTED'
) {
  try {
    // Find or create a system conversation for this user
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        productId: null, // System messages are not tied to a specific product
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: {
              userId,
            },
          },
        },
      });
    }

    const systemMessage = await prisma.message.create({
      data: {
        content: message,
        conversationId: conversation.id,
        senderId: userId,
        isSystemMessage: true,
        metadata: {
          type,
        },
      },
    });

    revalidatePath('/user/notifications');
    return {
      success: true,
      message: 'Notification sent successfully',
      data: systemMessage.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Sends notifications to sellers when a product is archived
 * 
 * @param productId - The ID of the product that was archived
 * @returns Result with success status and message
 * 
 * @example
 * // In a product archiving handler
 * const result = await sendProductArchivedNotifications(productId);
 * if (result.success) {
 *   console.log('Notifications sent to sellers');
 * }
 */
export async function sendProductArchivedNotifications(productId: string) {
  try {
    // Get all sellers who have conversations about this product
    const conversations = await prisma.conversation.findMany({
      where: { productId },
      include: {
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                role: true
              }
            }
          }
        }
      }
    });

    // Send notifications to each seller
    const messages = await Promise.all(
      conversations.flatMap((conversation) =>
        conversation.participants
          .filter(participant => participant.user.role === 'seller')
          .map(async (participant) => {
            // Find or create a system conversation for this user
            let systemConversation = await prisma.conversation.findFirst({
              where: {
                participants: {
                  some: {
                    userId: participant.userId,
                  },
                },
                productId: null,
              },
            });

            if (!systemConversation) {
              systemConversation = await prisma.conversation.create({
                data: {
                  participants: {
                    create: {
                      userId: participant.userId,
                    },
                  },
                },
              });
            }

            return prisma.message.create({
              data: {
                content: 'A product you were discussing has been archived',
                conversationId: systemConversation.id,
                senderId: participant.userId,
                isSystemMessage: true,
                metadata: {
                  type: 'PRODUCT_ARCHIVED',
                  productId,
                },
              },
            });
          })
      )
    );

    revalidatePath('/user/notifications');
    return {
      success: true,
      message: 'Notifications sent successfully',
      data: messages.map((message) => message.id),
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Marks a notification as read
 * 
 * @param notificationId - The ID of the notification to mark as read
 * @returns Result with success status and message
 * 
 * @example
 * // In a notification list component
 * const handleMarkAsRead = async (notificationId: string) => {
 *   const result = await markNotificationAsRead(notificationId);
 *   if (result.success) {
 *     // Update UI to show notification as read
 *   }
 * };
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const message = await prisma.message.update({
      where: {
        id: notificationId,
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      data: {
        readAt: new Date(),
      },
    });

    revalidatePath('/user/notifications');
    return {
      success: true,
      message: 'Notification marked as read',
      data: message.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves all notifications for the current user
 * 
 * @returns Array of notifications
 * 
 * @example
 * // In a notifications page
 * const notifications = await getUserNotifications();
 * 
 * return (
 *   <div>
 *     <h2>Notifications</h2>
 *     {notifications.map(notification => (
 *       <NotificationItem
 *         key={notification.id}
 *         message={notification.message}
 *         type={notification.type}
 *         read={notification.read}
 *         createdAt={notification.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getUserNotifications() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
            },
          },
        },
        isSystemMessage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return messages;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Sends a system message to a user
 * 
 * @param userId - The ID of the user to notify
 * @param message - The notification message
 * @param type - The type of notification
 * @returns Result with success status and message
 * 
 * @example
 * // In a product assignment handler
 * const result = await sendSystemMessage(
 *   sellerId,
 *   'You have been assigned a new product',
 *   'PRODUCT_ASSIGNED'
 * );
 */
export async function sendSystemMessage(
  userId: string,
  message: string,
  type: 'PRODUCT_ASSIGNED' | 'PRODUCT_COMPLETED' | 'PAYMENT_RECEIVED' | 'REVIEW_REQUESTED'
) {
  try {
    // Find or create a system conversation for this user
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        productId: null, // System messages are not tied to a specific product
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: {
              userId,
            },
          },
        },
      });
    }

    const systemMessage = await prisma.message.create({
      data: {
        content: message,
        conversationId: conversation.id,
        senderId: userId, // System messages are sent by the user themselves
        isSystemMessage: true,
        metadata: {
          type,
        },
      },
    });

    revalidatePath('/user/dashboard/messages');
    return {
      success: true,
      message: 'Message sent successfully',
      data: systemMessage.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Sends messages to sellers when a product is archived
 * 
 * @param productId - The ID of the product that was archived
 * @returns Result with success status and message
 * 
 * @example
 * // In a product archiving handler
 * const result = await sendProductArchivedMessages(productId);
 * if (result.success) {
 *   console.log('Messages sent to sellers');
 * }
 */
export async function sendProductArchivedMessages(productId: string) {
  try {
    // Get all sellers who have conversations about this product
    const conversations = await prisma.conversation.findMany({
      where: { productId },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Send messages to each seller
    const messages = await Promise.all(
      conversations.flatMap((conversation) =>
        conversation.participants.map((participant) =>
          prisma.message.create({
            data: {
              content: 'A product you were discussing has been archived',
              conversationId: conversation.id,
              senderId: participant.userId,
              isSystemMessage: true,
              metadata: {
                type: 'PRODUCT_ARCHIVED',
                productId,
              },
            },
          })
        )
      )
    );

    revalidatePath('/user/dashboard/messages');
    return {
      success: true,
      message: 'Messages sent successfully',
      data: messages.map((m) => m.id),
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Marks a message as read
 * 
 * @param messageId - The ID of the message to mark as read
 * @returns Result with success status and message
 * 
 * @example
 * // In a message list component
 * const handleMarkAsRead = async (messageId: string) => {
 *   const result = await markMessageAsRead(messageId);
 *   if (result.success) {
 *     // Update UI to show message as read
 *   }
 * };
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const message = await prisma.message.update({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      data: {
        readAt: new Date(),
      },
    });

    revalidatePath('/user/dashboard/messages');
    return {
      success: true,
      message: 'Message marked as read',
      data: message.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves all messages for the current user
 * 
 * @returns Array of messages
 * 
 * @example
 * // In a messages page
 * const messages = await getUserMessages();
 * 
 * return (
 *   <div>
 *     <h2>Messages</h2>
 *     {messages.map(message => (
 *       <MessageItem
 *         key={message.id}
 *         content={message.content}
 *         isSystemMessage={message.isSystemMessage}
 *         readAt={message.readAt}
 *         createdAt={message.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getUserMessages() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          participants: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

/**
 * Fetches messages for a specific conversation
 * 
 * @param conversationId - The ID of the conversation to fetch messages from
 * @returns Array of messages with sender details
 * 
 * @example
 * // In a chat interface component
 * const messages = await getConversationMessages(conversationId);
 * 
 * return (
 *   <div>
 *     {messages.map(message => (
 *       <MessageItem
 *         key={message.id}
 *         content={message.content}
 *         sender={message.sender}
 *         createdAt={message.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getConversationMessages(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify user is a participant in the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Fetch messages for the conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            sellerRating: true,
            clientRating: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return convertToPlainObject(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Creates a new message in a conversation
 * 
 * @param content - The message content
 * @param conversationId - The ID of the conversation
 * @param imageUrl - Optional URL of an attached image
 * @returns The created message with sender details
 * 
 * @example
 * // In a chat interface component
 * const handleSendMessage = async (content: string, imageUrl?: string) => {
 *   try {
 *     const message = await createMessage(content, conversationId, imageUrl);
 *     // Update UI with new message
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export async function createMessage(
  content: string,
  conversationId: string,
  imageUrl?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify user is a participant in the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        imageUrl,
        conversationId,
        senderId: session.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            sellerRating: true,
            clientRating: true
          }
        }
      }
    });

    // Update conversation's last activity timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Convert Decimal to number for ratings
    return {
      ...message,
      sender: {
        ...message.sender,
        sellerRating: Number(message.sender.sellerRating),
        clientRating: Number(message.sender.clientRating)
      }
    };
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

/**
 * Gets the count of unread messages for the current user
 * @returns {Promise<number>} The count of unread messages
 */
export async function getUnreadMessageCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return 0;
    }

    // Get all conversations where the user is a participant
    const userConversations = await prisma.conversationParticipant.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        conversationId: true
      }
    });

    const conversationIds = userConversations.map(c => c.conversationId);

    // Count messages that are:
    // 1. In conversations where the user is a participant
    // 2. Not sent by the user
    // 3. Have not been read (readAt is null)
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: session.user.id },
        readAt: null
      }
    });

    return unreadCount;
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return 0;
  }
} 
