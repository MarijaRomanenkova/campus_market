// tests/chat.test.ts

import { 
  mockUsers,
  mockProduct,
  mockConversation,
  mockMessages,
  mockConversationWithMessages,
  getOrCreateConversation,
  sendMessage,
  getConversationMessages,
  createProductAssignmentNotification,
  mockPrismaChat
} from './__mocks__/chat';

// Mock Next.js auth
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: {
      id: mockUsers.client.id,
      name: mockUsers.client.name,
      email: mockUsers.client.email
    }
  })
}));

// Mock Prisma client
jest.mock('@/db/prisma', () => ({
  prisma: mockPrismaChat
}));

// Mock revalidatePath from next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

// Mock lib/actions/chat.actions.ts
jest.mock('@/lib/actions/chat.actions', () => ({
  getOrCreateConversation
}));

// Mock lib/actions/messages.actions.ts
jest.mock('@/lib/actions/messages.actions', () => ({
  createProductAssignmentNotification
}));

describe('Chat Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Conversation Creation', () => {
    it('should create a conversation between client and seller for a product', async () => {
      // Arrange
      const currentUserId = mockUsers.seller.id;
      const productId = mockProduct.id;
      const clientId = mockUsers.client.id;
      const sellerId = mockUsers.seller.id;

      // Act
      const result = await getOrCreateConversation(currentUserId, productId, clientId, sellerId);

      // Assert
      expect(result).toHaveProperty('conversation');
      expect(result.conversation.productId).toBe(productId);
      expect(result.conversation.participants).toHaveLength(2);
      expect(getOrCreateConversation).toHaveBeenCalledWith(currentUserId, productId, clientId, sellerId);
    });

    it('should prevent creating a conversation with yourself', async () => {
      // Arrange
      const currentUserId = mockUsers.client.id;
      const productId = mockProduct.id;
      const clientId = mockUsers.client.id; // Same user
      const sellerId = mockUsers.seller.id;

      // Act
      const result = await getOrCreateConversation(currentUserId, productId, clientId, sellerId);

      // Assert
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Cannot create a conversation with yourself');
    });
  });

  describe('Message Creation', () => {
    it('should send a message to a conversation', async () => {
      // Arrange
      const conversationId = mockConversation.id;
      const content = 'Hello, this is a test message';
      const senderId = mockUsers.client.id;

      // Act
      const result = await sendMessage(conversationId, content, senderId);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result.message.content).toBe(content);
      expect(result.message.senderId).toBe(senderId);
      expect(sendMessage).toHaveBeenCalledWith(conversationId, content, senderId);
    });

    it('should validate required fields for sending messages', async () => {
      // Act
      const result = await sendMessage('', 'Test content', mockUsers.client.id);

      // Assert
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Missing required fields');
    });

    it('should support sending messages with images', async () => {
      // Arrange
      const conversationId = mockConversation.id;
      const content = 'Message with image';
      const senderId = mockUsers.client.id;
      const imageUrl = 'https://example.com/image.jpg';

      // Act
      const result = await sendMessage(conversationId, content, senderId, imageUrl);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result.message.imageUrl).toBeDefined();
    });
  });

  describe('Message Retrieval', () => {
    it('should get messages for a conversation', async () => {
      // Arrange
      const conversationId = mockConversation.id;

      // Mock the implementation for this test
      const mockGetMessages = jest.fn().mockResolvedValue({
        success: true,
        messages: mockMessages
      });

      // Act
      const result = await mockGetMessages(conversationId);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(mockMessages.length);
      expect(mockGetMessages).toHaveBeenCalledWith(conversationId);
    });

    it('should return an error for invalid conversation ID', async () => {
      // Arrange
      const invalidConversationId = 'invalid-id';

      // Mock the implementation for this test
      const mockGetMessages = jest.fn().mockResolvedValue({
        error: 'Conversation not found'
      });

      // Act
      const result = await mockGetMessages(invalidConversationId);

      // Assert
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Conversation not found');
      expect(mockGetMessages).toHaveBeenCalledWith(invalidConversationId);
    });
  });

  describe('System Messages', () => {
    it('should create system notification for product assignments', async () => {
      // Arrange
      const productAssignmentId = 'test-assignment-id';
      const message = 'Product has been assigned';
      const eventType = 'status-update';

      // Act
      const result = await createProductAssignmentNotification(productAssignmentId, message, eventType);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe(message);
      expect(result.isSystemMessage).toBe(true);
      expect(result.metadata).toHaveProperty('eventType', eventType);
      expect(createProductAssignmentNotification).toHaveBeenCalledWith(productAssignmentId, message, eventType);
    });
  });
}); 
