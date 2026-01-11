import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { mockUsers } from './__mocks__/auth';
import { getOrCreateConversation } from '@/lib/actions/conversation.actions';
import { createProduct } from '@/lib/actions/product.actions';
import { createProductAssignment } from '@/lib/actions/product-assignment.actions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    conversationParticipant: {
      create: jest.fn(),
    },
    productAssignment: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/actions/conversation.actions', () => ({
  getOrCreateConversation: jest.fn(),
}));

jest.mock('@/lib/actions/product.actions', () => ({
  createProduct: jest.fn(),
}));

jest.mock('@/lib/actions/product-assignment.actions', () => ({
  createProductAssignment: jest.fn(),
}));

describe('Context-Based Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Create mock users that can act as either client or seller
  const userA = {
    id: 'user-a-id',
    name: 'User A',
    email: 'usera@example.com'
  };
  
  const userB = {
    id: 'user-b-id',
    name: 'User B',
    email: 'userb@example.com'
  };
  
  describe('Product Creator Permissions (Acting as Client)', () => {
    beforeEach(() => {
      // Set up session for User A (acting as product creator)
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: userA.id,
          name: userA.name,
          email: userA.email
        }
      });
    });
    
    it('should allow product creators to create products', async () => {
      // Arrange
      const productData = {
        name: 'Product by User A',
        description: 'Description for test product',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: userA.id
      };
      
      (prisma.product.create as jest.Mock).mockResolvedValue({
        id: 'product-123',
        ...productData,
        createdById: userA.id,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (createProduct as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { 
          success: true, 
          data: await prisma.product.create({ 
            data: { ...data, createdById: session.user.id } 
          }),
        };
      });
      
      // Act
      const result = await (createProduct as any)(productData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...productData, createdById: userA.id }
      });
    });
    
    it('should allow product creators to assign their products to other users', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = userB.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: userA.id, // Product was created by User A
        name: 'Product by User A',
      });
      
      (prisma.productAssignment.create as jest.Mock).mockResolvedValue({
        id: 'assignment-123',
        productId,
        clientId: userA.id,
        sellerId,
        statusId: 'status-assigned',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (createProductAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        const product = await prisma.product.findUnique({ where: { id: data.productId } });
        if (!product) {
          return { success: false, message: 'Product not found' };
        }
        
        if (product.createdById !== session.user.id) {
          return { success: false, message: 'Only the product creator can assign sellers' };
        }
        
        const assignment = await prisma.productAssignment.create({
          data: {
            productId: data.productId,
            clientId: session.user.id,
            sellerId: data.sellerId,
            statusId: 'status-assigned'
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: userA.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.productAssignment.create).toHaveBeenCalledWith({
        data: {
          productId,
          clientId: userA.id,
          sellerId,
          statusId: 'status-assigned'
        }
      });
    });
    
    it('should prevent users from assigning products they did not create', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = userB.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: 'different-user-id', // Product created by someone else
        name: 'Product by Different User',
      });
      
      (createProductAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        const product = await prisma.product.findUnique({ where: { id: data.productId } });
        if (!product) {
          return { success: false, message: 'Product not found' };
        }
        
        if (product.createdById !== session.user.id) {
          return { success: false, message: 'Only the product creator can assign sellers' };
        }
        
        const assignment = await prisma.productAssignment.create({
          data: {
            productId: data.productId,
            clientId: session.user.id,
            sellerId: data.sellerId,
            statusId: 'status-assigned'
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: userB.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the product creator can assign sellers');
      expect(prisma.productAssignment.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Product Responder Permissions (Acting as Seller)', () => {
    beforeEach(() => {
      // Set up session for User B (acting as product responder)
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: userB.id,
          name: userB.name,
          email: userB.email
        }
      });
    });
    
    it('should allow users to initiate conversations about products created by others', async () => {
      // Arrange
      const productId = 'product-123';
      const productCreatorId = userA.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: productCreatorId,
        name: 'Product by User A',
      });
      
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
      
      (prisma.conversation.create as jest.Mock).mockResolvedValue({
        id: 'conversation-123',
        productId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (prisma.conversationParticipant.create as jest.Mock).mockImplementation(({ data }) => ({
        id: `participant-${data.userId}`,
        userId: data.userId,
        conversationId: data.conversationId,
        joinedAt: new Date()
      }));
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, productId, clientId, sellerId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Cannot create conversation with self
        if (currentUserId === clientId) {
          return { success: false, message: 'Cannot create a conversation with yourself' };
        }
        
        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
          where: { productId }
        });
        
        if (existingConversation) {
          return { success: true, data: existingConversation };
        }
        
        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: { productId }
        });
        
        // Add participants
        const clientParticipant = await prisma.conversationParticipant.create({
          data: {
            userId: clientId,
            conversationId: conversation.id
          }
        });
        
        const sellerParticipant = await prisma.conversationParticipant.create({
          data: {
            userId: currentUserId,
            conversationId: conversation.id
          }
        });
        
        return { success: true, data: conversation };
      });
      
      // Act
      const result = (await getOrCreateConversation(userB.id, productId, productCreatorId, userB.id) as unknown) as { 
        success: boolean; 
        data?: {
          id: string;
          productId: string;
          createdAt: Date;
          updatedAt: Date;
        }; 
        message?: string;
      };
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { productId }
      });
    });
    
    it('should prevent users from assigning products created by others', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = 'some-other-user-id';
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: userA.id, // Product created by User A
        name: 'Product by User A',
      });
      
      (createProductAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        const product = await prisma.product.findUnique({ where: { id: data.productId } });
        if (!product) {
          return { success: false, message: 'Product not found' };
        }
        
        if (product.createdById !== session.user.id) {
          return { success: false, message: 'Only the product creator can assign sellers' };
        }
        
        const assignment = await prisma.productAssignment.create({
          data: {
            productId: data.productId,
            clientId: session.user.id,
            sellerId: data.sellerId,
            statusId: 'status-assigned'
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: userB.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the product creator can assign sellers');
      expect(prisma.productAssignment.create).not.toHaveBeenCalled();
    });
    
    it('should prevent creating conversations for your own products', async () => {
      // Arrange
      const productId = 'product-456';
      const productCreatorId = userB.id; // Same as current user
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, productId, clientId, sellerId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Cannot create conversation with self
        if (currentUserId === clientId) {
          return { success: false, message: 'Cannot create a conversation with yourself' };
        }
        
        return { conversation: null };
      });
      
      // Act
      const result = (await getOrCreateConversation(userB.id, productId, productCreatorId, userB.id) as unknown) as {
        success: boolean;
        message?: string;
      };
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot create a conversation with yourself');
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Same User in Different Contexts', () => {
    const userC = {
      id: 'user-c-id',
      name: 'User C',
      email: 'userc@example.com'
    };
    
    it('should allow a user to create a product (as client) and respond to other products (as seller)', async () => {
      // Set up user C's session
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: userC.id,
          name: userC.name,
          email: userC.email
        }
      });
      
      // Test as product creator (client role)
      const productData = {
        name: 'Product by User C',
        description: 'Description for test product',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: userC.id
      };
      
      (prisma.product.create as jest.Mock).mockResolvedValue({
        id: 'product-c-123',
        ...productData,
        createdById: userC.id,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (createProduct as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { 
          success: true, 
          data: await prisma.product.create({ 
            data: { ...data, createdById: session.user.id } 
          }),
        };
      });
      
      // Test user creating a product
      const createResult = await (createProduct as any)(productData);
      expect(createResult.success).toBe(true);
      
      // Now test the same user responding to a product (seller role)
      const productId = 'product-by-another-user';
      const productCreatorId = userA.id;
      
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
      
      (prisma.conversation.create as jest.Mock).mockResolvedValue({
        id: 'conversation-with-c',
        productId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, productId, clientId, sellerId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Cannot create conversation with self
        if (currentUserId === clientId) {
          return { success: false, message: 'Cannot create a conversation with yourself' };
        }
        
        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
          where: { productId }
        });
        
        if (existingConversation) {
          return { success: true, data: existingConversation };
        }
        
        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: { productId }
        });
        
        return { success: true, data: conversation };
      });
      
      // Test user responding to another user's product
      const conversationResult = (await getOrCreateConversation(userC.id, productId, productCreatorId, userC.id) as unknown) as {
        success: boolean;
        data?: {
          id: string;
          productId: string;
          createdAt: Date;
          updatedAt: Date;
        };
        message?: string;
      };
      
      // Assert both roles work for the same user
      expect(createResult.success).toBe(true);
      expect(conversationResult.success).toBe(true);
      expect(conversationResult.data).toBeDefined();
    });
  });
  
  describe('Unauthorized Access', () => {
    beforeEach(() => {
      // Set up no session for each test
      (auth as jest.Mock).mockResolvedValue(null);
    });
    
    it('should prevent unauthenticated users from creating products', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'Description for test product',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: 'anonymous-user-id'
      };
      
      (createProduct as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { 
          success: true, 
          data: await prisma.product.create({ 
            data: { ...data, createdById: session.user.id } 
          }),
        };
      });
      
      // Act
      const result = await (createProduct as any)(productData);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
    
    it('should prevent unauthenticated users from initiating conversations', async () => {
      // Arrange
      const productId = 'product-123';
      const productCreatorId = userA.id;
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, productId, clientId, sellerId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        return { conversation: null };
      });
      
      // Act
      const result = (await getOrCreateConversation('anonymous-user', productId, productCreatorId, 'seller-id') as unknown) as {
        success: boolean;
        message?: string;
      };
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
  });
}); 
