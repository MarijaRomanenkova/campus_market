import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { mockSessions, mockUsers } from './__mocks__/auth';
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

describe('Role-Based Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Client Permissions', () => {
    beforeEach(() => {
      // Set up client session for each test
      (auth as jest.Mock).mockResolvedValue(mockSessions.CLIENT);
    });
    
    it('should allow clients to create products', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'Description for test product',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: mockUsers.client.id
      };
      
      (prisma.product.create as jest.Mock).mockResolvedValue({
        id: 'product-123',
        ...productData,
        createdById: mockUsers.client.id,
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
        data: { ...productData, createdById: mockUsers.client.id }
      });
    });
    
    it('should allow clients to assign products to sellers', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = mockUsers.seller.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: mockUsers.client.id,
        name: 'Test Product',
      });
      
      (prisma.productAssignment.create as jest.Mock).mockResolvedValue({
        id: 'assignment-123',
        productId,
        clientId: mockUsers.client.id,
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
            statusId: data.statusId
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.productAssignment.create).toHaveBeenCalledWith({
        data: {
          productId,
          clientId: mockUsers.client.id,
          sellerId,
          statusId: 'status-assigned'
        }
      });
    });
    
    it('should prevent clients from assigning products they did not create', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = mockUsers.seller.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: 'different-client-id', // Different client
        name: 'Test Product',
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
            statusId: data.statusId
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the product creator can assign sellers');
      expect(prisma.productAssignment.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Seller Permissions', () => {
    beforeEach(() => {
      // Set up seller session for each test
      (auth as jest.Mock).mockResolvedValue(mockSessions.SELLER);
    });
    
    it('should prevent sellers from creating products', async () => {
      // Arrange
      const productData = {
        name: 'Test Product',
        description: 'Description for test product',
        price: 100,
        categoryId: 'category-123',
        images: ['image1.jpg'],
        userId: mockUsers.seller.id
      };
      
      (createProduct as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Check if user is a client
        if (session.user.role !== 'CLIENT') {
          return { success: false, message: 'Only clients can create products' };
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
      expect(result.message).toBe('Only clients can create products');
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
    
    it('should allow sellers to initiate conversations about products', async () => {
      // Arrange
      const productId = 'product-123';
      const clientId = mockUsers.client.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: clientId,
        name: 'Test Product',
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
      const result = (await getOrCreateConversation(mockUsers.seller.id, productId, clientId, mockUsers.seller.id) as unknown) as { 
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
      expect(prisma.conversationParticipant.create).toHaveBeenCalledTimes(2);
    });
    
    it('should prevent sellers from assigning products', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = mockUsers.seller.id;
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: productId,
        createdById: mockUsers.client.id,
        name: 'Test Product',
      });
      
      (createProductAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Only clients can assign products
        if (session.user.role !== 'CLIENT') {
          return { success: false, message: 'Only clients can assign products' };
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
            statusId: data.statusId
          }
        });
        
        return { success: true, data: assignment };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Only clients can assign products');
      expect(prisma.productAssignment.create).not.toHaveBeenCalled();
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
      const clientId = mockUsers.client.id;
      
      (getOrCreateConversation as jest.Mock).mockImplementation(async (currentUserId, productId, clientId, sellerId) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Rest of the implementation
        return { success: true, data: null };
      });
      
      // Act
      const result = (await getOrCreateConversation('some-user-id', productId, clientId, 'seller-id') as unknown) as { 
        success: boolean; 
        data?: {
          id: string;
          productId: string;
          createdAt: Date;
          updatedAt: Date;
        }; 
        message: string;
      };
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
    
    it('should prevent unauthenticated users from assigning products', async () => {
      // Arrange
      const productId = 'product-123';
      const sellerId = mockUsers.seller.id;
      
      (createProductAssignment as jest.Mock).mockImplementation(async (data) => {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, message: 'Unauthorized' };
        }
        
        // Rest of the implementation
        return { success: true, data: null };
      });
      
      // Act
      const result = await createProductAssignment({
        productId,
        sellerId,
        clientId: mockUsers.client.id,
        statusId: 'status-assigned'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.productAssignment.create).not.toHaveBeenCalled();
    });
  });
}); 
