// Mock chat functionality data and functions for testing

import { z } from 'zod';

// UUID helper
const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock users
export const mockUsers = {
  client: {
    id: generateUuid(),
    name: 'Test Client',
    email: 'client@example.com',
    image: null
  },
  seller: {
    id: generateUuid(),
    name: 'Test Seller',
    email: 'seller@example.com',
    image: null
  }
};

// Mock product
export const mockProduct = {
  id: generateUuid(),
  name: 'Test Product',
  description: 'Description for test product',
  price: 100,
  images: ['image1.jpg', 'image2.jpg'],
  categoryId: generateUuid(),
  createdById: mockUsers.client.id,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Define a type for system message metadata
type SystemMessageMetadata = {
  eventType: string;
  productAssignmentId?: string;
  productName?: string;
};

// Define Message type
type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: null | Date;
  imageUrl: string | null;
  isSystemMessage: boolean;
  metadata: SystemMessageMetadata | null;
  sender: typeof mockUsers.client | typeof mockUsers.seller;
};

// Mock conversation
export const mockConversation = {
  id: generateUuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
  productId: mockProduct.id,
  participants: [
    {
      id: generateUuid(),
      userId: mockUsers.client.id,
      conversationId: null, // Will be set after creation
      joinedAt: new Date(),
      user: mockUsers.client
    },
    {
      id: generateUuid(),
      userId: mockUsers.seller.id,
      conversationId: null, // Will be set after creation
      joinedAt: new Date(),
      user: mockUsers.seller
    }
  ],
  messages: [] as Message[] // Initially empty, will be populated in tests
};

// Mock message
export const createMockMessage = (senderId: string, content: string, isSystemMessage = false): Message => ({
  id: generateUuid(),
  conversationId: mockConversation.id,
  senderId,
  content,
  createdAt: new Date(),
  readAt: null,
  imageUrl: null,
  isSystemMessage,
  metadata: isSystemMessage ? { eventType: 'status-update' } as SystemMessageMetadata : null,
  sender: senderId === mockUsers.client.id ? mockUsers.client : mockUsers.seller
});

// Mock initial messages for testing
export const mockMessages = [
  createMockMessage(mockUsers.seller.id, 'I can help with that. What do you need?'),
  createMockMessage(mockUsers.client.id, 'I need to buy a laptop')
];

// Conversation with messages for testing
export const mockConversationWithMessages = {
  ...mockConversation,
  messages: mockMessages
};

// Mock function to get or create a conversation
export const getOrCreateConversation = jest.fn().mockImplementation(
  async (currentUserId: string, productId: string, clientId: string, sellerId: string) => {
    // Validate parameters
    if (!currentUserId || !productId || !clientId || !sellerId) {
      return { error: 'Missing required parameters' };
    }

    // Check if trying to create conversation with self
    if (currentUserId === clientId) {
      return { error: 'Cannot create a conversation with yourself' };
    }

    // Return successful mock response
    return {
      conversation: {
        ...mockConversation,
        productId,
        participants: mockConversation.participants.map(p => ({
          ...p,
          conversationId: mockConversation.id
        }))
      }
    };
  }
);

// Mock function to send a message
export const sendMessage = jest.fn().mockImplementation(
  async (conversationId: string, content: string, senderId: string, imageUrl?: string) => {
    // Validate parameters
    if (!conversationId || !content || !senderId) {
      return { error: 'Missing required fields' };
    }

    // Create a new message
    const newMessage = createMockMessage(senderId, content);
    
    if (imageUrl) {
      newMessage.imageUrl = imageUrl;
    }

    return { success: true, message: newMessage };
  }
);

// Mock function to get conversation messages
export const getConversationMessages = jest.fn().mockImplementation(
  async (conversationId: string) => {
    if (conversationId !== mockConversation.id) {
      return { error: 'Conversation not found' };
    }

    return { success: true, messages: mockMessages };
  }
);

// Mock function to create system notification
export const createProductAssignmentNotification = jest.fn().mockImplementation(
  async (productAssignmentId: string, message: string, eventType: string) => {
    const systemMessage = createMockMessage(mockUsers.client.id, message, true);
    // Set metadata for system message
    systemMessage.metadata = {
      eventType,
      productAssignmentId,
      productName: mockProduct.name
    };
    
    return systemMessage;
  }
);

// Mock Prisma client for chat
export const mockPrismaChat = {
  conversation: {
    findUnique: jest.fn().mockImplementation(({ where, include }) => {
      if (where.id === mockConversation.id) {
        const result = { ...mockConversation };
        if (include?.participants) {
          result.participants = mockConversation.participants;
        }
        if (include?.messages) {
          result.messages = mockMessages;
        }
        return result;
      }
      return null;
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      // Simple implementation - just check if the productId matches
      if (where?.productId === mockProduct.id) {
        return mockConversation;
      }
      return null;
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      // If looking for conversations where a specific user is a participant
      if (where?.participants?.some?.userId) {
        const userId = where.participants.some.userId;
        if (mockConversation.participants.some(p => p.userId === userId)) {
          return [mockConversation];
        }
      }
      return [];
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      return {
        ...mockConversation,
        productId: data.productId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      return {
        ...mockConversation,
        id: where.id,
        updatedAt: new Date()
      };
    })
  },
  conversationParticipant: {
    create: jest.fn().mockImplementation(({ data }) => {
      return {
        id: generateUuid(),
        userId: data.userId,
        conversationId: data.conversationId,
        joinedAt: new Date()
      };
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      if (where?.conversationId === mockConversation.id) {
        return mockConversation.participants;
      }
      return [];
    })
  },
  message: {
    create: jest.fn().mockImplementation(({ data, include }) => {
      const message = createMockMessage(data.senderId, data.content, data.isSystemMessage || false);
      if (data.imageUrl) {
        message.imageUrl = data.imageUrl;
      }
      if (data.metadata) {
        message.metadata = data.metadata;
      }
      
      if (include?.sender) {
        message.sender = data.senderId === mockUsers.client.id 
          ? mockUsers.client 
          : mockUsers.seller;
      }
      
      return message;
    }),
    findMany: jest.fn().mockImplementation(({ where, orderBy, include }) => {
      if (where?.conversationId === mockConversation.id) {
        const messages = [...mockMessages];
        if (orderBy?.createdAt === 'desc') {
          messages.reverse();
        }
        return messages;
      }
      return [];
    })
  }
}; 
